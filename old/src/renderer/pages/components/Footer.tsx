import { useState, useRef, useEffect } from 'react';
import { FaCog } from 'react-icons/fa';
import Settings, { SettingsHandles } from '../Settings/Settings';
import { motion, AnimatePresence } from 'framer-motion';
import log from 'electron-log';
import { determineBestUpdateVersion } from '../../helpers/versionHelpers';

interface FooterProps {
  appVersion: string;
  latestVersion: string;
  isVersionLoading?: boolean;
  isDevBranch?: boolean;
  getLatestVersion: () => void;
}

const Footer: React.FC<FooterProps> = ({
  appVersion,
  latestVersion,
  isVersionLoading = false,
  isDevBranch = false,
  getLatestVersion
}) => {
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [showUpdateTab, setShowUpdateTab] = useState<boolean>(false);
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);

  const settingsRef = useRef<SettingsHandles>(null);

  useEffect(() => {
    if (!isVersionLoading && latestVersion) {
      try {
        const current = appVersion;
        const latest = latestVersion;

        log.info(`Footer: Version check - Current=${current}, Latest=${latest}, Branch=${isDevBranch ? 'dev' : 'stable'}`);

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
        log.info(`Footer: ${statusEmoji} Update status - ${updateInfo.shouldUpdate ? 'Update available' : 'No update needed'}`);
        if (updateInfo.shouldUpdate) {
          log.info(`Footer: Update recommendation - ${updateInfo.updateToVersion} (${updateInfo.useStable ? 'stable' : 'beta'})`);
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

  return (
    <>
      <div className="no-move h-[69px] items-center justify-center bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 rounded-b-3xl">
        <div className="flex justify-between items-center p-4">
          <div className="flex-1">
          </div>

          <div className="flex items-center">
            {hasUpdate && (
              <motion.div
                className="z-20 relative rounded-full shadow-sm mr-4"
                animate={{ y: [0, -3, 0] }}
                transition={{ y: { repeat: Infinity, repeatDelay: 2, duration: 1 } }}
              >
                <div className="relative">
                  <motion.div
                    onClick={openUpdateTab}
                    className="relative z-10 rounded-full transition rainbow-shadow"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      className="flex items-center bg-blue-500 dark:bg-blue-600 text-xs font-semibold text-white px-2 py-1 rounded-full hover:underline transition"
                    >
                      {isDevBranch
                        ? (appVersion.includes('-')
                            ? "Update Available"
                            : latestVersion.includes('-')
                                ? "Update to Beta"
                                : "Update Available")
                        : (appVersion.includes('-')
                            ? "Downgrade to Stable"
                            : "Update Available")
                      }
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            <motion.button
              onClick={handleCogClick}
              className="py-2 px-2 bg-transparent hover:bg-black/20 rounded-full transition duration-200"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaCog size="20" className="transition duration-200" />
            </motion.button>

            <div className="text-xs ml-2 text-neutral-600 dark:text-neutral-400">
              v{appVersion} {isDevBranch && "(dev)"}
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

export default Footer;
