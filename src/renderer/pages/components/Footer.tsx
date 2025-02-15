import { useState, useEffect, useRef } from 'react';
import { FaCog } from 'react-icons/fa';
import axios from 'axios';
import Settings, { SettingsHandles } from '../Settings/Settings';

function Footer() {
  const { ipcRenderer } = window.require('electron');
  const [appVersion] = useState<string>('1.6.4');
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const settingsRef = useRef<SettingsHandles>(null);

  const updateApplication = async () => {
    try {
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
        const response = await axios.get(
          'https://api.github.com/repos/Spoekle/SSRM-automation/releases/latest'
        );
        const data = response.data;
        setLatestVersion(data.tag_name.replace(/^v/, ''));
      } catch (error) {
        console.error('Error fetching latest version:', error);
      }
    };
    getLatestVersion();
  }, []);

  const handleCogClick = () => {
    if (settingsOpen) {
      settingsRef.current?.close();
    } else {
      setSettingsOpen(true);
    }
  };

  return (
    <>
      {isUpdating && (
        <div className="absolute animate-pulse bottom-16 left-1/2 w-full transform -translate-x-1/2 z-50 bg-blue-500 text-white p-4 shadow-md text-center">
          <p className="text-lg font-bold">{updateProgress}</p>
        </div>
      )}
      <div className="no-move items-center justify-items-center bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 rounded-b-3xl drop-shadow-xl">
        <div className="flex justify-between items-center p-4">
          <div className="flex text-center justify-between relative">
            {parseFloat(latestVersion.replace(/\./g, '')) >
              parseFloat(appVersion.replace(/\./g, '')) && (
              <div className="z-20 rainbow-shadow relative rounded-md bg-neutral-200 dark:bg-neutral-900">
                <button
                  onClick={updateApplication}
                  className="text-sm font-bold py-2 px-3 bg-neutral-200 dark:bg-neutral-900 transition duration-200 underline rounded-full hover:cursor-pointer hover:text-blue-500"
                >
                  Update available! Latest: {latestVersion}, Current: {appVersion}
                </button>
              </div>
            )}
          </div>
          <div className="flex text-center justify-between">
            <button
              onClick={handleCogClick}
              className="py-2 px-3 mx-3 bg-transparent hover:bg-black/20 hover:scale-110 rounded-md transition duration-200"
            >
              <FaCog className="transition duration-200" />
            </button>
          </div>
        </div>
      </div>
      {settingsOpen && (
        <Settings
          ref={settingsRef}
          appVersion={appVersion}
          onClose={() => {
            setSettingsOpen(false);
          }}
        />
      )}
    </>
  );
}

export default Footer;
