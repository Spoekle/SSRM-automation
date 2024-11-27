import React, { FormEvent } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { generateThumbnail } from '../../../main/helper';
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
  starRatings,
  setStarRatings,
  setMapInfo,
  setImageSrc
}) => {
  const [songName, setSongName] = React.useState('');
  const [chosenDiff, setChosenDiff] = React.useState('ES');
  const [background, setBackground] = React.useState<string | ArrayBuffer | null>('');

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLDivElement).classList.contains('modal-overlay')) {
      setThumbnailFormModal(false);
    }
  };

  const handleBackgroundChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackground(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    try {
        const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
        const data = response.data;
        setMapInfo(data);
        localStorage.setItem('mapId', `${mapId}`);
        localStorage.setItem('mapInfo', JSON.stringify(data));

        // Generate the image and set it to state
        const image = await generateThumbnail(data, chosenDiff as keyof StarRatings, starRatings, background);
        setImageSrc(image);

        console.log(data);
        setThumbnailFormModal(false);
    } catch (error) {
        console.error('Error fetching map info:', error);
    }
  };

  // Get star ratings from ScoreSaber API for difficulty
  async function getStarRating(hash: string): Promise<StarRatings> {
    let diffs = ['1', '3', '5', '7', '9'];
    let starRatings: StarRatings = {
      ES: '',
      NOR: '',
      HARD: '',
      EXP: '',
      EXP_PLUS: ''
    };

    for (let i = 0; i < diffs.length; i++) {
      try {
        const response = await axios.get(`http://localhost:3000/api/scoresaber/${hash}/${diffs[i]}`);
        const data = response.data;
        const key = Object.keys(starRatings)[i] as keyof StarRatings;
        if (data.stars === 0) {
          if (data.qualified === true) {
            starRatings[key] = 'Qualified';
          } else {
            starRatings[key] = 'Unranked';
          }
        } else {
          starRatings[key] = data.stars + ' ★';
        }
        localStorage.setItem('starRatings', JSON.stringify(starRatings));
        console.log(starRatings);
      } catch (error) {
        console.error(error);
      }
    }
    return starRatings;
  }

  const fetchName = async (mapId: string) => {
    if (mapId === '') (
      setSongName('')
    )
    setMapId(mapId)
    try {
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      setSongName(data.metadata.songName);
      getStarRating(data.versions[0].hash).then((newStarRatings) => {
        setStarRatings(newStarRatings);
      });
      return data.metadata.songName;
    } catch (error) {
      console.error('Error fetching map info:', error);
    }
  }

  return ReactDOM.createPortal(
    <div
      className="modal-overlay fixed inset-0 bg-white/10 backdrop-blur-lg flex justify-center items-center z-50 rounded-3xl animate-fade animate-duration-200"
      onClick={handleClickOutside}
    >
      <div className="relative modal-content bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 p-6 rounded-lg animate-jump-in animate-duration-300">
        <div className='absolute top-8 right-8 z-30 text-center items-center text-lg'>
          <button
            className='bg-red-500 text-white hover:bg-red-600 rounded-md p-2 transition duration-200'
            onClick={() => setThumbnailFormModal(false)}
          >
            <FaTimes/>
          </button>
        </div>
        <form onSubmit={getMapInfo} className='space-y-6'>
          <div className='flex flex-col md:flex-row md:space-x-6'>
            <div className='relative w-full bg-white dark:bg-neutral-800 p-4 rounded-lg shadow'>
              <h2 className='text-xl font-semibold mb-4'>Map Info</h2>
              <label className='block mb-2 text-gray-700 dark:text-gray-200'>Map ID:</label>
              <input
              type='text'
              value={mapId}
              onChange={(e) => fetchName(e.target.value)}
              className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white'
              />
              <label className='block mb-2 text-gray-700 dark:text-gray-200'>Difficulty:</label>
                <select
                  className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white'
                  onChange={(e) => setChosenDiff(e.target.value)}
                >
                  <option value='ES'>Easy</option>
                  <option value='NOR'>Normal</option>
                  <option value='HARD'>Hard</option>
                  <option value='EXP'>Expert</option>
                  <option value='EXP_PLUS'>Expert+</option>
                </select>
            </div>
          </div>
          <div className='w-full bg-white dark:bg-neutral-800 p-4 rounded-lg shadow'>
            <label className='block mb-2 text-gray-700 dark:text-gray-200'>Upload Background:</label>
            <label className='flex items-center justify-center w-full px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 transition duration-200'>
            <span>Select File</span>
            <input
              type="file"
              accept=".png, .jpg, .jpeg, .webp"
              onChange={handleBackgroundChange}
              className='hidden'
            />
            </label>
          </div>
          <div className='flex flex-col md:flex-row justify-end items-center'>
            <button type="submit" className='w-full md:w-auto bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-200'>
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
