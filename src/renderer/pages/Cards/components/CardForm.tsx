import React, { FormEvent, ChangeEvent, useState } from 'react';
import ReactDOM from 'react-dom';
import Switch from '@mui/material/Switch';
import { FaTimes, FaCloudUploadAlt, FaLayerGroup, FaStar, FaToggleOn, FaCheck, FaSync, FaSort, FaList, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import log from 'electron-log';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { notifyMapInfoUpdated } from '../../../utils/mapEvents';
import { getStarRating } from '../../../api/scoresaber';
import { fetchMapData, fetchMapDataByHashWithRetry } from '../../../api/beatsaver';
import { storage, STORAGE_KEYS } from '../../../utils/storage';
import { useModal } from '../../../hooks/useModal';
import { handleError } from '../../../utils/errorHandler';
import type { StarRatings, MapInfo, QualifiedJson } from '../../../types';
import '../../../pages/Settings/styles/CustomScrollbar.css';

const { ipcRenderer } = window.require('electron');

interface CardFormProps {
  mapId: string;
  setMapId: (id: string) => void;
  starRatings: StarRatings;
  setStarRatings: (ratings: StarRatings) => void;
  setCardFormModal: (show: boolean) => void;
  setMapInfo: (info: any) => void;
  setImageSrc: (src: string) => void;
  useBackground: boolean;
  setUseBackground: (use: boolean) => void;
  createAlert?: (text: string, type: 'success' | 'error' | 'alert' | 'info') => void;
  progress: (process: string, progress: number, visible: boolean) => void;
  cancelGenerationRef: React.MutableRefObject<boolean>;
}



interface ParsedMapData {
  songHash: string;
  songName: string;
  songSubName: string;
  levelAuthorName: string;
  starRatings: StarRatings;
  id?: number;
  selected: boolean;
}

type SortOption = 'songName' | 'levelAuthorName' | 'maxStars' | 'songSubName';
type SortDirection = 'asc' | 'desc';

const CardForm: React.FC<CardFormProps> = ({
  mapId,
  setMapId,
  starRatings,
  setStarRatings,
  setCardFormModal,
  setMapInfo,
  setImageSrc,
  useBackground,
  setUseBackground,
  createAlert,
  progress: setProgress,
  cancelGenerationRef,
}) => {
  const [songName, setSongName] = useState('');
  const { isPanelOpen, isOverlayVisible, handleClose: closeModal } = useModal(() => setCardFormModal(false));
  const [isFetching, setIsFetching] = useState(false);
  
  // JSON parsing state
  const [parsedMaps, setParsedMaps] = useState<ParsedMapData[]>([]);
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('maxStars');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [allSelected, setAllSelected] = useState(false);

  // Load saved maps from storage on mount
  React.useEffect(() => {
    const savedMaps = storage.get<ParsedMapData[]>(STORAGE_KEYS.QUALIFIED_MAPS_JSON);
    if (savedMaps && savedMaps.length > 0) {
      setParsedMaps(savedMaps);
      setIsJsonMode(true);
    }
  }, []);

  const handleClose = closeModal;

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLDivElement).classList.contains('modal-overlay')) {
      setCardFormModal(false);
    }
  };

  const handleSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseBackground(event.target.checked);
    storage.setString(STORAGE_KEYS.USE_BACKGROUND, `${event.target.checked}`);
  };

  const handleMapIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMapId(e.target.value);
  };

  const fetchStarRatings = async () => {
    if (!mapId) {
      if (createAlert) createAlert("Please enter a map ID first", "error");
      return;
    }

    setIsFetching(true);
    try {
      const data = await fetchMapData(mapId);
      setSongName(data.metadata.songName);

      const latestStarRatings = await getStarRating(data.versions[0].hash);
      setStarRatings(latestStarRatings);

      if (createAlert) createAlert("Star ratings fetched successfully", "success");
    } catch (error) {
      handleError(error, 'fetchStarRatings', createAlert);
    } finally {
      setIsFetching(false);
    }
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const data = await fetchMapData(mapId);
      setMapInfo(data);
      storage.setString(STORAGE_KEYS.MAP_ID, mapId);
      storage.set(STORAGE_KEYS.MAP_INFO, data);
      notifyMapInfoUpdated();

      const image = await ipcRenderer.invoke('generate-card', data, starRatings, useBackground);
      setImageSrc(image);

      log.info(data.metadata.songName);
      if (createAlert) createAlert('Card generated successfully!', 'success');
      setCardFormModal(false);
    } catch (error) {
      log.error('Error fetching map info:', error);
      if (createAlert) createAlert('Error generating card', 'error');
    }
  };



  const handleStoredConfigGeneration = async () => {
    const cardConfig = storage.get<any>('cardConfig');
    setCardFormModal(false);
    if (!cardConfig) {
      if (createAlert) createAlert("No saved card configuration found!", "error");
      return;
    }
    try {

      if (!cardConfig.width || !cardConfig.height || !cardConfig.background || !cardConfig.components) {
        throw new Error("Invalid card configuration");
      }
      const data = await fetchMapData(mapId);
      setMapInfo(data);
      storage.setString(STORAGE_KEYS.MAP_ID, mapId);
      storage.set(STORAGE_KEYS.MAP_INFO, data);

      const imageDataUrl = await ipcRenderer.invoke('generate-card-from-config', cardConfig, data, starRatings, useBackground);
      setImageSrc(imageDataUrl);
      if (createAlert) createAlert("Card generated from stored configuration!", "success");
    } catch (error) {
      log.error("Error generating card from stored config:", error);
      if (createAlert) createAlert("Failed to generate card from stored configuration.", "error");
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (createAlert) createAlert(`Parsing JSON file...`, 'info');

    try {
      const text = await file.text();
      const qualifiedMaps: QualifiedJson[] = JSON.parse(text);
      
      // Group maps by songHash and combine star ratings
      const groupedMaps: { [key: string]: QualifiedJson[] } = qualifiedMaps.reduce(
        (acc, map) => {
          if (!acc[map.songHash]) {
            acc[map.songHash] = [];
          }
          acc[map.songHash].push(map);
          return acc;
        },
        {} as { [key: string]: QualifiedJson[] }
      );

      // Convert to ParsedMapData format
      const parsed: ParsedMapData[] = Object.entries(groupedMaps).map(([songHash, maps]) => {
        const combinedStarRatings: StarRatings = {
          ES: '',
          NOR: '',
          HARD: '',
          EX: '',
          EXP: '',
        };

        // Combine star ratings from all difficulties for this map
        maps.forEach((map) => {
          switch (map.difficulty) {
            case 1:
              combinedStarRatings.ES = map.stars.toString();
              break;
            case 3:
              combinedStarRatings.NOR = map.stars.toString();
              break;
            case 5:
              combinedStarRatings.HARD = map.stars.toString();
              break;
            case 7:
              combinedStarRatings.EX = map.stars.toString();
              break;
            case 9:
              combinedStarRatings.EXP = map.stars.toString();
              break;
            default:
              break;
          }
        });

        // Use the first map's metadata (should be same for all difficulties)
        const firstMap = maps[0];
        return {
          songHash,
          songName: firstMap.songName,
          songSubName: firstMap.songSubName,
          levelAuthorName: firstMap.levelAuthorName,
          starRatings: combinedStarRatings,
          id: firstMap.id,
          selected: false,
        };
      });

      setParsedMaps(parsed);
      setIsJsonMode(true);
      // Save to storage for persistence
      storage.set(STORAGE_KEYS.QUALIFIED_MAPS_JSON, parsed);
      if (createAlert) createAlert(`Parsed ${parsed.length} maps successfully!`, 'success');
    } catch (error: any) {
      log.error("Error parsing JSON:", error);
      if (createAlert) createAlert(
        "Failed to parse the uploaded JSON file. Please ensure it is correctly formatted.",
        "error"
      );
    }
  };

  // Sorting functions
  const getSortedMaps = () => {
    const sorted = [...parsedMaps].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'songName':
          comparison = a.songName.localeCompare(b.songName);
          break;
        case 'levelAuthorName':
          comparison = a.levelAuthorName.localeCompare(b.levelAuthorName);
          break;
        case 'maxStars':
          const getMaxStars = (ratings: StarRatings) => {
            const stars = [ratings.ES, ratings.NOR, ratings.HARD, ratings.EX, ratings.EXP]
              .filter(star => star && star !== 'Unranked')
              .map(star => parseFloat(star))
              .filter(star => !isNaN(star));
            return stars.length > 0 ? Math.max(...stars) : 0;
          };
          comparison = getMaxStars(a.starRatings) - getMaxStars(b.starRatings);
          break;
        default:
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  };

  const handleSort = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  const toggleMapSelection = (index: number) => {
    const updated = [...parsedMaps];
    updated[index].selected = !updated[index].selected;
    setParsedMaps(updated);
    storage.set(STORAGE_KEYS.QUALIFIED_MAPS_JSON, updated);
    
    // Update allSelected state
    const selectedCount = updated.filter(map => map.selected).length;
    setAllSelected(selectedCount === updated.length);
  };

  const toggleSelectAll = () => {
    const newSelected = !allSelected;
    const updated = parsedMaps.map(map => ({ ...map, selected: newSelected }));
    setParsedMaps(updated);
    storage.set(STORAGE_KEYS.QUALIFIED_MAPS_JSON, updated);
    setAllSelected(newSelected);
  };

  const handleGenerateSelectedCards = async () => {
    const selectedMaps = parsedMaps.filter(map => map.selected);
    if (selectedMaps.length === 0) {
      if (createAlert) createAlert("Please select at least one map to generate cards", "error");
      return;
    }

    cancelGenerationRef.current = false;
    setCardFormModal(false);
    if (createAlert) createAlert(`Generating ${selectedMaps.length} selected cards...`, 'info');
    setProgress("Starting card generation...", 0, true);

    try {
      const zip = new JSZip();
      const totalMaps = selectedMaps.length;
      let processedCount = 0;

      for (const mapData of selectedMaps) {
        if (cancelGenerationRef.current) {
          if (createAlert) createAlert("Card generation cancelled by user!", "error");
          setProgress("", 0, false);
          return;
        }

        try {
          const mapInfo = await fetchMapDataByHashWithRetry(mapData.songHash);
          const imageDataUrl = await ipcRenderer.invoke('generate-card', mapInfo, mapData.starRatings, useBackground);
          const base64Data = imageDataUrl.split(",")[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const sanitizedSongName = mapInfo.metadata.songName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
          const fileName = `${sanitizedSongName}-${mapInfo.id}.png`;

          zip.file(fileName, byteArray, { binary: true });
        } catch (error: any) {
          log.error(`Error processing map with hash ${mapData.songHash}:`, error);
        } finally {
          processedCount++;
          const percent = Math.floor((processedCount / totalMaps) * 100);
          setProgress(`Processing selected maps (${processedCount} / ${totalMaps})`, percent, true);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "map_cards.zip");
      setProgress("ZIP file created!", 100, true);
      setTimeout(() => {
        setProgress("", 0, false);
      }, 2000);
      if (createAlert) createAlert("Selected cards generated successfully!", "success");
    } catch (error: any) {
      log.error("Error generating selected cards:", error);
      if (createAlert) createAlert("Failed to generate selected cards", "error");
      setProgress("", 0, false);
    }
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {true && (
        <motion.div
          className={`fixed top-16 left-0 right-0 bottom-16 z-40 rounded-br-3xl backdrop-blur-md flex justify-center items-center ${
            isOverlayVisible ? "opacity-100" : "opacity-0"
          } bg-black/20`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isOverlayVisible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="absolute left-0 top-0 h-full w-2/3 rounded-r-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-lg overflow-hidden flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: isPanelOpen ? "0%" : "-100%" }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="z-10 sticky top-0 backdrop-blur-md bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-800/20 dark:to-cyan-800/20 p-3 border-b border-neutral-300 dark:border-neutral-700 flex justify-between items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <div className="flex items-center">
                <motion.h2
                  className="text-lg bg-white/70 dark:bg-neutral-700/70 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
                  whileHover={{ scale: 1.03 }}
                >
                  <FaLayerGroup className="text-blue-500" />
                  Card Settings
                </motion.h2>
                {songName && (
                  <motion.span
                    className="ml-3 font-medium text-blue-600 dark:text-blue-400 text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {songName}
                  </motion.span>
                )}
              </div>
              <motion.button
                className="text-red-500 bg-white/70 dark:bg-neutral-700/70 p-1.5 rounded-md hover:bg-neutral-400 dark:hover:bg-neutral-600 transition duration-200 shadow-sm"
                onClick={handleClose}
                whileHover={{
                  scale: 1.1,
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                }}
                whileTap={{ scale: 0.95 }}
              >
                <FaTimes />
              </motion.button>
            </motion.div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              <div className='p-3 space-y-3'>
                {/* Automatic Inputs */}
                {!isJsonMode && (
                  <>
                    <div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm'>
                      <h2 className='text-base font-medium mb-2 border-b pb-1 border-neutral-200 dark:border-neutral-600 flex items-center gap-1.5'>
                        <FaCloudUploadAlt className="text-purple-500" /> Automatic Input
                      </h2>
                      <label className='block mb-1 text-sm text-neutral-700 dark:text-neutral-200'>Upload JSON File:</label>
                      <label className='flex items-center justify-center w-full h-16 px-3 py-2 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-200/50 dark:hover:bg-neutral-600/50 transition duration-200'>
                        <div className="flex flex-col items-center">
                          <FaCloudUploadAlt className="mb-1 text-blue-500" size={18} />
                          <span className="text-sm text-neutral-700 dark:text-neutral-200">Select JSON File</span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">or drag and drop</span>
                        </div>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileUpload}
                          className='hidden'
                        />
                      </label>
                    </div>

                    {/* Map ID Input */}
                    <div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm'>
                      <h2 className='text-base font-medium mb-2 border-b pb-1 border-neutral-200 dark:border-neutral-600 flex items-center gap-1.5'>
                        <FaLayerGroup className="text-blue-500" /> Map Details
                      </h2>
                      <div className="mb-2">
                        <label className='block mb-1 text-sm text-neutral-700 dark:text-neutral-200 font-medium'>Map ID:</label>
                        <div className="relative flex space-x-2 items-center">
                          <input
                            type='text'
                            value={mapId}
                            onChange={handleMapIdChange}
                            placeholder="Enter map ID..."
                            className='flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white'
                          />
                          <motion.button
                            type="button"
                            onClick={fetchStarRatings}
                            disabled={isFetching}
                            className="absolute right-0 bg-blue-500 text-white px-3 py-1.5 text-sm rounded-lg flex items-center gap-1"
                            whileHover={!isFetching ? { scale: 1.05 } : {}}
                            whileTap={!isFetching ? { scale: 0.95 } : {}}
                          >
                            {isFetching ? <FaSync className="animate-spin" size={12} /> : <FaStar size={12} />}
                            <span className="hidden sm:inline">{isFetching ? 'Fetching...' : 'Fetch Ratings'}</span>
                          </motion.button>
                        </div>
                        {songName && (
                          <motion.p
                            className="mt-1 text-xs text-green-600 dark:text-green-400"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            Found: {songName}
                          </motion.p>
                        )}
                      </div>
                    </div>

                    {/* Background Options */}
                    <div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm'>
                      <div className='flex items-center justify-between'>
                        <h2 className='text-base font-medium flex items-center gap-1.5'>
                          <FaToggleOn className="text-blue-500" /> Options
                        </h2>
                        <div className='flex items-center'>
                          <label className='mr-2 text-sm text-neutral-700 dark:text-neutral-200'>Use Background:</label>
                          <Switch size="small" checked={useBackground} onChange={handleSwitch} />
                        </div>
                      </div>
                    </div>

                    {/* Star Ratings */}
                    <div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm'>
                      <h2 className='text-base font-medium mb-2 border-b pb-1 border-neutral-200 dark:border-neutral-600 flex items-center gap-1.5'>
                        <FaStar className="text-yellow-500" /> Star Ratings
                      </h2>
                      <div className='grid grid-cols-5 gap-2'>
                        {['ES', 'NOR', 'HARD', 'EX', 'EXP'].map((diff, index) => (
                          <div className='flex flex-col' key={diff}>
                            <label className='mb-1 text-xs text-neutral-700 dark:text-neutral-300 font-medium'>
                              {['Easy', 'Normal', 'Hard', 'Expert', 'Expert+'][index]}
                            </label>
                            <input
                              type='text'
                              value={starRatings[diff as keyof StarRatings]}
                              onChange={(e) => setStarRatings({ ...starRatings, [diff]: e.target.value })}
                              className='px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white'
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {/* JSON Map List View */}
                {isJsonMode && parsedMaps.length > 0 && (
                  <div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm'>
                    <div className='flex items-center justify-between mb-3'>
                      <h2 className='text-base font-medium flex items-center gap-1.5'>
                        <FaList className="text-blue-500" /> 
                        Qualified Maps ({parsedMaps.length})
                      </h2>
                      <div className='flex items-center gap-2'>
                        <motion.button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSelectAll();
                          }}
                          className='bg-blue-500 text-white px-3 py-1 text-xs rounded-md flex items-center gap-1'
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {allSelected ? <FaCheckSquare size={12} /> : <FaSquare size={12} />}
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setParsedMaps([]);
                            setIsJsonMode(false);
                            setAllSelected(false);
                            storage.remove(STORAGE_KEYS.QUALIFIED_MAPS_JSON);
                            if (createAlert) createAlert('Cleared stored maps', 'info');
                          }}
                          className='bg-red-500 text-white px-3 py-1 text-xs rounded-md flex items-center gap-1'
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FaTimes size={10} />
                          Clear
                        </motion.button>
                      </div>
                    </div>

                    {/* Sorting Controls */}
                    <div className='flex items-center gap-2 mb-3 pb-2 border-b border-neutral-200 dark:border-neutral-600'>
                      <FaSort className="text-gray-500" size={14} />
                      <span className='text-sm text-neutral-600 dark:text-neutral-400'>Sort by:</span>
                      {[
                        { key: 'maxStars' as SortOption, label: 'Max Stars' },
                        { key: 'songName' as SortOption, label: 'Song Name' },
                        { key: 'levelAuthorName' as SortOption, label: 'Mapper' }
                      ].map(({ key, label }) => (
                        <motion.button
                          key={key}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSort(key);
                          }}
                          className={`px-2 py-1 text-xs rounded transition ${
                            sortBy === key 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-300'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {label} {sortBy === key && (sortDirection === 'asc' ? '↑' : '↓')}
                        </motion.button>
                      ))}
                    </div>

                    {/* Map List */}
                    <div className='space-y-2'>
                      {getSortedMaps().map((mapData) => {
                        const originalIndex = parsedMaps.findIndex(m => m.songHash === mapData.songHash);

                        return (
                          <motion.div
                            key={mapData.songHash}
                            onClick={(e) => {
                              e.preventDefault();
                              toggleMapSelection(originalIndex);
                            }}
                            className={`py-1 px-2 rounded border transition select-none hover:cursor-pointer ${
                              mapData.selected 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' 
                                : 'bg-neutral-50 dark:bg-neutral-600 border-neutral-200 dark:border-neutral-500'
                            }`}
                          >
                            <div className='flex items-center gap-3'>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center justify-between'>
                                  <div className='min-w-0 flex-1'>
                                    <p className='text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate'>
                                      {mapData.songName}
                                    </p>
                                    {mapData.songSubName && (
                                      <p className='text-xs text-neutral-600 dark:text-neutral-400 truncate'>
                                        {mapData.songSubName}
                                      </p>
                                    )}
                                    <p className='text-xs text-neutral-500 dark:text-neutral-500 truncate'>
                                      by {mapData.levelAuthorName}
                                    </p>
                                  </div>
                                  
                                  <div className='flex items-center gap-1 ml-2'>
                                    {Object.entries(mapData.starRatings).map(([diff, stars]) => {
                                      if (!stars || stars === 'Unranked') return null;
                                      const colors = {
                                        ES: 'bg-green-500',
                                        NOR: 'bg-blue-500', 
                                        HARD: 'bg-orange-500',
                                        EX: 'bg-red-500',
                                        EXP: 'bg-purple-500'
                                      };
                                      return (
                                        <span 
                                          key={diff} 
                                          className={`px-1 py-0.5 text-xs text-white rounded ${colors[diff as keyof typeof colors]} whitespace-nowrap`}
                                        >
                                          {stars}★
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky footer */}
            <div className='sticky bottom-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm p-2 border-t border-neutral-300 dark:border-neutral-700 flex justify-end items-center gap-2'>
              {isJsonMode && parsedMaps.length > 0 ? (
                <motion.button
                  type="button"
                  onClick={handleGenerateSelectedCards}
                  disabled={parsedMaps.filter(map => map.selected).length === 0}
                  className={`px-4 py-1.5 text-sm rounded-lg shadow-sm hover:shadow-md font-medium flex items-center gap-1.5 ${
                    parsedMaps.filter(map => map.selected).length === 0
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  }`}
                  whileHover={parsedMaps.filter(map => map.selected).length > 0 ? { scale: 1.03, boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" } : {}}
                  whileTap={parsedMaps.filter(map => map.selected).length > 0 ? { scale: 0.97 } : {}}
                >
                  <FaLayerGroup size={12} />
                  Generate Selected ({parsedMaps.filter(map => map.selected).length})
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    getMapInfo(e as any);
                  }}
                  className='bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1.5 text-sm rounded-lg shadow-sm hover:shadow-md font-medium flex items-center gap-1.5'
                  whileHover={{ scale: 1.03, boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaCheck size={12} />
                  Generate Card
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CardForm;
