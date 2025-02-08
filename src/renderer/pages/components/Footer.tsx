import { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaGithub } from 'react-icons/fa';
import axios from 'axios';

function Footer() {
  const { ipcRenderer } = window.require('electron');
  const [appVersion] = useState<string>('1.5.1');
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = useState<string>('');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const updateApplication = async () => {
    try {
      setIsDownloading(true);
      setIsUpdating(true);
      setUpdateProgress("Starting update...");

      ipcRenderer.on('update-progress', (_event: any, progressMsg: string) => {
        setUpdateProgress(progressMsg);
      });

      await ipcRenderer.invoke('update-application');
    } catch (error) {
      console.error('Error updating application:', error);
      setIsUpdating(false);
      alert('Failed to update the application.');
    }
  };

  useEffect(() => {
    const getLatestVersion = async () => {
      try {
        const response = await axios.get('https://api.github.com/repos/Spoekle/SSRM-automation/releases/latest');
        const data = response.data;
        setLatestVersion(data.tag_name.replace(/^v/, ''));
      } catch (error) {
        console.error('Error fetching latest version:', error);
      }
    };
    getLatestVersion();
  }, []);

  return (
    <>
      {isUpdating && (
        <div
          className="absolute animate-pulse bottom-16 left-1/2 w-full transform -translate-x-1/2 z-50 bg-blue-500 text-white p-4 shadow-md text-center"
        >
          <p className="text-lg font-bold">{updateProgress}</p>
        </div>
      )}
      <div className='no-move items-center justify-items-center bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 rounded-b-3xl drop-shadow-xl'>
        <div className='flex justify-between items-center p-4'>
          <div className='flex text-center justify-between'>
            <p className='text-sm py-2 px-3 mx-3'>Created by Spoekle</p>
          </div>
            <div className="flex text-center justify-between relative">
            {parseFloat(latestVersion.replace(/\./g, '')) > parseFloat(appVersion.replace(/\./g, '')) && (
              <div className="relative group">
              {/* Moving rainbow gradient border */}
              <div className="absolute -inset-1 rounded-md bg-conic/[in_hsl_longer_hue] from-red-600 to-red-600 size-24 opacity-75 blur animate-[spin_4s_linear_infinite]"></div>
              {/* Inner background to overlay the gradient border */}
              <div className="relative rounded-md bg-neutral-200 dark:bg-neutral-900">
                <button
                onClick={updateApplication}
                className="text-sm font-bold py-2 px-3 mx-3 transition duration-200 underline rounded-md"
                >
                Update available! Latest: {latestVersion}, Current: {appVersion}
                </button>
              </div>
              </div>
            )}
            </div>
          <div className='flex text-center justify-between'>
            <a
              href='https://github.com/Spoekle/SSRM-automation'
              target='_blank'
              rel="noreferrer"
              className='py-2 px-3 mx-3 bg-transparent hover:bg-black/20 hover:scale-110 rounded-md transition duration-200'>
              <FaGithub />
            </a>
            <button
              onClick={toggleDarkMode}
              className="py-2 px-3 mx-3 bg-transparent hover:bg-black/20 hover:scale-110 rounded-md transition duration-200">
              {isDarkMode ? <FaSun className="transition duration-200" /> : <FaMoon className="transition duration-200" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Footer;
