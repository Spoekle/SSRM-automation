import { useState, useRef, useEffect } from 'react';
import { FaCog } from 'react-icons/fa';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import Settings, { SettingsHandles } from '../Settings/Settings';
import log from '../../utils/log';
import { determineBestUpdateVersion } from '../../helpers/versionHelpers';

interface FooterProps {
  appVersion: string;
  latestVersion: string;
  isVersionLoading?: boolean;
  isDevBranch?: boolean;
  getLatestVersion: () => void;
}

interface ApiStatus {
  scoresaber: boolean | null;
  beatsaver: boolean | null;
}

// Status indicator component (outside Footer to avoid recreation on render)
function StatusDot({
  status,
  label,
}: {
  status: boolean | null;
  label: string;
}) {
  const getStatusColor = () => {
    if (status === null) return 'bg-yellow-500';
    return status ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = () => {
    if (status === null) return 'Checking...';
    return status ? 'Online' : 'Offline';
  };

  return (
    <div
      className="flex items-center gap-1.5"
      title={`${label}: ${getStatusText()}`}
    >
      <motion.div
        className={`h-2 w-2 rounded-full ${getStatusColor()}`}
        animate={status === null ? { opacity: [0.5, 1, 0.5] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
    </div>
  );
}

export default function Footer({
  appVersion,
  latestVersion,
  isVersionLoading = false,
  isDevBranch = false,
  getLatestVersion,
}: FooterProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showUpdateTab, setShowUpdateTab] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    scoresaber: null,
    beatsaver: null,
  });

  const settingsRef = useRef<SettingsHandles>(null);

  // Check API status on mount and every 30 seconds
  useEffect(() => {
    const checkApis = async () => {
      try {
        const ssStatus = await invoke<boolean>('check_scoresaber');
        setApiStatus((prev) => ({ ...prev, scoresaber: ssStatus }));
      } catch {
        setApiStatus((prev) => ({ ...prev, scoresaber: false }));
      }

      try {
        const bsStatus = await invoke<boolean>('check_beatsaver');
        setApiStatus((prev) => ({ ...prev, beatsaver: bsStatus }));
      } catch {
        setApiStatus((prev) => ({ ...prev, beatsaver: false }));
      }
    };

    // Check immediately on mount
    checkApis();

    // Check every 30 seconds
    const interval = setInterval(checkApis, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isVersionLoading && latestVersion) {
      try {
        const current = appVersion;
        const latest = latestVersion;

        log.info(
          `Footer: Version check - Current=${current}, Latest=${latest}, Branch=${isDevBranch ? 'dev' : 'stable'}`,
        );

        // Check if branches switched
        const lastUsedBranch = localStorage.getItem('lastUsedBranch');
        const currentBranch = isDevBranch ? 'dev' : 'stable';
        const hasSwitchedBranches = lastUsedBranch !== null && lastUsedBranch !== currentBranch;

        if (hasSwitchedBranches) {
          log.info(`Footer: Branch switch detected - ${lastUsedBranch} to ${currentBranch}`);
          setHasUpdate(true);
          return;
        }

        // Get latest stable version
        const latestStableVersion = localStorage.getItem('latestStableVersion');

        // Get latest beta version
        const latestBetaVersion = latest.includes('-') ? latest : null;
        const stableVersion = latestStableVersion || (!latest.includes('-') ? latest : null);

        // Use the helper function to determine if update is needed
        const updateInfo = determineBestUpdateVersion(
          current,
          stableVersion,
          latestBetaVersion,
          isDevBranch
        );

        setHasUpdate(updateInfo.shouldUpdate);

        // Log decision with clear formatting
        const statusEmoji = updateInfo.shouldUpdate ? '🔄' : '✓';
        log.info(
          `Footer: ${statusEmoji} Update status - ${updateInfo.shouldUpdate ? 'Update available' : 'No update needed'}`
        );
        if (updateInfo.shouldUpdate) {
          log.info(
            `Footer: Update recommendation - ${updateInfo.updateToVersion} (${updateInfo.useStable ? 'stable' : 'beta'})`
          );
          log.info(`Footer: Reason - ${updateInfo.reason}`);
        }
      } catch (error) {
        log.error('Error comparing versions:', error);
      }
    }
  }, [appVersion, latestVersion, isVersionLoading, isDevBranch]);

  const handleCogClick = () => {
    if (settingsOpen) {
      settingsRef.current?.close();
    } else {
      setShowUpdateTab(false);
      setSettingsOpen(true);
    }
  };

  const openUpdateTab = () => {
    setShowUpdateTab(true);
    setSettingsOpen(true);
  };

  const getUpdateButtonText = () => {
    if (isDevBranch) {
      if (appVersion.includes('-')) return 'Update Available';
      if (latestVersion.includes('-')) return 'Update to Beta';
      return 'Update Available';
    }
    return appVersion.includes('-')
      ? 'Downgrade to Stable'
      : 'Update Available';
  };

  return (
    <>
      <div className="no-move flex-none flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 text-neutral-950 dark:text-neutral-200 transition-colors duration-200">
        <div className="w-full relative flex items-center px-4 py-2.5">
          {/* Centered Status Indicators */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
            <StatusDot status={apiStatus.scoresaber} label="ScoreSaber" />
            <StatusDot status={apiStatus.beatsaver} label="BeatSaver" />
          </div>

          {/* Right Side Controls */}
          <div className="ml-auto flex items-center">
            {hasUpdate && (
              <motion.div
                className="z-20 relative rounded-full shadow-sm mr-3"
                animate={{ y: [0, -3, 0] }}
                transition={{
                  y: { repeat: Infinity, repeatDelay: 2, duration: 1 },
                }}
              >
                <div className="relative">
                  <motion.div
                    onClick={openUpdateTab}
                    className="relative z-10 rounded-full transition rainbow-shadow"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      type="button"
                      className="flex items-center bg-blue-500 dark:bg-blue-600 text-[10px] font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-full hover:bg-blue-600 transition"
                    >
                      {getUpdateButtonText()}
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            <motion.button
              type="button"
              onClick={handleCogClick}
              className="p-1.5 bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors duration-200"
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaCog size="18" className="text-neutral-600 dark:text-neutral-400" />
            </motion.button>

            <div className="text-[10px] uppercase tracking-wider font-medium ml-3 text-neutral-500 dark:text-neutral-500">
              v{appVersion} {isDevBranch && '(dev)'}
            </div>
          </div>
        </div>
      </div>

      {settingsOpen && (
        <Settings
          ref={settingsRef}
          isDevBranch={isDevBranch}
          appVersion={appVersion}
          getLatestVersion={getLatestVersion}
          latestVersion={latestVersion}
          showUpdateTab={showUpdateTab}
          onClose={() => {
            setSettingsOpen(false);
          }}
        />
      )}
    </>
  );
}
