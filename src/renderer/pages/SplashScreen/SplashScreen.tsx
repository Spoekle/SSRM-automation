import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import log from 'electron-log';
import LinearProgress from '@mui/material/LinearProgress';
import logo from '../../../../assets/icons/logo.svg';

interface SplashScreenProps {
  appVersion: string;
  forceVersionCheck?: boolean; // Add prop for forcing version check
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

const SplashScreen: React.FC<SplashScreenProps> = ({ appVersion, forceVersionCheck = false }) => {
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

  const [countdown, setCountdown] = useState(1200);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isHovering, setIsHovering] = useState(false);

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
  const MIN_SPLASH_TIME = 2000;

  const [isDevBranch, setIsDevBranch] = useState(() => {
    return localStorage.getItem('useDevelopmentBranch') === 'true';
  });

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
    if (!isUpdating && !isHovering) {
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown <= 1) {
            clearInterval(countdownTimerRef.current!);
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    } else if (countdownTimerRef.current && (isHovering || isUpdating)) {
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

  const checkForUpdates = async () => {
    try {
      log.info('SplashScreen: Checking for updates...');
      log.info(`SplashScreen: Using ${isDevBranch ? 'development' : 'stable'} branch for updates`);

      // Get releases from GitHub API
      const response = await axios.get(
        'https://api.github.com/repos/Spoekle/SSRM-automation/releases',
        { timeout: 10000 }
      );

      let targetRelease;
      if (isDevBranch) {
        // Find the latest pre-release (development build)
        targetRelease = response.data.find((release: any) => release.prerelease);
        // Fall back to stable if no pre-releases
        if (!targetRelease) {
          targetRelease = response.data.find((release: any) => !release.prerelease);
        }
        log.info(`SplashScreen: Checking development branch`);
      } else {
        // Find the latest stable release
        targetRelease = response.data.find((release: any) => !release.prerelease);
        log.info(`SplashScreen: Checking stable branch`);
      }

      if (!targetRelease) {
        log.error('SplashScreen: No suitable release found');
        return false;
      }

      const latestVer = targetRelease.tag_name.replace(/^v/, '');
      setLatestVersion(latestVer);

      // Compare versions - simplified version comparison
      const current = appVersion;
      const latest = latestVer;

      log.info(`SplashScreen: Version check - Current=${current}, Latest=${latest}, Branch=${isDevBranch ? 'dev' : 'stable'}`);

      // If versions are identical, no update needed
      if (current === latest) {
        log.info('SplashScreen: Versions are identical, no update needed');
        return false;
      }

      // Use simpler version comparison with the compareVersions utility
      const versionCompare = compareVersions(latest, current);

      // Main version comparison logic (simplified)
      const isUpdateNeeded = (() => {
        // Direct check for exact version match
        if (current === latest) return false;

        // Check if current version has prerelease tag and latest doesn't
        const currentHasPrerelease = current.includes('-');
        const latestHasPrerelease = latest.includes('-');

        // If latest is stable and current is prerelease, update to stable
        if (!latestHasPrerelease && currentHasPrerelease) return true;

        // If latest is prerelease and current is stable, only update if we're on dev branch
        if (latestHasPrerelease && !currentHasPrerelease) return isDevBranch;

        // For all other cases, use numeric comparison
        if (currentHasPrerelease && latestHasPrerelease) {
          // Both are prereleases, handle special case
          const currentBase = current.split('-')[0];
          const latestBase = latest.split('-')[0];

          if (currentBase === latestBase) {
            // Same base version, compare prerelease tags
            const currentTag = current.split('-')[1];
            const latestTag = latest.split('-')[1];
            return latestTag > currentTag;
          }
        }

        // Default: use the standard version compare
        return versionCompare > 0;
      })();

      if (isUpdateNeeded) {
        log.info(`SplashScreen: Update available - Current=${current}, Latest=${latest}`);
        setUpdateAvailable(true);
        return true;
      } else {
        log.info(`SplashScreen: No update required - Current=${current}, Latest=${latest}`);
        return false;
      }
    } catch (error) {
      log.error('SplashScreen: Error checking for updates:', error);
      return false;
    }
  };

  const updateApplication = async () => {
    try {
      setIsUpdating(true);
      setUpdateProgress("Starting update...");

      ipcRenderer.on(
        "update-progress",
        (_event: any, progressMsg: string) => {
          setUpdateProgress(progressMsg);
        },
      );

      await ipcRenderer.invoke("update-application");
      localStorage.removeItem("skipUpdateCheck");

      // For non-Windows platforms, we need to indicate that the update won't auto-restart
      if (navigator.platform && !navigator.platform.includes('Win')) {
        setTimeout(() => {
          setUpdateProgress("Please complete the installation manually. You can close this app after installation is complete.");
        }, 5000);
      }
    } catch (error) {
      log.error("Error updating application:", error);
      setIsUpdating(false);
      setUpdateProgress("Update failed. Please try again or download manually from GitHub.");

      // Give user a chance to see error message before hiding it
      setTimeout(() => {
        setIsUpdating(false);
        proceedToMainApp();
      }, 5000);
    }
  };

  const handleSkipUpdate = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    localStorage.setItem(LOCAL_STORAGE_KEYS.SKIP_UPDATE_CHECK, 'true');
    log.info("Update skipped, setting skip flag");
    proceedToMainApp();
  };

  useEffect(() => {
    const loadEverything = async () => {
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      await wait(500);
      try {
        setLoadingStage('Checking ScoreSaber API...');
        const ssStatus = await ipcRenderer.invoke('check-scoresaber');
        setApiStatus(prev => ({ ...prev, scoresaber: ssStatus }));
        setLoadingProgress(25);
        await wait(500);

        setLoadingStage('Checking BeatSaver API...');
        const bsStatus = await ipcRenderer.invoke('check-beatsaver');
        setApiStatus(prev => ({ ...prev, beatsaver: bsStatus }));
        setLoadingProgress(50);
        await wait(500);

        setLoadingStage('Loading configuration...');
        setLoadingProgress(75);
        await wait(500);

        setLoadingStage('Checking for updates...');
        const hasUpdate = await checkForUpdates();
        setLoadingProgress(100);
        await wait(500);

        setLoadingStage('Ready!');

        // Use force check option if provided, otherwise use the skip setting
        const skipUpdateCheck = forceVersionCheck ? false : localStorage.getItem('skipUpdateCheck') === 'true';

        if (hasUpdate && !skipUpdateCheck) {
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
        setTimeout(proceedToMainApp, 1000);
      }
    };

    if (localStorageData.theme !== null) {
      loadEverything();
    }
  }, [localStorageData, forceVersionCheck]);

  useEffect(() => {
    // Clear any existing timers first to prevent multiple timers
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    // Only start countdown if update prompt is visible, not updating, and not hovering
    if (showUpdatePrompt && !isUpdating && !isHovering) {
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prevCount) => {
          const newCount = prevCount - 1;
          if (newCount <= 0) {
            // Clear the interval when we reach zero
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            // Automatically handle skip update when countdown reaches 0
            setTimeout(() => handleSkipUpdate(), 100);
            return 0;
          }
          return newCount;
        });
      }, 1000);
    }

    // Cleanup function to clear interval
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [showUpdatePrompt, isUpdating, isHovering]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full bg-neutral-200 dark:bg-neutral-900 rounded-3xl overflow-hidden p-4"
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="drag absolute top-0 left-0 right-0 h-10"></div>
      <motion.div
        className="w-full max-w-xs flex flex-col items-center justify-center space-y-4 mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
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
            className="text-xs text-neutral-600 dark:text-neutral-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Version {appVersion}
          </motion.p>
        </motion.div>

        <AnimatePresence>
          {!showUpdatePrompt && (
            <motion.div
              className="w-full space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
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

              {!showUpdatePrompt && loadingProgress >= 25 && (
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

        <AnimatePresence>
          {showUpdatePrompt && !isUpdating && (
            <motion.div
              className="p-4 bg-blue-100 dark:bg-blue-900 rounded-2xl text-center w-full overflow-clip"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <motion.p
                className="text-sm mb-2 text-neutral-950 dark:text-neutral-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {localStorage.getItem('lastUsedBranch') !== (isDevBranch ? 'dev' : 'stable')
                  ? isDevBranch
                    ? `Upgrade to development build available!`
                    : `Downgrade to stable build available!`
                  : `Update available!`}
                <br />
                <span className='text-xs'>Latest: {latestVersion}, Current: {appVersion}</span>
              </motion.p>

              <motion.div
                className="flex justify-center space-x-3 mt-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={updateApplication}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
                  whileHover={{ scale: 1.05, backgroundColor: "#2563eb" }}
                  whileTap={{ scale: 0.95 }}
                >
                  {localStorage.getItem('lastUsedBranch') !== (isDevBranch ? 'dev' : 'stable')
                    ? isDevBranch
                      ? "Upgrade to Dev"
                      : "Downgrade to Stable"
                    : "Update Now"
                  }
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
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1.5 overflow-clip">
                  <motion.div
                    className="bg-blue-500 h-1.5"
                    initial={{ width: `${countdown * 20}%` }}
                    animate={{ width: `${countdown * 20}%` }}
                    transition={{
                      duration: 0.5,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {isUpdating && (
            <motion.div
              className="mt-4 p-4 bg-blue-500 text-white rounded-lg text-center w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.p
                className="text-sm text-white"
                key={updateProgress}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {updateProgress}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const compareVersions = (v1: string, v2: string): number => {
  const cleanV1 = v1.split('-')[0];
  const cleanV2 = v2.split('-')[0];

  const v1Parts = cleanV1.split('.').map(Number);
  const v2Parts = cleanV2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }

  // If base versions are equal, check pre-release tags
  if (v1.includes('-') && !v2.includes('-')) return -1; // v2 is stable, v1 is pre-release
  if (!v1.includes('-') && v2.includes('-')) return 1;  // v1 is stable, v2 is pre-release

  return 0;
};

export default SplashScreen;
