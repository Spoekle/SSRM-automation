import React, { FormEvent, useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaCloudUploadAlt, FaMapMarkedAlt, FaCheck, FaSync, FaSpinner } from 'react-icons/fa';
import log from '../../../../utils/log';
import { ipcRenderer, nativeDialog } from '../../../../utils/tauri-api';
import { convertFileSrc } from '@tauri-apps/api/core';
import MapInfoSection from './MapInfoSection';
import { NativeFileUpload } from '../../../../components/forms';
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
        // setMapInfo from hook handles localStorage and event dispatch
        setMapInfo(mapData);
        // Manually save mapId as it's not in the mapInfo hook
        storage.setString(STORAGE_KEYS.MAP_ID, mapId);

      } catch (error) {
        handleError(error, 'fetchMapData', createAlert);
        setProgress("", 0, false);
        return;
      }

      let backgroundImage = '';

      // Handle custom background (Image or Video)
      if (previewSrc) {
        backgroundImage = previewSrc;
        setProgress('Background prepared', 30, true);
      } else if (mapData && mapData.versions && mapData.versions.length > 0) {
        createAlert('No file provided, using map cover as background', 'info');
        setProgress('Generating thumbnail with cover image', 50, true);
        backgroundImage = mapData.versions[0].coverURL;
      } else {
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
                  <FaImage className="text-orange-500" />
                  SSRM Thumbnail Settings
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
                {/* Background Image */}
                <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                  <h2 className='text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2'>
                    <FaCloudUploadAlt /> Background Source
                  </h2>
                  <div className="space-y-4">
                    <NativeFileUpload
                      accepts="any"
                      onFileSelect={handleFileSelect}
                      currentPath={customBackgroundPath}
                      label="Select Image or Video"
                      helperText="Use a custom background for your thumbnail"
                    />

                    {/* Preview Area */}
                    {previewSrc && (
                      <div className="relative mt-2 aspect-video rounded-lg bg-neutral-900/5 dark:bg-black/20 border border-neutral-200 dark:border-neutral-700 flex justify-center items-center overflow-hidden group">
                        <img
                          src={previewSrc.startsWith('data:') ? previewSrc : convertFileSrc(previewSrc)}
                          alt="Preview"
                          className="h-full w-full object-contain"
                        />
                        {previewSrc.startsWith('data:') && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <button
                              type="button"
                              onClick={refreshVideoPreview}
                              disabled={isLoading}
                              className={`bg-white/90 text-neutral-900 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                <div className='bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm'>
                  <h2 className='text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2'>
                    <FaMapMarkedAlt /> Map Configuration
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
                className='btn-primary px-6 py-2.5 text-sm rounded-lg shadow-lg shadow-orange-500/20 font-semibold flex items-center gap-2'
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

export default SSRMThumbnailForm;
