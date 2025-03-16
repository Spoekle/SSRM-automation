import React, { useState, useEffect, useRef } from 'react';
import { FaDownload } from 'react-icons/fa';
import CardForm from './components/CardForm';
import StarRatingForm from './components/ReweightForm';
import { motion, AnimatePresence } from 'framer-motion';
import AlertSystem from '../../components/AlertSystem';
import ProgressBar from '../../components/ProgressBar';
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
    createAlert('Downloaded card!', 'success');
    document.body.removeChild(link);

  };

  const handleCancelGeneration = () => {
    cancelGenerationRef.current = true;
    setProgress({ process: "Cancelling...", progress: 100, visible: true });
    setTimeout(() => {
      setProgress({ process: "", progress: 0, visible: false });
      createAlert("Operation cancelled by user", "info");
    }, 500);
  };

  const mapLink = `https://beatsaver.com/maps/${mapId}`;

  return (
    <div className='max-h-96 h-96 relative dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-900 p-4 pt-6 overflow-auto'>
      <ProgressBar
        visible={progress.visible}
        progress={progress.progress}
        process={progress.process}
        onCancel={handleCancelGeneration}
      />

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
        </div>

        {imageSrc && (
          <motion.div
            className='flex justify-center w-full'
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <motion.div
              className='bg-neutral-300 dark:bg-neutral-800 p-2 rounded-lg shadow-md'
              whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="flex items-center mb-1">
                <h2 className='text-base font-bold'>Preview</h2>
                <motion.button
                  onClick={() => downloadCard()}
                  className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaDownload className='inline mr-1' size={10} /> Save
                </motion.button>
              </div>
              <motion.div
                className='flex justify-center'
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <img src={imageSrc} alt='Card Preview' className='max-h-[180px] w-auto' />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      <AlertSystem alerts={alerts} position="top-right" />

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
          createAlert={createAlert}
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
          createAlert={createAlert}
          progress={(process: string, progress: number, visible: boolean) => setProgress({ process, progress, visible })}
          cancelGenerationRef={cancelGenerationRef}
        />
      )}
    </div>
  );
}

export default MapCards;
