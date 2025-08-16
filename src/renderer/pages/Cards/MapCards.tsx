import React, { useState, useEffect, useRef } from 'react';
import { FaDownload, FaEdit, FaExchangeAlt, FaLayerGroup } from 'react-icons/fa';
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

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

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
    <div className='max-h-96 h-96 relative dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-900 p-4 pt-6 overflow-auto custom-scrollbar'>
      <ProgressBar
        visible={progress.visible}
        progress={progress.progress}
        process={progress.process}
        onCancel={handleCancelGeneration}
      />

      <motion.div
        className='flex flex-col items-center max-w-3xl mx-auto'
        initial="hidden"
        animate="visible"
      >
        <motion.div className='text-center mb-4' variants={fadeIn} custom={0}>
          <div className="flex items-center justify-center gap-3 mb-1">
            <FaLayerGroup className="text-blue-500 text-xl" />
            <h1 className='text-2xl font-bold'>Mapcard Generator</h1>
          </div>
          <p className='text-sm mb-3 text-neutral-600 dark:text-neutral-400'>
            Generate a mapcard in a single click!
          </p>
          <div className="flex justify-center space-x-3">
            <motion.button
              className='bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2'
              onClick={() => setCardFormModal(true)}
              whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring" }}
            >
              <FaLayerGroup size={16} />
              <span>Map Card</span>
            </motion.button>
            <motion.button
              className='bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2'
              onClick={() => setStarRatingFormModal(true)}
              whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring" }}
            >
              <FaExchangeAlt size={16} />
              <span>Reweight</span>
            </motion.button>
          </div>
        </motion.div>

        {imageSrc && (
          <motion.div
            className='w-full max-w-md'
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
                <h2 className='text-lg font-bold flex items-center gap-2'>
                  <FaLayerGroup className="text-blue-500" />
                  Preview
                </h2>
                <motion.button
                  className='bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 text-sm rounded-lg flex items-center gap-1.5'
                  onClick={() => downloadCard()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaDownload size={14} />
                  Download
                </motion.button>
              </div>
              <motion.div
                className='flex justify-center rounded-lg shadow-inner overflow-hidden relative z-10'
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <img src={imageSrc} alt='Card Preview' className='max-h-[180px] w-auto' />
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {!imageSrc && (
          <motion.div
            className="w-full max-w-md mx-auto bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-6 rounded-xl shadow-md mt-8 text-center"
            variants={fadeIn}
            custom={1}
          >
            <p className="text-neutral-600 dark:text-neutral-400">
              No card generated yet. Click one of the buttons above to get started.
            </p>
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
