import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { ipcRenderer } from 'electron';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const [ffmpegInstalled, setFfmpegInstalled] = useState<boolean | null>(null);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);

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

  const checkFfmpeg = async () => {
    try {
      const installed: boolean = await ipcRenderer.invoke('check-ffmpeg');
      setFfmpegInstalled(installed);
      if (installed) {
        console.log('ffmpeg detected.');
      } else {
        console.log('ffmpeg not detected.');
      }
    } catch (error) {
      console.error('Error checking ffmpeg installation:', error);
      setFfmpegInstalled(false);
    }
  };

  const handleInstallFfmpeg = async () => {
    setFfmpegLoading(true);
    try {
      await ipcRenderer.invoke('install-ffmpeg');
      checkFfmpeg();
    } catch (err) {
      console.error('Error installing ffmpeg:', err);
    } finally {
      setFfmpegLoading(false);
    }
  };

  const handleReinstallFfmpeg = async () => {
    setFfmpegLoading(true);
    try {
      await ipcRenderer.invoke('reinstall-ffmpeg');
      checkFfmpeg();
    } catch (err) {
      console.error('Error reinstalling ffmpeg:', err);
    } finally {
      setFfmpegLoading(false);
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

  return (
    <div
      className="fixed top-16 left-0 right-0 bottom-16 z-40"
      onClick={onClose}
    >
      <div
        className="absolute right-0 top-0 h-full w-2/3 rounded-l-xl bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-lg transform transition-transform duration-300 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button className="text-red-500" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b">
            <span className="font-medium">Dark Mode</span>
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={toggleTheme}
              className="w-4 h-4"
            />
          </div>
          <div className='flex items-center justify-between'>
            <div className='flex flex-col items-center'>
              <button
                onClick={resetLocalStorage}
                className="w-full bg-red-500 text-white px-4 py-2 rounded"
              >
                Reset Local Storage
              </button>
            </div>

          </div>

          <div>
            <h3 className="font-semibold mb-2">Credits</h3>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                Developed by{' '}
                <a
                  href="https://github.com/Spoekle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500"
                >
                  Spoekle
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/spoekle/SSRM-automation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500"
                >
                  GitHub Repo
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className='absolute bottom-4 right-4 flex flex-col items-center'>
          {ffmpegLoading && <p>Installing...</p>}
          {ffmpegInstalled === null && !ffmpegLoading && (
            <p>Checking ffmpeg installation status...</p>
          )}
          {ffmpegInstalled === true && !ffmpegLoading && (
            <div>
              <button
                onClick={handleReinstallFfmpeg}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded mt-2"
              >
                Reinstall ffmpeg
              </button>
              <p>ffmpeg is installed.</p>
            </div>
          )}
          {ffmpegInstalled === false && !ffmpegLoading && (
            <>
              <button
                onClick={handleInstallFfmpeg}
                className="w-full bg-green-500 text-white px-4 py-2 rounded"
              >
                Install ffmpeg
              </button>
              <p>ffmpeg is not installed.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
