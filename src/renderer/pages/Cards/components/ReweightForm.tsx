import React, { FormEvent, ChangeEvent, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCloudUploadAlt, FaExchangeAlt } from "react-icons/fa";
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

      const image = await generateReweightCard(data, oldStarRatings, newStarRatings, chosenDiff as keyof OldStarRatings);
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
          className={`fixed top-16 left-0 right-0 bottom-16 z-40 rounded-bl-3xl backdrop-blur-md flex justify-center items-center ${
            isOverlayVisible ? "opacity-100" : "opacity-0"
          } bg-black/20`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isOverlayVisible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="absolute left-0 top-0 h-full w-3/4 lg:w-2/3 rounded-r-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-lg overflow-y-auto custom-scrollbar"
            initial={{ x: "-100%" }}
            animate={{ x: isPanelOpen ? "0%" : "-100%" }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="z-10 sticky top-0 backdrop-blur-md bg-neutral-200/80 dark:bg-neutral-800/80 p-4 border-b border-neutral-200 dark:border-neutral-500 flex justify-between items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <div className="flex items-center">
                <motion.h2
                  className="text-xl bg-neutral-100 dark:bg-neutral-600 px-3 py-2 rounded-lg font-semibold"
                  whileHover={{ scale: 1.03 }}
                >
                  Reweight Settings
                </motion.h2>
                {songName && (
                  <motion.span
                    className="ml-4 font-medium text-blue-600 dark:text-blue-400"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {songName}
                  </motion.span>
                )}
              </div>
              <motion.button
                className="text-red-500 bg-neutral-300 dark:bg-neutral-700 p-2 rounded-md hover:bg-neutral-400 dark:hover:bg-neutral-600 transition duration-200"
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

            <div className="mt-4 px-4 pb-4 space-y-4">
              <form onSubmit={getMapInfo} className='space-y-8'>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Manual Input Section */}
                  <div className="bg-white dark:bg-neutral-700 p-5 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4 border-b pb-2 border-neutral-200 dark:border-neutral-600">Manual Input</h2>
                    <div className="mb-4">
                      <label className="block mb-2 text-neutral-700 dark:text-neutral-200 font-medium">Map ID:</label>
                      <input
                        type="text"
                        value={mapId}
                        onChange={(e) => fetchName(e.target.value)}
                        placeholder="Enter map ID..."
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block mb-2 text-neutral-700 dark:text-neutral-200 font-medium">Difficulty:</label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
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

                  {/* Automatic Input Section */}
                  <div className="bg-white dark:bg-neutral-700 p-5 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4 border-b pb-2 border-neutral-200 dark:border-neutral-600">Automatic Input</h2>
                    <label className="block mb-2 text-neutral-700 dark:text-neutral-200 font-medium">Upload JSON File:</label>
                    <label className='flex items-center justify-center w-full h-24 px-4 py-4 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-200/50 dark:hover:bg-neutral-600/50 transition duration-200'>
                      <div className="flex flex-col items-center">
                        <FaCloudUploadAlt className="mb-2 text-blue-500" size={24} />
                        <span className="text-neutral-700 dark:text-neutral-200">Select Reweight JSON</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">or drag and drop</span>
                      </div>
                      <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" />
                    </label>
                    {uploadError && (
                      <motion.p
                        className="mt-2 text-sm text-red-500"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {uploadError}
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* Reweight Values Section */}
                <div className="bg-white dark:bg-neutral-700 p-5 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <h2 className="text-lg font-medium border-b pb-2 border-neutral-200 dark:border-neutral-600">Star Rating Changes</h2>
                    <FaExchangeAlt className="ml-2 text-blue-500" />
                  </div>
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex flex-col w-full md:w-1/2">
                      <label className="mb-2 text-neutral-700 dark:text-neutral-200 font-medium">Old Rating:</label>
                      <input
                        type="text"
                        placeholder="Old star rating"
                        value={oldStarRatings[chosenDiff as keyof OldStarRatings]}
                        onChange={(e) => setOldStarRatings({ ...oldStarRatings, [chosenDiff]: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
                      />
                    </div>
                    <div className="flex flex-col w-full md:w-1/2">
                      <label className="mb-2 text-neutral-700 dark:text-neutral-200 font-medium">New Rating:</label>
                      <input
                        type="text"
                        placeholder="New star rating"
                        value={newStarRatings[chosenDiff as keyof NewStarRatings]}
                        onChange={(e) => setNewStarRatings({ ...newStarRatings, [chosenDiff]: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="flex justify-end">
                  <motion.button
                    type="submit"
                    className="bg-blue-500 text-white px-6 py-2.5 rounded-lg shadow-sm hover:bg-blue-600 transition duration-200 font-medium"
                    whileHover={{ scale: 1.03, boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Generate Reweight Card
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default StarRatingForm;
