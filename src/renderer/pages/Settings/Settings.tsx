import React, { useState, useEffect, forwardRef, useImperativeHandle, ChangeEvent } from 'react';
import Switch from '@mui/material/Switch';
import LinearProgress from '@mui/material/LinearProgress';
import { FaTimes, FaGithub, FaArrowRight, FaTrash, FaExchangeAlt, FaUpload } from 'react-icons/fa';
import log from 'electron-log';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationModal } from './components/ConfirmationModal';
import LoadedMapInfo from './components/LoadedMapInfo';
import './styles/CustomScrollbar.css';

export interface SettingsHandles {
  close: () => void;
}

interface SettingsProps {
  onClose: () => void;
  appVersion: string;
  latestVersion: string;
  showUpdateTab?: boolean;
}

const Settings = forwardRef<SettingsHandles, SettingsProps>(({ onClose, appVersion, latestVersion, showUpdateTab = false }, ref) => {
  const { ipcRenderer } = window.require('electron');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  const [ffmpegInstalled, setFfmpegInstalled] = useState<boolean | null>(null);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [installStatus, setInstallStatus] = useState('');
  const [installProgressPercent, setInstallProgressPercent] = useState<number | null>(null);

  const [confirmResetAllOpen, setConfirmResetAllOpen] = useState(false);
  const [confirmResetMapOpen, setConfirmResetMapOpen] = useState(false);
  const [loadedMapInfo, setLoadedMapInfo] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState('');

  // New state to hold stored card config file name
  const [storedCardConfigName, setStoredCardConfigName] = useState<string | null>(() => {
    try {
      const storedConfig = localStorage.getItem('cardConfig');
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        return parsed.configName || null;
      }
    } catch (error) {
      log.error("Error parsing cardConfig:", error);
    }
    return null;
  });

  // The updateSectionRef will be used to scroll to update section if showUpdateTab is true
  const updateSectionRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOverlayVisible(true);
    setIsPanelOpen(true);

    // Scroll to update section if showUpdateTab is true
    if (showUpdateTab && updateSectionRef.current) {
      setTimeout(() => {
        updateSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [showUpdateTab]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    checkFfmpeg();
    ipcRenderer.on('ffmpeg-install-progress', updateInstallStatus);
    const storedMap = localStorage.getItem('mapInfo');
    if (storedMap) {
      setLoadedMapInfo(storedMap);
    }
    return () => {
      ipcRenderer.removeListener('ffmpeg-install-progress', updateInstallStatus);
    };
  }, []);

  const updateApplication = async () => {
    try {
      setIsUpdating(true);
      setUpdateProgress("Starting update...");

      ipcRenderer.on('update-progress', (_event: any, progressMsg: string) => {
        setUpdateProgress(progressMsg);
      });

      await ipcRenderer.invoke('update-application');
      // Reset skip update flag when updates are manually applied
      localStorage.removeItem('skipUpdateCheck');
    } catch (error) {
      log.error('Error updating application:', error);
      setIsUpdating(false);
      alert('Failed to update the application.');
    }
  };

  // Updated: store card configuration with the file name.
  const handleCardConfigUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const cardConfig = JSON.parse(text);
      // Validate basic structure
      if (!cardConfig.width || !cardConfig.height || !cardConfig.background || !cardConfig.components) {
        throw new Error("Invalid card configuration format.");
      }
      // Add the file name to the configuration
      cardConfig.configName = file.name;
      localStorage.setItem('cardConfig', JSON.stringify(cardConfig));
      setStoredCardConfigName(file.name);
      window.alert("Card configuration saved successfully!");
    } catch (error) {
      log.error("Error uploading card configuration:", error);
      window.alert("Failed to upload card configuration. Please check the file format.");
    }
  };

  const updateInstallStatus = (_event: any, progressMessage: string) => {
    setInstallStatus(progressMessage);
    const match = progressMessage.match(/(\d+)%/);
    setInstallProgressPercent(match ? parseInt(match[1], 10) : null);
  };

  const checkFfmpeg = async () => {
    try {
      const installed = await ipcRenderer.invoke('check-ffmpeg');
      setFfmpegInstalled(installed);
    } catch (error) {
      log.error('Error checking ffmpeg:', error);
      setFfmpegInstalled(false);
    }
  };

  const handleFfmpegAction = async (type: 'install' | 'reinstall') => {
    setFfmpegLoading(true);
    setInstallStatus('');
    setInstallProgressPercent(null);
    try {
      await ipcRenderer.invoke(
        type === 'install' ? 'install-ffmpeg' : 'reinstall-ffmpeg'
      );
    } catch (err) {
      log.error(`Error ${type}ing ffmpeg:`, err);
    } finally {
      setFfmpegLoading(false);
      checkFfmpeg();
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const resetLocalStorage = () => {
    setConfirmResetAllOpen(true);
  };

  const handleConfirmResetAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleConfirmResetMap = () => {
    localStorage.removeItem('mapId');
    localStorage.removeItem('mapInfo');
    localStorage.removeItem('starRatings');
    localStorage.removeItem('oldStarRatings');
    window.location.reload();
  };

  const handleClose = () => {
    setIsPanelOpen(false);
    setIsOverlayVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  useImperativeHandle(ref, () => ({
    close: handleClose,
  }));

  // Animation variants for different elements
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  return (
    <>
      <motion.div
        className={`fixed top-16 left-0 right-0 bottom-16 z-40 rounded-bl-3xl backdrop-blur-md flex justify-center items-center ${
          isOverlayVisible ? 'opacity-100' : 'opacity-0'
        } bg-black/20`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isOverlayVisible ? 1 : 0 }}
        onClick={handleClose}
      >
        <motion.div
          className={`absolute right-0 top-0 h-full w-2/3 rounded-l-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-lg overflow-y-auto custom-scrollbar`}
          initial={{ x: "100%" }}
          animate={{ x: isPanelOpen ? "0%" : "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          id="settings-panel"
        >
          {/* Header */}
          <motion.div
            className="z-10 sticky top-0 backdrop-blur-md p-4 border-b border-neutral-200 dark:border-neutral-500 flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring" }}
          >
            <motion.h2
              className="text-xl bg-neutral-100 dark:bg-neutral-600 px-3 py-2 rounded-lg font-semibold"
              whileHover={{ scale: 1.03 }}
            >
              Settings
            </motion.h2>
            <motion.button
              className="text-red-500 bg-neutral-300 dark:bg-neutral-700 p-2 rounded-md hover:bg-neutral-400 dark:hover:bg-neutral-600 transition duration-200"
              onClick={handleClose}
              whileHover={{ scale: 1.1, backgroundColor: "#ef4444", color: "#ffffff" }}
              whileTap={{ scale: 0.95 }}
            >
              <FaTimes />
            </motion.button>
          </motion.div>

          {/* Content Container */}
          <div className="px-4 pb-4 space-y-4">
            {/* Loaded Map Info */}
            <motion.div
              className="p-4 rounded-lg"
              custom={0}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.p
                className="font-medium text-neutral-800 dark:text-neutral-100"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Currently Loaded Map:
              </motion.p>
              <LoadedMapInfo
                loadedMapInfo={loadedMapInfo}
                setConfirmResetMapOpen={setConfirmResetMapOpen}
              />
            </motion.div>

            {/* Preferences */}
            <motion.div
              className="p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg"
              custom={1}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.01, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex justify-between items-center">
                <motion.h1
                  className="font-medium text-xl text-neutral-800 dark:text-neutral-100"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Preferences
                </motion.h1>
                <motion.p
                  className="text-neutral-800 dark:text-neutral-100 text-sm text-end"
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Change the theme, upload or remove card configuration...
                </motion.p>
              </div>
              <motion.div
                className="mt-4 flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex flex-col">
                  <motion.div
                    className="flex items-center space-x-4"
                    whileHover={{ scale: 1.02, x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <span className="font-medium text-neutral-800 dark:text-neutral-100">Dark Mode</span>
                    <Switch checked={isDarkMode} onChange={toggleTheme} color="primary" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            {/* Reset Local Storage */}
            <motion.div
              className="p-4 bg-neutral-100 dark:bg-neutral-600 rounded-lg"
              custom={2}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.01, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
            >
              <div className="flex justify-between items-center">
                <motion.h1
                  className="font-medium text-xl text-neutral-800 dark:text-neutral-100"
                  whileHover={{ x: 3 }}
                >
                  Reset Local Storage
                </motion.h1>
                <motion.p
                  className="text-neutral-800 dark:text-neutral-100 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ delay: 0.7 }}
                >
                  Reset all local storage data.
                </motion.p>
              </div>
              <motion.button
                onClick={resetLocalStorage}
                className="mt-2 w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200"
                whileHover={{ scale: 1.02, boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.2)" }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div
                  className="flex items-center justify-center space-x-2"
                  whileHover={{ x: 5 }}
                >
                  <FaTrash />
                  <span>Reset Local Storage</span>
                </motion.div>
              </motion.button>
            </motion.div>

            {/* ffmpeg Install Section */}
            <motion.div
              className="p-4 bg-neutral-100 dark:bg-neutral-600 rounded-lg text-center space-y-4"
              custom={3}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.01, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
            >
              <div className="flex justify-between items-center">
                <motion.h1
                  className="font-medium text-xl text-neutral-800 dark:text-neutral-100"
                  whileHover={{ x: 3 }}
                >
                  ffmpeg
                </motion.h1>
                <motion.p
                  className="text-neutral-800 dark:text-neutral-100 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  ffmpeg is required for video thumbnail extractions.
                </motion.p>
              </div>

              <AnimatePresence>
                {ffmpegLoading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <LinearProgress
                      variant={installProgressPercent !== null ? 'determinate' : 'indeterminate'}
                      value={installProgressPercent || 0}
                    />
                    <motion.p
                      className="text-sm mt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {installStatus}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {!ffmpegLoading && ffmpegInstalled && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <motion.button
                      onClick={() => handleFfmpegAction('reinstall')}
                      className="w-full bg-blue-500 hover:bg-blue-600 transition duration-200 text-white px-4 py-2 rounded mt-2"
                      whileHover={{ scale: 1.02, boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.2)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div className="flex items-center justify-center space-x-2">
                        <FaExchangeAlt />
                        <span>Reinstall ffmpeg</span>
                      </motion.div>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {!ffmpegLoading && ffmpegInstalled === false && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <motion.button
                      onClick={() => handleFfmpegAction('install')}
                      className="w-full bg-green-500 text-white px-4 py-2 rounded"
                      whileHover={{ scale: 1.02, boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.2)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div className="flex items-center justify-center space-x-2">
                        <FaUpload />
                        <span>Install ffmpeg</span>
                      </motion.div>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Update section */}
            {parseFloat(latestVersion.replace(/\./g, '')) >
              parseFloat(appVersion.replace(/\./g, '')) && (
              <motion.div
                ref={updateSectionRef}
                className={`p-4 bg-neutral-100 dark:bg-neutral-600 rounded-lg transition-colors duration-300`}
                custom={4}
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.01, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
              >
                <div className="flex justify-between items-center">
                  <motion.h1
                    className="font-medium text-xl text-neutral-800 dark:text-neutral-100"
                    whileHover={{ x: 3 }}
                    animate={{
                      scale: [1, 1.03, 1],
                      color: ["#3b82f6", "#60a5fa", "#3b82f6"]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      color: { repeat: Infinity, duration: 3 }
                    }}
                  >
                    Update! {latestVersion}
                  </motion.h1>
                  <motion.p
                    className="text-neutral-800 dark:text-neutral-100 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    Update available! Please update your application.
                  </motion.p>
                </div>

                <AnimatePresence>
                  {isUpdating && (
                    <motion.div
                      className="mt-2 p-2 bg-blue-500 text-white rounded-lg text-center"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.p
                        animate={{
                          scale: [1, 1.02, 1],
                        }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        {updateProgress}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={updateApplication}
                  className={`mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200`}
                  disabled={isUpdating}
                  whileHover={!isUpdating ? { scale: 1.02, boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.2)" } : {}}
                  whileTap={!isUpdating ? { scale: 0.98 } : {}}
                  animate={!isUpdating ? {
                    scale: [1, 1.02, 1],
                    boxShadow: [
                      "0px 0px 0px rgba(37, 99, 235, 0.2)",
                      "0px 0px 15px rgba(37, 99, 235, 0.5)",
                      "0px 0px 0px rgba(37, 99, 235, 0.2)"
                    ]
                  } : {}}
                  transition={{
                    repeat: isUpdating ? 0 : Infinity,
                    duration: 2
                  }}
                >
                  <motion.div className="flex items-center justify-center space-x-2">
                    {isUpdating ? 'Updating...' : (
                      <>
                        <FaArrowRight />
                        <span>Update Now!</span>
                      </>
                    )}
                  </motion.div>
                </motion.button>
              </motion.div>
            )}

            {/* Credits */}
            <motion.div
              className="p-4 flex justify-between items-center bg-neutral-200 dark:bg-neutral-800 rounded-lg"
              custom={5}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.01 }}
            >
              <p className="text-lg flex text-neutral-800 dark:text-neutral-100">
                Made by <a className='ml-1 font-bold'>Spoekle :D</a>
              </p>
              <div className="flex flex-col items-center">
                <motion.a
                  href="https://github.com/Spoekle/SSRM-automation"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-neutral-300"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FaGithub size={32}/>
                </motion.a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Confirmation modals */}
      <ConfirmationModal
        open={confirmResetAllOpen}
        title="Reset All Local Storage"
        message="Are you sure you want to reset all local storage?"
        onCancel={() => setConfirmResetAllOpen(false)}
        onConfirm={() => {
          setConfirmResetAllOpen(false);
          handleConfirmResetAll();
        }}
      />

      <ConfirmationModal
        open={confirmResetMapOpen}
        title="Reset Map Data"
        message="Are you sure you want to reset only the map data?"
        onCancel={() => setConfirmResetMapOpen(false)}
        onConfirm={() => {
          setConfirmResetMapOpen(false);
          handleConfirmResetMap();
        }}
      />
    </>
  );
});

export default Settings;
