import React, { FormEvent, ChangeEvent, useState } from 'react';
import ReactDOM from 'react-dom';
import Switch from '@mui/material/Switch';
import { FaTimes, FaCloudUploadAlt, FaLayerGroup, FaStar, FaToggleOn, FaCheck, FaSync, FaSort, FaList, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import log from '../../../utils/log';
import JSZip from 'jszip';
import { notifyMapInfoUpdated } from '../../../utils/mapEvents';
import { getStarRating } from '../../../api/scoresaber';
import { fetchMapData, fetchMapDataByHashWithRetry } from '../../../api/beatsaver';
import { storage, STORAGE_KEYS } from '../../../utils/storage';
import { useModal } from '../../../hooks/useModal';
import { handleError } from '../../../utils/errorHandler';
import type { StarRatings, MapInfo, QualifiedJson } from '../../../types';

import { ipcRenderer } from '../../../utils/tauri-api';

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
  setZipUrl?: (url: string | null) => void;
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
  setZipUrl,
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
      // storage.set(STORAGE_KEYS.MAP_INFO, data); // Handled by setMapInfo hook
      // notifyMapInfoUpdated(); // Handled by setMapInfo hook

      const image = await ipcRenderer.invoke('generate-card', data, starRatings, useBackground) as string;
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
      // storage.set(STORAGE_KEYS.MAP_INFO, data); // Handled by hook

      const imageDataUrl = await ipcRenderer.invoke('generate-card-from-config', cardConfig, data, starRatings, useBackground) as string;
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
          const imageDataUrl = await ipcRenderer.invoke('generate-card', mapInfo, mapData.starRatings, useBackground) as string;
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

      const zipBlob = await zip.generateAsync({ type: "base64" });

      // Use native save dialog
      const { nativeDialog } = await import('../../../utils/tauri-api');
      const saved = await nativeDialog.saveFile(zipBlob, 'map_cards.zip', [{ name: 'ZIP Archive', extensions: ['zip'] }]);

      if (saved) {
        setProgress("ZIP file saved!", 100, true);
        if (createAlert) createAlert("Selected cards generated and saved successfully!", "success");
      } else {
        setProgress("ZIP file created (save cancelled)", 100, true);
        if (createAlert) createAlert("ZIP created but save was cancelled", "info");
      }
      setTimeout(() => {
        setProgress("", 0, false);
      }, 2000);
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
          className={`fixed top-17 left-0 right-0 bottom-13 z-40 rounded-br-3xl backdrop-blur-sm flex justify-center items-center ${isOverlayVisible ? "opacity-100" : "opacity-0"
            } bg-neutral-900/30`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isOverlayVisible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="absolute left-0 top-0 h-full w-2/3 max-w-2xl lg:max-w-4xl rounded-r-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl border-r border-y border-white/20 dark:border-white/5 overflow-hidden flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: isPanelOpen ? "0%" : "-100%" }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="z-10 sticky top-0 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <div className="flex items-center">
                <motion.h2
                  className="text-lg font-bold flex items-center gap-2 text-neutral-800 dark:text-neutral-100"
                  whileHover={{ scale: 1.01 }}
                >
                  <FaLayerGroup className="text-blue-500" />
                  Card Settings
                </motion.h2>
                {songName && (
                  <motion.span
                    className="ml-3 font-medium text-blue-600 dark:text-blue-400 text-sm bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {songName}
                  </motion.span>
                )}
              </div>
              <motion.button
                className="text-neutral-500 hover:text-red-500 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                onClick={handleClose}
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes size={18} />
              </motion.button>
            </motion.div>

            <div className="flex-1 overflow-auto custom-scrollbar p-6 space-y-6">
              <div className='space-y-6'>
                {/* Automatic Inputs */}
                {!isJsonMode && (
                  <>
                    <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                      <h2 className='text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2'>
                        <FaCloudUploadAlt /> Automatic Input
                      </h2>
                      <label className='block mb-2 text-sm text-neutral-700 dark:text-neutral-300'>Upload JSON File:</label>
                      <label className='flex items-center justify-center w-full h-24 px-4 transition bg-white/50 dark:bg-neutral-900/50 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl appearance-none cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none'>
                        <div className="flex flex-col items-center space-y-2">
                          <FaCloudUploadAlt className="text-blue-500 text-3xl" />
                          <span className="font-medium text-neutral-600 dark:text-neutral-300">
                            Drop JSON file or click to browse
                          </span>
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
                    <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                      <h2 className='text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2'>
                        <FaLayerGroup /> Map Details
                      </h2>
                      <div className="mb-2">
                        <label className='block mb-1 text-sm text-neutral-700 dark:text-neutral-200 font-medium'>Map ID:</label>
                        <div className="relative flex space-x-2 items-center">
                          <input
                            type='text'
                            value={mapId}
                            onChange={handleMapIdChange}
                            placeholder="Enter map ID..."
                            className='flex-1 px-3 py-2 text-sm border bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-shadow'
                          />
                          <motion.button
                            type="button"
                            onClick={fetchStarRatings}
                            disabled={isFetching}
                            className="absolute right-1 bg-blue-500 text-white px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 shadow-sm hover:bg-blue-600 transition-colors"
                            whileHover={!isFetching ? { scale: 1.05 } : {}}
                            whileTap={!isFetching ? { scale: 0.95 } : {}}
                          >
                            {isFetching ? <FaSync className="animate-spin" /> : <FaStar />}
                            <span className="hidden sm:inline">{isFetching ? 'Fetching...' : 'Fetch Ratings'}</span>
                          </motion.button>
                        </div>
                        {songName && (
                          <motion.p
                            className="mt-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded inline-block border border-green-200 dark:border-green-800/50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            Found: {songName}
                          </motion.p>
                        )}
                      </div>
                    </div>

                    {/* Background Options */}
                    <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                      <div className='flex items-center justify-between'>
                        <h2 className='text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-2'>
                          <FaToggleOn /> Options
                        </h2>
                        <div className='flex items-center bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700'>
                          <label className='mr-3 text-sm font-medium text-neutral-700 dark:text-neutral-200'>Use Background</label>
                          <Switch size="small" checked={useBackground} onChange={handleSwitch} />
                        </div>
                      </div>
                    </div>

                    {/* Star Ratings */}
                    <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                      <h2 className='text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2'>
                        <FaStar className="text-yellow-500" /> Star Ratings
                      </h2>
                      <div className='grid grid-cols-5 gap-2'>
                        {['ES', 'NOR', 'HARD', 'EX', 'EXP'].map((diff, index) => (
                          <div className='flex flex-col' key={diff}>
                            <label className='mb-1 text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400'>
                              {['Easy', 'Normal', 'Hard', 'Expert', 'Expert+'][index]}
                            </label>
                            <input
                              type='text'
                              value={starRatings[diff as keyof StarRatings]}
                              onChange={(e) => setStarRatings({ ...starRatings, [diff]: e.target.value })}
                              className='px-2 py-2 text-sm text-center border bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white'
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {/* JSON Map List View */}
                {isJsonMode && parsedMaps.length > 0 && (
                  <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                    <div className='flex items-center justify-between mb-4'>
                      <h2 className='text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-2'>
                        <FaList />
                        Qualified Maps ({parsedMaps.length})
                      </h2>
                      <div className='flex items-center gap-2'>
                        <motion.button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSelectAll();
                          }}
                          className='bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors'
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {allSelected ? <FaCheckSquare className="text-blue-500" /> : <FaSquare className="text-neutral-400" />}
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
                          className='bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors'
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <FaTimes />
                          Clear List
                        </motion.button>
                      </div>
                    </div>

                    {/* Sorting Controls */}
                    <div className='flex items-center gap-2 mb-4 pb-2 border-b border-neutral-200 dark:border-neutral-700'>
                      <FaSort className="text-neutral-400" size={14} />
                      <span className='text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mr-2'>Sort by:</span>
                      {[
                        { key: 'maxStars' as SortOption, label: 'Max Stars' },
                        { key: 'songName' as SortOption, label: 'Song Name' },
                        { key: 'levelAuthorName' as SortOption, label: 'Mapper' }
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSort(key);
                          }}
                          className={`px-3 py-1 text-xs rounded-full transition-all border ${sortBy === key
                            ? 'bg-blue-500 border-blue-600 text-white shadow-sm'
                            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                            }`}
                        >
                          {label} {sortBy === key && (sortDirection === 'asc' ? '↑' : '↓')}
                        </button>
                      ))}
                    </div>

                    {/* Map List */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2'>
                      {getSortedMaps().map((mapData) => {
                        const originalIndex = parsedMaps.findIndex(m => m.songHash === mapData.songHash);

                        return (
                          <motion.div
                            key={mapData.songHash}
                            onClick={(e) => {
                              e.preventDefault();
                              toggleMapSelection(originalIndex);
                            }}
                            className={`p-3 rounded-lg border transition-all select-none hover:cursor-pointer flex items-center gap-3 group ${mapData.selected
                              ? 'bg-blue-50/80 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-700'
                              }`}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${mapData.selected ? 'bg-blue-500 border-blue-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-transparent group-hover:border-blue-400'
                              }`}>
                              <FaCheck size={10} />
                            </div>

                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center justify-between'>
                                <div className='min-w-0 flex-1'>
                                  <p className='text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate'>
                                    {mapData.songName}
                                  </p>
                                  <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 gap-2">
                                    <span className="truncate max-w-[120px]">{mapData.songSubName}</span>
                                    <span>•</span>
                                    <span className="truncate">by {mapData.levelAuthorName}</span>
                                  </div>
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
                                        className={`px-1.5 py-0.5 text-[10px] font-bold text-white rounded ${colors[diff as keyof typeof colors]} shadow-sm`}
                                      >
                                        {stars}
                                      </span>
                                    );
                                  })}
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
            <div className='sticky bottom-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end items-center gap-3'>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              {isJsonMode && parsedMaps.length > 0 ? (
                <motion.button
                  type="button"
                  onClick={handleGenerateSelectedCards}
                  disabled={parsedMaps.filter(map => map.selected).length === 0}
                  className={`px-6 py-2.5 text-sm rounded-lg shadow-lg font-semibold flex items-center gap-2 ${parsedMaps.filter(map => map.selected).length === 0
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/20'
                    }`}
                  whileHover={parsedMaps.filter(map => map.selected).length > 0 ? { scale: 1.02 } : {}}
                  whileTap={parsedMaps.filter(map => map.selected).length > 0 ? { scale: 0.98 } : {}}
                >
                  <FaLayerGroup />
                  Generate Selected ({parsedMaps.filter(map => map.selected).length})
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    getMapInfo(e as any);
                  }}
                  className='btn-primary px-6 py-2.5 text-sm rounded-lg shadow-lg shadow-blue-500/20 font-semibold flex items-center gap-2'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaCheck />
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
