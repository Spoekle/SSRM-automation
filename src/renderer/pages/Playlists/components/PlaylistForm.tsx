import React, { ChangeEvent, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes, FaCloudUploadAlt, FaList, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import log from 'electron-log';
import '../../../pages/Settings/styles/CustomScrollbar.css';

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
          className={`fixed top-16 left-0 right-0 bottom-16 z-40 rounded-br-3xl backdrop-blur-md flex justify-center items-center ${
            isOverlayVisible ? "opacity-100" : "opacity-0"
          } bg-black/20`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isOverlayVisible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="absolute left-0 top-0 h-full w-2/3 rounded-r-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-lg overflow-hidden flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: isPanelOpen ? "0%" : "-100%" }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="z-10 sticky top-0 backdrop-blur-md bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-800/20 dark:to-pink-800/20 p-3 border-b border-neutral-300 dark:border-neutral-700 flex justify-between items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <div className="flex items-center">
                <motion.h2
                  className="text-lg bg-white/70 dark:bg-neutral-700/70 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
                  whileHover={{ scale: 1.03 }}
                >
                  <FaList className="text-purple-500" />
                  Playlist Processor
                </motion.h2>
              </div>
              <motion.button
                className="text-red-500 bg-white/70 dark:bg-neutral-700/70 p-1.5 rounded-md hover:bg-neutral-400 dark:hover:bg-neutral-600 transition duration-200 shadow-sm"
                onClick={handleClose}
                whileHover={{
                  scale: 1.1,
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                }}
                whileTap={{ scale: 0.95 }}
              >
                <FaTimes />
              </motion.button>
            </motion.div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              <div className='p-3 space-y-3'>
                {/* File Upload Section */}
                <div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm'>
                  <h2 className='text-base font-medium mb-2 border-b pb-1 border-neutral-200 dark:border-neutral-600 flex items-center gap-1.5'>
                    <FaCloudUploadAlt className="text-purple-500" /> Upload JSON File
                  </h2>
                  <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-3'>
                    Upload a JSON file containing map data to extract unique song hashes.
                  </p>
                  <label className='flex items-center justify-center w-full h-20 px-3 py-2 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-200/50 dark:hover:bg-neutral-600/50 transition duration-200'>
                    <div className="flex flex-col items-center">
                      <FaCloudUploadAlt className="mb-2 text-purple-500" size={24} />
                      <span className="text-sm text-neutral-700 dark:text-neutral-200 font-medium">Select JSON File</span>
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
