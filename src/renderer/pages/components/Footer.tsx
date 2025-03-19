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
        const isUpdateNeeded = (): boolean => {
          if (!appVersion || !latestVersion) {
            return false;
          }

          try {
            // Clean version strings
            const currentVersion = appVersion.replace(/^v/, '');
            const latestVer = latestVersion.replace(/^v/, '');

            // Check for branch switching scenarios
            const isCurrentBeta = currentVersion.includes('-beta') ||
                                 currentVersion.includes('-alpha') ||
                                 currentVersion.includes('-rc');
            const isLatestBeta = latestVer.includes('-beta') ||
                                latestVer.includes('-alpha') ||
                                latestVer.includes('-rc');

            // Check if we're in a branch switching scenario
            // If current is beta but latest is stable - suggest update (downgrade to stable)
            if (isCurrentBeta && !isLatestBeta) {
              console.log("Footer: Update needed - downgrade from dev to stable");
              return true;
            }

            // If current is stable but latest is beta - suggest update (upgrade to beta)
            if (!isCurrentBeta && isLatestBeta) {
              console.log("Footer: Update needed - upgrade from stable to dev");
              return true;
            }

            // If both are from same branch type (both beta or both stable)
            // then do regular version comparison

            // Parse versions to extract components
            const parseVersion = (version: string) => {
              const [basePart, prereleasePart] = version.split('-');
              const versionParts = basePart.split('.').map(Number);
              return {
                major: versionParts[0] || 0,
                minor: versionParts[1] || 0,
                patch: versionParts[2] || 0,
                prerelease: prereleasePart || null
              };
            };

            const current = parseVersion(currentVersion);
            const latest = parseVersion(latestVer);

            // Compare major.minor.patch
            if (latest.major > current.major) return true;
            if (latest.major < current.major) return false;

            if (latest.minor > current.minor) return true;
            if (latest.minor < current.minor) return false;

            if (latest.patch > current.patch) return true;
            if (latest.patch < current.patch) return false;

            // Base versions are identical - check prerelease tags
            // If latest has no prerelease tag but current does, update (stable is newer than prerelease)
            if (!latest.prerelease && current.prerelease) {
              return true;
            }

            // If current has no prerelease but latest does, don't update (don't downgrade stable to prerelease)
            if (latest.prerelease && !current.prerelease) {
              return false;
            }

            // Both have prerelease tags - compare them
            if (latest.prerelease && current.prerelease) {
              // Compare prerelease types (rc > beta > alpha)
              const latestType = latest.prerelease.split('.')[0];
              const currentType = current.prerelease.split('.')[0];

              if (latestType !== currentType) {
                if (latestType === 'rc' && (currentType === 'beta' || currentType === 'alpha')) return true;
                if (latestType === 'beta' && currentType === 'alpha') return true;
                return false;
              }

              // Same prerelease type, compare numbers
              const latestNum = parseInt(latest.prerelease.split('.')[1]) || 0;
              const currentNum = parseInt(current.prerelease.split('.')[1]) || 0;
              return latestNum > currentNum;
            }

            return false;
          } catch (error) {
            console.error("Error comparing versions:", error);
            return false;
          }
        };

        setHasUpdate(isUpdateNeeded());
        log.info(`Footer: Update status - ${isUpdateNeeded() ? 'Update available' : 'No update needed'}`);
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
                        ? appVersion.includes('-beta') || appVersion.includes('-alpha') || appVersion.includes('-rc')
                          ? "Update Available"
                          : "Update to Dev"
                        : appVersion.includes('-beta') || appVersion.includes('-alpha') || appVersion.includes('-rc')
                          ? "Downgrade to Stable"
                          : "Update Available"
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
