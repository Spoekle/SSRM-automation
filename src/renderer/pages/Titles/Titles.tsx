import MapForm from './components/MapForm';
import React, { useState, useEffect } from 'react';
import log from 'electron-log';
import LoadedMap from '../components/LoadedMap';
import { motion, AnimatePresence } from 'framer-motion';

interface MapInfo {
  metadata: {
    songAuthorName: string;
    songName: string;
    songSubName: string;
    levelAuthorName: string;
    duration: number;
    bpm: number;
  };
  id: string;
  versions: {
    coverURL: string;
    hash: string;
  }[];
}

interface Alert {
  id: number;
  message: string;
  fadeOut: boolean;
  type: 'success' | 'error' | 'alert';
}
const abbreviatedToDifficulty = (abbreviated: string): string => {
  switch (abbreviated) {
    case 'ES':
      return 'Easy';
    case 'NOR':
      return 'Normal';
    case 'HARD':
      return 'Hard';
    case 'EX':
      return 'Expert';
    case 'EXP':
      return 'Expert+';
    default:
      return abbreviated;
  }
};

const Titles: React.FC = () => {
  const [mapId, setMapId] = useState<string>('');
  const [chosenDiff, setChosenDiff] = useState<string>('Easy');
  const [player, setPlayer] = useState<string>('Mr_bjo');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null);
  const [mapFormModal, setMapFormModal] = useState<boolean>(false);
  const [useSubname, setUseSubname] = useState<boolean>(false);

  useEffect(() => {
    const storedMapId = localStorage.getItem('mapId');
    if (storedMapId) {
      setMapId(storedMapId);
    }
    const storedMapInfo = localStorage.getItem('mapInfo');
    if (storedMapInfo) {
      setMapInfo(JSON.parse(storedMapInfo));
    }
    const storedChosenDiff = localStorage.getItem('chosenDiff');
    if (storedChosenDiff) {
      setChosenDiff(abbreviatedToDifficulty(storedChosenDiff));
    }
  }, []);

  const copyToClipboard = (text: string, type: 'title' | 'description') => {
    navigator.clipboard.writeText(text).then(() => {
      createAlerts(`Copied ${type} to clipboard!`, 'success');
    }).catch((err) => {
      log.error('Failed to copy: ', err);
    });
  };

  const createAlerts = (text: string, type: 'success' | 'error' | 'alert') => {
    const id = new Date().getTime();
    setAlerts([...alerts, { id, message: `${text}`, type, fadeOut: false }]);
    setTimeout(() => {
      setAlerts(alerts => alerts.map(alert => alert.id === id ? { ...alert, fadeOut: true } : alert));
      setTimeout(() => {
        setAlerts(alerts => alerts.filter(alert => alert.id !== id));
      }, 500);
    }, 2000);
  };

  const mapLink = `https://beatsaver.com/maps/${mapId}`;

  return (
    <div className='max-h-96 h-96 relative dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-900 p-4 pt-8 overflow-auto custom-scrollbar'>
      <motion.div
        className='flex flex-col items-center justify-start max-w-3xl mx-auto pl-8 pr-4'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='text-center mb-6'>
          <motion.h1
            className='text-2xl font-bold'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            Titles
          </motion.h1>
          <motion.p
            className='text-lg'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Generate your title and description here!
          </motion.p>
          <motion.button
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-4 mx-2 rounded-lg hover:scale-110 transition duration-200 drop-shadow-lg'
            onClick={() => setMapFormModal(true)}
            whileHover={{ scale: 1.05, boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Open Map Form
          </motion.button>
          {mapInfo && <LoadedMap mapInfo={mapInfo} />}
        </div>

        {mapInfo && (
          <motion.div
            className='flex flex-col gap-4 w-full max-w-lg'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <motion.div
              className='flex-col w-full bg-neutral-300 dark:bg-neutral-800 rounded-md p-4 shadow-md'
              whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="flex justify-between items-center mb-2">
                <h1 className='text-lg font-bold'>Title</h1>
                <motion.button
                  className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 text-sm rounded-md'
                  onClick={() => copyToClipboard(`${mapInfo.metadata.songName}${mapInfo.metadata.songSubName ? ` ${mapInfo.metadata.songSubName} | ` : ' | '}${mapInfo.metadata.songAuthorName} | ${mapInfo.metadata.levelAuthorName} | ${chosenDiff}`, 'title')}
                  whileHover={{ scale: 1.05, backgroundColor: "#3b82f6" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Copy
                </motion.button>
              </div>
              <div className='bg-neutral-200 dark:bg-neutral-700 p-3 rounded-md max-h-20 overflow-auto'>
                <p className='text-sm'>{mapInfo.metadata.songName} {mapInfo.metadata.songSubName ? ` ${mapInfo.metadata.songSubName} | ` : ' | '}{mapInfo.metadata.songAuthorName} | {mapInfo.metadata.levelAuthorName} | {chosenDiff}</p>
              </div>
            </motion.div>

            <motion.div
              className='flex-col w-full bg-neutral-300 dark:bg-neutral-800 rounded-md p-4 shadow-md'
              whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="flex justify-between items-center mb-2">
                <h1 className='text-lg font-bold'>Description</h1>
                <motion.button
                  className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 text-sm rounded-md'
                  onClick={() => copyToClipboard(`${mapInfo.metadata.songName} by ${mapInfo.metadata.songAuthorName}\nMapped by ${mapInfo.metadata.levelAuthorName}\nMap Link: ${mapLink}\nGameplay by {player}`, 'description')}
                  whileHover={{ scale: 1.05, backgroundColor: "#3b82f6" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Copy
                </motion.button>
              </div>
              <div className='bg-neutral-200 dark:bg-neutral-700 p-3 rounded-md whitespace-pre-line max-h-32 overflow-auto'>
                <p className='text-sm'>{mapInfo.metadata.songName} by {mapInfo.metadata.songAuthorName}<br/>
                Mapped by {mapInfo.metadata.levelAuthorName}<br/>
                Map Link: {mapLink}<br/>
                Gameplay by {player}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        <div className='absolute top-0 right-0 mt-4 mr-4 flex flex-col items-end space-y-2 overflow-hidden z-60'>
          {alerts.map(alert => (
            <motion.div
              key={alert.id}
              className={`flex items-center justify-center px-4 py-2 ${alert.type === 'success' ? 'bg-green-600' : alert.type === 'error' ? 'bg-red-600' : 'bg-blue-600'} rounded-md drop-shadow-lg ${alert.fadeOut ? 'animate-fade-out' : ''}`}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <p className='text-white'>{alert.message}</p>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
      {mapFormModal && (
        <MapForm
          mapId={mapId}
          setMapId={setMapId}
          chosenDiff={chosenDiff}
          setChosenDiff={setChosenDiff}
          useSubname={useSubname}
          setUseSubname={setUseSubname}
          player={player}
          setPlayer={setPlayer}
          setMapInfo={setMapInfo}
          setMapFormModal={setMapFormModal}
        />
      )}
    </div>
  );
}

export default Titles;
