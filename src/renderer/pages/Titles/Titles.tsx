import MapForm from './components/MapForm';
import React, { useState, useEffect } from 'react';
import log from 'electron-log';
import { motion } from 'framer-motion';
import AlertSystem from '../../components/AlertSystem';
import { useAlerts } from '../../utils/alertSystem';

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
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null);
  const [mapFormModal, setMapFormModal] = useState<boolean>(false);
  const [useSubname, setUseSubname] = useState<boolean>(false);

  // Replace the old alerts with the new system
  const { alerts, createAlert } = useAlerts();

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
      createAlert(`Copied ${type} to clipboard!`, 'success');
    }).catch((err) => {
      log.error('Failed to copy: ', err);
      createAlert('Failed to copy to clipboard', 'error');
    });
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
        <div className='text-center mb-4'>
          <motion.h1
            className='text-2xl font-bold'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            Titles
          </motion.h1>
          <motion.p
            className='text-sm mb-2'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Generate your title and description here!
          </motion.p>
          <motion.button
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 text-sm rounded-lg transition duration-200 drop-shadow-lg'
            onClick={() => setMapFormModal(true)}
            whileHover={{ scale: 1.05, boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Open Map Form
          </motion.button>
        </div>

        {mapInfo && (
          <motion.div
            className='grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <motion.div
              className='flex-col w-full bg-neutral-300 dark:bg-neutral-800 rounded-md p-3 shadow-md'
              whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="flex justify-between items-center mb-2">
                <h1 className='text-base font-bold'>Title</h1>
                <motion.button
                  className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 text-xs rounded-md'
                  onClick={() => copyToClipboard(`${mapInfo.metadata.songName}${mapInfo.metadata.songSubName ? ` ${mapInfo.metadata.songSubName} | ` : ' | '}${mapInfo.metadata.songAuthorName} | ${mapInfo.metadata.levelAuthorName} | ${chosenDiff}`, 'title')}
                  whileHover={{ scale: 1.05, backgroundColor: "#3b82f6" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Copy
                </motion.button>
              </div>
              <div className='bg-neutral-200 dark:bg-neutral-700 p-2 rounded-md h-20 overflow-auto text-left'>
                <p className='text-sm'>{mapInfo.metadata.songName} {mapInfo.metadata.songSubName ? ` ${mapInfo.metadata.songSubName} | ` : ' | '}{mapInfo.metadata.songAuthorName} | {mapInfo.metadata.levelAuthorName} | {chosenDiff}</p>
              </div>
            </motion.div>

            <motion.div
              className='flex-col w-full bg-neutral-300 dark:bg-neutral-800 rounded-md p-3 shadow-md'
              whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="flex justify-between items-center mb-2">
                <h1 className='text-base font-bold'>Description</h1>
                <motion.button
                  className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 text-xs rounded-md'
                  onClick={() => copyToClipboard(`${mapInfo.metadata.songName} by ${mapInfo.metadata.songAuthorName}\nMapped by ${mapInfo.metadata.levelAuthorName}\nMap Link: ${mapLink}\nGameplay by ${player}`, 'description')}
                  whileHover={{ scale: 1.05, backgroundColor: "#3b82f6" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Copy
                </motion.button>
              </div>
              <div className='bg-neutral-200 dark:bg-neutral-700 p-2 rounded-md h-20 overflow-auto text-left'>
                <p className='text-sm whitespace-pre-line'>{mapInfo.metadata.songName} by {mapInfo.metadata.songAuthorName}
                  {"\n"}Mapped by {mapInfo.metadata.levelAuthorName}
                  {"\n"}Map Link: {mapLink}
                  {"\n"}Gameplay by {player}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      <AlertSystem alerts={alerts} position="top-right" />

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
          createAlert={createAlert} // Pass the createAlert function
        />
      )}
    </div>
  );
}

export default Titles;
