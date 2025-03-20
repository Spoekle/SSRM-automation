import React, { FormEvent, ChangeEvent, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Switch from '@mui/material/Switch';
import { FaTimes, FaCloudUploadAlt, FaLayerGroup, FaStar, FaToggleOn, FaCheck, FaSync } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import log from 'electron-log';
import { generateCard } from '../../../../main/helper';
import { generateCardFromConfig } from '../../../../main/jsonHelper';
import { notifyMapInfoUpdated } from '../../../utils/mapEvents';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import '../../../pages/Settings/styles/CustomScrollbar.css';

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

interface StarRatings {
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
  stars: number;
}

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
      setCardFormModal(false);
    }, 300);
  };

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLDivElement).classList.contains('modal-overlay')) {
      setCardFormModal(false);
    }
  };

  const handleSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseBackground(event.target.checked);
    localStorage.setItem('useBackground', `${event.target.checked}`);
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
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      setSongName(data.metadata.songName);

      const latestStarRatings = await getStarRating(data.versions[0].hash);
      setStarRatings(latestStarRatings);

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
    try {
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      setMapInfo(data);
      localStorage.setItem('mapId', `${mapId}`);
      localStorage.setItem('mapInfo', JSON.stringify(data));
      notifyMapInfoUpdated();

      const image = await generateCard(data, starRatings, useBackground);
      setImageSrc(image);

      log.info(data);
      if (createAlert) createAlert('Card generated successfully!', 'success');
      setCardFormModal(false);
    } catch (error) {
      log.error('Error fetching map info:', error);
      if (createAlert) createAlert('Error generating card', 'error');
    }
  };

  async function getStarRating(hash: string): Promise<StarRatings> {
    let diffs = ['1', '3', '5', '7', '9'];
    let starRatings: StarRatings = {
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
        const key = Object.keys(starRatings)[i] as keyof StarRatings;
        if (data.stars === 0) {
          starRatings[key] = 'Unranked';
        } else {
          starRatings[key] = data.stars.toString();
        }
        localStorage.setItem('starRatings', JSON.stringify(starRatings));
        log.info(starRatings);
      } catch (error) {
        log.error("Error fetching star rating, diff " + diffs[i] + " probably doesnt exist :)");
      }
    }
    return starRatings;
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
      getStarRating(data.versions[0].hash).then((starRatings) => {
        setStarRatings(starRatings);
      });
      return data.metadata.songName;
    } catch (error) {
      log.error('Error fetching map info:', error);
    }
  };

  interface MapInfo {
    metadata: {
        songAuthorName: string;
        songName: string;
        songSubName: string;
        levelAuthorName: string;
        duration: number;
        bpm: number;
    };
    id: string;
    versions: {
        coverURL: string;
        hash: string;
    }[];
  }

  const handleStoredConfigGeneration = async () => {
    const configStr = localStorage.getItem('cardConfig');
    setCardFormModal(false);
    if (!configStr) {
      if (createAlert) createAlert("No saved card configuration found in localStorage!", "error");
      return;
    }
    try {
      const cardConfig = JSON.parse(configStr);

      if (!cardConfig.width || !cardConfig.height || !cardConfig.background || !cardConfig.components) {
        throw new Error("Invalid card configuration");
      }
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      setMapInfo(data);
      localStorage.setItem('mapId', `${mapId}`);
      localStorage.setItem('mapInfo', JSON.stringify(data));

      const imageDataUrl = await generateCardFromConfig(cardConfig, data, starRatings, useBackground);
      setImageSrc(imageDataUrl);
      if (createAlert) createAlert("Card generated from stored configuration!", "success");
    } catch (error) {
      log.error("Error generating card from stored config:", error);
      if (createAlert) createAlert("Failed to generate card from stored configuration.", "error");
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    cancelGenerationRef.current = false;
    const file = event.target.files?.[0];
    if (!file) return;

    setCardFormModal(false);
    if (createAlert) createAlert(`JSON processing...`, 'info');
    setProgress("Reading JSON file...", 10, true);

    try {
      const text = await file.text();
      setProgress("Parsing JSON...", 20, true);

      const uploadedMaps: UploadedMap[] = JSON.parse(text);
      const groupedMaps: { [key: string]: UploadedMap[] } = uploadedMaps.reduce(
        (acc, map) => {
          if (!acc[map.songHash]) {
            acc[map.songHash] = [];
          }
          acc[map.songHash].push(map);
          return acc;
        },
        {} as { [key: string]: UploadedMap[] }
      );

      setProgress("Starting map processing...", 30, true);

      const zip = new JSZip();
      const songHashes = Object.keys(groupedMaps);
      const totalHashes = songHashes.length;
      let processedCount = 0;

      for (const songHash of songHashes) {
        if (cancelGenerationRef.current) {
          if (createAlert) createAlert("Card generation cancelled by user!", "error");
          setProgress("", 0, false);
          return;
        }

        const combinedStarRatings: StarRatings = {
          ES: '',
          NOR: '',
          HARD: '',
          EX: '',
          EXP: '',
        };

        groupedMaps[songHash].forEach((map) => {
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

        try {
          let response;
          while (true) {
            try {
              response = await axios.get<MapInfo>(
                `https://api.beatsaver.com/maps/hash/${songHash}`
              );
              break;
            } catch (err: any) {
              if (err.response && err.response.status === 429) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
              } else {
                throw err;
              }
            }
          }
          const mapInfo = response.data;
          const imageDataUrl = await generateCard(mapInfo, combinedStarRatings, useBackground);
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
          log.error(`Error processing map with hash ${songHash}:`, error);
        } finally {
          processedCount++;
          const percent = Math.floor((processedCount / totalHashes) * 100);
          setProgress(`Processing maps (${processedCount} / ${totalHashes})`, percent, true);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "map_cards.zip");
      setProgress("ZIP file created!", 100, true);
      setTimeout(() => {
        setProgress("", 0, false);
      }, 2000);
    } catch (error: any) {
      log.error("Error processing uploaded JSON:", error);
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
              <form onSubmit={getMapInfo} className='p-3 space-y-3'>
                {/* Automatic Inputs */}
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
              </form>
            </div>

            {/* Sticky footer */}
            <div className='sticky bottom-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm p-2 border-t border-neutral-300 dark:border-neutral-700 flex justify-end items-center'>
              <motion.button
                type="button"
                onClick={getMapInfo}
                className='bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1.5 text-sm rounded-lg shadow-sm hover:shadow-md font-medium flex items-center gap-1.5'
                whileHover={{ scale: 1.03, boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}
                whileTap={{ scale: 0.97 }}
              >
                <FaCheck size={12} />
                Generate Card
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CardForm;
