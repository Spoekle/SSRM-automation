import React, { FormEvent, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaVideo } from 'react-icons/fa';
import log from 'electron-log';
import MapInfoSection from './MapInfoSection';
import FileUploadSection from './FileUploadSection';
import { generateThumbnail } from '../../../../main/helper';
import { notifyMapInfoUpdated } from '../../../utils/mapEvents';
import '../../../pages/Settings/styles/CustomScrollbar.css';

interface ThumbnailFormProps {
  mapId: string;
  setMapId: (id: string) => void;
  setThumbnailFormModal: (show: boolean) => void;
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

const ThumbnailForm: React.FC<ThumbnailFormProps> = ({
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
  const [file, setFile] = useState<File | null>(null);
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
      setThumbnailFormModal(false);
    }, 300);
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    try {
      // Start the process.
      setImageSrc("");
      setThumbnailFormModal(false);
      createAlert('Generation Started...', 'info');
      setProgress('Fetching map info...', 10, true);

      // Fetch map data
      let mapData;
      try {
        const { data } = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
        mapData = data;
        setMapInfo(mapData);
        localStorage.setItem('mapId', mapId);
        localStorage.setItem('mapInfo', JSON.stringify(mapData));
        notifyMapInfoUpdated();
      } catch (error) {
        log.error('Error fetching map data:', error);
        createAlert('Error fetching map info', 'error');
        setProgress("", 0, false);
        return;
      }

      let backgroundImage = '';

      if (file) {
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';

        if (fileType === 'video') {
          setProgress('Processing video to extract a frame...', 30, true);
        } else {
          setProgress('Processing image...', 30, true);
        }

        try {
          // Create FormData and append the file
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
          createAlert('Error processing file, falling back to map cover', 'error');
          backgroundImage = mapData.versions[0].coverURL;
        }
      } else {
        createAlert('No file provided, using map cover as background', 'info');
        setProgress('Generating thumbnail with cover image', 50, true);
        backgroundImage = mapData.versions[0].coverURL;
      }

      setProgress('Generating thumbnail...', 70, true);
      let image;
      try {
        image = await generateThumbnail(
          mapData,
          chosenDiff as keyof StarRatings,
          starRatings,
          backgroundImage,
        );
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
          className={`fixed top-16 left-0 right-0 bottom-16 z-40 rounded-bl-3xl backdrop-blur-md flex justify-center items-center ${
            isOverlayVisible ? "opacity-100" : "opacity-0"
          } bg-black/20`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isOverlayVisible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="absolute left-0 top-0 h-full w-3/4 lg:w-2/3 rounded-r-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-lg overflow-y-auto custom-scrollbar"
            initial={{ x: "-100%" }}
            animate={{ x: isPanelOpen ? "0%" : "-100%" }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="z-10 sticky top-0 backdrop-blur-md bg-neutral-200/80 dark:bg-neutral-800/80 p-4 border-b border-neutral-200 dark:border-neutral-500 flex justify-between items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <motion.h2
                className="text-xl bg-neutral-100 dark:bg-neutral-600 px-3 py-2 rounded-lg font-semibold"
                whileHover={{ scale: 1.03 }}
              >
                Thumbnail Settings
              </motion.h2>
              <motion.button
                className="text-red-500 bg-neutral-300 dark:bg-neutral-700 p-2 rounded-md hover:bg-neutral-400 dark:hover:bg-neutral-600 transition duration-200"
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

            <div className="mt-4 px-4 pb-4 space-y-4">
              <form onSubmit={getMapInfo} className='space-y-6'>
                <div className="bg-white dark:bg-neutral-700 p-5 rounded-xl shadow-sm">
                  <h3 className="text-lg font-medium mb-4 border-b pb-2 border-neutral-200 dark:border-neutral-600">Map Settings</h3>
                  <MapInfoSection
                    mapId={mapId}
                    setMapId={setMapId}
                    starRatings={starRatings}
                    setStarRatings={setStarRatings}
                    chosenDiff={chosenDiff}
                    setChosenDiff={setChosenDiff}
                  />
                </div>

                <div className="bg-white dark:bg-neutral-700 p-5 rounded-xl shadow-sm">
                  <h3 className="text-lg font-medium mb-4 border-b pb-2 border-neutral-200 dark:border-neutral-600">Background Image</h3>
                  <FileUploadSection
                    file={file}
                    setFile={setFile}
                  />
                </div>

                <div className="flex justify-end mt-6">
                  <motion.button
                    type="submit"
                    className="bg-blue-500 text-white px-6 py-2.5 rounded-lg shadow-sm hover:bg-blue-600 transition duration-200 font-medium"
                    whileHover={{ scale: 1.05, boxShadow: "0px 4px 8px rgba(0,0,0,0.15)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Generate Thumbnail
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ThumbnailForm;
