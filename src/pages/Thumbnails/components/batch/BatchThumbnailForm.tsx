import React, { FormEvent, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaCloudUploadAlt, FaMapMarkedAlt, FaCheck, FaSpinner } from 'react-icons/fa';
import log from '../../../../utils/log';
import { ipcRenderer } from '../../../../utils/tauri-api';
import BatchInfoSection from './BatchInfoSection';
import { NativeFileUpload } from '../../../../components/forms';

interface ThumbnailFormProps {
  mapId: string;
  setMapId: (id: string) => void;
  setThumbnailFormModal: (show: string) => void;
  setMapInfo: (info: any) => void;
  setImageSrc: (src: string) => void;
  starRatings: StarRatings;
  setStarRatings: (ratings: StarRatings) => void;
  chosenDiff: string;
  setChosenDiff: (diff: string) => void;
  createAlert: (message: string, type: 'success' | 'error' | 'alert' | 'info') => void;
  progress: (process: string, progress: number, visible: boolean) => void;
  cancelGenerationRef: React.MutableRefObject<boolean>;
}

interface StarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EX: string;
  EXP: string;
}

const BatchThumbnailForm: React.FC<ThumbnailFormProps> = ({
  mapId,
  setMapId,
  setThumbnailFormModal,
  setMapInfo,
  setImageSrc,
  starRatings,
  setStarRatings,
  chosenDiff,
  setChosenDiff,
  createAlert,
  progress: setProgress,
  cancelGenerationRef,
}) => {
  const [customBackgroundPath, setCustomBackgroundPath] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [month, setMonth] = useState<string>('');

  useEffect(() => {
    setIsOverlayVisible(true);
    setIsPanelOpen(true);
  }, []);

  // Generate preview when file changes (image only)
  useEffect(() => {
    const generatePreview = async () => {
      if (!customBackgroundPath) {
        setPreviewSrc(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        log.info(`Reading image for preview: ${customBackgroundPath}`);
        const imageData = await ipcRenderer.invoke('read-image-as-base64', { imagePath: customBackgroundPath }) as string;
        setPreviewSrc(imageData);
      } catch (e) {
        log.error('Failed to read image for preview', e);
        createAlert('Failed to load image preview', 'error');
        setPreviewSrc(null);
      } finally {
        setIsLoading(false);
      }
    };

    generatePreview();
  }, [customBackgroundPath]);

  const handleClose = () => {
    setIsPanelOpen(false);
    setIsOverlayVisible(false);
    setTimeout(() => {
      setThumbnailFormModal("none");
    }, 300);
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();

    // Validate that month is selected
    if (!month) {
      createAlert('Please select a month', 'error');
      return;
    }

    if (!customBackgroundPath) {
      createAlert('No file provided', 'info');
      return;
    }

    try {
      setImageSrc("");
      setThumbnailFormModal("none");
      createAlert('Generation Started...', 'info');
      setProgress('Putting info together...', 10, true);

      setProgress('Background prepared', 30, true);

      let image;
      try {
        image = await ipcRenderer.invoke('generate-batch-thumbnail', customBackgroundPath, month) as string;
      } catch (error) {
        log.error('Error generating thumbnail:', error);
        createAlert('Error generating thumbnail', 'error');
        setProgress("", 0, false);
        return;
      }

      setProgress('Thumbnail generated', 100, true);
      setImageSrc(image);
      setProgress("", 0, false);
      createAlert('Thumbnail generated successfully', 'success');

    } catch (error) {
      log.error('Unhandled error in getMapInfo:', error);
      createAlert('An unexpected error occurred', 'error');
      setProgress("", 0, false);
    }
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {true && (
        <motion.div
          className={`fixed top-17 left-0 right-0 bottom-13 z-40 backdrop-blur-sm flex justify-center items-center ${isOverlayVisible ? "opacity-100" : "opacity-0"
            } bg-neutral-900/30`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isOverlayVisible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="absolute left-0 top-0 h-full w-2/3 max-w-2xl rounded-r-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl border-r border-y border-white/20 dark:border-white/5 overflow-hidden flex flex-col"
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
                  <FaImage className="text-yellow-500" />
                  Batch Thumbnail Settings
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

            <div className="flex-1 overflow-auto custom-scrollbar p-6 space-y-6">
              <form onSubmit={getMapInfo} className='space-y-6'>
                {/* Background Image - File upload comes first */}
                <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                  <h2 className='text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2'>
                    <FaCloudUploadAlt /> Background Image
                  </h2>
                  <NativeFileUpload
                    accepts="image"
                    onFileSelect={setCustomBackgroundPath}
                    currentPath={customBackgroundPath}
                    label="Background Source"
                    helperText="Click to browse image or drag & drop"
                  />
                </div>

                {/* Map Details */}
                <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                  <h2 className='text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2'>
                    <FaMapMarkedAlt /> Batch Details
                  </h2>
                  <BatchInfoSection
                    month={month}
                    setMonth={setMonth}
                  />
                </div>

                {/* Preview Section */}
                {customBackgroundPath && (
                  <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                    <div className='flex items-center justify-between mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-2'>
                      <h2 className='text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-2'>
                        <FaImage /> Preview
                      </h2>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2 text-center">
                     (Editor port is still WIP)
                      </p>
                      {isLoading && (
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <FaSpinner className="animate-spin" /> Loading...
                        </span>
                      )}
                    </div>
                    {previewSrc && (
                      <div className="flex justify-center">
                        <div className="relative h-48 aspect-video bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden shadow-inner ring-1 ring-neutral-900/5 dark:ring-white/10">
                          <img
                            src={previewSrc}
                            alt="Background preview"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center">
                      Image will be auto-cropped to 16:9 (centered)
                    </p>
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
                onClick={getMapInfo}
                className='btn-primary px-6 py-2.5 text-sm rounded-lg shadow-lg shadow-yellow-500/20 font-semibold flex items-center gap-2'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaCheck />
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

export default BatchThumbnailForm;
