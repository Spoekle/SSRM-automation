import { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaGithub } from 'react-icons/fa';
import { SyncLoader } from 'react-spinners';
import axios from 'axios';

function Footer() {
  const { ipcRenderer } = window.require('electron');
  const [appVersion] = useState<string>('1.3.1');
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' ? true : false;
  })

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
      await ipcRenderer.invoke('update-application');
      alert('Update started. The application will restart.');
    } catch (error) {
      console.error('Error updating application:', error);
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
  }
  , []);

  return (
    <div className='no-move items-center justify-items-center bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 rounded-b-3xl drop-shadow-xl'>
      <div className='flex justify-between items-center p-4'>
        <div className='flex text-center justify-between'>
          <p className='text-sm py-2 px-3 mx-3'>Created by Spoekle</p>
        </div>
        <div className='flex text-center justify-between'>
          {parseFloat(latestVersion.replace(/\./g, '')) > parseFloat(appVersion.replace(/\./g, '')) && (
            <button onClick={updateApplication}
              className='text-sm font-bold py-2 px-3 mx-3 hover:scale-105 transition duration-200 underline'>
              Update available! Latest Version: {latestVersion}, Current Version: {appVersion}
            </button>
          )}
          {isDownloading && <SyncLoader size='8' color='rgba(255, 255, 255, 1)' />}

        </div>
        <div className='flex text-center justify-between'>
          <a href='https://github.com/Spoekle/SSRM-automation' target='_blank' className='py-2 px-3 mx-3 bg-transparent hover:bg-black/20 hover:scale-110 rounded-md transition duration-200'><FaGithub /></a>
          <button onClick={toggleDarkMode} className="py-2 px-3 mx-3 bg-transparent hover:bg-black/20 hover:scale-110 rounded-md transition duration-200">
            {isDarkMode ? <FaSun className="transition duration-200" /> : <FaMoon className="transition duration-200" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Footer
