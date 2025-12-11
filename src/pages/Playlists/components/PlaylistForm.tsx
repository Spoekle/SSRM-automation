import React, { ChangeEvent, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes, FaCloudUploadAlt, FaList, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import log from '../../../utils/log';

interface PlaylistFormProps {
  setPlaylistFormModal: (show: boolean) => void;
  createAlert?: (text: string, type: 'success' | 'error' | 'alert' | 'info') => void;
  progress: (process: string, progress: number, visible: boolean) => void;
  onProcessComplete: (hashes: string[], output: string) => void;
}

interface UploadedMap {
  id: number;
  songHash: string;
  songName: string;
  songSubName: string;
  levelAuthorName: string;
  difficulty: number;
  stars: number;
}

const PlaylistForm: React.FC<PlaylistFormProps> = ({
  setPlaylistFormModal,
  createAlert,
  progress: setProgress,
  onProcessComplete,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  useEffect(() => {
    setIsOverlayVisible(true);
    setIsPanelOpen(true);
  }, []);

  const handleClose = () => {
    setIsPanelOpen(false);
    setIsOverlayVisible(false);
    setTimeout(() => {
      setPlaylistFormModal(false);
    }, 300);
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (createAlert) createAlert(`Processing JSON file...`, 'info');
    setProgress("Reading JSON file...", 10, true);

    try {
      const text = await file.text();
      setProgress("Parsing JSON...", 30, true);

      const uploadedMaps: UploadedMap[] = JSON.parse(text);

      setProgress("Extracting song hashes...", 60, true);

      // Extract unique song hashes
      const uniqueHashes = Array.from(new Set(uploadedMaps.map(map => map.songHash)));

      const output = uniqueHashes.join('\n');

      setProgress("Complete!", 100, true);
      setTimeout(() => {
        setProgress("", 0, false);
      }, 1000);

      if (createAlert) createAlert(`Extracted ${uniqueHashes.length} hashes from ${uploadedMaps.length} total diffs`, 'success');

      // Call the callback to pass data to parent and close modal
      onProcessComplete(uniqueHashes, output);
    } catch (error: any) {
      log.error("Error processing uploaded JSON:", error);
      if (createAlert) createAlert(
        "Failed to process the uploaded JSON file. Please ensure it is correctly formatted.",
        "error"
      );
      setProgress("", 0, false);
    }
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {true && (
        <motion.div
          className={`fixed top-17 left-0 right-0 bottom-13 z-40 rounded-br-3xl backdrop-blur-sm flex justify-center items-center ${isOverlayVisible ? "opacity-100" : "opacity-0"
            } bg-neutral-900/30`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isOverlayVisible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="absolute left-0 top-0 h-full w-2/3 max-w-2xl lg:max-w-4xl rounded-r-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl border-r border-y border-white/20 dark:border-white/5 overflow-hidden flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: isPanelOpen ? "0%" : "-100%" }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="z-10 sticky top-0 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <div className="flex items-center">
                <motion.h2
                  className="text-lg font-bold flex items-center gap-2 text-neutral-800 dark:text-neutral-100"
                  whileHover={{ scale: 1.01 }}
                >
                  <FaList className="text-purple-500" />
                  Playlist Processor
                </motion.h2>
              </div>
              <motion.button
                className="text-neutral-500 hover:text-red-500 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                onClick={handleClose}
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes size={18} />
              </motion.button>
            </motion.div>

            <div className="flex-1 overflow-auto custom-scrollbar p-6">
              <div className='space-y-6'>
                {/* File Upload Section */}
                <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                  <h2 className='text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2'>
                    <FaCloudUploadAlt className="text-purple-500" /> Upload JSON File
                  </h2>
                  <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-4'>
                    Upload a JSON file containing map data to extract unique song hashes.
                  </p>
                  <label className='flex items-center justify-center w-full h-24 px-4 transition bg-white/50 dark:bg-neutral-900/50 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl appearance-none cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 focus:outline-none'>
                    <div className="flex flex-col items-center space-y-2">
                      <FaCloudUploadAlt className="text-purple-500 text-3xl" />
                      <span className="font-medium text-neutral-600 dark:text-neutral-300">
                        Select JSON File
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">or drag and drop</span>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className='hidden'
                    />
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PlaylistForm;
