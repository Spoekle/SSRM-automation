import { useState, useRef, useEffect } from 'react';
import { FaCog } from 'react-icons/fa';
import Settings, { SettingsHandles } from '../Settings/Settings';
import { motion, AnimatePresence } from 'framer-motion';
import log from 'electron-log';

interface FooterProps {
  appVersion: string;
  latestVersion: string;
}

const Footer: React.FC<FooterProps> = ({ appVersion, latestVersion }) => {
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [showUpdateTab, setShowUpdateTab] = useState<boolean>(false);
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);

  const settingsRef = useRef<SettingsHandles>(null);

  useEffect(() => {
    // Compare versions to determine if an update is available
    try {
      const currentVerNumber = parseFloat(appVersion.replace(/\./g, ''));
      const latestVerNumber = parseFloat(latestVersion.replace(/\./g, ''));
      setHasUpdate(latestVerNumber > currentVerNumber);
      log.info(`Version check in Footer: Current=${appVersion}, Latest=${latestVersion}, Update available: ${latestVerNumber > currentVerNumber}`);
    } catch (error) {
      log.error('Error comparing versions:', error);
    }
  }, [appVersion, latestVersion]);

  const handleCogClick = () => {
    // Check if user previously skipped an update
    const skipUpdateCheck = localStorage.getItem('skipUpdateCheck') === 'true';

    if (skipUpdateCheck && hasUpdate) {
      // Show update tab in settings
      setShowUpdateTab(true);
      // Reset the skip flag when user manually opens settings
      localStorage.removeItem('skipUpdateCheck');
    } else {
      setShowUpdateTab(false);
    }

    if (settingsOpen) {
      settingsRef.current?.close();
    } else {
      setSettingsOpen(true);
    }
  };

  const openUpdateTab = () => {
    setShowUpdateTab(true);
    setSettingsOpen(true);
  };

  return (
    <>
      <motion.div
        className="no-move items-center bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 rounded-b-3xl drop-shadow-xl"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring" }}
      >
        <div className="flex justify-between items-center p-4">
          {/* Empty left side */}
          <div className="flex-1"></div>

          {/* Right side with version and settings */}
          <div className="flex items-center">
            {hasUpdate && (
              <motion.div
                className="z-20 relative rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 shadow-sm mr-2"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: [0, -3, 0],
                }}
                transition={{
                  scale: { duration: 0.3 },
                  y: { repeat: Infinity, repeatDelay: 2, duration: 1 }
                }}
              >
                <motion.button
                  onClick={openUpdateTab}
                  className="text-xs font-medium py-1 text-blue-600 dark:text-blue-300 hover:underline transition duration: 200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Update available
                </motion.button>
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

            <motion.div
              className="text-xs ml-2 text-neutral-600 dark:text-neutral-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.7 }}
            >
              v{appVersion}
            </motion.div>
          </div>
        </div>
      </motion.div>

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
