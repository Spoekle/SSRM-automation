import React, { FormEvent, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaCloudUploadAlt, FaMapMarkedAlt, FaCheck } from 'react-icons/fa';
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

  async function getStarRating(hash: string): Promise<StarRatings> {
    const diffs = ['1', '3', '5', '7', '9'];
    const ratings: StarRatings = { ES: '', NOR: '', HARD: '', EX: '', EXP: '' };

    for (let i = 0; i < diffs.length; i++) {
      try {
        const { data } = await axios.get(`http://localhost:3000/api/scoresaber/${hash}/${diffs[i]}`);
        const key = Object.keys(ratings)[i] as keyof StarRatings;
        ratings[key] = data.stars === 0 ? (data.qualified ? 'Qualified' : 'Unranked') : `${data.stars}`;
      } catch (error) {
        log.error(`Error fetching star rating for difficulty ${diffs[i]}:`, error);
      }
    }
    return ratings;
  }

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
      let currentStarRatings = starRatings; // Default to current ratings

      try {
        const { data } = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
        mapData = data;
        setMapInfo(mapData);
        localStorage.setItem('mapId', mapId);
        localStorage.setItem('mapInfo', JSON.stringify(mapData));
        notifyMapInfoUpdated();

        // Fetch latest star ratings at generation time
        try {
          const latestStarRatings = await getStarRating(mapData.versions[0].hash);
          setStarRatings(latestStarRatings);
          currentStarRatings = latestStarRatings; // Use the latest ratings
          localStorage.setItem('starRatings', JSON.stringify(latestStarRatings));
        } catch (starError) {
          log.error('Error fetching star ratings:', starError);
          // Continue with generation even if star ratings fetch fails
        }
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
          currentStarRatings, // Use the latest fetched ratings
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
                  <FaImage className="text-purple-500" />
                  Thumbnail Settings
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
                <div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm'>
                  <h2 className='text-base font-medium mb-2 border-b pb-1 border-neutral-200 dark:border-neutral-600 flex items-center gap-1.5'>
                    <FaCloudUploadAlt className="text-purple-500" /> Background Image
                  </h2>
                  <FileUploadSection
                    file={file}
                    setFile={setFile}
                  />
                </div>

                {/* Map Details */}
                <div className='bg-white dark:bg-neutral-700 p-3 rounded-xl shadow-sm'>
                  <h2 className='text-base font-medium mb-2 border-b pb-1 border-neutral-200 dark:border-neutral-600 flex items-center gap-1.5'>
                    <FaMapMarkedAlt className="text-purple-500" /> Map Details
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
                className='bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1.5 text-sm rounded-lg shadow-sm hover:shadow-md font-medium flex items-center gap-1.5'
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

export default ThumbnailForm;
