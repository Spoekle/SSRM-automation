import React, { FormEvent, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Switch from '@mui/material/Switch';
import axios from 'axios';
import log from 'electron-log';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMapMarkedAlt, FaGamepad, FaCheck, FaStar, FaSync } from 'react-icons/fa';
import { notifyMapInfoUpdated } from '../../../utils/mapEvents';
import '../../../pages/Settings/styles/CustomScrollbar.css';

// Utility functions for difficulty conversion
const difficultyToAbbreviated = (difficulty: string): string => {
  switch (difficulty) {
    case 'Easy':
      return 'ES';
    case 'Normal':
      return 'NOR';
    case 'Hard':
      return 'HARD';
    case 'Expert':
      return 'EX';
    case 'Expert+':
      return 'EXP';
    default:
      return difficulty;
  }
};

interface MapFormProps {
  mapId: string;
  setMapId: (id: string) => void;
  chosenDiff: string;
  setChosenDiff: (diff: string) => void;
  useSubname: boolean;
  setUseSubname: (use: boolean) => void;
  player: string;
  setPlayer: (player: string) => void;
  setMapFormModal: (show: boolean) => void;
  setMapInfo: (info: any) => void;
  createAlert?: (text: string, type: 'success' | 'error' | 'alert' | 'info') => void;
}

const MapForm: React.FC<MapFormProps> = ({
  mapId,
  setMapId,
  chosenDiff,
  setChosenDiff,
  useSubname,
  setUseSubname,
  player,
  setPlayer,
  setMapFormModal,
  setMapInfo,
  createAlert
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [songName, setSongName] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    setIsOverlayVisible(true);
    setIsPanelOpen(true);
  }, []);

  const handleClose = () => {
    setIsPanelOpen(false);
    setIsOverlayVisible(false);
    setTimeout(() => {
      setMapFormModal(false);
    }, 300);
  };

  const handleMapIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMapId(e.target.value);
  };

  const handleSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseSubname(event.target.checked);
    localStorage.setItem('useSubname', `${event.target.checked}`);
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      if (!useSubname) {
        data.metadata.songSubName = '';
      }
      setMapInfo(data);
      localStorage.setItem('mapId', `${mapId}`);
      localStorage.setItem('mapInfo', JSON.stringify(data));
      notifyMapInfoUpdated();
      log.info(data);
      if (createAlert) createAlert('Map loaded successfully!', 'success');
      setMapFormModal(false);
    } catch (error) {
      log.error('Error fetching map info:', error);
      if (createAlert) createAlert('Error loading map', 'error');
    }
  };

  const fetchMapInfo = async () => {
    if (!mapId) {
      if (createAlert) createAlert("Please enter a map ID first", "error");
      return;
    }

    setIsFetching(true);
    try {
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      setSongName(data.metadata.songName);
      if (createAlert) createAlert("Map info loaded!", "success");
    } catch (error) {
      log.error('Error fetching map info:', error);
      if (createAlert) createAlert("Error loading map info", "error");
      setSongName('');
    } finally {
      setIsFetching(false);
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
            className="absolute left-0 top-0 h-full w-2/3 md:w-1/2 rounded-r-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-lg overflow-hidden flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: isPanelOpen ? "0%" : "-100%" }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="z-10 sticky top-0 backdrop-blur-md bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-800/20 dark:to-cyan-800/20 p-4 border-b border-neutral-300 dark:border-neutral-700 flex justify-between items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <motion.h2
                className="text-xl bg-white/70 dark:bg-neutral-700/70 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-sm"
                whileHover={{ scale: 1.03 }}
              >
                <FaMapMarkedAlt className="text-blue-500" />
                Map Settings
              </motion.h2>
              <motion.button
                className="text-red-500 bg-white/70 dark:bg-neutral-700/70 p-2 rounded-md hover:bg-neutral-400 dark:hover:bg-neutral-600 transition duration-200 shadow-sm"
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
              <form onSubmit={getMapInfo} className='px-4 py-3'>
                <div className='space-y-4'>
                  {/* Map Details Card */}
                  <div className='bg-white dark:bg-neutral-700 p-4 rounded-xl shadow-sm'>
                    <h3 className="text-base font-medium mb-2 border-b pb-2 border-neutral-200 dark:border-neutral-600 flex items-center gap-2">
                      <FaMapMarkedAlt className="text-blue-500" /> Map Details
                    </h3>

                    <div className='mb-3'>
                      <label className="text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-200">Map ID:</label>
                      <div className="relative flex space-x-2 items-center">
                        <input
                          type='text'
                          value={mapId}
                          onChange={handleMapIdChange}
                          className='w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white'
                          placeholder="Enter map ID..."
                        />
                        <motion.button
                          type="button"
                          onClick={fetchMapInfo}
                          disabled={isFetching}
                          className="absolute right-0 bg-blue-500 text-white px-3 py-1.5 text-sm rounded-lg flex items-center gap-1"
                          whileHover={!isFetching ? { scale: 1.05 } : {}}
                          whileTap={!isFetching ? { scale: 0.95 } : {}}
                        >
                          {isFetching ? <FaSync className="animate-spin" size={12} /> : <FaStar size={12} />}
                          <span className="hidden sm:inline">{isFetching ? 'Fetching...' : 'Fetch Info'}</span>
                        </motion.button>
                      </div>
                      {songName && (
                        <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                          Found: {songName}
                        </div>
                      )}
                    </div>

                    <div className='flex items-center mt-2'>
                      <label className='text-sm mr-3 text-neutral-700 dark:text-neutral-200'>Use Subname:</label>
                      <Switch checked={useSubname} onChange={handleSwitch} size="small" />
                    </div>
                  </div>

                  {/* Content Settings Card */}
                  <div className='bg-white dark:bg-neutral-700 p-4 rounded-xl shadow-sm'>
                    <h3 className="text-base font-medium mb-2 border-b pb-2 border-neutral-200 dark:border-neutral-600 flex items-center gap-2">
                      <FaGamepad className="text-purple-500" /> Content Settings
                    </h3>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-sm mb-1 text-neutral-700 dark:text-neutral-200 font-medium'>Difficulty:</label>
                        <select
                          className='w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white'
                          value={chosenDiff}
                          onChange={(e) => {
                            const selectedDifficulty = e.target.value;
                            setChosenDiff(selectedDifficulty);
                            localStorage.setItem('chosenDiff', difficultyToAbbreviated(selectedDifficulty));
                          }}
                        >
                          <option value="Easy">Easy (ES)</option>
                          <option value="Normal">Normal (NOR)</option>
                          <option value="Hard">Hard (HARD)</option>
                          <option value="Expert">Expert (EX)</option>
                          <option value="Expert+">Expert+ (EXP)</option>
                        </select>
                      </div>

                      <div>
                        <label className='block text-sm mb-1 text-neutral-700 dark:text-neutral-200 font-medium'>Player:</label>
                        <select
                          className='w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white'
                          onChange={(e) => setPlayer(e.target.value)}
                          value={player}
                        >
                          <option value="praunt">praunt</option>
                          <option value="olliemine">olliemine</option>
                          <option value="voltage">voltage</option>
                          <option value="RaccoonVR">RaccoonVR</option>
                          <option value="BigOlDumplin">BigOlDumplin</option>
                          <option value="yabje">yabje</option>
                          <option value="Mr_bjo">Mr_bjo</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Sticky footer with Generate button */}
            <div className='sticky bottom-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm p-3 border-t border-neutral-300 dark:border-neutral-700 flex justify-end items-center'>
              <motion.button
                type="button"
                onClick={getMapInfo}
                className='bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-2 rounded-lg shadow-sm hover:shadow-md font-medium flex items-center gap-2'
                whileHover={{ scale: 1.03, boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}
                whileTap={{ scale: 0.97 }}
              >
                <FaCheck />
                Generate
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MapForm;
