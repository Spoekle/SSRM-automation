import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaDownload, FaGithub, FaDiscord } from 'react-icons/fa';
import Switch from '@mui/material/Switch';
import log from 'electron-log';
import { useConfirmationModal } from '../../contexts/ConfirmationModalContext';
import ConfirmationModal from './components/ConfirmationModal';
import LoadedMapInfo from './components/LoadedMapInfo';
import { isUpdateNeeded } from '../../utils/versionUtils';
import { determineBestUpdateVersion } from '../../helpers/versionHelpers';

export interface SettingsHandles {
  close: () => void;
}

interface SettingsProps {
  onClose: () => void;
  appVersion: string;
  latestVersion: string;
  showUpdateTab?: boolean;
  isVersionLoading?: boolean;
  isDevBranch?: boolean;
  getLatestVersion?: () => void;
}

const Settings = forwardRef<SettingsHandles, SettingsProps>(
  ({ onClose, getLatestVersion, appVersion, latestVersion, showUpdateTab = false, isVersionLoading = false, isDevBranch = false }, ref) => {
    const { ipcRenderer } = window.require("electron");
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
      const savedTheme = localStorage.getItem("theme");
      return savedTheme === "dark";
    });

    const [isDevMode, setIsDevMode] = useState(() => {
      return localStorage.getItem("useDevelopmentBranch") === "true";
    });

    const [ffmpegInstalled, setFfmpegInstalled] = useState<boolean | null>(
      null,
    );
    const [ffmpegLoading, setFfmpegLoading] = useState(false);
    const [installStatus, setInstallStatus] = useState("");
    const [installProgressPercent, setInstallProgressPercent] = useState<
      number | null
    >(null);

    const [confirmResetAllOpen, setConfirmResetAllOpen] = useState(false);
    const [loadedMapInfo, setLoadedMapInfo] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateProgress, setUpdateProgress] = useState("");

    // Get the latest stable version from localStorage (set in App.tsx)
    const [latestStableVersion, setLatestStableVersion] = useState<string | null>(
      localStorage.getItem("latestStableVersion")
    );

    // Calculate if an update to stable is available and should be shown
    const [shouldUpdateToStable, setShouldUpdateToStable] = useState<boolean>(false);

    const [storedCardConfigName, setStoredCardConfigName] = useState<
      string | null
    >(() => {
      try {
        const storedConfig = localStorage.getItem("cardConfig");
        if (storedConfig) {
          const parsed = JSON.parse(storedConfig);
          return parsed.configName || null;
        }
      } catch (error) {
        log.error("Error parsing cardConfig:", error);
      }
      return null;
    });

    const updateSectionRef = React.useRef<HTMLDivElement>(null);
    const { showConfirmation } = useConfirmationModal();

    // Check if update is available
    useEffect(() => {
      if (appVersion && latestVersion) {
        // Get latest beta version
        const latestBetaVersion = latestVersion.includes('-') ? latestVersion : null;

        // Check if there's an update available
        const updateInfo = determineBestUpdateVersion(
          appVersion,
          latestStableVersion || null,
          latestBetaVersion,
          isDevBranch
        );

        setShouldUpdateToStable(updateInfo.useStable);

        if (updateInfo.shouldUpdate) {
          log.info(`Settings: Update available - ${updateInfo.updateToVersion} (${updateInfo.useStable ? 'stable' : 'beta'})`);
          log.info(`Settings: Update reason - ${updateInfo.reason}`);
        }
      }
    }, [appVersion, latestVersion, latestStableVersion, isDevBranch]);

    useEffect(() => {
      setIsOverlayVisible(true);
      setIsPanelOpen(true);

      if (showUpdateTab && updateSectionRef.current) {
        setTimeout(() => {
          updateSectionRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    }, [showUpdateTab]);

    useEffect(() => {
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode]);

    useEffect(() => {
      localStorage.setItem("useDevelopmentBranch", isDevMode ? "true" : "false");
    }, [isDevMode]);

    useEffect(() => {
      checkFfmpeg();
      ipcRenderer.on("ffmpeg-install-progress", updateInstallStatus);
      const storedMap = localStorage.getItem("mapInfo");
      if (storedMap) {
        setLoadedMapInfo(storedMap);
      }
      return () => {
        ipcRenderer.removeListener(
          "ffmpeg-install-progress",
          updateInstallStatus,
        );
      };
    }, []);

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

        // Get the appropriate versions
        const latestBetaVersion = latestVersion.includes('-') ? latestVersion : null;
        const updateInfo = determineBestUpdateVersion(
          appVersion,
          latestStableVersion || null,
          latestBetaVersion,
          isDevBranch
        );

        if (updateInfo.shouldUpdate) {
          log.info(`Settings: Starting update to ${updateInfo.updateToVersion} (${updateInfo.useStable ? 'stable' : 'beta'})`);
          await ipcRenderer.invoke("update-application", {
            useStable: updateInfo.useStable,
            targetVersion: updateInfo.updateToVersion
          });
        } else {
          log.info('Settings: No update available, using default update behavior');
          await ipcRenderer.invoke("update-application");
        }

        localStorage.removeItem("skipUpdateCheck");
      } catch (error) {
        log.error("Error updating application:", error);
        setIsUpdating(false);
        alert("Failed to update the application.");
      }
    };

    const handleCardConfigUpload = async (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const cardConfig = JSON.parse(text);
        if (
          !cardConfig.width || !cardConfig.height || !cardConfig.background ||
          !cardConfig.components
        ) {
          throw new Error("Invalid card configuration format.");
        }
        cardConfig.configName = file.name;
        localStorage.setItem("cardConfig", JSON.stringify(cardConfig));
        setStoredCardConfigName(file.name);
        window.alert("Card configuration saved successfully!");
      } catch (error) {
        log.error("Error uploading card configuration:", error);
        window.alert(
          "Failed to upload card configuration. Please check the file format.",
        );
      }
    };

    const updateInstallStatus = (_event: any, progressMessage: string) => {
      setInstallStatus(progressMessage);
      const match = progressMessage.match(/(\d+)%/);
      setInstallProgressPercent(match ? parseInt(match[1], 10) : null);
    };

    const checkFfmpeg = async () => {
      try {
        const installed = await ipcRenderer.invoke("check-ffmpeg");
        setFfmpegInstalled(installed);
      } catch (error) {
        log.error("Error checking ffmpeg:", error);
        setFfmpegInstalled(false);
      }
    };

    const handleFfmpegAction = async (type: "install" | "reinstall") => {
      setFfmpegLoading(true);
      setInstallStatus("");
      setInstallProgressPercent(null);
      try {
        await ipcRenderer.invoke(
          type === "install" ? "install-ffmpeg" : "reinstall-ffmpeg",
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

    const toggleBranch = () => {
      const newBranchSetting = !isDevMode;
      const switchToDev = !isDevMode;

      if (switchToDev) {
        showConfirmation({
          title: "Switch to Development Branch",
          message: "Switching to development branch will install pre-release versions which may contain bugs or incomplete features. Continue?",
          confirmText: "Switch",
          cancelText: "Cancel",
          onConfirm: () => {
            applyBranchChange(newBranchSetting);
            getLatestVersion && getLatestVersion();
            window.location.reload();
          }
        });
      } else {
        showConfirmation({
          title: "Switch to Stable Branch",
          message: "Are you sure you want to switch to the stable branch? This will downgrade to the latest stable version.",
          confirmText: "Switch",
          cancelText: "Cancel",
          onConfirm: () => {
            applyBranchChange(newBranchSetting);
            getLatestVersion && getLatestVersion();
            window.location.reload();
          }
        });
      }
    };

    const applyBranchChange = (newBranchSetting: boolean) => {
      setIsDevMode(newBranchSetting);
      localStorage.setItem("useDevelopmentBranch", newBranchSetting ? "true" : "false");
      localStorage.removeItem("skipUpdateCheck");
      localStorage.setItem("forceVersionCheck", "true");
    };

    const resetLocalStorage = () => {
      setConfirmResetAllOpen(true);
    };

    const handleConfirmResetAll = () => {
      localStorage.clear();
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

    const sectionVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
          delay: i * 0.1,
          duration: 0.5,
          ease: "easeOut",
        },
      }),
    };

    return (
      <>
        <motion.div
          className={`fixed top-16 left-0 right-0 bottom-16 z-40 rounded-bl-3xl backdrop-blur-md flex justify-center items-center ${
            isOverlayVisible ? "opacity-100" : "opacity-0"
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
            <motion.div
              className="z-10 sticky top-0 backdrop-blur-md p-4 border-b border-neutral-200 dark:border-neutral-500 flex justify-between items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <motion.h2
                className="text-xl font-bold"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Settings
              </motion.h2>
              <motion.button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes className="text-neutral-700 dark:text-neutral-300" />
              </motion.button>
            </motion.div>

            <div className="p-4">
              <div className="space-y-6">

                {/* Theme Settings */}
                <motion.section
                  className="bg-white dark:bg-neutral-700 rounded-xl shadow p-4"
                  initial="hidden"
                  animate="visible"
                  variants={sectionVariants}
                  custom={1}
                >
                  <h3 className="text-lg font-semibold border-b pb-2 mb-4 border-neutral-200 dark:border-neutral-600">Theme Settings</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Dark Mode</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Toggle dark mode on/off</p>
                    </div>
                    <Switch checked={isDarkMode} onChange={toggleTheme} />
                  </div>
                </motion.section>

                {/* Data Management */}
                <motion.section
                  className="bg-white dark:bg-neutral-700 rounded-xl shadow p-4"
                  initial="hidden"
                  animate="visible"
                  variants={sectionVariants}
                  custom={2}
                >
                  <h3 className="text-lg font-semibold border-b pb-2 mb-4 border-neutral-200 dark:border-neutral-600">Data Management</h3>

                  {/* Loaded Map Data */}
                  <div className="mb-4">
                    <h4 className="text-base font-medium mb-2">Currently Loaded Map:</h4>
                    {loadedMapInfo ? (
                      <LoadedMapInfo loadedMapInfo={loadedMapInfo} />
                    ) : (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">No map loaded</p>
                    )}
                  </div>

                  {/* Card Configuration */}
                  <div className="mb-4">
                    <h4 className="text-base font-medium mb-2">Card Configuration:</h4>
                    <div className="flex items-center">
                      {storedCardConfigName ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 flex-grow">
                          Loaded: <span className="font-medium text-neutral-800 dark:text-neutral-200">{storedCardConfigName}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 flex-grow">
                          No card configuration loaded
                        </p>
                      )}
                      <label className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg cursor-pointer">
                        Upload Config
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={handleCardConfigUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Reset Options */}
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-600">
                    <motion.button
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg mt-2"
                      onClick={resetLocalStorage}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Reset All Data
                    </motion.button>
                  </div>
                </motion.section>

                {/* FFmpeg Settings */}
                <motion.section
                  className="bg-white dark:bg-neutral-700 rounded-xl shadow p-4"
                  initial="hidden"
                  animate="visible"
                  variants={sectionVariants}
                  custom={3}
                >
                  <h3 className="text-lg font-semibold border-b pb-2 mb-4 border-neutral-200 dark:border-neutral-600">FFmpeg Settings</h3>
                  <div className="space-y-3">
                    <p className="text-sm">
                      Status: {ffmpegInstalled === null ? "Checking..." : ffmpegInstalled ? "Installed" : "Not Installed"}
                    </p>

                    {ffmpegLoading && (
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-md">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {installStatus || "Installing FFmpeg..."}
                        </p>
                        {installProgressPercent !== null && (
                          <div className="w-full bg-blue-200 dark:bg-blue-800 h-2 rounded-full mt-1">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${installProgressPercent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {!ffmpegInstalled && !ffmpegLoading && (
                        <motion.button
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
                          onClick={() => handleFfmpegAction("install")}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Install FFmpeg
                        </motion.button>
                      )}

                      {ffmpegInstalled && !ffmpegLoading && (
                        <motion.button
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
                          onClick={() => handleFfmpegAction("reinstall")}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Reinstall FFmpeg
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.section>

                {/* Update Section */}
                <motion.section
                  ref={updateSectionRef}
                  className="bg-white dark:bg-neutral-700 rounded-xl shadow p-4"
                  initial="hidden"
                  animate="visible"
                  variants={sectionVariants}
                  custom={4}
                  id="updates-section"
                >
                  <h3 className="text-lg font-semibold border-b pb-2 mb-4 border-neutral-200 dark:border-neutral-600">Updates</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm">Current Version: <span className="font-semibold">{appVersion}</span></p>

                        {/* Display appropriate version info based on branch */}
                        {isDevBranch ? (
                          <>
                            <p className="text-sm">Latest Dev: <span className="font-semibold">{isVersionLoading ? "Checking..." : latestVersion}</span></p>
                            {latestStableVersion && (
                              <p className="text-sm">Latest Stable: <span className="font-semibold text-green-600">{latestStableVersion}</span></p>
                            )}
                            <p className="text-xs mt-1 text-amber-500 dark:text-amber-400">
                              Using development branch
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm">Latest Version: <span className="font-semibold">{isVersionLoading ? "Checking..." : latestVersion}</span></p>
                            {appVersion.includes('-') && (
                              <p className="text-xs mt-1 text-amber-500 dark:text-amber-400">
                                Currently on beta version
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        {isUpdating ? (
                          <div className="text-center">
                            <motion.div
                              className="inline-block w-6 h-6 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            />
                            <p className="text-xs mt-1">{updateProgress}</p>
                          </div>
                        ) : (
                          <>
                            <motion.button
                              onClick={updateApplication}
                              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg flex items-center justify-center space-x-1"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={isVersionLoading || (!shouldUpdateToStable && appVersion === latestVersion)}
                            >
                              <FaDownload size={12} />
                              <span>
                                {shouldUpdateToStable
                                  ? `Update to Stable ${latestStableVersion}`
                                  : latestVersion.includes('-') && !appVersion.includes('-')
                                      ? "Update to Beta"
                                      : "Update Now"
                                }
                              </span>
                            </motion.button>
                            <motion.button
                              onClick={async () => {
                                getLatestVersion && await getLatestVersion();
                                // Refresh the stable version after checking
                                setLatestStableVersion(localStorage.getItem("latestStableVersion"));
                                localStorage.removeItem("skipUpdateCheck");
                                window.location.reload();
                              }}
                              className="px-3 py-1.5 bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-sm rounded-lg"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Check for Updates
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* Branch Settings */}
                <motion.section
                  className="bg-white dark:bg-neutral-700 rounded-xl shadow p-4"
                  initial="hidden"
                  animate="visible"
                  variants={sectionVariants}
                  custom={5}
                >
                  <h3 className="text-lg font-semibold border-b pb-2 mb-4 border-neutral-200 dark:border-neutral-600">Branch Settings</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Use Development Branch</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Receive pre-release updates with new features</p>
                    </div>
                    <Switch checked={isDevMode} onChange={toggleBranch} />
                  </div>
                </motion.section>

                {/* Developer Tools section */}
                <motion.section
                  className="bg-white dark:bg-neutral-700 rounded-xl shadow p-4"
                  initial="hidden"
                  animate="visible"
                  variants={sectionVariants}
                  custom={6}
                >
                  <h3 className="text-lg font-semibold border-b pb-2 mb-4 border-neutral-200 dark:border-neutral-600">Developer Tools</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Open DevTools</p>
                    <motion.button
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => ipcRenderer.send('open-devtools')}
                    >
                      Open DevTools
                    </motion.button>
                  </div>
                </motion.section>

                {/* Credits section */}
                <motion.section
                  className="bg-white dark:bg-neutral-700 rounded-xl shadow p-4"
                  initial="hidden"
                  animate="visible"
                  variants={sectionVariants}
                  custom={7}
                >
                  <h3 className="text-lg font-semibold border-b pb-2 mb-4 border-neutral-200 dark:border-neutral-600">Credits & Links</h3>
                  <div className="flex items-center justify-between">
                    <motion.div
                      className="flex items-center space-x-4"
                    >
                      <motion.button
                        className="rounded-lg"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.95, rotate: -10 }}
                        onClick={() => window.open('https://github.com/Spoekle/SSRM-automation', '_blank')}
                        title='View on GitHub'
                      >
                        <FaGithub size={32} />
                      </motion.button>
                      <motion.button
                        className="rounded-lg"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.95, rotate: -10 }}
                        onClick={() => window.open('https://github.com/Spoekle/SSRM-automation', '_blank')}
                        title='ScoreSaber Discord'
                      >
                        <FaDiscord size={32} />
                      </motion.button>
                    </motion.div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-4 md:mb-0">
                      © {new Date().getFullYear()} Spoekle. All rights reserved.
                    </p>

                  </div>
                </motion.section>
              </div>
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
      </>
    );
  },
);

export default Settings;
