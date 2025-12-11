import React, { useState, useEffect, useRef } from 'react';
import { FaDownload, FaImage, FaSearch } from 'react-icons/fa';
import BatchThumbnailForm from './components/batch/BatchThumbnailForm';
import SSRMThumbnailForm from './components/ssrm/SSRMThumbnailForm';
import ThumbnailPreview from './components/batch/ThumbnailPreview';
import { motion, AnimatePresence } from 'framer-motion';
import AlertSystem from '../../components/AlertSystem';
import ProgressBar from '../../components/ProgressBar';
import { useAlerts } from '../../utils/alertSystem';
import { nativeDialog } from '../../utils/tauri-api';

import { useMapInfo, useStarRatings } from '../../hooks';

interface Progress {
  process: string;
  progress: number;
  visible: boolean;
}

const Thumbnails: React.FC = () => {
  const [mapId, setMapId] = useState<string>('');
  const [progress, setProgress] = useState<Progress>({ process: "", progress: 0, visible: false });
  // Custom hooks
  const { mapInfo, setMapInfo } = useMapInfo();
  const { starRatings, setStarRatings } = useStarRatings();

  const [chosenDiff, setChosenDiff] = React.useState('ES');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [thumbnailFormModal, setThumbnailFormModal] = useState<string>("none");
  const [thumbnailPreviewModal, setThumbnailPreviewModal] = useState<boolean>(false);
  const cancelGenerationRef = useRef(false);
  const { alerts, createAlert } = useAlerts();

  useEffect(() => {
    const storedMapId = localStorage.getItem('mapId');
    if (storedMapId) {
      setMapId(storedMapId);
    }
    // mapInfo and starRatings are handled by hooks
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
        ease: "easeOut" as const
      }
    })
  };

  const downloadCard = async () => {
    if (!imageSrc) return;
    const filename = `${mapInfo?.metadata?.songName || 'Thumbnail'} - ${mapInfo?.metadata?.songAuthorName || 'Author'} - ${mapInfo?.metadata?.levelAuthorName || 'LevelAuthor'} - ${chosenDiff}.png`;

    // Sanitize filename
    const safeFilename = filename.replace(/[<>:"/\\|?*]/g, '_');

    const success = await nativeDialog.saveImage(imageSrc, safeFilename);
    if (success) {
      createAlert('Saved thumbnail!', 'success');
    }
  };

  const openThumbnailPreview = () => {
    setThumbnailPreviewModal(true);
  };

  // Handle cancellation
  const handleCancelGeneration = () => {
    cancelGenerationRef.current = true;
    setProgress({ process: "Cancelling...", progress: 100, visible: true });
    setTimeout(() => {
      setProgress({ process: "", progress: 0, visible: false });
      createAlert("Operation cancelled by user", "info");
    }, 500);
  };

  return (
    <div className='w-full min-h-full relative p-4 pt-6 overflow-x-hidden custom-scrollbar'>
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
            <FaImage className="text-purple-500 text-xl" />
            <h1 className='text-2xl font-bold'>Thumbnail Generator</h1>
          </div>
          <p className='text-sm mb-3 text-neutral-600 dark:text-neutral-400'>
            Generate a thumbnail in a single click!
          </p>
          <div className="flex justify-center gap-3">
            <motion.button
              className='group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl shadow-sm hover:bg-white/80 dark:hover:bg-neutral-800 hover:shadow-md transition-all'
              onClick={() => setThumbnailFormModal("batch")}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring" }}
            >
              <FaImage size={16} className="text-yellow-500 group-hover:scale-110 transition-transform" />
              <span>Batch Thumbnail</span>
            </motion.button>
            <motion.button
              className='group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl shadow-sm hover:bg-white/80 dark:hover:bg-neutral-800 hover:shadow-md transition-all'
              onClick={() => setThumbnailFormModal("ssrm")}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring" }}
            >
              <FaImage size={16} className="text-orange-500 group-hover:scale-110 transition-transform" />
              <span>SSRM Thumbnail</span>
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
              className='relative flex w-full bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-4 shadow-md overflow-hidden group'
              whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 rounded-xl transition-opacity duration-300" />
              <motion.div
                className='flex justify-center rounded-lg shadow-inner overflow-hidden relative z-10'
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <div className="flex flex-col justify-between items-center relative z-10">
                  <h2 className='text-lg font-bold flex items-center gap-2'>
                    <FaImage className="text-purple-500" />
                    Preview
                  </h2>
                  <div className="flex flex-col space-y-2 mx-2">
                    <motion.button
                      onClick={() => openThumbnailPreview()}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 px-3 text-sm rounded-lg flex items-center gap-1.5"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaSearch size={14} />
                      Full View
                    </motion.button>
                    <motion.button
                      onClick={() => downloadCard()}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 text-sm rounded-lg flex items-center gap-1.5"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaDownload size={14} />
                      Download
                    </motion.button>
                  </div>
                </div>

                <motion.img
                  src={imageSrc}
                  alt='Thumbnail Preview'
                  className='max-h-[160px] w-auto rounded'
                  onClick={() => openThumbnailPreview()}
                  whileHover={{
                    cursor: 'pointer'
                  }}
                />
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
              No thumbnail generated yet. Click the button above to get started.
            </p>
          </motion.div>
        )}
      </motion.div>

      <AlertSystem alerts={alerts} position="top-right" />

      {thumbnailFormModal === "batch" && (
        <BatchThumbnailForm
          mapId={mapId}
          setMapId={setMapId}
          setMapInfo={setMapInfo}
          setThumbnailFormModal={setThumbnailFormModal}
          setImageSrc={setImageSrc}
          starRatings={starRatings}
          setStarRatings={setStarRatings}
          chosenDiff={chosenDiff}
          setChosenDiff={setChosenDiff}
          createAlert={createAlert}
          progress={(process: string, progress: number, visible: boolean) => setProgress({ process, progress, visible })}
          cancelGenerationRef={cancelGenerationRef}
        />
      )}
      {thumbnailFormModal === "ssrm" && (
        <SSRMThumbnailForm
          mapId={mapId}
          setMapId={setMapId}
          setMapInfo={setMapInfo}
          setThumbnailFormModal={setThumbnailFormModal}
          setImageSrc={setImageSrc}
          starRatings={starRatings}
          setStarRatings={setStarRatings}
          chosenDiff={chosenDiff}
          setChosenDiff={setChosenDiff}
          createAlert={createAlert}
          progress={(process: string, progress: number, visible: boolean) => setProgress({ process, progress, visible })}
          cancelGenerationRef={cancelGenerationRef}
        />
      )}
      {thumbnailPreviewModal && (
        <ThumbnailPreview
          setThumbnailPreviewModal={setThumbnailPreviewModal}
          imageSrc={imageSrc}
        />
      )}
    </div>
  );
}

export default Thumbnails;
