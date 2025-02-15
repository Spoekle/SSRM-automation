import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Switch from '@mui/material/Switch';
import LinearProgress from '@mui/material/LinearProgress';
import { FaTimes, FaGithub } from 'react-icons/fa';
import { ipcRenderer } from 'electron';

export interface SettingsHandles {
  close: () => void;
}

interface SettingsProps {
  onClose: () => void;
}

const Settings = forwardRef<SettingsHandles, SettingsProps>(({ onClose }, ref) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const [ffmpegInstalled, setFfmpegInstalled] = useState<boolean | null>(null);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [installStatus, setInstallStatus] = useState('');
  const [installProgressPercent, setInstallProgressPercent] = useState<number | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    checkFfmpeg();
  }, []);

  useEffect(() => {
    setIsOverlayVisible(true);
    setIsPanelOpen(true);
  }, []);

  useEffect(() => {
    const listener = (_event: any, progressMessage: string) => {
      setInstallStatus(progressMessage);
      const match = progressMessage.match(/(\d+)%/);
      if (match) {
        setInstallProgressPercent(parseInt(match[1], 10));
      } else {
        setInstallProgressPercent(null);
      }
    };

    ipcRenderer.on('ffmpeg-install-progress', listener);
    return () => {
      ipcRenderer.removeListener('ffmpeg-install-progress', listener);
    };
  }, []);

  const checkFfmpeg = async () => {
    try {
      const installed: boolean = await ipcRenderer.invoke('check-ffmpeg');
      setFfmpegInstalled(installed);
      console.log(installed ? 'ffmpeg detected.' : 'ffmpeg not detected.');
    } catch (error) {
      console.error('Error checking ffmpeg installation:', error);
      setFfmpegInstalled(false);
    }
  };

  const handleInstallFfmpeg = async () => {
    setFfmpegLoading(true);
    setInstallStatus('');
    setInstallProgressPercent(null);
    try {
      await ipcRenderer.invoke('install-ffmpeg');
    } catch (err) {
      console.error('Error installing ffmpeg:', err);
    } finally {
      setFfmpegLoading(false);
      checkFfmpeg();
    }
  };

  const handleReinstallFfmpeg = async () => {
    setFfmpegLoading(true);
    setInstallStatus('');
    setInstallProgressPercent(null);
    try {
      await ipcRenderer.invoke('reinstall-ffmpeg');
    } catch (err) {
      console.error('Error reinstalling ffmpeg:', err);
    } finally {
      setFfmpegLoading(false);
      checkFfmpeg();
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const resetLocalStorage = () => {
    if (window.confirm('Are you sure you want to reset local storage?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const resetLoadedMap  = () => {
    if (window.confirm('Are you sure you want to reset loaded map?')) {
      localStorage.removeItem('mapId');
      localStorage.removeItem('mapInfo');
      localStorage.removeItem('starRatings');
      localStorage.removeItem('oldStarRatings');
      window.location.reload();
    }
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
    <div
      className={`fixed top-16 left-0 right-0 bottom-16 z-40 rounded-bl-3xl backdrop-blur-md flex justify-center items-center transition-opacity duration-300 ${
        isOverlayVisible ? 'opacity-100' : 'opacity-0'
      } bg-black/20`}
      onClick={handleClose}
    >
      <div
        className={`absolute right-0 top-0 h-full w-2/3 rounded-l-xl bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-lg transform transition-transform duration-300 overflow-y-auto ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
        id="settings-panel"
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button className="text-red-500 bg-neutral-300 dark:bg-neutral-700 p-2 rounded-md hover:scale-105 hover:bg-neutral-400 dark:hover:bg-neutral-600 transition duration-200" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>
        <div className="p-4 space-y-6">
          <div className="flex items-center pb-2 border-b">
            <span className="font-medium">Dark Mode</span>
            <Switch checked={isDarkMode} onChange={toggleTheme} color="primary" />
          </div>
          <div className="flex mx-8 items-center justify-between">
            <div className="flex justify-between items-center space-x-4">
              <button onClick={resetLoadedMap} className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200">
                Reset Loaded Map
              </button>
            </div>
            <div className="flex justify-between items-center space-x-4">
              <button onClick={resetLocalStorage} className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200">
                Reset Local Storage
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 flex flex-col justify-center items-center space-y-2 w-full px-8">
          {ffmpegLoading && (
            <div className="w-full">
              <LinearProgress
                variant={installProgressPercent !== null ? 'determinate' : 'indeterminate'}
                value={installProgressPercent || 0}
              />
              <p className="text-center text-sm mt-1">{installStatus}</p>
            </div>
          )}
          {!ffmpegLoading && ffmpegInstalled === true && (
            <div className="w-full text-center">
              <button onClick={handleReinstallFfmpeg} className="w-full bg-blue-500 text-white px-4 py-2 rounded mt-2">
                Reinstall ffmpeg
              </button>
              <p>ffmpeg is installed.</p>
            </div>
          )}
          {!ffmpegLoading && ffmpegInstalled === false && (
            <div className="w-full text-center">
              <button onClick={handleInstallFfmpeg} className="w-full bg-green-500 text-white px-4 py-2 rounded">
                Install ffmpeg
              </button>
              <p>ffmpeg is not installed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default Settings;
