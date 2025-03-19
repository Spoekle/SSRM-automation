import React, { FormEvent, ChangeEvent, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCloudUploadAlt, FaExchangeAlt, FaMapMarkedAlt, FaCheck, FaStar, FaSync } from "react-icons/fa";
import log from 'electron-log';
import { generateReweightCard } from '../../../../main/helper';
import { notifyMapInfoUpdated } from '../../../utils/mapEvents';
import '../../../pages/Settings/styles/CustomScrollbar.css';

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

interface OldStarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EX: string;
  EXP: string;
}

interface NewStarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EX: string;
  EXP: string;
}

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
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    setIsOverlayVisible(true);
    setIsPanelOpen(true);
  }, []);

  const handleClose = () => {
    setIsPanelOpen(false);
    setIsOverlayVisible(false);
    setTimeout(() => {
      setStarRatingFormModal(false);
    }, 300);
  };

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
      // First fetch the map data to get the hash
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      setSongName(data.metadata.songName);

      // Then get the star ratings
      const fetchedRatings = await getStarRating(data.versions[0].hash);
      setNewStarRatings(fetchedRatings);

      if (createAlert) createAlert("Star ratings fetched successfully", "success");
    } catch (error) {
      log.error('Error fetching star ratings:', error);
      if (createAlert) createAlert("Error fetching star ratings", "error");
    } finally {
      setIsFetching(false);
    }
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    if (createAlert) createAlert("Fetching map info...", 'info');
    try {
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      setMapInfo(data);
      localStorage.setItem('mapId', `${mapId}`);
      localStorage.setItem('oldStarRatings', JSON.stringify(oldStarRatings));
      localStorage.setItem('mapInfo', JSON.stringify(data));
      notifyMapInfoUpdated();

      // Fetch the latest star ratings
      let currentNewRatings = newStarRatings;
      try {
        const fetchedStarRatings = await getStarRating(data.versions[0].hash);
        setNewStarRatings(fetchedStarRatings);
        currentNewRatings = fetchedStarRatings; // Use these for current generation
        localStorage.setItem('starRatings', JSON.stringify(fetchedStarRatings));
      } catch (starError) {
        log.error('Error fetching star ratings:', starError);
        // Continue with generation even if star ratings fetch fails
      }

      const image = await generateReweightCard(data, oldStarRatings, currentNewRatings, chosenDiff as keyof OldStarRatings);
      setImageSrc(image);
      if (createAlert) createAlert("Star change image generated successfully.", "success");
      setStarRatingFormModal(false);
    } catch (error) {
      log.error('Error fetching map info:', error);
      if (createAlert) createAlert("Error fetching map info.", "error");
    }
  };

  async function getStarRating(hash: string): Promise<NewStarRatings> {
    let diffs = ['1', '3', '5', '7', '9'];
    let fetchedStarRatings: NewStarRatings = {
      ES: '',
      NOR: '',
      HARD: '',
      EX: '',
      EXP: ''
    };

    for (let i = 0; i < diffs.length; i++) {
      try {
        const response = await axios.get(`http://localhost:3000/api/scoresaber/${hash}/${diffs[i]}`);
        const data = response.data;
        const key = Object.keys(fetchedStarRatings)[i] as keyof NewStarRatings;
        fetchedStarRatings[key] = data.stars === 0 ? 'Unranked' : data.stars.toString();
        localStorage.setItem('starRatings', JSON.stringify(fetchedStarRatings));
        log.info(fetchedStarRatings);
      } catch (error) {
        log.error("Error fetching star rating, diff " + diffs[i] + " probably doesnt exist :)");
      }
    }
    return fetchedStarRatings;
  }

  const fetchName = async (mapId: string) => {
    if (mapId === '') {
      setSongName('');
      return;
    }
    setMapId(mapId);
    try {
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      setSongName(data.metadata.songName);
      getStarRating(data.versions[0].hash).then((fetchedStarRatings) => {
        setNewStarRatings(fetchedStarRatings);
      });
      return data.metadata.songName;
    } catch (error) {
      log.error('Error fetching map info:', error);
    }
  };

  const handleJsonUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    cancelGenerationRef.current = false;
    const file = event.target.files?.[0];
    if (!file) return;

    setStarRatingFormModal(false);
    setUploadError(null);
    if (createAlert) createAlert("Reweight JSON Uploaded...", "alert");
    setProgress("Reading JSON file...", 10, true);

    try {
      const text = await file.text();
      setProgress("Parsing JSON...", 20, true);
      const uploadedMaps: UploadedMap[] = JSON.parse(text);
      const mapCount = uploadedMaps.length;
      setProgress("Starting map processing...", 30, true);
      const zip = new JSZip();

      let processedCount = 0;
      for (const map of uploadedMaps) {
        if (cancelGenerationRef.current) {
          if (createAlert) createAlert("Reweight cards generation cancelled by user!", "error");
          setProgress("", 0, false);
          return;
        }

        let diffKey = '';
        switch (map.difficulty) {
          case 1:
            diffKey = 'ES';
            break;
          case 3:
            diffKey = 'NOR';
            break;
          case 5:
            diffKey = 'HARD';
            break;
          case 7:
            diffKey = 'EX';
            break;
          case 9:
            diffKey = 'EXP';
            break;
          default:
            diffKey = 'ES';
        }

        const manualOld: OldStarRatings = { ES: '', NOR: '', HARD: '', EX: '', EXP: '' };
        const manualNew: NewStarRatings = { ES: '', NOR: '', HARD: '', EX: '', EXP: '' };
        manualOld[diffKey as keyof OldStarRatings] = map.old_stars.toString();
        manualNew[diffKey as keyof NewStarRatings] = map.new_stars.toString();

        try {
          let response;
          while (true) {
            try {
              response = await axios.get(`https://api.beatsaver.com/maps/hash/${map.songHash}`);
              break;
            } catch (err: any) {
              if (err.response && err.response.status === 429) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
              } else {
                throw err;
              }
            }
          }
          const mapInfo = response.data;
          const imageDataUrl = await generateReweightCard(
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
          const sanitizedSongName = map.songName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
          const fileName = `${sanitizedSongName}-${diffKey}-${mapInfo.id}.png`;

          zip.file(fileName, byteArray, { binary: true });
        } catch (err) {
          log.error(`Error processing map with hash ${map.songHash}:`, err);
        } finally {
          processedCount++;
          const percent = Math.floor((processedCount / mapCount) * 100);
          setProgress(`Processing maps (${processedCount} / ${mapCount})`, percent, true);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "reweight_cards.zip");
      setProgress("ZIP file created!", 100, true);
      setTimeout(() => {
        setProgress("", 0, false);
      }, 2000);
    } catch (err: any) {
      log.error("Error processing uploaded JSON:", err);
      setUploadError("Failed to process the uploaded JSON file. Please ensure it is correctly formatted.");
      if (createAlert) createAlert(
        "Failed to process the uploaded JSON file. Please ensure it is correctly formatted.",
        "error"
      );
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
              <form onSubmit={getMapInfo} className='p-3 space-y-3'>
                {/* Automatic Input moved to top */}
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

                {/* Reweight Values Section - more compact */}
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
              </form>
            </div>

            {/* Sticky footer with Generate button */}
            <div className='sticky bottom-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm p-2 border-t border-neutral-300 dark:border-neutral-700 flex justify-end items-center'>
              <motion.button
                type="button"
                onClick={getMapInfo}
                className='bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1.5 text-sm rounded-lg shadow-sm hover:shadow-md font-medium flex items-center gap-1.5'
                whileHover={{ scale: 1.03, boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}
                whileTap={{ scale: 0.97 }}
              >
                <FaCheck size={12} />
                Generate Reweight Card
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default StarRatingForm;
