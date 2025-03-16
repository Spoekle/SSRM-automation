import { useState, useRef, useEffect } from 'react';
import { FaCog } from 'react-icons/fa';
import Settings, { SettingsHandles } from '../Settings/Settings';
import { motion, AnimatePresence } from 'framer-motion';
import log from 'electron-log';

interface FooterProps {
  appVersion: string;
  latestVersion: string;
  isVersionLoading?: boolean;
}

const Footer: React.FC<FooterProps> = ({ appVersion, latestVersion, isVersionLoading = false }) => {
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [showUpdateTab, setShowUpdateTab] = useState<boolean>(false);
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);

  const settingsRef = useRef<SettingsHandles>(null);

  useEffect(() => {
    if (!isVersionLoading && latestVersion) {
      try {
        const currentVerNumber = parseFloat(appVersion.replace(/\./g, ''));
        const latestVerNumber = parseFloat(latestVersion.replace(/\./g, ''));
        const updateAvailable = latestVerNumber > currentVerNumber;

        setHasUpdate(updateAvailable);
        log.info(`Version check in Footer: Current=${appVersion}, Latest=${latestVersion}, Update available: ${updateAvailable}`);
      } catch (error) {
        log.error('Error comparing versions:', error);
      }
    }
  }, [appVersion, latestVersion, isVersionLoading]);

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
          <div className="flex-1"></div>

          <div className="flex items-center">
            {hasUpdate && (
              <motion.div
                className="z-20 relative rounded-full shadow-sm mr-2"
                animate={{ y: [0, -3, 0] }}
                transition={{ y: { repeat: Infinity, repeatDelay: 2, duration: 1 } }}
              >
                <div className="relative">
                  <motion.button
                    onClick={openUpdateTab}
                    className="relative z-10 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-xs font-medium text-blue-600 dark:text-blue-300 hover:underline transition rainbow-shadow"
                    style={{ isolation: 'isolate' }} /* Ensure the button content stays above the shadow */
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Update available
                  </motion.button>
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
              v{appVersion}
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
