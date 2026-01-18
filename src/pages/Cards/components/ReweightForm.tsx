import React, { FormEvent, ChangeEvent, useState } from 'react';
import ReactDOM from 'react-dom';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCloudUploadAlt, FaExchangeAlt, FaMapMarkedAlt, FaCheck, FaStar, FaSync, FaSort, FaList, FaCheckSquare, FaSquare, FaArrowUp, FaArrowDown, FaEquals } from "react-icons/fa";
import log from '../../../utils/log';
import { notifyMapInfoUpdated } from '../../../utils/mapEvents';
import { getStarRating } from '../../../api/scoresaber';
import { fetchMapData, fetchMapDataByHashWithRetry } from '../../../api/beatsaver';
import { storage, STORAGE_KEYS } from '../../../utils/storage';
import { useModal } from '../../../hooks/useModal';
import { handleError } from '../../../utils/errorHandler';
import type { StarRatings, ReweightJson } from '../../../types';

import { ipcRenderer } from '../../../utils/tauri-api';

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
  setZipUrl?: (url: string | null) => void;
}

interface OldStarRatings extends StarRatings { }
interface NewStarRatings extends StarRatings { }

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
  setZipUrl,
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
      // storage.set(STORAGE_KEYS.OLD_STAR_RATINGS, oldStarRatings); // Handled by hook
      // storage.set(STORAGE_KEYS.MAP_INFO, data); // Handled by hook
      // notifyMapInfoUpdated(); // Handled by hook

      const image = await ipcRenderer.invoke('generate-reweight-card', data, oldStarRatings, newStarRatings, chosenDiff as keyof OldStarRatings) as string;
      setImageSrc(image);
      if (createAlert) createAlert("Star change image generated successfully.", "success");
      setStarRatingFormModal(false);
    } catch (error) {
      log.error('Error fetching map info:', error);
      if (createAlert) createAlert("Error fetching map info.", "error");
    }
  };

  // ... (rest of the functions remain the same) ...

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
          ) as string;
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

      const zipBlob = await zip.generateAsync({ type: "base64" });

      // Use native save dialog
      const { nativeDialog } = await import('../../../utils/tauri-api');
      const saved = await nativeDialog.saveFile(zipBlob, 'reweight_cards.zip', [{ name: 'ZIP Archive', extensions: ['zip'] }]);

      if (saved) {
        setProgress("ZIP file saved!", 100, true);
        if (createAlert) createAlert("Selected reweight cards generated and saved successfully!", "success");
      } else {
        setProgress("ZIP file created (save cancelled)", 100, true);
        if (createAlert) createAlert("ZIP created but save was cancelled", "info");
      }
      setTimeout(() => {
        setProgress("", 0, false);
      }, 2000);
    } catch (error: any) {
      log.error("Error generating selected reweight cards:", error);
      if (createAlert) createAlert("Failed to generate selected reweight cards", "error");
      setProgress("", 0, false);
    }
  }; return ReactDOM.createPortal(
    <AnimatePresence>
      {true && (
        <motion.div
          className={`fixed top-17 left-0 right-0 bottom-13 z-40 backdrop-blur-sm flex justify-center items-center ${isOverlayVisible ? "opacity-100" : "opacity-0"
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
              className="z-10 sticky top-0 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md p-3 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <div className="flex items-center">
                <motion.h2
                  className="text-lg font-bold flex items-center gap-2 text-neutral-800 dark:text-neutral-100"
                  whileHover={{ scale: 1.01 }}
                >
                  <FaExchangeAlt className="text-purple-500" />
                  Reweight Settings
                </motion.h2>
                {songName && (
                  <motion.span
                    className="ml-3 font-medium text-purple-600 dark:text-purple-400 text-xs bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full"
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
                <FaTimes size={16} />
              </motion.button>
            </motion.div>

            <div className="flex-1 overflow-auto custom-scrollbar p-5 space-y-5">
              <div className='space-y-5'>
                {/* Automatic Input moved to top */}
                {!isJsonMode && (
                  <>
                    <div className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
                        <FaCloudUploadAlt /> Automatic Input
                      </h2>
                      <label className='block mb-2 text-xs text-neutral-700 dark:text-neutral-300'>Upload Reweight JSON:</label>
                      <label className='flex items-center justify-center w-full h-20 px-4 transition bg-white/50 dark:bg-neutral-900/50 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl appearance-none cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 focus:outline-none'>
                        <div className="flex flex-col items-center space-y-1">
                          <FaCloudUploadAlt className="text-purple-500 text-2xl" />
                          <span className="font-medium text-xs text-neutral-600 dark:text-neutral-300">
                            Drop JSON file or click to browse
                          </span>
                        </div>
                        <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" />
                      </label>
                      {uploadError && (
                        <motion.p
                          className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded border border-red-100 dark:border-red-800/50"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {uploadError}
                        </motion.p>
                      )}
                    </div>

                    {/* Map Details - more compact */}
                    <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
                        <FaMapMarkedAlt /> Map Details
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-1 text-xs text-neutral-700 dark:text-neutral-200 font-medium">Map ID:</label>
                          <div className="relative flex space-x-2 items-center">
                            <input
                              type="text"
                              value={mapId}
                              onChange={handleMapIdChange}
                              placeholder="Enter map ID..."
                              className="flex-1 px-3 py-1.5 text-sm border bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:text-white transition-shadow"
                            />
                            <motion.button
                              type="button"
                              onClick={fetchStarRatings}
                              disabled={isFetching}
                              className="absolute right-1 bg-purple-500 text-white px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 shadow-sm hover:bg-purple-600 transition-colors"
                              whileHover={!isFetching ? { scale: 1.05 } : {}}
                              whileTap={!isFetching ? { scale: 0.95 } : {}}
                            >
                              {isFetching ? <FaSync className="animate-spin" /> : <FaStar />}
                              <span className="hidden sm:inline">{isFetching ? 'Fetching...' : 'Fetch'}</span>
                            </motion.button>
                          </div>
                          {songName && (
                            <div className="mt-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded inline-block border border-green-200 dark:border-green-800/50">
                              Found: {songName}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block mb-1 text-xs text-neutral-700 dark:text-neutral-200 font-medium">Difficulty:</label>
                          <select
                            className="w-full px-3 py-1.5 text-sm border bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:text-white transition-shadow"
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
                    <div className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
                        <FaStar className="text-yellow-500" /> Star Rating Changes
                      </h2>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs text-neutral-700 dark:text-neutral-200 font-medium">Old Rating:</label>
                          <input
                            type="text"
                            placeholder="Old star rating"
                            value={oldStarRatings[chosenDiff as keyof OldStarRatings]}
                            onChange={(e) => setOldStarRatings({ ...oldStarRatings, [chosenDiff]: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:text-white transition-shadow"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-neutral-700 dark:text-neutral-200 font-medium">New Rating:</label>
                          <input
                            type="text"
                            placeholder="New star rating"
                            value={newStarRatings[chosenDiff as keyof NewStarRatings]}
                            onChange={(e) => setNewStarRatings({ ...newStarRatings, [chosenDiff]: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:text-white transition-shadow"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* JSON Reweight List View */}
                {isJsonMode && parsedReweights.length > 0 && (
                  <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                    <div className='flex items-center justify-between mb-3'>
                      <h2 className='text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-2'>
                        <FaList />
                        Reweights ({parsedReweights.length})
                      </h2>
                      <div className='flex items-center gap-2'>
                        <div className='flex items-center gap-2 text-xs bg-white dark:bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 mr-2'>
                          <span className='flex items-center gap-1 text-green-600 dark:text-green-400 font-medium'>
                            <FaArrowUp size={8} />
                            {buffCount}
                          </span>
                          <span className="w-px h-3 bg-neutral-200 dark:bg-neutral-700"></span>
                          <span className='flex items-center gap-1 text-red-600 dark:text-red-400 font-medium'>
                            <FaArrowDown size={8} />
                            {nerfCount}
                          </span>
                        </div>
                        <motion.button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSelectAll();
                          }}
                          className='bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1 hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors'
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {allSelected ? <FaCheckSquare className="text-purple-500" /> : <FaSquare className="text-neutral-400" />}
                          {allSelected ? 'None' : 'All'}
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
                          className='bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors'
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <FaTimes />
                          Clear
                        </motion.button>
                      </div>
                    </div>

                    {/* Sorting Controls */}
                    <div className='flex items-center gap-1.5 mb-3 pb-2 border-b border-neutral-200 dark:border-neutral-700 overflow-x-auto custom-scrollbar'>
                      <FaSort className="text-neutral-400 shrink-0" size={12} />
                      <span className='text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mr-1 shrink-0'>Sort:</span>
                      {[
                        { key: 'change' as ReweightSortOption, label: 'Change' },
                        { key: 'newStars' as ReweightSortOption, label: 'New ★' },
                        { key: 'oldStars' as ReweightSortOption, label: 'Old ★' },
                        { key: 'songName' as ReweightSortOption, label: 'Song' },
                        { key: 'levelAuthorName' as ReweightSortOption, label: 'Mapper' },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSort(key);
                          }}
                          className={`px-2 py-0.5 text-[10px] rounded-full transition-all border whitespace-nowrap ${sortBy === key
                            ? 'bg-purple-500 border-purple-600 text-white shadow-sm'
                            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                            }`}
                        >
                          {label} {sortBy === key && (sortDirection === 'asc' ? '↑' : '↓')}
                        </button>
                      ))}
                    </div>

                    {/* Reweight List */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-2'>
                      {getSortedReweights().map((reweightData) => {
                        const originalIndex = parsedReweights.findIndex(r => r.songHash === reweightData.songHash && r.difficulty === reweightData.difficulty);

                        return (
                          <motion.div
                            key={`${reweightData.songHash}-${reweightData.difficulty}`}
                            onClick={(e) => {
                              e.preventDefault();
                              toggleReweightSelection(originalIndex);
                            }}
                            className={`p-2 rounded-lg border transition-all select-none hover:cursor-pointer flex items-center gap-2 group ${reweightData.selected
                              ? 'bg-purple-50/80 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800'
                              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-700'
                              }`}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${reweightData.selected ? 'bg-purple-500 border-purple-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-transparent group-hover:border-purple-400'
                              }`}>
                              <FaCheck size={8} />
                            </div>

                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center justify-between'>
                                <div className='min-w-0 flex-1'>
                                  <p className='text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate'>
                                    {reweightData.songName}
                                  </p>
                                  <div className="flex items-center text-[10px] text-neutral-500 dark:text-neutral-400 gap-2">
                                    <span className="truncate max-w-[100px]">{reweightData.songSubName}</span>
                                    <span>•</span>
                                    <span className="truncate">{reweightData.levelAuthorName}</span>
                                    <span>•</span>
                                    <span className="font-medium text-neutral-600 dark:text-neutral-300">{reweightData.difficultyName}</span>
                                  </div>
                                </div>

                                <div className='flex items-center gap-2 ml-2'>
                                  <div className={`px-1.5 py-0.5 text-[10px] font-mono text-white rounded bg-neutral-600 shadow-sm whitespace-nowrap`}>
                                    {reweightData.oldStars.toFixed(2)} → {reweightData.newStars.toFixed(2)}
                                  </div>
                                  <div className={`text-xs font-bold flex items-center gap-0.5 ${reweightData.changeType === 'buff'
                                    ? 'text-green-600 dark:text-green-400'
                                    : reweightData.changeType === 'nerf' ? 'text-red-600 dark:text-red-400' : 'text-gray-500'
                                    }`}>
                                    {reweightData.changeType === 'buff' ? <FaArrowUp size={8} /> : reweightData.changeType === 'nerf' ? <FaArrowDown size={8} /> : <FaEquals size={8} />}
                                    {reweightData.change > 0 ? '+' : ''}{reweightData.change.toFixed(2)}
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
            <div className='sticky bottom-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md p-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end items-center gap-2'>
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              {isJsonMode && parsedReweights.length > 0 ? (
                <motion.button
                  type="button"
                  onClick={handleGenerateSelectedReweights}
                  disabled={parsedReweights.filter(r => r.selected).length === 0}
                  className={`px-4 py-2 text-sm rounded-lg shadow-lg font-semibold flex items-center gap-2 ${parsedReweights.filter(r => r.selected).length === 0
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/20'
                    }`}
                  whileHover={parsedReweights.filter(r => r.selected).length > 0 ? { scale: 1.02 } : {}}
                  whileTap={parsedReweights.filter(r => r.selected).length > 0 ? { scale: 0.98 } : {}}
                >
                  <FaExchangeAlt />
                  Generate ({parsedReweights.filter(r => r.selected).length})
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    getMapInfo(e as any);
                  }}
                  className='btn-primary px-4 py-2 text-sm rounded-lg shadow-lg shadow-purple-500/20 font-semibold flex items-center gap-2'
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

export default StarRatingForm;
