import React, { useState, useEffect, forwardRef, useImperativeHandle, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import log from '../../utils/log';
import { useConfirmationModal } from '../../contexts/ConfirmationModalContext';
import ConfirmationModal from './components/ConfirmationModal';
import { determineBestUpdateVersion } from '../../helpers/versionHelpers';
import { ipcRenderer } from '../../utils/tauri-api';

// Section components
import ThemeSection from './components/ThemeSection';
import DataManagementSection from './components/DataManagementSection';
import FFmpegSection from './components/FFmpegSection';
import UpdateSection from './components/UpdateSection';
import BranchSection from './components/BranchSection';
import DeveloperToolsSection from './components/DeveloperToolsSection';
import CreditsSection from './components/CreditsSection';

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
    // Panel state
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);

    // Theme state
    const [isDarkMode, setIsDarkMode] = useState(() => {
      const savedTheme = localStorage.getItem("theme");
      return savedTheme === "dark";
    });

    // Branch state
    const [isDevMode, setIsDevMode] = useState(() => {
      return localStorage.getItem("useDevelopmentBranch") === "true";
    });

    // FFmpeg state
    const [ffmpegInstalled, setFfmpegInstalled] = useState<boolean | null>(null);
    const [ffmpegLoading, setFfmpegLoading] = useState(false);
    const [installStatus, setInstallStatus] = useState("");
    const [installProgressPercent, setInstallProgressPercent] = useState<number | null>(null);

    // Data management state
    const [confirmResetAllOpen, setConfirmResetAllOpen] = useState(false);
    const [loadedMapInfo, setLoadedMapInfo] = useState<string | null>(null);
    const [storedCardConfigName, setStoredCardConfigName] = useState<string | null>(() => {
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

    // Update state
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateProgress, setUpdateProgress] = useState("");
    const [latestStableVersion, setLatestStableVersion] = useState<string | null>(
      localStorage.getItem("latestStableVersion")
    );
    const [shouldUpdateToStable, setShouldUpdateToStable] = useState<boolean>(false);

    const updateSectionRef = React.useRef<HTMLDivElement>(null);
    const { showConfirmation } = useConfirmationModal();

    // Animation variants
    const sectionVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
          delay: i * 0.1,
          duration: 0.5,
          ease: "easeOut" as const,
        },
      }),
    };

    // Effects
    useEffect(() => {
      if (appVersion && latestVersion) {
        const latestBetaVersion = latestVersion.includes('-') ? latestVersion : null;
        const updateInfo = determineBestUpdateVersion(
          appVersion,
          latestStableVersion || null,
          latestBetaVersion,
          isDevBranch
        );
        setShouldUpdateToStable(updateInfo.useStable);
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
      ipcRenderer.on("ffmpeg-install-progress", updateInstallStatus as (...args: unknown[]) => void);
      const storedMap = localStorage.getItem("mapInfo");
      if (storedMap) {
        setLoadedMapInfo(storedMap);
      }
      return () => {
        ipcRenderer.removeListener("ffmpeg-install-progress", updateInstallStatus as (...args: unknown[]) => void);
      };
    }, []);

    // Handlers
    const updateApplication = async () => {
      try {
        setIsUpdating(true);
        setUpdateProgress("Starting update...");

        ipcRenderer.on("update-progress", ((_event: unknown, progressMsg: unknown) => {
          setUpdateProgress(progressMsg as string);
        }) as (...args: unknown[]) => void);

        const latestBetaVersion = latestVersion.includes('-') ? latestVersion : null;
        const updateInfo = determineBestUpdateVersion(
          appVersion,
          latestStableVersion || null,
          latestBetaVersion,
          isDevBranch
        );

        if (updateInfo.shouldUpdate) {
          await ipcRenderer.invoke("update-application", {
            useStable: updateInfo.useStable,
            targetVersion: updateInfo.updateToVersion
          });
        } else {
          await ipcRenderer.invoke("update-application");
        }

        localStorage.removeItem("skipUpdateCheck");
      } catch (error) {
        log.error("Error updating application:", error);
        setIsUpdating(false);
        alert("Failed to update the application.");
      }
    };

    const handleCardConfigUpload = async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const cardConfig = JSON.parse(text);
        if (!cardConfig.width || !cardConfig.height || !cardConfig.background || !cardConfig.components) {
          throw new Error("Invalid card configuration format.");
        }
        cardConfig.configName = file.name;
        localStorage.setItem("cardConfig", JSON.stringify(cardConfig));
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
        const installed = await ipcRenderer.invoke("check-ffmpeg") as boolean;
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
        await ipcRenderer.invoke(type === "install" ? "install-ffmpeg" : "reinstall-ffmpeg");
      } catch (err) {
        log.error(`Error ${type}ing ffmpeg:`, err);
      } finally {
        setFfmpegLoading(false);
        checkFfmpeg();
      }
    };

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

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

    const resetLocalStorage = () => setConfirmResetAllOpen(true);

    const handleConfirmResetAll = () => {
      localStorage.clear();
      window.location.reload();
    };

    const handleClose = () => {
      setIsPanelOpen(false);
      setIsOverlayVisible(false);
      setTimeout(() => onClose(), 300);
    };

    useImperativeHandle(ref, () => ({ close: handleClose }));

    return (
      <>
        <motion.div
          className={`fixed top-17 left-0 right-0 bottom-13 z-40 rounded-bl-3xl backdrop-blur-sm flex justify-center items-center ${isOverlayVisible ? "opacity-100" : "opacity-0"
            } bg-neutral-900/30`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isOverlayVisible ? 1 : 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="absolute right-0 top-0 h-full w-2/3 max-w-2xl rounded-l-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl border-l border-y border-white/20 dark:border-white/5 overflow-y-auto custom-scrollbar"
            initial={{ x: "100%" }}
            animate={{ x: isPanelOpen ? "0%" : "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            id="settings-panel"
          >
            {/* Header */}
            <motion.div
              className="z-10 sticky top-0 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md p-3 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <motion.h2
                className="text-lg font-bold flex items-center gap-2 text-neutral-800 dark:text-neutral-100"
                whileHover={{ scale: 1.01 }}
              >
                Settings
              </motion.h2>
              <motion.button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes size={16} className="text-neutral-500 hover:text-red-500 transition-colors" />
              </motion.button>
            </motion.div>

            {/* Content */}
            <div className="p-5">
              <div className="space-y-5">
                <ThemeSection
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                  sectionVariants={sectionVariants}
                />

                <DataManagementSection
                  loadedMapInfo={loadedMapInfo}
                  storedCardConfigName={storedCardConfigName}
                  handleCardConfigUpload={handleCardConfigUpload}
                  resetLocalStorage={resetLocalStorage}
                  sectionVariants={sectionVariants}
                />

                <FFmpegSection
                  ffmpegInstalled={ffmpegInstalled}
                  ffmpegLoading={ffmpegLoading}
                  installStatus={installStatus}
                  installProgressPercent={installProgressPercent}
                  handleFfmpegAction={handleFfmpegAction}
                  sectionVariants={sectionVariants}
                />

                <UpdateSection
                  sectionRef={updateSectionRef}
                  appVersion={appVersion}
                  latestVersion={latestVersion}
                  latestStableVersion={latestStableVersion}
                  isVersionLoading={isVersionLoading}
                  isDevBranch={isDevBranch}
                  isUpdating={isUpdating}
                  updateProgress={updateProgress}
                  shouldUpdateToStable={shouldUpdateToStable}
                  updateApplication={updateApplication}
                  getLatestVersion={getLatestVersion}
                  setLatestStableVersion={setLatestStableVersion}
                  sectionVariants={sectionVariants}
                />

                <BranchSection
                  isDevMode={isDevMode}
                  toggleBranch={toggleBranch}
                  sectionVariants={sectionVariants}
                />

                <DeveloperToolsSection sectionVariants={sectionVariants} />

                <CreditsSection sectionVariants={sectionVariants} />
              </div>
            </div>
          </motion.div>
        </motion.div>

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
