import React, { FormEvent } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { generateThumbnail } from '../../../main/helper';

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
        {songName &&
          <div className='absolute right-0 mr-8 text-right'>
            <h1 className='text-2xl font-bold'>Chosen Song:</h1>
            <h1 className='text-lg font-semibold'>{songName}</h1>
          </div>
        }
        <form onSubmit={getMapInfo}>
          <h1 className='text-2xl font-bold'>Thumbnail Form</h1>
          <div className='flex flex-col justify-center items-center mt-2'>
            <div className='flex gap-8 text-center'>
            <div className='flex flex-col text-center'>
              <label>Map ID:</label>
              <input
                type='text'
                value={mapId}
                onChange={(e) => fetchName(e.target.value)}
                className='w-24 border rounded p-2 text-neutral-950 mt-1'
              />
            </div>
            <div className='flex flex-col text-center'>
              <label>Difficulty:</label>
              <select
                className='w-24 border rounded p-2 text-neutral-950 mt-1'
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
          </div>
          <div className='flex flex-col text-center items-center mt-2'>
            <label>Background:</label>
            <input
              type='file'
              onChange={handleBackgroundChange}
              className='w-24 border rounded p-2 text-neutral-950 mt-1'
            />
          </div>
          <div className='flex flex-col mt-4'>
            <button type="submit" className='bg-blue-500 text-white p-2 rounded'>Generate</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ThumbnailForm;
