import React, { FormEvent } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Switch from '@mui/material/Switch';
import { generateCard } from '../../../main/helper';

interface CardFormProps {
  mapId: string;
  setMapId: (id: string) => void;
  starRatings: StarRatings;
  setStarRatings: (ratings: StarRatings) => void;
  setCardFormModal: (show: boolean) => void;
  setMapInfo: (info: any) => void;
  setImageSrc: (src: string) => void;
}

interface StarRatings {
  ES: string;  // Temporarily store the input as a string
  NOR: string;
  HARD: string;
  EXP: string;
  EXP_PLUS: string;
}

const CardForm: React.FC<CardFormProps> = ({
  mapId,
  setMapId,
  starRatings,
  setStarRatings,
  setCardFormModal,
  setMapInfo,
  setImageSrc
}) => {
  const [songName, setSongName] = React.useState('');
  const [useBackground, setUseBackground] = React.useState(true);

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLDivElement).classList.contains('modal-overlay')) {
      setCardFormModal(false);
    }
  };

  const handleSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseBackground(event.target.checked);
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
        const image = await generateCard(data, starRatings, useBackground);
        setImageSrc(image);

        console.log(data);
        setCardFormModal(false);
    } catch (error) {
        console.error('Error fetching map info:', error);
    }
  };

  // Get star ratings from ScoreSaber API for 1 3 5 7 9 difficulties
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
          starRatings[key] = 'Unranked';
        } else {
          starRatings[key] = data.stars;
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
      getStarRating(data.versions[0].hash).then((starRatings) => {
        setStarRatings(starRatings);
      });
      return data.metadata.songName;
    } catch (error) {
      console.error('Error fetching map info:', error);
    }
  }

  // Utility to get numeric rating or default to 0
  const getNumericRating = (rating: string) => {
    const numericRating = parseFloat(rating);
    return isNaN(numericRating) ? 0 : numericRating;
  };

  // Calculate total rating value and individual widths as percentage of the total
  const ratings = {
    ES: getNumericRating(starRatings.ES),
    NOR: getNumericRating(starRatings.NOR),
    HARD: getNumericRating(starRatings.HARD),
    EXP: getNumericRating(starRatings.EXP),
    EXP_PLUS: getNumericRating(starRatings.EXP_PLUS),
  };
  const totalRating = Object.values(ratings).reduce((sum, value) => sum + value, 0);

  // Render the star ratings bar
  const renderRatingsBar = () => {
    const colors = {
      ES: 'bg-green-600',
      NOR: 'bg-blue-500',
      HARD: 'bg-orange-500',
      EXP: 'bg-red-600',
      EXP_PLUS: 'bg-purple-700',
    };

    let accumulatedWidth = 0;
    return (
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        {Object.entries(ratings).map(([difficulty, rating]) => {
          const percentage = totalRating > 0 ? (rating / totalRating) * 100 : 0; // Calculate percentage width
          const colorClass = colors[difficulty as keyof typeof colors];

          const style = {
            width: `${percentage}%`,
            position: 'absolute',
            height: '100%',
            left: `${accumulatedWidth}%`,
            transition: 'width 0.5s ease', // Animation duration
          };

          accumulatedWidth += percentage;
          return <div key={difficulty} className={`${colorClass} absolute`} style={style as React.CSSProperties} />;
        })}
      </div>
    );
  };

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
          <h1 className='text-2xl font-bold'>Get Info</h1>
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
              <div className='flex flex-col text-center items-center'>
                <label>Background:</label>
                <Switch checked={useBackground} onChange={handleSwitch} defaultChecked className='mt-1' />
              </div>
            </div>
            <div className='flex flex-col text-center'>
              <h1 className='text-2xl font-bold'>Star Ratings:</h1>
              <p className='text-lg'>Enter the star ratings for each difficulty</p>
              {renderRatingsBar()}
              <div className='grid grid-cols-5 gap-2 my-4'>
                <div className='flex flex-col bg-green-600 rounded px-2 py-1'>
                  <label className='font-bold'>Easy</label>
                  {starRatings.ES === '' ?
                   <h1 className='text-lg'>-</h1>
                   :
                   <h1 className='text-lg'>{starRatings.ES} ★</h1>}
                </div>
                <div className='flex flex-col bg-blue-500 rounded px-2 py-1'>
                  <label className='font-bold'>Normal</label>
                  {starRatings.NOR === '' ?
                   <h1 className='text-lg'>-</h1>
                   :
                   <h1 className='text-lg'>{starRatings.NOR} ★</h1>}
                </div>
                <div className='flex flex-col bg-orange-500 rounded px-2 py-1'>
                  <label className='font-bold'>Hard</label>
                  {starRatings.HARD === '' ?
                   <h1 className='text-lg'>-</h1>
                   :
                   <h1 className='text-lg'>{starRatings.HARD} ★</h1>}
                </div>
                <div className='flex flex-col bg-red-600 rounded px-2 py-1'>
                  <label className='font-bold'>Expert</label>
                  {starRatings.EXP === '' ?
                   <h1 className='text-lg'>-</h1>
                   :
                   <h1 className='text-lg'>{starRatings.EXP} ★</h1>}
                </div>
                <div className='flex flex-col bg-purple-700 rounded px-2 py-1'>
                  <label className='font-bold'>Expert+</label>
                  {starRatings.EXP_PLUS === '' ?
                   <h1 className='text-lg'>-</h1>
                   :
                   <h1 className='text-lg'>{starRatings.EXP_PLUS} ★</h1>}
                </div>
              </div>
            </div>
          </div>
          <div className='flex flex-col'>
            <button type="submit" className='bg-blue-500 text-white p-2 rounded'>Generate</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CardForm;
