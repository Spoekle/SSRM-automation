import MapForm from './components/MapForm';
import React, { useState, useEffect } from 'react';
import log from '../../utils/log';
import { motion } from 'framer-motion';
import AlertSystem from '../../components/AlertSystem';
import { useAlerts } from '../../utils/alertSystem';
import { FaFileAlt, FaCopy, FaEdit } from 'react-icons/fa';

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

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: "easeOut" as const
      }
    })
  };

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
    <div className='max-h-96 h-96 relative dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-900 p-4 pt-6 overflow-auto custom-scrollbar'>
      <motion.div
        className='flex flex-col items-center justify-start max-w-4xl mx-auto'
        initial="hidden"
        animate="visible"
      >
        <motion.div className='text-center mb-4' variants={fadeIn} custom={0}>
          <div className="flex items-center justify-center gap-3 mb-1">
            <FaFileAlt className="text-blue-500 text-xl" />
            <h1 className='text-2xl font-bold'>Titles</h1>
          </div>
          <p className='text-sm mb-3 text-neutral-600 dark:text-neutral-400'>
            Generate your title and description for Beat Saber videos!
          </p>
          <motion.button
            className='bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2 mx-auto'
            onClick={() => setMapFormModal(true)}
            whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)" }}
            whileTap={{ scale: 0.95 }}
          >
            <FaEdit size={16} />
            <span>Map Settings</span>
          </motion.button>
        </motion.div>

        {mapInfo && (
          <motion.div
            className='grid grid-cols-2 gap-5 w-full'
            variants={fadeIn}
            custom={1}
          >
            <motion.div
              className='relative flex flex-col w-full bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-4 shadow-md overflow-hidden group'
              whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 rounded-xl transition-opacity duration-300" />

              <div className="flex justify-between items-center mb-3 relative z-10">
                <h1 className='text-lg font-bold flex items-center gap-2'>
                  <FaCopy className="text-blue-500" />
                  Title
                </h1>
                <motion.button
                  className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 px-3 text-sm rounded-lg flex items-center gap-1.5'
                  onClick={() => copyToClipboard(`${mapInfo.metadata.songName}${mapInfo.metadata.songSubName ? ` ${mapInfo.metadata.songSubName} | ` : ' | '}${mapInfo.metadata.songAuthorName} | ${mapInfo.metadata.levelAuthorName} | ${chosenDiff}`, 'title')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaCopy size={14} />
                  Copy
                </motion.button>
              </div>
              <div className='bg-white dark:bg-neutral-700 p-3 rounded-lg shadow-inner h-20 overflow-auto text-left relative z-10'>
                <p className='text-sm text-neutral-800 dark:text-neutral-100'>{mapInfo.metadata.songName}{useSubname ? ` ${mapInfo.metadata.songSubName} | ` : ' | '}{mapInfo.metadata.songAuthorName} | {mapInfo.metadata.levelAuthorName} | {chosenDiff}</p>
              </div>
            </motion.div>

            <motion.div
              className='relative flex flex-col w-full bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-4 shadow-md overflow-hidden group'
              whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 rounded-xl transition-opacity duration-300" />

              <div className="flex justify-between items-center mb-3 relative z-10">
                <h1 className='text-lg font-bold flex items-center gap-2'>
                  <FaCopy className="text-purple-500" />
                  Description
                </h1>
                <motion.button
                  className='bg-purple-500 hover:bg-purple-600 text-white font-bold py-1.5 px-3 text-sm rounded-lg flex items-center gap-1.5'
                  onClick={() => copyToClipboard(`${mapInfo.metadata.songName} by ${mapInfo.metadata.songAuthorName} ${mapInfo.metadata.songSubName ? `${mapInfo.metadata.songSubName}` : ''} \nMapped by ${mapInfo.metadata.levelAuthorName}\nMap Link: ${mapLink}\nGameplay by ${player}`, 'description')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaCopy size={14} />
                  Copy
                </motion.button>
              </div>
              <div className='bg-white dark:bg-neutral-700 p-3 rounded-lg shadow-inner h-32 overflow-auto text-left relative z-10'>
                <p className='text-sm whitespace-pre-line text-neutral-800 dark:text-neutral-100'>
                  {mapInfo.metadata.songName} by {mapInfo.metadata.songAuthorName} {mapInfo.metadata.songSubName ? `${mapInfo.metadata.songSubName}` : ''}
                  {"\n"}Mapped by {mapInfo.metadata.levelAuthorName}
                  {"\n"}Map Link: {mapLink}
                  {"\n"}Gameplay by {player}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {!mapInfo && (
          <motion.div
            className="w-full max-w-md mx-auto bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-6 rounded-xl shadow-md mt-8 text-center"
            variants={fadeIn}
            custom={1}
          >
            <p className="text-neutral-600 dark:text-neutral-400">
              No map loaded. Click "Map Settings" to get started.
            </p>
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
          createAlert={createAlert}
        />
      )}
    </div>
  );
}

export default Titles;
