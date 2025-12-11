import React, { FormEvent, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Switch from '@mui/material/Switch';
import axios from 'axios';
import log from '../../../utils/log';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMapMarkedAlt, FaGamepad, FaCheck, FaStar, FaSync } from 'react-icons/fa';
import { notifyMapInfoUpdated } from '../../../utils/mapEvents';

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
          className={`fixed top-17 left-0 right-0 bottom-13 z-40 rounded-br-3xl backdrop-blur-sm flex justify-center items-center ${isOverlayVisible ? "opacity-100" : "opacity-0"
            } bg-neutral-900/30`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isOverlayVisible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="absolute left-0 top-0 h-full w-2/3 md:w-1/2 rounded-r-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl border-r border-y border-white/20 dark:border-white/5 overflow-hidden flex flex-col"
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
                  <FaMapMarkedAlt className="text-blue-500" />
                  Map Settings
                </motion.h2>
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
              <form onSubmit={getMapInfo} className='space-y-5'>
                {/* Map Details Card */}
                <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
                    <FaMapMarkedAlt className="text-blue-500" /> Map Details
                  </h3>

                  <div className='mb-3'>
                    <label className="block mb-1 text-xs text-neutral-700 dark:text-neutral-200 font-medium">Map ID:</label>
                    <div className="relative flex space-x-2 items-center">
                      <input
                        type='text'
                        value={mapId}
                        onChange={handleMapIdChange}
                        className='flex-1 px-3 py-1.5 text-sm border bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-shadow'
                        placeholder="Enter map ID..."
                      />
                      <motion.button
                        type="button"
                        onClick={fetchMapInfo}
                        disabled={isFetching}
                        className="absolute right-1 bg-blue-500 text-white px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 shadow-sm hover:bg-blue-600 transition-colors"
                        whileHover={!isFetching ? { scale: 1.05 } : {}}
                        whileTap={!isFetching ? { scale: 0.95 } : {}}
                      >
                        {isFetching ? <FaSync className="animate-spin" /> : <FaStar />}
                        <span className="hidden sm:inline">{isFetching ? 'Fetching...' : 'Fetch Info'}</span>
                      </motion.button>
                    </div>
                    {songName && (
                      <motion.div
                        className="mt-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded inline-block border border-green-200 dark:border-green-800/50"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        Found: {songName}
                      </motion.div>
                    )}
                  </div>

                  <div className='flex items-center mt-2'>
                    <label className='text-xs mr-3 text-neutral-700 dark:text-neutral-200 font-medium'>Use Subname:</label>
                    <Switch checked={useSubname} onChange={handleSwitch} size="small" />
                  </div>
                </div>

                {/* Content Settings Card */}
                <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
                    <FaGamepad className="text-purple-500" /> Content Settings
                  </h3>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    <div>
                      <label className='block text-xs mb-1 text-neutral-700 dark:text-neutral-200 font-medium'>Difficulty:</label>
                      <select
                        className='w-full px-3 py-1.5 text-sm border bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-shadow'
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
                      <label className='block text-xs mb-1 text-neutral-700 dark:text-neutral-200 font-medium'>Player:</label>
                      <select
                        className='w-full px-3 py-1.5 text-sm border bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-shadow'
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
                        <option value="Gumball">Gumball</option>
                        <option value="Dack">Dack</option>
                      </select>
                    </div>
                  </div>
                </div>
              </form>
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
              <motion.button
                type="button"
                onClick={getMapInfo}
                className='bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-5 py-2 text-sm rounded-lg shadow-lg shadow-blue-500/20 font-semibold flex items-center gap-2'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaCheck />
                Update Map Info
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
