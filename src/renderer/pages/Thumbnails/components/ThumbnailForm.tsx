import React, { FormEvent } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { generateThumbnail } from '../../../../main/helper';
import { FaTimes } from 'react-icons/fa';

interface ThumbnailFormProps {
  mapId: string;
  setMapId: (id: string) => void;
  setThumbnailFormModal: (show: boolean) => void;
  setMapInfo: (info: any) => void;
  setImageSrc: (src: string) => void;
  starRatings: StarRatings;
  setStarRatings: (ratings: StarRatings) => void;
}

interface StarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EXP: string;
  EXP_PLUS: string;
}

const ThumbnailForm: React.FC<ThumbnailFormProps> = ({
  mapId,
  setMapId,
  setThumbnailFormModal,
  setMapInfo,
  setImageSrc,
  starRatings,
  setStarRatings
}) => {
  const [songName, setSongName] = React.useState('');
  const [chosenDiff, setChosenDiff] = React.useState('ES');
  const [background, setBackground] = React.useState<string | ArrayBuffer | null>('');
  const [video, setVideo] = React.useState<string | ArrayBuffer | null>('');
  const [backgroundFilename, setBackgroundFilename] = React.useState('');
  const [videoFilename, setVideoFilename] = React.useState('');
  const [imageLoading, setImageLoading] = React.useState(false);
  const [videoLoading, setVideoLoading] = React.useState(false);

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((e.target as HTMLDivElement).classList.contains('modal-overlay'))
      setThumbnailFormModal(false);
  };

  // Modified readFile to accept an optional loading setter.
  const readFile = (
    file: File,
    setter: (data: string | ArrayBuffer | null) => void,
    setLoading?: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (setLoading) setLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result);
      if (setLoading) setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChangeWithName = (
    e: React.ChangeEvent<HTMLInputElement>,
    dataSetter: (data: string | ArrayBuffer | null) => void,
    nameSetter: (name: string) => void,
    setLoading?: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      nameSetter(file.name);
      readFile(file, dataSetter, setLoading);
    }
  };

  const handleDropWithName = (
    e: React.DragEvent<HTMLDivElement>,
    dataSetter: (data: string | ArrayBuffer | null) => void,
    nameSetter: (name: string) => void,
    setLoading?: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      const file = e.dataTransfer.files[0];
      nameSetter(file.name);
      readFile(file, dataSetter, setLoading);
    }
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    try {
      // Fetch map info.
      const { data: mapData } = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      setMapInfo(mapData);
      localStorage.setItem('mapId', mapId);
      localStorage.setItem('mapInfo', JSON.stringify(mapData));

      // Send image and video to backend to get a processed background image.
      const response = await axios.post('http://localhost:3000/api/generate-thumbnail', {
        background,
        video
      });
      const processedBackground = response.data.thumbnail;

      // Use the processed background in the thumbnail generation.
      const image = await generateThumbnail(
        mapData,
        chosenDiff as keyof StarRatings,
        starRatings,
        processedBackground,
      );

      setImageSrc(image);
      setThumbnailFormModal(false);
    } catch (error) {
      console.error('Error fetching map info or generating thumbnail:', error);
    }
  };

  async function getStarRating(hash: string): Promise<StarRatings> {
    const diffs = ['1', '3', '5', '7', '9'];
    const ratings: StarRatings = { ES: '', NOR: '', HARD: '', EXP: '', EXP_PLUS: '' };

    for (let i = 0; i < diffs.length; i++) {
      try {
        const { data } = await axios.get(`http://localhost:3000/api/scoresaber/${hash}/${diffs[i]}`);
        const key = Object.keys(ratings)[i] as keyof StarRatings;
        ratings[key] = data.stars === 0 ? (data.qualified ? 'Qualified' : 'Unranked') : `${data.stars} ★`;
        localStorage.setItem('starRatings', JSON.stringify(ratings));
      } catch (error) {
        console.error(error);
      }
    }
    return ratings;
  }

  const fetchName = async (id: string) => {
    if (!id) {
      setSongName('');
      return;
    }
    setMapId(id);
    try {
      const { data } = await axios.get(`https://api.beatsaver.com/maps/id/${id}`);
      setSongName(data.metadata.songName);
      getStarRating(data.versions[0].hash).then(setStarRatings);
      return data.metadata.songName;
    } catch (error) {
      console.error('Error fetching map info:', error);
    }
  };

  // Functions to clear the inputs (which also show both upload fields again)
  const clearImage = () => {
    setBackground('');
    setBackgroundFilename('');
  };

  const clearVideo = () => {
    setVideo('');
    setVideoFilename('');
  };

  return ReactDOM.createPortal(
    <div
      className="modal-overlay fixed inset-0 bg-white/10 backdrop-blur-lg flex justify-center items-center z-50 p-2"
      onClick={handleClickOutside}
    >
      <div className="relative modal-content bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 p-2 rounded-lg w-full max-w-lg">
        <button
          className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600 rounded-md p-1 transition duration-200 text-sm"
          onClick={() => setThumbnailFormModal(false)}
        >
          <FaTimes />
        </button>
        <form onSubmit={getMapInfo} className="space-y-2">
          <div className="flex flex-col">
            <div className="relative w-full bg-white dark:bg-neutral-800 p-2 rounded-lg shadow">
              <h2 className="text-base font-semibold mb-2">Map Info</h2>
              <label className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Map ID:</label>
              <input
                type="text"
                value={mapId}
                onChange={(e) => fetchName(e.target.value)}
                className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white text-sm"
              />
              <label className="block mb-1 mt-2 text-gray-700 dark:text-gray-200 text-sm">Difficulty:</label>
              <select
                className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white text-sm"
                onChange={(e) => setChosenDiff(e.target.value)}
              >
                <option value="ES">Easy</option>
                <option value="NOR">Normal</option>
                <option value="HARD">Hard</option>
                <option value="EXP">Expert</option>
                <option value="EXP_PLUS">Expert+</option>
              </select>
            </div>
          </div>
          <div className="flex flex-row gap-2">
            {/* Show image upload if no video is loaded; if a video exists, hide image input */}
            { !video && (
              <div className="w-full bg-white dark:bg-neutral-800 p-2 rounded-lg shadow relative">
                <label className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Upload Image:</label>
                <div
                  className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-blue-300 rounded-md cursor-pointer hover:bg-blue-100 transition duration-200 text-sm"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropWithName(e, setBackground, setBackgroundFilename, setImageLoading)}
                  onClick={() => document.getElementById('imageInput')?.click()}
                >
                  <span className="text-sm text-gray-600">
                    {backgroundFilename ? backgroundFilename : 'Drag & drop image here or click to select'}
                  </span>
                  <input
                    id="imageInput"
                    type="file"
                    accept=".png, .jpg, .jpeg, .webp"
                    onChange={(e) => handleFileChangeWithName(e, setBackground, setBackgroundFilename, setImageLoading)}
                    className="hidden"
                  />
                  {imageLoading && (
                    <div className="mt-1 text-xs text-blue-600 text-center">Uploading…</div>
                  )}
                </div>
                { backgroundFilename && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-gray-300 hover:bg-gray-400 rounded-full p-1 text-xs text-gray-700"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            )}
            {/* Show video upload if no image is loaded; if an image exists, hide video input */}
            { !background && (
              <div className="w-full bg-white dark:bg-neutral-800 p-2 rounded-lg shadow relative">
                <label className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Upload Video:</label>
                <div
                  className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-blue-300 rounded-md cursor-pointer hover:bg-blue-100 transition duration-200 text-sm"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropWithName(e, setVideo, setVideoFilename, setVideoLoading)}
                  onClick={() => document.getElementById('videoInput')?.click()}
                >
                  <span className="text-sm text-gray-600">
                    {videoFilename ? videoFilename : 'Drag & drop video here or click to select'}
                  </span>
                  <input
                    id="videoInput"
                    type="file"
                    accept=".mp4, .avi, .mov, .webp"
                    onChange={(e) => handleFileChangeWithName(e, setVideo, setVideoFilename, setVideoLoading)}
                    className="hidden"
                  />
                  {videoLoading && (
                    <div className="mt-1 text-xs text-blue-600 text-center">Uploading…</div>
                  )}
                </div>
                { videoFilename && (
                  <button
                    type="button"
                    onClick={clearVideo}
                    className="absolute top-2 right-2 bg-gray-300 hover:bg-gray-400 rounded-full p-1 text-xs text-gray-700"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="w-full md:w-auto bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600 transition duration-200 text-sm"
            >
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ThumbnailForm;
