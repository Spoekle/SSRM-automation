import React, { FormEvent, useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaCloudUploadAlt, FaMapMarkedAlt, FaCheck, FaSync, FaSpinner } from 'react-icons/fa';
import log from '../../../../utils/log';
import { ipcRenderer, nativeDialog } from '../../../../utils/tauri-api';
import { convertFileSrc } from '@tauri-apps/api/core';
import MapInfoSection from './MapInfoSection';
import NativeFileUpload from '../common/NativeFileUpload';
import { notifyMapInfoUpdated } from '../../../../utils/mapEvents';
import { fetchMapData } from '../../../../api/beatsaver';
import { storage, STORAGE_KEYS } from '../../../../utils/storage';
import { useModal } from '../../../../hooks/useModal';
import { handleError } from '../../../../utils/errorHandler';
import type { StarRatings } from '../../../../types';

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



const SSRMThumbnailForm: React.FC<ThumbnailFormProps> = ({
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
  const { isPanelOpen, isOverlayVisible, handleClose: closeModal } = useModal(() => setThumbnailFormModal("none"));

  // Generate preview when file changes
  React.useEffect(() => {
    const generatePreview = async () => {
      if (!customBackgroundPath) {
        setPreviewSrc(null);
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

  const handleClose = closeModal;

  const handleFileSelect = (path: string | null) => {
      setCustomBackgroundPath(path);
      if (path) log.info('Selected background path:', path);
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setImageSrc("");
      setThumbnailFormModal("none");
      createAlert('Generation Started...', 'info');
      setProgress('Fetching map info...', 10, true);

      let mapData;
      let currentStarRatings = starRatings;

      try {
        mapData = await fetchMapData(mapId);
        setMapInfo(mapData);
        storage.setString(STORAGE_KEYS.MAP_ID, mapId);
        storage.set(STORAGE_KEYS.MAP_INFO, mapData);
        notifyMapInfoUpdated();

      } catch (error) {
        handleError(error, 'fetchMapData', createAlert);
        setProgress("", 0, false);
        return;
      }

      let backgroundImage = '';

      // Handle custom background (Image or Video)
      // Handle custom background (Image or Video)
      if (previewSrc) {
          backgroundImage = previewSrc;
          setProgress('Background prepared', 30, true);
      } else if (mapData && mapData.versions && mapData.versions.length > 0) {
          createAlert('No file provided, using map cover as background', 'info');
          setProgress('Generating thumbnail with cover image', 50, true);
          backgroundImage = mapData.versions[0].coverURL;
      } else {
         // Fallback usually shouldn't happen if mapData is valid but safe to have
         backgroundImage = "";
      }

      setProgress('Generating thumbnail...', 70, true);
      let image;
      try {
        image = await ipcRenderer.invoke('generate-ssrm-thumbnail', mapData, chosenDiff, currentStarRatings, backgroundImage) as string;
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
                  SSRM Thumbnail Settings
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
              <form onSubmit={getMapInfo} className='p-3 space-y-3'>
                {/* Background Image - File upload comes first */}
                {/* Background Image */}
                < div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm' >
                  <h2 className='text-base font-medium mb-2 border-b pb-1 border-neutral-200 dark:border-neutral-600 flex items-center gap-1.5'>
                    <FaCloudUploadAlt className="text-orange-500" /> Background Image
                  </h2>
                   <div className="space-y-2">
                    <NativeFileUpload
                        accepts="any"
                        onFileSelect={handleFileSelect}
                        currentPath={customBackgroundPath}
                        label="Background Source"
                        helperText="Click to browse image/video or drag & drop"
                    />

                    {/* Preview Area */}
                    {previewSrc && (
                        <div className="relative mt-2 h-32 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 flex justify-center items-center overflow-hidden group">
                            <img
                                src={previewSrc.startsWith('data:') ? previewSrc : convertFileSrc(previewSrc)}
                                alt="Preview"
                                className="h-full w-full object-contain"
                            />
                            {previewSrc.startsWith('data:') && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={refreshVideoPreview}
                                        disabled={isLoading}
                                        className={`bg-white text-neutral-900 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 hover:scale-105 transition-transform ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isLoading ? <FaSpinner className="animate-spin" /> : <FaSync />} Refresh Frame
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                   </div>
                </div>

                {/* Map Details */}
                <div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm'>
                  <h2 className='text-base font-medium mb-2 border-b pb-1 border-neutral-200 dark:border-neutral-600 flex items-center gap-1.5'>
                    <FaMapMarkedAlt className="text-orange-500" /> Map Details
                  </h2>
                  <MapInfoSection
                    mapId={mapId}
                    setMapId={setMapId}
                    starRatings={starRatings}
                    setStarRatings={setStarRatings}
                    chosenDiff={chosenDiff}
                    setChosenDiff={setChosenDiff}
                  />
                </div>
              </form>
            </div>

            {/* Sticky footer with Generate button */}
            <div className='sticky bottom-0 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm p-2 border-t border-neutral-300 dark:border-neutral-700 flex justify-end items-center'>
              <motion.button
                type="button"
                onClick={getMapInfo}
                className='bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-1.5 text-sm rounded-lg shadow-sm hover:shadow-md font-medium flex items-center gap-1.5'
                whileHover={{ scale: 1.03, boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}
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

export default SSRMThumbnailForm;
