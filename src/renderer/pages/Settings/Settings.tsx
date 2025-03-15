import React, { useState, useEffect, forwardRef, useImperativeHandle, ChangeEvent } from 'react';
import Switch from '@mui/material/Switch';
import LinearProgress from '@mui/material/LinearProgress';
import { FaTimes, FaGithub } from 'react-icons/fa';
import { ipcRenderer } from 'electron';
import log from 'electron-log';
import { ConfirmationModal } from './components/ConfirmationModal';
import LoadedMapInfo from './components/LoadedMapInfo';
import './styles/CustomScrollbar.css';

export interface SettingsHandles {
  close: () => void;
}

interface SettingsProps {
  onClose: () => void;
  appVersion: string;
}

const Settings = forwardRef<SettingsHandles, SettingsProps>(({ onClose, appVersion }, ref) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  const [ffmpegInstalled, setFfmpegInstalled] = useState<boolean | null>(null);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [installStatus, setInstallStatus] = useState('');
  const [installProgressPercent, setInstallProgressPercent] = useState<number | null>(null);

  const [confirmResetAllOpen, setConfirmResetAllOpen] = useState(false);
  const [confirmResetMapOpen, setConfirmResetMapOpen] = useState(false);
  const [loadedMapInfo, setLoadedMapInfo] = useState<string | null>(null);
  // New state to hold stored card config file name
  const [storedCardConfigName, setStoredCardConfigName] = useState<string | null>(() => {
    try {
      const storedConfig = localStorage.getItem('cardConfig');
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        return parsed.configName || null;
      }
    } catch (error) {
      log.error("Error parsing cardConfig:", error);
    }
    return null;
  });

  useEffect(() => {
    setIsOverlayVisible(true);
    setIsPanelOpen(true);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    checkFfmpeg();
    ipcRenderer.on('ffmpeg-install-progress', updateInstallStatus);
    const storedMap = localStorage.getItem('mapInfo');
    if (storedMap) {
      setLoadedMapInfo(storedMap);
    }
    return () => {
      ipcRenderer.removeListener('ffmpeg-install-progress', updateInstallStatus);
    };
  }, []);

  // Updated: store card configuration with the file name.
  const handleCardConfigUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const cardConfig = JSON.parse(text);
      // Validate basic structure
      if (!cardConfig.width || !cardConfig.height || !cardConfig.background || !cardConfig.components) {
        throw new Error("Invalid card configuration format.");
      }
      // Add the file name to the configuration
      cardConfig.configName = file.name;
      localStorage.setItem('cardConfig', JSON.stringify(cardConfig));
      setStoredCardConfigName(file.name);
      window.alert("Card configuration saved successfully!");
    } catch (error) {
      log.error("Error uploading card configuration:", error);
      window.alert("Failed to upload card configuration. Please check the file format.");
    }
  };

  useImperativeHandle(ref, () => ({ close: handleClose }));

  const updateInstallStatus = (_event: any, progressMessage: string) => {
    setInstallStatus(progressMessage);
    const match = progressMessage.match(/(\d+)%/);
    setInstallProgressPercent(match ? parseInt(match[1], 10) : null);
  };

  const checkFfmpeg = async () => {
    try {
      const installed = await ipcRenderer.invoke('check-ffmpeg');
      setFfmpegInstalled(installed);
    } catch (error) {
      log.error('Error checking ffmpeg:', error);
      setFfmpegInstalled(false);
    }
  };

  const handleFfmpegAction = async (type: 'install' | 'reinstall') => {
    setFfmpegLoading(true);
    setInstallStatus('');
    setInstallProgressPercent(null);
    try {
      await ipcRenderer.invoke(
        type === 'install' ? 'install-ffmpeg' : 'reinstall-ffmpeg'
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

  const resetLocalStorage = () => {
    setConfirmResetAllOpen(true);
  };

  const handleConfirmResetAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleConfirmResetMap = () => {
    localStorage.removeItem('mapId');
    localStorage.removeItem('mapInfo');
    localStorage.removeItem('starRatings');
    localStorage.removeItem('oldStarRatings');
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

  return (
    <>
      <div
        className={`fixed top-16 left-0 right-0 bottom-16 z-40 rounded-bl-3xl backdrop-blur-md flex justify-center items-center transition-opacity duration-300 ${
          isOverlayVisible ? 'opacity-100' : 'opacity-0'
        } bg-black/20`}
        onClick={handleClose}
      >
        <div
          className={`absolute right-0 top-0 h-full w-2/3 rounded-l-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-lg transform transition-transform duration-300 overflow-y-auto custom-scrollbar ${
            isPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
          id="settings-panel"
        >
          {/* Header */}
          <div className="z-10 sticky top-0 backdrop-blur-md p-4 border-b border-neutral-200 dark:border-neutral-500 flex justify-between items-center">
            <h2 className="text-xl bg-neutral-100 dark:bg-neutral-600 px-3 py-2 rounded-lg font-semibold">Settings</h2>
            <button
              className="text-red-500 bg-neutral-300 dark:bg-neutral-700 p-2 rounded-md hover:scale-105 hover:bg-neutral-400 dark:hover:bg-neutral-600 transition duration-200"
              onClick={handleClose}
            >
              <FaTimes />
            </button>
          </div>

          {/* Content Container */}
          <div className="px-4 pb-4 space-y-4">
            {/* Loaded Map Info */}
            <div className="p-4 rounded-lg">
              <p className="font-medium text-neutral-800 dark:text-neutral-100">
                Currently Loaded Map:
              </p>
              <LoadedMapInfo
                loadedMapInfo={loadedMapInfo}
                setConfirmResetMapOpen={setConfirmResetMapOpen}
              />
            </div>

            {/* Preferences */}
            <div className="p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
              <div className="flex justify-between items-center">
                <h1 className="font-medium text-xl text-neutral-800 dark:text-neutral-100">
                  Preferences
                </h1>
                <p className="text-neutral-800 dark:text-neutral-100 text-sm text-end">
                  Change the theme, upload or remove card configuration...
                </p>
              </div>
              <div className="mt-4 flex flex-col">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-neutral-800 dark:text-neutral-100">Dark Mode</span>
                    <Switch checked={isDarkMode} onChange={toggleTheme} color="primary" />
                  </div>
                </div>
                {/*
                <div className="flex flex-col bg-neutral-200 dark:bg-neutral-800 p-2 rounded-lg mt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-neutral-800 dark:text-neutral-100">
                      {storedCardConfigName ? (
                      <>
                        Stored Card Config: <br />
                        {storedCardConfigName}
                      </>
                      ) : "No Card Configuration Stored"}
                    </p>
                    <div className="flex space-x-4">
                      <label className="flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md cursor-pointer transition duration-200">
                        <span>Select File</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleCardConfigUpload}
                          className="hidden"
                        />
                      </label>
                      {storedCardConfigName && (
                        <button
                          onClick={() => {
                          localStorage.removeItem('cardConfig');
                          setStoredCardConfigName(null);
                          window.alert("Card configuration removed.");
                          }}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition duration-200"
                        >
                          Remove File
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                */}
              </div>
            </div>

            {/* Reset Local Storage */}
            <div className="p-4 bg-neutral-100 dark:bg-neutral-600 rounded-lg">
              <div className="flex justify-between items-center">
                <h1 className="font-medium text-xl text-neutral-800 dark:text-neutral-100">
                  Reset Local Storage
                </h1>
                <p className="text-neutral-800 dark:text-neutral-100 text-sm">
                  Reset all local storage data.
                </p>
              </div>
              <button
                onClick={resetLocalStorage}
                className="mt-2 w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200"
              >
                Reset Local Storage
              </button>
            </div>

            {/* ffmpeg Install Section */}
            <div className="p-4 bg-neutral-100 dark:bg-neutral-600 rounded-lg text-center space-y-4">
              <div className="flex justify-between items-center">
                <h1 className="font-medium text-xl text-neutral-800 dark:text-neutral-100">
                  ffmpeg
                </h1>
                <p className="text-neutral-800 dark:text-neutral-100 text-sm">
                  ffmpeg is required for video thumbnail extractions.
                </p>
              </div>
              {ffmpegLoading && (
                <div>
                  <LinearProgress
                    variant={installProgressPercent !== null ? 'determinate' : 'indeterminate'}
                    value={installProgressPercent || 0}
                  />
                  <p className="text-sm mt-1">{installStatus}</p>
                </div>
              )}
              {!ffmpegLoading && ffmpegInstalled && (
                <div>
                  <button
                    onClick={() => handleFfmpegAction('reinstall')}
                    className="w-full bg-blue-500 hover:bg-blue-600 transition duratioin-200 text-white px-4 py-2 rounded mt-2"
                  >
                    Reinstall ffmpeg
                  </button>
                </div>
              )}
              {!ffmpegLoading && ffmpegInstalled === false && (
                <div>
                  <button
                    onClick={() => handleFfmpegAction('install')}
                    className="w-full bg-green-500 text-white px-4 py-2 rounded"
                  >
                    Install ffmpeg
                  </button>
                </div>
              )}
            </div>

            {/* Credits */}
            <div className="p-4 flex justify-between items-center bg-neutral-200 dark:bg-neutral-800 rounded-lg">
              <p className="text-lg flex text-neutral-800 dark:text-neutral-100">
                Made by <a className='ml-1 font-bold'>Spoekle :D</a>
              </p>
              <div className="flex flex-col mt-2 space-y-2 items-center">
                <a
                  href="https://github.com/Spoekle/SSRM-automation"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-neutral-300 hover:scale-110"
                >
                  <FaGithub size={32}/>
                </a>
                <p className="text-sm text-neutral-800 dark:text-neutral-100">
                  (Version: {appVersion})
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      <ConfirmationModal
        open={confirmResetMapOpen}
        title="Reset Map Data"
        message="Are you sure you want to reset only the map data?"
        onCancel={() => setConfirmResetMapOpen(false)}
        onConfirm={() => {
          setConfirmResetMapOpen(false);
          handleConfirmResetMap();
        }}
      />
    </>
  );
});

export default Settings;
