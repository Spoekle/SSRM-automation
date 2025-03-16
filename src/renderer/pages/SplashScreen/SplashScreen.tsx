import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import log from 'electron-log';
import LinearProgress from '@mui/material/LinearProgress';
import logo from '../../../../assets/icons/logo.svg';

interface SplashScreenProps {
  appVersion: string;
}

// Local Storage Keys
const LOCAL_STORAGE_KEYS = {
  THEME: 'theme',
  SKIP_UPDATE_CHECK: 'skipUpdateCheck',
  MAP_INFO: 'mapInfo',
  MAP_ID: 'mapId',
  STAR_RATINGS: 'starRatings',
  OLD_STAR_RATINGS: 'oldStarRatings',
  CARD_CONFIG: 'cardConfig'
};

const SplashScreen: React.FC<SplashScreenProps> = ({ appVersion }) => {
  const { ipcRenderer } = window.require('electron');
  const [loadingStage, setLoadingStage] = useState('Initializing...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState('');
  const [apiStatus, setApiStatus] = useState({
    scoresaber: false,
    beatsaver: false
  });

  const [countdown, setCountdown] = useState(2000);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Local storage state
  const [localStorageData, setLocalStorageData] = useState<{
    theme: string | null,
    skipUpdateCheck: boolean,
    mapInfo: any | null,
    mapId: string | null,
    cardConfig: any | null
  }>({
    theme: null,
    skipUpdateCheck: false,
    mapInfo: null,
    mapId: null,
    cardConfig: null
  });

  const startTimeRef = useRef<number>(Date.now());
  const MIN_SPLASH_TIME = 5;

  useEffect(() => {
    const loadLocalStorageData = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME);
      const isDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;

      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, 'light');
      }

      const skipUpdateCheck = localStorage.getItem(LOCAL_STORAGE_KEYS.SKIP_UPDATE_CHECK) === 'true';
      const mapInfo = localStorage.getItem(LOCAL_STORAGE_KEYS.MAP_INFO);
      const mapId = localStorage.getItem(LOCAL_STORAGE_KEYS.MAP_ID);

      let cardConfig = null;
      try {
        const cardConfigJson = localStorage.getItem(LOCAL_STORAGE_KEYS.CARD_CONFIG);
        if (cardConfigJson) {
          cardConfig = JSON.parse(cardConfigJson);
        }
      } catch (error) {
        log.error("Error parsing card config:", error);
      }

      // Update local storage state
      setLocalStorageData({
        theme: isDarkMode ? 'dark' : 'light',
        skipUpdateCheck,
        mapInfo,
        mapId,
        cardConfig
      });

      log.info("Local storage initialized:", {
        theme: isDarkMode ? 'dark' : 'light',
        skipUpdateCheck,
        hasMapInfo: !!mapInfo,
        hasMapId: !!mapId,
        hasCardConfig: !!cardConfig
      });
    };

    loadLocalStorageData();
  }, []);

  useEffect(() => {
    if (showUpdatePrompt && !isUpdating && !isHovering) {
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown <= 1) {
            clearInterval(countdownTimerRef.current!);
            handleSkipUpdate();
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    } else if (countdownTimerRef.current && (isHovering || isUpdating)) {
      // Clear the interval when hovering or updating
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [showUpdatePrompt, isUpdating, isHovering]);

  const proceedToMainApp = () => {
    const elapsedTime = Date.now() - startTimeRef.current;
    const remainingTime = Math.max(0, MIN_SPLASH_TIME - elapsedTime);

    setTimeout(() => {
      ipcRenderer.invoke('splash-complete');
    }, remainingTime);
  };

  // Load all needed data
  useEffect(() => {
    const loadEverything = async () => {
      // Helper function to wait for a specified duration
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      try {
      // Stage 1: Check ScoreSaber API
      setLoadingStage('Checking ScoreSaber API...');
      const ssStatus = await ipcRenderer.invoke('check-scoresaber');
      setApiStatus(prev => ({ ...prev, scoresaber: ssStatus }));
      setLoadingProgress(25);
      await wait(1000);

      // Stage 2: Check BeatSaver API
      setLoadingStage('Checking BeatSaver API...');
      const bsStatus = await ipcRenderer.invoke('check-beatsaver');
      setApiStatus(prev => ({ ...prev, beatsaver: bsStatus }));
      setLoadingProgress(50);
      await wait(1000);

      // Stage 3: Load configuration
      setLoadingStage('Loading configuration...');
      // Configuration is already loaded in the earlier useEffect
      setLoadingProgress(75);
      await wait(1000);

      // Stage 4: Check for updates (last)
      setLoadingStage('Checking for updates...');
      const hasUpdate = await checkForUpdates();
      setLoadingProgress(100);
      await wait(1000);

      // Stage 5: Finalizing
      setLoadingStage('Ready!');

      // Check if we should show update prompt or continue to main app
      if (hasUpdate && !localStorageData.skipUpdateCheck) {
        log.info("Update available and not skipped, showing prompt");
        setShowUpdatePrompt(true);
      } else {
        if (hasUpdate) {
        log.info("Update available but skipped");
        }
        proceedToMainApp();
      }
      } catch (error) {
      log.error('Error during splash initialization:', error);
      setLoadingStage('Error during initialization');
      // Continue to main app even on error after a delay
      setTimeout(proceedToMainApp, 1000);
      }
    };

    if (localStorageData.theme !== null) {
      loadEverything();
    }
  }, [localStorageData]);

  const checkForUpdates = async () => {
    try {
      const response = await axios.get(
        'https://api.github.com/repos/Spoekle/SSRM-automation/releases/latest'
      );
      const data = response.data;
      const latestVer = data.tag_name.replace(/^v/, '');
      setLatestVersion(latestVer);

      // Compare versions more reliably by converting to numbers
      const currentVerNumber = parseFloat(appVersion.replace(/\./g, ''));
      const latestVerNumber = parseFloat(latestVer.replace(/\./g, ''));

      log.info(`Version check: Current=${appVersion} (${currentVerNumber}), Latest=${latestVer} (${latestVerNumber})`);

      if (latestVerNumber > currentVerNumber) {
        log.info(`Update available: Current=${appVersion}, Latest=${latestVer}`);
        setUpdateAvailable(true);
        return true;
      } else {
        log.info(`No update required: Current=${appVersion}, Latest=${latestVer}`);
        return false;
      }
    } catch (error) {
      log.error('Error checking for updates:', error);
      return false;
    }
  };

  const handleUpdateNow = async () => {
    // Clear the countdown timer when user clicks update
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

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

  const handleSkipUpdate = () => {
    // Clear the countdown timer when user clicks skip
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    localStorage.setItem(LOCAL_STORAGE_KEYS.SKIP_UPDATE_CHECK, 'true');
    log.info("Update skipped, setting skip flag");
    proceedToMainApp();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-neutral-200 dark:bg-neutral-900 rounded-3xl overflow-hidden p-4">
      <div className="drag absolute top-0 left-0 right-0 h-20"></div>
      <motion.div
        className="w-full max-w-xs flex flex-col items-center justify-center space-y-6 mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo - Enhanced 2D animation */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9, rotate: 10 }}
          animate={{
            rotateY: 360,
            rotateX: [0, 15, 0, -15, 0],
            y: [0, -10, 0],
          }}
          transition={{
            rotateY: { duration: 6, ease: "linear", repeat: Infinity },
            rotateX: { duration: 3, ease: "easeInOut", repeat: Infinity },
            y: { duration: 2, ease: "easeInOut", repeat: Infinity }
          }}
          style={{ perspective: "1000px" }}
          className="mb-2 cursor-pointer"
        >
          <motion.img
            src={logo}
            alt="Logo"
            className="h-24 w-24"
            drag
            dragConstraints={{
              top: -10,
              left: -10,
              right: 10,
              bottom: 10,
            }}
          />
        </motion.div>

        {/* App name and version */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.h1
            className="text-2xl font-bold text-neutral-950 dark:text-neutral-200"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            SSRM Automation
          </motion.h1>
          <motion.p
            className="text-sm text-neutral-600 dark:text-neutral-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Version {appVersion}
          </motion.p>
        </motion.div>

        {/* Show loading progress and API status only if no update prompt is visible */}
        <AnimatePresence>
          {!showUpdatePrompt && (
            <motion.div
              className="w-full space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Loading progress */}
              <motion.div
                className="w-full space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex justify-between items-center">
                  <motion.p
                    className="text-sm font-medium text-neutral-800 dark:text-neutral-300"
                    key={loadingStage}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {loadingStage}
                  </motion.p>
                  <motion.p
                    className="text-xs text-neutral-600 dark:text-neutral-400"
                    key={loadingProgress}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {loadingProgress}%
                  </motion.p>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={loadingProgress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#3b82f6'
                    }
                  }}
                />
              </motion.div>

              {/* API Status indicators */}
              {loadingProgress >= 25 && (
                <motion.div
                  className="flex justify-center space-x-4 w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                >
                  <motion.div
                    className={`flex items-center space-x-2 text-sm ${apiStatus.scoresaber ? 'text-green-500' : 'text-red-500'}`}
                    whileHover={{ scale: 1.1 }}
                    animate={apiStatus.scoresaber ? { y: [0, -3, 0] } : {}}
                    transition={apiStatus.scoresaber ? { y: { duration: 0.5, repeat: 1 } } : {}}
                  >
                    <motion.div
                      className={`h-2 w-2 rounded-full ${apiStatus.scoresaber ? 'bg-green-500' : 'bg-red-500'}`}
                      animate={{ scale: apiStatus.scoresaber ? [1, 1.5, 1] : [1, 0.8, 1] }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                    />
                    <span>ScoreSaber</span>
                  </motion.div>
                  <motion.div
                    className={`flex items-center space-x-2 text-sm ${apiStatus.beatsaver ? 'text-green-500' : 'text-red-500'}`}
                    whileHover={{ scale: 1.1 }}
                    animate={apiStatus.beatsaver ? { y: [0, -3, 0] } : {}}
                    transition={apiStatus.beatsaver ? { y: { duration: 0.5, delay: 0.2, repeat: 1 } } : {}}
                  >
                    <motion.div
                      className={`h-2 w-2 rounded-full ${apiStatus.beatsaver ? 'bg-green-500' : 'bg-red-500'}`}
                      animate={{ scale: apiStatus.beatsaver ? [1, 1.5, 1] : [1, 0.8, 1] }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", delay: 0.3 }}
                    />
                    <span>BeatSaver</span>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Update prompt with countdown */}
        <AnimatePresence>
          {showUpdatePrompt && !isUpdating && (
            <motion.div
              className="p-4 bg-blue-100 dark:bg-blue-900 rounded-2xl text-center w-full"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <motion.p
                className="text-sm mb-2 text-neutral-950 dark:text-neutral-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Update available! Latest: {latestVersion}, Current: {appVersion}
              </motion.p>

              <motion.div
                className="flex justify-center space-x-3 mt-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={handleUpdateNow}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
                  whileHover={{ scale: 1.05, backgroundColor: "#2563eb" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Update Now
                </motion.button>
                <motion.button
                  onClick={handleSkipUpdate}
                  className="px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-200"
                  whileHover={{ scale: 1.05, backgroundColor: "#4b5563" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Skip
                </motion.button>
              </motion.div>

              {/* Countdown bar */}
              <motion.div
                className="mt-4 w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <motion.p
                  className="text-xs text-neutral-950 dark:text-neutral-200 text-center mb-1"
                  animate={{
                    color: isHovering ? ["#3b82f6", "#60a5fa", "#3b82f6"] : undefined
                  }}
                  transition={{ duration: 1.5, repeat: isHovering ? Infinity : 0 }}
                >
                  {isHovering ? "Paused" : `Continuing in ${countdown}s`}
                </motion.p>
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="bg-blue-500 h-1.5"
                    style={{ width: `${countdown * 20}%` }}
                    animate={isHovering ? {
                      backgroundColor: ["#3b82f6", "#60a5fa", "#3b82f6"]
                    } : {}}
                    transition={isHovering ? {
                      backgroundColor: { duration: 2, repeat: Infinity }
                    } : {
                      width: { duration: 1, ease: "linear" }
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Update progress */}
        <AnimatePresence>
          {isUpdating && (
            <motion.div
              className="mt-4 p-4 bg-blue-500 text-white rounded-lg text-center w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, boxShadow: ["0px 0px 0px rgba(59, 130, 246, 0)", "0px 0px 15px rgba(59, 130, 246, 0.5)", "0px 0px 0px rgba(59, 130, 246, 0)"] }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                boxShadow: { duration: 2, repeat: Infinity },
                opacity: { duration: 0.3 },
                y: { duration: 0.3, type: "spring" }
              }}
            >
              <motion.p
                className="text-sm"
                key={updateProgress}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {updateProgress}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
