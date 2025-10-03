import React, { FormEvent, ChangeEvent, useState } from 'react';
import ReactDOM from 'react-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCloudUploadAlt, FaExchangeAlt, FaMapMarkedAlt, FaCheck, FaStar, FaSync, FaSort, FaList, FaCheckSquare, FaSquare, FaArrowUp, FaArrowDown, FaEquals } from "react-icons/fa";
import log from 'electron-log';
import { notifyMapInfoUpdated } from '../../../utils/mapEvents';
import { getStarRating } from '../../../api/scoresaber';
import { fetchMapData, fetchMapDataByHashWithRetry } from '../../../api/beatsaver';
import { storage, STORAGE_KEYS } from '../../../utils/storage';
import { useModal } from '../../../hooks/useModal';
import { handleError } from '../../../utils/errorHandler';
import type { StarRatings, ReweightJson } from '../../../types';
import '../../../pages/Settings/styles/CustomScrollbar.css';

const { ipcRenderer } = window.require('electron');

interface StarRatingFormProps {
  mapId: string;
  setMapId: (id: string) => void;
  oldStarRatings: OldStarRatings;
  setOldStarRatings: (ratings: OldStarRatings) => void;
  newStarRatings: NewStarRatings;
  setNewStarRatings: (ratings: NewStarRatings) => void;
  setStarRatingFormModal: (show: boolean) => void;
  chosenDiff: string;
  setChosenDiff: (diff: string) => void;
  setMapInfo: (info: any) => void;
  setImageSrc: (src: string) => void;
  createAlert?: (text: string, type: 'success' | 'error' | 'alert' | 'info') => void;
  progress: (process: string, progress: number, visible: boolean) => void;
  cancelGenerationRef: React.MutableRefObject<boolean>;
}

interface OldStarRatings extends StarRatings {}
interface NewStarRatings extends StarRatings {}

interface UploadedMap {
  id: number;
  songHash: string;
  songName: string;
  songSubName: string;
  levelAuthorName: string;
  difficulty: number;
  old_stars: number;
  new_stars: number;
}



interface ParsedReweightData {
  songHash: string;
  songName: string;
  songSubName: string;
  levelAuthorName: string;
  difficulty: number;
  difficultyName: string;
  oldStars: number;
  newStars: number;
  change: number;
  changeType: 'buff' | 'nerf' | 'same';
  id?: number;
  selected: boolean;
}

type ReweightSortOption = 'songName' | 'levelAuthorName' | 'change' | 'oldStars' | 'newStars';
type SortDirection = 'asc' | 'desc';

const StarRatingForm: React.FC<StarRatingFormProps> = ({
  mapId,
  setMapId,
  oldStarRatings,
  setOldStarRatings,
  newStarRatings,
  setNewStarRatings,
  setStarRatingFormModal,
  chosenDiff,
  setChosenDiff,
  setMapInfo,
  setImageSrc,
  createAlert,
  progress: setProgress,
  cancelGenerationRef,
}) => {
  const [songName, setSongName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { isPanelOpen, isOverlayVisible, handleClose: closeModal } = useModal(() => setStarRatingFormModal(false));
  const [isFetching, setIsFetching] = useState(false);
  
  // JSON parsing state
  const [parsedReweights, setParsedReweights] = useState<ParsedReweightData[]>([]);
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [sortBy, setSortBy] = useState<ReweightSortOption>('change');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [allSelected, setAllSelected] = useState(false);
  const [buffCount, setBuffCount] = useState(0);
  const [nerfCount, setNerfCount] = useState(0);

  // Load saved reweight maps from storage on mount
  React.useEffect(() => {
    const savedReweights = storage.get<ParsedReweightData[]>(STORAGE_KEYS.REWEIGHT_MAPS_JSON);
    if (savedReweights && savedReweights.length > 0) {
      setParsedReweights(savedReweights);
      setIsJsonMode(true);
      // Recalculate buff/nerf counts
      const buffs = savedReweights.filter(map => map.changeType === 'buff').length;
      const nerfs = savedReweights.filter(map => map.changeType === 'nerf').length;
      setBuffCount(buffs);
      setNerfCount(nerfs);
    }
  }, []);

  const handleClose = closeModal;

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLDivElement).classList.contains('modal-overlay')) {
      setStarRatingFormModal(false);
    }
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

      const fetchedRatings = await getStarRating(data.versions[0].hash);
      setNewStarRatings(fetchedRatings);

      if (createAlert) createAlert("Star ratings fetched successfully", "success");
    } catch (error) {
      handleError(error, 'fetchStarRatings', createAlert);
    } finally {
      setIsFetching(false);
    }
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    if (createAlert) createAlert("Fetching map info...", 'info');
    try {
      const data = await fetchMapData(mapId);
      setMapInfo(data);
      storage.setString(STORAGE_KEYS.MAP_ID, mapId);
      storage.set(STORAGE_KEYS.OLD_STAR_RATINGS, oldStarRatings);
      storage.set(STORAGE_KEYS.MAP_INFO, data);
      notifyMapInfoUpdated();

      const image = await ipcRenderer.invoke('generate-reweight-card', data, oldStarRatings, newStarRatings, chosenDiff as keyof OldStarRatings);
      setImageSrc(image);
      if (createAlert) createAlert("Star change image generated successfully.", "success");
      setStarRatingFormModal(false);
    } catch (error) {
      log.error('Error fetching map info:', error);
      if (createAlert) createAlert("Error fetching map info.", "error");
    }
  };



  const handleJsonUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    if (createAlert) createAlert(`Parsing reweight JSON file...`, 'info');

    try {
      const text = await file.text();
      const reweightMaps: ReweightJson[] = JSON.parse(text);
      
      // Filter out maps where new rating equals old rating and convert to ParsedReweightData
      const filteredAndParsed: ParsedReweightData[] = reweightMaps
        .filter(map => map.old_stars !== map.new_stars) // Filter out unchanged ratings
        .map(map => {
          const getDifficultyName = (diff: number) => {
            switch (diff) {
              case 1: return 'Easy';
              case 3: return 'Normal';
              case 5: return 'Hard';
              case 7: return 'Expert';
              case 9: return 'Expert+';
              default: return 'Unknown';
            }
          };

          const change = map.new_stars - map.old_stars;
          const changeType: 'buff' | 'nerf' | 'same' = 
            change > 0 ? 'buff' : change < 0 ? 'nerf' : 'same';

          return {
            songHash: map.songHash,
            songName: map.songName,
            songSubName: map.songSubName,
            levelAuthorName: map.levelAuthorName,
            difficulty: map.difficulty,
            difficultyName: getDifficultyName(map.difficulty),
            oldStars: map.old_stars,
            newStars: map.new_stars,
            change,
            changeType,
            id: map.id,
            selected: false,
          };
        });

      // Calculate buff and nerf counts
      const buffs = filteredAndParsed.filter(map => map.changeType === 'buff').length;
      const nerfs = filteredAndParsed.filter(map => map.changeType === 'nerf').length;
      
      setParsedReweights(filteredAndParsed);
      setBuffCount(buffs);
      setNerfCount(nerfs);
      setIsJsonMode(true);
      
      // Save to storage for persistence
      storage.set(STORAGE_KEYS.REWEIGHT_MAPS_JSON, filteredAndParsed);
      
      if (createAlert) {
        createAlert(
          `Parsed ${filteredAndParsed.length} reweight changes (${buffs} buffs, ${nerfs} nerfs)!`,
          'success'
        );
      }
    } catch (error: any) {
      log.error("Error parsing reweight JSON:", error);
      setUploadError("Failed to parse the uploaded JSON file. Please ensure it is correctly formatted.");
      if (createAlert) createAlert(
        "Failed to parse the uploaded JSON file. Please ensure it is correctly formatted.",
        "error"
      );
    }
  };

  // Sorting functions
  const getSortedReweights = () => {
    const sorted = [...parsedReweights].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'songName':
          comparison = a.songName.localeCompare(b.songName);
          break;
        case 'levelAuthorName':
          comparison = a.levelAuthorName.localeCompare(b.levelAuthorName);
          break;
        case 'change':
          comparison = a.change - b.change;
          break;
        case 'oldStars':
          comparison = a.oldStars - b.oldStars;
          break;
        case 'newStars':
          comparison = a.newStars - b.newStars;
          break;
        default:
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  };

  const handleSort = (newSortBy: ReweightSortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  const toggleReweightSelection = (index: number) => {
    const updated = [...parsedReweights];
    updated[index].selected = !updated[index].selected;
    setParsedReweights(updated);
    storage.set(STORAGE_KEYS.REWEIGHT_MAPS_JSON, updated);
    
    // Update allSelected state
    const selectedCount = updated.filter(map => map.selected).length;
    setAllSelected(selectedCount === updated.length);
  };

  const toggleSelectAll = () => {
    const newSelected = !allSelected;
    const updated = parsedReweights.map(map => ({ ...map, selected: newSelected }));
    setParsedReweights(updated);
    storage.set(STORAGE_KEYS.REWEIGHT_MAPS_JSON, updated);
    setAllSelected(newSelected);
  };

  const handleGenerateSelectedReweights = async () => {
    const selectedReweights = parsedReweights.filter(map => map.selected);
    if (selectedReweights.length === 0) {
      if (createAlert) createAlert("Please select at least one reweight to generate cards", "error");
      return;
    }

    cancelGenerationRef.current = false;
    setStarRatingFormModal(false);
    if (createAlert) createAlert(`Generating ${selectedReweights.length} selected reweight cards...`, 'info');
    setProgress("Starting reweight card generation...", 0, true);

    try {
      const zip = new JSZip();
      const totalMaps = selectedReweights.length;
      let processedCount = 0;

      for (const reweightData of selectedReweights) {
        if (cancelGenerationRef.current) {
          if (createAlert) createAlert("Reweight card generation cancelled by user!", "error");
          setProgress("", 0, false);
          return;
        }

        let diffKey = '';
        switch (reweightData.difficulty) {
          case 1: diffKey = 'ES'; break;
          case 3: diffKey = 'NOR'; break;
          case 5: diffKey = 'HARD'; break;
          case 7: diffKey = 'EX'; break;
          case 9: diffKey = 'EXP'; break;
          default: diffKey = 'ES';
        }

        const manualOld: OldStarRatings = { ES: '', NOR: '', HARD: '', EX: '', EXP: '' };
        const manualNew: NewStarRatings = { ES: '', NOR: '', HARD: '', EX: '', EXP: '' };
        manualOld[diffKey as keyof OldStarRatings] = reweightData.oldStars.toString();
        manualNew[diffKey as keyof NewStarRatings] = reweightData.newStars.toString();

        try {
          const mapInfo = await fetchMapDataByHashWithRetry(reweightData.songHash);
          const imageDataUrl = await ipcRenderer.invoke('generate-reweight-card',
            mapInfo,
            manualOld,
            manualNew,
            diffKey as keyof OldStarRatings
          );
          const base64Data = imageDataUrl.split(",")[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const sanitizedSongName = reweightData.songName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
          const fileName = `${sanitizedSongName}-${diffKey}-${mapInfo.id}.png`;

          zip.file(fileName, byteArray, { binary: true });
        } catch (error: any) {
          log.error(`Error processing reweight with hash ${reweightData.songHash}:`, error);
        } finally {
          processedCount++;
          const percent = Math.floor((processedCount / totalMaps) * 100);
          setProgress(`Processing selected reweights (${processedCount} / ${totalMaps})`, percent, true);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "selected_reweight_cards.zip");
      setProgress("ZIP file created!", 100, true);
      setTimeout(() => {
        setProgress("", 0, false);
      }, 2000);
      if (createAlert) createAlert("Selected reweight cards generated successfully!", "success");
    } catch (error: any) {
      log.error("Error generating selected reweight cards:", error);
      if (createAlert) createAlert("Failed to generate selected reweight cards", "error");
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
              className="z-10 sticky top-0 backdrop-blur-md bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-800/20 dark:to-pink-800/20 p-3 border-b border-neutral-300 dark:border-neutral-700 flex justify-between items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <div className="flex items-center">
                <motion.h2
                  className="text-lg bg-white/70 dark:bg-neutral-700/70 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
                  whileHover={{ scale: 1.03 }}
                >
                  <FaExchangeAlt className="text-purple-500" />
                  Reweight Settings
                </motion.h2>
                {songName && (
                  <motion.span
                    className="ml-3 font-medium text-purple-600 dark:text-purple-400 text-sm"
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
                {/* Automatic Input moved to top */}
                {!isJsonMode && (
                  <>
                    <div className="bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm">
                      <h2 className="text-base font-medium mb-2 border-b pb-1 border-neutral-200 dark:border-neutral-600 flex items-center gap-1.5">
                        <FaCloudUploadAlt className="text-purple-500" /> Automatic Input
                      </h2>
                      <label className='block mb-1 text-sm text-neutral-700 dark:text-neutral-200'>Upload JSON File:</label>
                      <label className='flex items-center justify-center w-full h-16 px-3 py-2 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-200/50 dark:hover:bg-neutral-600/50 transition duration-200'>
                        <div className="flex flex-col items-center">
                          <FaCloudUploadAlt className="mb-1 text-purple-500" size={18} />
                          <span className="text-sm text-neutral-700 dark:text-neutral-200">Select Reweight JSON</span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">or drag and drop</span>
                        </div>
                        <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" />
                      </label>
                      {uploadError && (
                        <motion.p
                          className="mt-1 text-xs text-red-500"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {uploadError}
                        </motion.p>
                      )}
                    </div>

                    {/* Map Details - more compact */}
                    <div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm'>
                      <h2 className="text-base font-medium mb-2 border-b pb-1 border-neutral-200 dark:border-neutral-600 flex items-center gap-1.5">
                        <FaMapMarkedAlt className="text-purple-500" /> Map Details
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-1 text-sm text-neutral-700 dark:text-neutral-200 font-medium">Map ID:</label>
                          <div className="relative flex space-x-2 items-center">
                            <input
                              type="text"
                              value={mapId}
                              onChange={handleMapIdChange}
                              placeholder="Enter map ID..."
                              className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
                            />
                            <motion.button
                              type="button"
                              onClick={fetchStarRatings}
                              disabled={isFetching}
                              className="absolute right-0 bg-purple-500 text-white px-3 py-1.5 text-sm rounded-lg flex items-center gap-1"
                              whileHover={!isFetching ? { scale: 1.05 } : {}}
                              whileTap={!isFetching ? { scale: 0.95 } : {}}
                            >
                              {isFetching ? <FaSync className="animate-spin" size={12} /> : <FaStar size={12} />}
                              <span className="hidden sm:inline">{isFetching ? 'Fetching...' : 'Fetch Ratings'}</span>
                            </motion.button>
                          </div>
                          {songName && (
                            <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                              {songName}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-neutral-700 dark:text-neutral-200 font-medium">Difficulty:</label>
                          <select
                            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
                            onChange={(e) => {
                              setChosenDiff(e.target.value)
                              localStorage.setItem('chosenDiff', e.target.value)
                            }}
                            value={chosenDiff}
                          >
                            <option value="ES">Easy</option>
                            <option value="NOR">Normal</option>
                            <option value="HARD">Hard</option>
                            <option value="EX">Expert</option>
                            <option value="EXP">Expert+</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Reweight Values Section */}
                    <div className="bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm">
                      <h2 className="text-base font-medium mb-2 border-b pb-1 border-neutral-200 dark:border-neutral-600 flex items-center gap-1.5">
                        <FaStar className="text-yellow-500" /> Star Rating Changes
                      </h2>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200 font-medium">Old Rating:</label>
                          <input
                            type="text"
                            placeholder="Old star rating"
                            value={oldStarRatings[chosenDiff as keyof OldStarRatings]}
                            onChange={(e) => setOldStarRatings({ ...oldStarRatings, [chosenDiff]: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-200 font-medium">New Rating:</label>
                          <input
                            type="text"
                            placeholder="New star rating"
                            value={newStarRatings[chosenDiff as keyof NewStarRatings]}
                            onChange={(e) => setNewStarRatings({ ...newStarRatings, [chosenDiff]: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* JSON Reweight List View */}
                {isJsonMode && parsedReweights.length > 0 && (
                  <div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm'>
                    <div className='flex items-center justify-between mb-3'>
                      <h2 className='text-base font-medium flex items-center gap-1.5'>
                        <FaList className="text-purple-500" /> 
                        Reweights ({parsedReweights.length})
                      </h2>
                      <div className='flex items-center gap-2'>
                        <div className='flex items-center gap-3 text-xs'>
                          <span className='flex items-center gap-1 text-green-600 dark:text-green-400'>
                            <FaArrowUp size={10} />
                            {buffCount}
                          </span>
                          <span className='flex items-center gap-1 text-red-600 dark:text-red-400'>
                            <FaArrowDown size={10} />
                            {nerfCount}
                          </span>
                        </div>
                        <motion.button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSelectAll();
                          }}
                          className='bg-purple-500 text-white px-3 py-1 text-xs rounded-md flex items-center gap-1'
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
                            setParsedReweights([]);
                            setIsJsonMode(false);
                            setAllSelected(false);
                            setBuffCount(0);
                            setNerfCount(0);
                            storage.remove(STORAGE_KEYS.REWEIGHT_MAPS_JSON);
                            if (createAlert) createAlert('Cleared stored reweight maps', 'info');
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
                        { key: 'change' as ReweightSortOption, label: 'Change' },
                        { key: 'newStars' as ReweightSortOption, label: 'New Stars' },
                        { key: 'oldStars' as ReweightSortOption, label: 'Old Stars' },
                        { key: 'songName' as ReweightSortOption, label: 'Song Name' },
                        { key: 'levelAuthorName' as ReweightSortOption, label: 'Mapper' },
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
                              ? 'bg-purple-500 text-white' 
                              : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-300'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {label} {sortBy === key && (sortDirection === 'asc' ? '↑' : '↓')}
                        </motion.button>
                      ))}
                    </div>

                    {/* Reweight List */}
                    <div className='space-y-2'>
                      {getSortedReweights().map((reweightData) => {
                        const originalIndex = parsedReweights.findIndex(r => r.songHash === reweightData.songHash && r.difficulty === reweightData.difficulty);

                        return (
                          <motion.div
                            key={`${reweightData.songHash}-${reweightData.difficulty}`}
                            onClick={(e) => {
                              e.preventDefault();
                              toggleReweightSelection(originalIndex);
                            }}
                            className={`py-1 px-2 rounded border transition select-none hover:cursor-pointer ${
                              reweightData.selected 
                                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700' 
                                : 'bg-neutral-50 dark:bg-neutral-600 border-neutral-200 dark:border-neutral-500'
                            }`}
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className='flex items-center gap-3'>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center justify-between'>
                                  <div className='min-w-0 flex-1'>
                                    <p className='text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate'>
                                      {reweightData.songName}
                                    </p>
                                    {reweightData.songSubName && (
                                      <p className='text-xs text-neutral-600 dark:text-neutral-400 truncate'>
                                        {reweightData.songSubName}
                                      </p>
                                    )}
                                    <p className='text-xs text-neutral-500 dark:text-neutral-500 truncate'>
                                      by {reweightData.levelAuthorName} • {reweightData.difficultyName}
                                    </p>
                                  </div>
                                  
                                  <div className='flex items-center gap-2 ml-2'>
                                    <div className='flex items-center gap-2'>
                                      <div className={`px-1 py-0.5 text-xs text-white rounded ${
                                        reweightData.difficulty === 1 ? 'bg-green-500' :
                                        reweightData.difficulty === 3 ? 'bg-blue-500' :
                                        reweightData.difficulty === 5 ? 'bg-orange-500' :
                                        reweightData.difficulty === 7 ? 'bg-red-500' :
                                        reweightData.difficulty === 9 ? 'bg-purple-500' : 'bg-gray-500'
                                      } whitespace-nowrap`}>
                                        {reweightData.oldStars}★ → {reweightData.newStars}★
                                      </div>
                                      <div className={`text-xs font-bold flex items-center gap-1 ${
                                        reweightData.changeType === 'buff' 
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {reweightData.changeType === 'buff' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                                        {reweightData.change > 0 ? '+' : ''}{reweightData.change.toFixed(2)}
                                      </div>
                                    </div>
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

            {/* Sticky footer with Generate button */}
            <div className='sticky bottom-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm p-2 border-t border-neutral-300 dark:border-neutral-700 flex justify-end items-center gap-2'>
              {isJsonMode && parsedReweights.length > 0 ? (
                <motion.button
                  type="button"
                  onClick={handleGenerateSelectedReweights}
                  disabled={parsedReweights.filter(r => r.selected).length === 0}
                  className={`px-4 py-1.5 text-sm rounded-lg shadow-sm hover:shadow-md font-medium flex items-center gap-1.5 ${
                    parsedReweights.filter(r => r.selected).length === 0
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  }`}
                  whileHover={parsedReweights.filter(r => r.selected).length > 0 ? { scale: 1.03, boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" } : {}}
                  whileTap={parsedReweights.filter(r => r.selected).length > 0 ? { scale: 0.97 } : {}}
                >
                  <FaExchangeAlt size={12} />
                  Generate Selected ({parsedReweights.filter(r => r.selected).length})
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    getMapInfo(e as any);
                  }}
                  className='bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1.5 text-sm rounded-lg shadow-sm hover:shadow-md font-medium flex items-center gap-1.5'
                  whileHover={{ scale: 1.03, boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaCheck size={12} />
                  Generate Reweight Card
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

export default StarRatingForm;
