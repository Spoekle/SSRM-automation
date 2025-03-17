import { useState, useRef, useEffect } from 'react';
import { FaCog } from 'react-icons/fa';
import Settings, { SettingsHandles } from '../Settings/Settings';
import { motion, AnimatePresence } from 'framer-motion';
import log from 'electron-log';

interface FooterProps {
  appVersion: string;
  latestVersion: string;
  isVersionLoading?: boolean;
  isDevBranch?: boolean;
}

const Footer: React.FC<FooterProps> = ({
  appVersion,
  latestVersion,
  isVersionLoading = false,
  isDevBranch = false
}) => {
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [showUpdateTab, setShowUpdateTab] = useState<boolean>(false);
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);

  const settingsRef = useRef<SettingsHandles>(null);

  useEffect(() => {
    if (!isVersionLoading && latestVersion) {
      try {
        // Extract version components
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

        // Use the same corrected version comparison logic
        const isUpdateNeeded = (() => {
          // Simple case: if versions are identical, no update needed
          if (current === latest) {
            log.info('Footer: Versions are identical, no update needed');
            return false;
          }

          // If on stable branch with a beta version, only update if latest is stable or a newer beta
          if (!isDevBranch && /beta|alpha|rc/i.test(current)) {
            // Parse the versions to compare
            const currentBase = current.split('-')[0];
            const latestBase = latest.split('-')[0];
            const latestIsStable = !/beta|alpha|rc/i.test(latest);

            if (latestIsStable) {
              // Update to stable version if base versions match or latest is newer
              if (latestBase === currentBase || compareVersions(latestBase, currentBase) > 0) {
                log.info('Footer: Update needed from beta to stable');
                return true;
              }
              return false;
            }
          }

          // Rest of existing comparison logic for major.minor.patch...
          // ...

          return false;
        })();

        setHasUpdate(isUpdateNeeded);
        log.info(`Footer: Update status - ${isUpdateNeeded ? 'Update available' : 'No update needed'}`);
      } catch (error) {
        log.error('Error comparing versions:', error);
      }
    }
  }, [appVersion, latestVersion, isVersionLoading, isDevBranch]);

  // Add this helper function to compare version numbers
  const compareVersions = (v1: string, v2: string) => {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }

    return 0;
  };

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
      <div className="no-move items-center bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 rounded-b-3xl drop-shadow-xl">
        <div className="flex justify-between items-center p-4">
          <div className="flex-1">
          </div>

          <div className="flex items-center">
            {hasUpdate && (
              <motion.div
                className="z-20 relative rounded-full shadow-sm mr-2"
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
                      {localStorage.getItem('lastUsedBranch') !== (isDevBranch ? 'dev' : 'stable')
                        ? isDevBranch
                          ? "Upgrade to Dev"
                          : "Downgrade to Stable"
                        : "Update Available"
                      }
                    </button>


                  </motion.div>
                </div>
              </motion.div>
            )}

            <motion.button
              onClick={handleCogClick}
              className="py-2 px-3 bg-transparent hover:bg-black/20 rounded-md transition duration-200"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaCog className="transition duration-200" />
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
          appVersion={appVersion}
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
