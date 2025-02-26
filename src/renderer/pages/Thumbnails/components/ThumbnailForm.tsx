import React, { FormEvent, useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';
import MapInfoSection from './MapInfoSection';
import FileUploadSection from './FileUploadSection';
import { generateThumbnail } from '../../../../main/helper';

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
  createAlerts: (message: string, type: 'success' | 'error' | 'alert') => void;
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
  createAlerts,
  progress: setProgress,
}) => {
  const [file, setFile] = useState<File | null>(null);

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((e.target as HTMLDivElement).classList.contains('modal-overlay'))
      setThumbnailFormModal(false);
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    try {
      // Start the process.
      setImageSrc("");
      setThumbnailFormModal(false);
      createAlerts('Generation Started...', 'alert');
      setProgress('Fetching map info...', 10, true);

      // Fetch map data
      let mapData;
      try {
        const { data } = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
        mapData = data;
        setMapInfo(mapData);
        localStorage.setItem('mapId', mapId);
        localStorage.setItem('mapInfo', JSON.stringify(mapData));
      } catch (error) {
        console.error('Error fetching map data:', error);
        createAlerts('Error fetching map info', 'error');
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
          console.error('Error processing file:', error);
          createAlerts('Error processing file, falling back to map cover', 'error');
          backgroundImage = mapData.versions[0].coverURL;
        }
      } else {
        createAlerts('No file provided, using map cover as background', 'alert');
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
        console.error('Error generating thumbnail:', error);
        createAlerts('Error generating thumbnail', 'error');
        setProgress("", 0, false);
        return;
      }

      setProgress('Thumbnail generated', 100, true);
      setImageSrc(image);
      setProgress("", 0, false);
      createAlerts('Thumbnail generated successfully', 'success');

    } catch (error) {
      console.error('Unhandled error in getMapInfo:', error);
      createAlerts('An unexpected error occurred', 'error');
      setProgress("", 0, false);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="modal-overlay fixed inset-0 bg-black/20 dark:bg-white/10 backdrop-blur-xl rounded-3xl flex justify-center items-center z-50 p-2 animate-fade animate-duration-300"
      onMouseDown={handleClickOutside}
    >
      <div className="relative modal-content bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 p-6 rounded-lg w-full max-w-lg animate-jump-in animate-duration-300">
        <div className='absolute z-30 top-8 right-8 text-center items-center text-lg'>
          <button
            className='bg-red-500 text-white hover:bg-red-600 rounded-md p-2 transition duration-200'
            onClick={() => setThumbnailFormModal(false)}
          >
            <FaTimes/>
          </button>
        </div>

        <form onSubmit={getMapInfo} className="space-y-4">
          <MapInfoSection
            mapId={mapId}
            setMapId={setMapId}
            starRatings={starRatings}
            setStarRatings={setStarRatings}
            chosenDiff={chosenDiff}
            setChosenDiff={setChosenDiff}
          />

          <FileUploadSection
            file={file}
            setFile={setFile}
          />

          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 text-sm"
            >
              Generate Thumbnail
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ThumbnailForm;
