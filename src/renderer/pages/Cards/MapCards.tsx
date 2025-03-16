import React, { useState, useEffect, useRef } from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import { FaDownload } from 'react-icons/fa';
import CardForm from './components/CardForm';
import StarRatingForm from './components/ReweightForm';
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

interface StarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EX: string;
  EXP: string;
}

interface Progress {
  process: string;
  progress: number;
  visible: boolean;
}

const MapCards: React.FC = () => {
  const [mapId, setMapId] = useState<string>('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [progress, setProgress] = useState<Progress>({process: "", progress: 0, visible: false });
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null);
  const [chosenDiff, setChosenDiff] = useState('ES');
  const [cardFormModal, setCardFormModal] = useState<boolean>(false);
  const [starRatingFormModal, setStarRatingFormModal] = useState<boolean>(false);
  const [starRatings, setStarRatings] = useState<StarRatings>({ ES: "", NOR: "", HARD: "", EX: "", EXP: "" });
  const [oldStarRatings, setOldStarRatings] = useState<StarRatings>({ ES: "", NOR: "", HARD: "", EX: "", EXP: "" });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [useBackground, setUseBackground] = useState(true);
  const cancelGenerationRef = useRef(false);

  useEffect(() => {
    const storedMapId = localStorage.getItem('mapId');
    if (storedMapId) {
      setMapId(storedMapId);
    }
    const storedMapInfo = localStorage.getItem('mapInfo');
    if (storedMapInfo) {
      setMapInfo(JSON.parse(storedMapInfo));
    }
    const storedStarRatings = localStorage.getItem('starRatings');
    if (storedStarRatings) {
      setStarRatings(JSON.parse(storedStarRatings));
    }
    const storedOldStarRatings = localStorage.getItem('oldStarRatings');
    if (storedOldStarRatings) {
      setOldStarRatings(JSON.parse(storedOldStarRatings));
    }
    const storedChosenDiff = localStorage.getItem('chosenDiff');
    if (storedChosenDiff) {
      setChosenDiff(storedChosenDiff);
    }
  }, []);

  const downloadCard = () => {
    const link = document.createElement('a');
    link.href = imageSrc || '';
    link.download = `${mapInfo?.metadata.songName} - ${mapInfo?.metadata.songAuthorName} - ${mapInfo?.metadata.levelAuthorName}.png`;
    document.body.appendChild(link);
    link.click();
    createAlerts('Downloaded card!', 'success');
    document.body.removeChild(link);

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
    <div className='max-h-96 h-96 relative dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-900 p-4 pt-6 overflow-auto'>
      <motion.div
        className='flex flex-col items-center max-w-3xl mx-auto pl-8 pr-4'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className='text-center mb-4'>
          <motion.h1
            className='text-2xl font-bold'
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            Mapcard Generator
          </motion.h1>
          <motion.p
            className='text-sm mb-2'
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Generate a mapcard in a single click!
          </motion.p>
          <div className="flex justify-center space-x-2">
            <motion.button
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 text-sm rounded-lg hover:scale-110 transition duration-200 drop-shadow-lg'
              onClick={() => setCardFormModal(true)}
              whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              Map Form
            </motion.button>
            <motion.button
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 text-sm rounded-lg hover:scale-110 transition duration-200 drop-shadow-lg'
              onClick={() => setStarRatingFormModal(true)}
              whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, type: "spring" }}
            >
              Reweight Form
            </motion.button>
            {imageSrc && (
              <motion.button
                className='bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-sm rounded-lg hover:scale-110 transition duration-200 drop-shadow-lg'
                onClick={() => downloadCard()}
                whileHover={{ scale: 1.05, backgroundColor: "#16a34a" }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, type: "spring" }}
              >
                <FaDownload className='inline mr-1' /> Download
              </motion.button>
            )}
          </div>
          {mapInfo && <LoadedMap mapInfo={mapInfo} />}
        </div>

        {imageSrc && (
          <motion.div
            className='flex justify-center w-full'
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <motion.div
              className='bg-neutral-300 dark:bg-neutral-800 p-3 rounded-lg shadow-md'
              whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
            >
              <h2 className='text-lg font-bold mb-2'>Preview</h2>
              <motion.div
                className='flex justify-center'
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <img src={imageSrc} alt='Card Preview' className='max-h-[300px] w-auto' />
              </motion.div>
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
              transition={{ type: "spring", stiffness: 200 }}
            >
              <p className='text-white'>{alert.message}</p>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      <AnimatePresence>
        {progress.visible && (
          <motion.div
            className='fixed bottom-20 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md z-60'
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <motion.div
              className='flex flex-col w-full text-center items-center justify-center bg-neutral-300 dark:bg-neutral-800 p-3 rounded-md drop-shadow-lg animate-fade'
              animate={{
                boxShadow: ["0px 0px 0px rgba(0, 0, 0, 0.1)", "0px 10px 20px rgba(0, 0, 0, 0.2)", "0px 0px 0px rgba(0, 0, 0, 0.1)"]
              }}
              transition={{ boxShadow: { repeat: Infinity, duration: 2 } }}
            >
              <div className="w-full px-4 relative">
                <motion.p
                  className='text-lg font-bold mb-2'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {progress.process}
                </motion.p>
                <div className='relative'>
                  <LinearProgress
                    sx={{
                      height: 30,
                      backgroundColor: "#171717",
                      "& .MuiLinearProgress-bar": { backgroundColor: "#2563eb" }
                    }}
                    variant="determinate"
                    value={progress.progress}
                    className='w-full rounded-full text-white'
                  />
                  <motion.span
                    className='absolute inset-0 flex items-center justify-center text-white font-bold'
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {progress.progress}%
                  </motion.span>
                </div>
                <motion.button
                  className='mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200'
                  onClick={() => {
                    cancelGenerationRef.current = true;
                    setProgress({ process: "", progress: 0, visible: false });
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {cardFormModal && (
        <CardForm
          mapId={mapId}
          setMapId={setMapId}
          starRatings={starRatings}
          setStarRatings={setStarRatings}
          setMapInfo={setMapInfo}
          setCardFormModal={setCardFormModal}
          setImageSrc={setImageSrc}
          useBackground={useBackground}
          setUseBackground={setUseBackground}
          createAlerts={createAlerts}
          progress={(process: string, progress: number, visible: boolean) => setProgress({ process, progress, visible })}
          cancelGenerationRef={cancelGenerationRef}
        />
      )}
      {starRatingFormModal && (
        <StarRatingForm
          mapId={mapId}
          setMapId={setMapId}
          oldStarRatings={oldStarRatings}
          setOldStarRatings={setOldStarRatings}
          newStarRatings={starRatings}
          setNewStarRatings={setStarRatings}
          chosenDiff={chosenDiff}
          setChosenDiff={setChosenDiff}
          setMapInfo={setMapInfo}
          setStarRatingFormModal={setStarRatingFormModal}
          setImageSrc={setImageSrc}
          createAlerts={createAlerts}
          progress={(process: string, progress: number, visible: boolean) => setProgress({ process, progress, visible })}
          cancelGenerationRef={cancelGenerationRef}
        />
      )}
    </div>
  );
}

export default MapCards;
