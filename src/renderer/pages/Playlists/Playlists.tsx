import React, { useState, useRef } from 'react';
import { FaList, FaCloudUploadAlt, FaDownload, FaCopy } from 'react-icons/fa';
import log from 'electron-log';
import PlaylistForm from './components/PlaylistForm';
import { motion, AnimatePresence } from 'framer-motion';
import AlertSystem from '../../components/AlertSystem';
import ProgressBar from '../../components/ProgressBar';
import { useAlerts } from '../../utils/alertSystem';
import '../Settings/styles/CustomScrollbar.css';

interface Progress {
  process: string;
  progress: number;
  visible: boolean;
}

const Playlists: React.FC = () => {
  const [progress, setProgress] = useState<Progress>({process: "", progress: 0, visible: false });
  const [playlistFormModal, setPlaylistFormModal] = useState<boolean>(false);
  const [songHashes, setSongHashes] = useState<string[]>([]);
  const [outputText, setOutputText] = useState<string>('');
  const { alerts, createAlert } = useAlerts();

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

  const handleCancelOperation = () => {
    setProgress({ process: "Cancelling...", progress: 100, visible: true });
    setTimeout(() => {
      setProgress({ process: "", progress: 0, visible: false });
      createAlert("Operation cancelled by user", "info");
    }, 500);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      createAlert('Song hashes copied to clipboard!', 'success');
    } catch (error) {
      log.error('Failed to copy to clipboard:', error);
      createAlert('Failed to copy to clipboard', 'error');
    }
  };

  const handleProcessComplete = (hashes: string[], output: string) => {
    setSongHashes(hashes);
    setOutputText(output);
    setPlaylistFormModal(false);
  };

  return (
    <div className='max-h-96 h-96 relative dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-900 p-4 pt-6 overflow-auto custom-scrollbar'>
      <ProgressBar
        visible={progress.visible}
        progress={progress.progress}
        process={progress.process}
        onCancel={handleCancelOperation}
      />

      <motion.div
        className='flex flex-col items-center max-w-3xl mx-auto'
        initial="hidden"
        animate="visible"
      >
        <motion.div className='text-center mb-4' variants={fadeIn} custom={0}>
          <div className="flex items-center justify-center gap-3 mb-1">
            <FaList className="text-orange-500 text-xl" />
            <h1 className='text-2xl font-bold'>Playlist Processor</h1>
          </div>
          <p className='text-sm mb-3 text-neutral-600 dark:text-neutral-400'>
            Extract unique song hashes from JSON files!
          </p>
          <div className="flex justify-center">
            <motion.button
              className='bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2 mx-auto'
              onClick={() => setPlaylistFormModal(true)}
              whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <FaCloudUploadAlt size={18} />
              <span>Process Playlist</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Output Section */}
        {songHashes.length > 0 && (
          <motion.div
            className="w-2/3 max-w-2xl mx-auto bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-4 rounded-xl shadow-md mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold">{songHashes.length} Extracted Song Hashes</h2>
              <div className="absolute top-2 right-2 flex gap-2">
                <motion.button
                  onClick={copyToClipboard}
                  className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 px-3 text-sm rounded-lg flex items-center gap-1.5'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaCopy size={14} />
                  Copy
                </motion.button>
              </div>
            </div>
            
            <div className="relative">
              <textarea
                value={outputText}
                readOnly
                className="w-full h-32 p-3 text-sm font-mono bg-white/60 dark:bg-neutral-700/60 border rounded-lg resize-none custom-scrollbar"
              />
            </div>
          </motion.div>
        )}

        {!songHashes.length && (
          <motion.div
            className="w-full max-w-md mx-auto bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-6 rounded-xl shadow-md mt-8 text-center"
            variants={fadeIn}
            custom={1}
          >
            <p className="text-neutral-600 dark:text-neutral-400">
              No list generated yet. Click the button above to get started.
            </p>
          </motion.div>
        )}
      </motion.div>

      <AlertSystem alerts={alerts} position="top-right" />

      {playlistFormModal && (
        <PlaylistForm
          setPlaylistFormModal={setPlaylistFormModal}
          createAlert={createAlert}
          progress={(process: string, progress: number, visible: boolean) => setProgress({ process, progress, visible })}
          onProcessComplete={handleProcessComplete}
        />
      )}
    </div>
  );
}

export default Playlists;
