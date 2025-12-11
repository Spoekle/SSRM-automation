import React, { FormEvent, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaCloudUploadAlt, FaList, FaCheck, FaCog, FaSync, FaSpinner } from 'react-icons/fa';
import log from '../../../../utils/log';
import { ipcRenderer } from '../../../../utils/tauri-api';
import PlaylistThumbnailInfoSection from './PlaylistThumbnailInfoSection';
import NativeFileUpload from '../../../Thumbnails/components/common/NativeFileUpload';
import BackgroundCustomizer from '../../../../components/forms/BackgroundCustomizer';

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
  const [customBackgroundPath, setCustomBackgroundPath] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [backgroundScale, setBackgroundScale] = useState<number>(1);
  const [backgroundX, setBackgroundX] = useState<number>(0);
  const [backgroundY, setBackgroundY] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsOverlayVisible(true);
    setIsPanelOpen(true);
  }, []);

  // Generate preview when file changes
  useEffect(() => {
    const generatePreview = async () => {
      if (!customBackgroundPath) {
        setPreviewSrc(null);
        setBackgroundScale(1);
        setBackgroundX(0);
        setBackgroundY(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const ext = customBackgroundPath.split('.').pop()?.toLowerCase();
      const isVideo = ['mp4', 'mkv', 'avi', 'mov'].includes(ext || '');

      try {
        if (isVideo) {
          log.info(`Generating preview for video: ${customBackgroundPath}`);
          const frameData = await ipcRenderer.invoke('generate-video-thumbnail', { videoPath: customBackgroundPath }) as string;
          setPreviewSrc(frameData);
        } else {
          log.info(`Reading image for preview: ${customBackgroundPath}`);
          const imageData = await ipcRenderer.invoke('read-image-as-base64', { imagePath: customBackgroundPath }) as string;
          setPreviewSrc(imageData);
        }
      } catch (e) {
        log.error('Failed to generate preview', e);
        createAlert('Failed to load preview', 'error');
        setPreviewSrc(null);
      } finally {
        setIsLoading(false);
      }
    };

    generatePreview();
  }, [customBackgroundPath]);

  const refreshVideoPreview = async () => {
    if (!customBackgroundPath) return;
    const ext = customBackgroundPath.split('.').pop()?.toLowerCase();
    const isVideo = ['mp4', 'mkv', 'avi', 'mov'].includes(ext || '');

    if (isVideo) {
      setIsLoading(true);
      try {
        log.info(`Refreshing preview for video: ${customBackgroundPath}`);
        const frameData = await ipcRenderer.invoke('generate-video-thumbnail', { videoPath: customBackgroundPath }) as string;
        setPreviewSrc(frameData);
      } catch (e) {
        log.error('Failed to refresh video preview', e);
        createAlert('Failed to refresh video preview', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

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
    if (!customBackgroundPath) {
      createAlert('Please upload a background image', 'error');
      return;
    }

    try {
      setImageSrc("");
      setPlaylistThumbnailFormModal(false);
      createAlert('Generation Started...', 'info');
      setProgress('Putting info together...', 10, true);

      let backgroundImage = '';

      if (previewSrc) {
        backgroundImage = previewSrc;
        setProgress('Background prepared', 30, true);
      } else {
        createAlert('No file provided', 'info');
        return;
      }

      setProgress('Generating thumbnail...', 70, true);
      let image;
      try {
        image = await ipcRenderer.invoke('generate-playlist-thumbnail', backgroundImage, month, {
          scale: backgroundScale,
          x: backgroundX,
          y: backgroundY
        }) as string;
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
                  <FaImage className="text-orange-500" />
                  Playlist Thumbnail Settings
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
              <form onSubmit={generateThumbnail} className='space-y-6'>
                {/* Background Image - File upload comes first */}
                <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                  <h2 className='text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2'>
                    <FaCloudUploadAlt className="text-orange-500" /> Background Image
                  </h2>
                  <NativeFileUpload
                    accepts="any"
                    onFileSelect={setCustomBackgroundPath}
                    currentPath={customBackgroundPath}
                    label="Background Source"
                    helperText="Click to browse image/video or drag & drop"
                  />
                </div>

                {/* Playlist Details */}
                <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                  <h2 className='text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2'>
                    <FaList className="text-orange-500" /> Playlist Details
                  </h2>
                  <PlaylistThumbnailInfoSection
                    month={month}
                    setMonth={setMonth}
                  />
                </div>

                {/* Background Customizer */}
                {customBackgroundPath && (
                  <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                    <div className='flex items-center justify-between mb-4 pb-2 border-b border-neutral-200 dark:border-neutral-700/50'>
                      <h2 className='text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-2'>
                        <FaCog className="text-orange-500" /> Background Customizer
                      </h2>
                      {previewSrc && previewSrc.startsWith('data:') && (
                        <button
                          type="button"
                          onClick={refreshVideoPreview}
                          disabled={isLoading}
                          className={`text-xs bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Get a different random frame"
                        >
                          {isLoading ? <FaSpinner className="animate-spin" size={10} /> : <FaSync size={10} />} Refresh Frame
                        </button>
                      )}
                    </div>
                    <BackgroundCustomizer
                      previewSrc={previewSrc || ''}
                      month={month}
                      backgroundScale={backgroundScale}
                      setBackgroundScale={setBackgroundScale}
                      backgroundX={backgroundX}
                      setBackgroundX={setBackgroundX}
                      backgroundY={backgroundY}
                      setBackgroundY={setBackgroundY}
                      aspectRatio="1:1"
                      accentColor="orange"
                      positionRange={200}
                    />
                  </div>
                )}
              </form>
            </div>

            {/* Sticky footer with Generate button */}
            <div className='sticky bottom-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end items-center gap-3'>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                onClick={generateThumbnail}
                className='bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2.5 text-sm rounded-lg shadow-lg shadow-orange-500/20 font-semibold flex items-center gap-2'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaCheck size={14} />
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
