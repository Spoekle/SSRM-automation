import React, { FormEvent, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaCloudUploadAlt, FaList, FaCheck, FaCog } from 'react-icons/fa';
import log from 'electron-log';
import { ipcRenderer } from 'electron';
import PlaylistThumbnailInfoSection from './PlaylistThumbnailInfoSection';
import PlaylistFileUploadSection from './PlaylistFileUploadSection';
import PlaylistBackgroundCustomizer from './PlaylistBackgroundCustomizer';
import '../../../Settings/styles/CustomScrollbar.css';

interface PlaylistThumbnailFormProps {
  setPlaylistThumbnailFormModal: (show: boolean) => void;
  month: string;
  setMonth: (month: string) => void;
  setImageSrc: (src: string) => void;
  createAlert: (message: string, type: 'success' | 'error' | 'alert' | 'info') => void;
  progress: (process: string, progress: number, visible: boolean) => void;
}

const PlaylistThumbnailForm: React.FC<PlaylistThumbnailFormProps> = ({
  setPlaylistThumbnailFormModal,
  month,
  setMonth,
  setImageSrc,
  createAlert,
  progress: setProgress,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [backgroundScale, setBackgroundScale] = useState<number>(1);
  const [backgroundX, setBackgroundX] = useState<number>(0);
  const [backgroundY, setBackgroundY] = useState<number>(0);

  useEffect(() => {
    setIsOverlayVisible(true);
    setIsPanelOpen(true);
  }, []);

  // Reset customizer values when file changes
  useEffect(() => {
    if (!file) {
      setBackgroundScale(1);
      setBackgroundX(0);
      setBackgroundY(0);
    }
  }, [file]);

  const handleClose = () => {
    setIsPanelOpen(false);
    setIsOverlayVisible(false);
    setTimeout(() => {
      setPlaylistThumbnailFormModal(false);
    }, 300);
  };

  const generateThumbnail = async (event: FormEvent) => {
    event.preventDefault();
    
    // Validate that month is selected
    if (!month) {
      createAlert('Please select a month', 'error');
      return;
    }

    // Validate that a file is uploaded
    if (!file) {
      createAlert('Please upload a background image', 'error');
      return;
    }
    
    try {
      setImageSrc("");
      setPlaylistThumbnailFormModal(false);
      createAlert('Generation Started...', 'info');
      setProgress('Putting info together...', 10, true);

      let backgroundImage = '';

      const fileType = file.type.startsWith('image/') ? 'image' : 'video';

      if (fileType === 'video') {
        setProgress('Processing video to extract a frame...', 30, true);
      } else {
        setProgress('Processing image...', 30, true);
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', fileType);

        const response = await axios.post(
          'http://localhost:3000/api/generate-thumbnail',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || file.size)
              );
              setProgress(`Uploading ${fileType}...`, percentCompleted, true);
            }
          }
        );

        if (response.data && response.data.thumbnail) {
          backgroundImage = response.data.thumbnail;
          setProgress('File processed successfully', 60, true);
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        log.error('Error processing file:', error);
        createAlert('Error processing file', 'error');
        setProgress("", 0, false);
        return;
      }

      setProgress('Generating thumbnail...', 70, true);
      let image;
      try {
        image = await ipcRenderer.invoke('generate-playlist-thumbnail', backgroundImage, month, {
          scale: backgroundScale,
          x: backgroundX,
          y: backgroundY
        });
      } catch (error) {
        log.error('Error generating playlist thumbnail:', error);
        createAlert('Error generating thumbnail', 'error');
        setProgress("", 0, false);
        return;
      }

      setProgress('Thumbnail generated', 100, true);
      setImageSrc(image);
      setProgress("", 0, false);
      createAlert('Playlist thumbnail generated successfully', 'success');

    } catch (error) {
      log.error('Unhandled error in generateThumbnail:', error);
      createAlert('An unexpected error occurred', 'error');
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
              className="z-10 sticky top-0 backdrop-blur-md bg-gradient-to-r from-orange-500/10 to-orange-400/10 dark:from-orange-800/20 dark:to-orange-700/20 p-3 border-b border-neutral-300 dark:border-neutral-700 flex justify-between items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <div className="flex items-center">
                <motion.h2
                  className="text-lg bg-white/70 dark:bg-neutral-700/70 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
                  whileHover={{ scale: 1.03 }}
                >
                  <FaImage className="text-orange-500" />
                  Playlist Thumbnail Settings
                </motion.h2>
              </div>
              <motion.button
                className="text-red-500 bg-white/70 dark:bg-neutral-700/70 p-1.5 rounded-md hover:bg-red-500 hover:text-white transition duration-200 shadow-sm"
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaTimes />
              </motion.button>
            </motion.div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              <form onSubmit={generateThumbnail} className='p-3 space-y-3'>
                {/* Background Image - File upload comes first */}
                <div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm'>
                  <h2 className='text-base font-medium mb-2 border-b pb-1 border-neutral-200 dark:border-neutral-600 flex items-center gap-1.5'>
                    <FaCloudUploadAlt className="text-orange-500" /> Background Image
                  </h2>
                  <PlaylistFileUploadSection
                    file={file}
                    setFile={setFile}
                  />
                </div>

                {/* Playlist Details */}
                <div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm'>
                  <h2 className='text-base font-medium mb-2 border-b pb-1 border-neutral-200 dark:border-neutral-600 flex items-center gap-1.5'>
                    <FaList className="text-orange-500" /> Playlist Details
                  </h2>
                  <PlaylistThumbnailInfoSection
                    month={month}
                    setMonth={setMonth}
                  />
                </div>

                {/* Background Customizer */}
                {file && (
                  <div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm'>
                    <h2 className='text-base font-medium mb-2 border-b pb-1 border-neutral-200 dark:border-neutral-600 flex items-center gap-1.5'>
                      <FaCog className="text-orange-500" /> Background Customizer
                    </h2>
                    <PlaylistBackgroundCustomizer
                      file={file}
                      month={month}
                      backgroundScale={backgroundScale}
                      setBackgroundScale={setBackgroundScale}
                      backgroundX={backgroundX}
                      setBackgroundX={setBackgroundX}
                      backgroundY={backgroundY}
                      setBackgroundY={setBackgroundY}
                    />
                  </div>
                )}
              </form>
            </div>

            {/* Sticky footer with Generate button */}
            <div className='sticky bottom-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm p-2 border-t border-neutral-300 dark:border-neutral-700 flex justify-end items-center'>
              <motion.button
                type="button"
                onClick={generateThumbnail}
                className='bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-1.5 text-sm rounded-lg shadow-sm hover:shadow-md font-medium flex items-center gap-1.5'
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaCheck size={12} />
                Generate Thumbnail
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PlaylistThumbnailForm;