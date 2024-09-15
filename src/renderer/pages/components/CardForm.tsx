import React, { FormEvent } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
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

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLDivElement).classList.contains('modal-overlay')) {
      setCardFormModal(false);
    }
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    try {
        const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
        const data = response.data;
        setMapInfo(data);
        localStorage.setItem('mapId', `${mapId}`);
        localStorage.setItem('mapInfo', JSON.stringify(data)); // Serialize the mapInfo object
        localStorage.setItem('starRatings', JSON.stringify(starRatings)); // Serialize the starRatings object

        // Generate the image and set it to state
        const image = await generateCard(data, starRatings);
        setImageSrc(image);

        console.log(data);
        setCardFormModal(false);
    } catch (error) {
        console.error('Error fetching map info:', error);
    }
};

  async function getStarRating(hash: string): Promise<StarRatings> {
    const response = await fetch(`https://scoresaber.com/api/leaderboard/by-hash/${hash}/info?difficulty=1`);
    if (!response.ok) throw new Error('Failed to fetch star ratings');
    const data = await response.json();
    return {
        ES: data.stars,
        NOR: data.stars,
        HARD: data.stars,
        EXP: data.stars,
        EXP_PLUS: data.stars,
    };
  }

  // Function to update the star ratings and allow decimal input as strings
  const handleStarRatingChange = (difficulty: keyof StarRatings, value: string) => {
    // Allow only numbers and a single decimal point or empty input
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setStarRatings({
        ...starRatings,
        [difficulty]: value // Store the string temporarily
      });
    }
  };

  const fetchName = async (mapId: string) => {
    if (mapId === '') (
      setSongName('')
    )
    setMapId(mapId)
    try {
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      setSongName(data.metadata.songName);
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
          return <div key={difficulty} className={`${colorClass} absolute`} style={style} />;
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
              <h1 className='text-2xl font-bold'>Star Ratings:</h1>
              <p className='text-lg'>Enter the star ratings for each difficulty</p>
              {renderRatingsBar()}
              <div className='grid grid-cols-5 gap-2'>
                <div className='flex flex-col'>
                  <label>Easy</label>
                  <input
                    type='text'
                    value={starRatings.ES}
                    onChange={(e) => handleStarRatingChange('ES', e.target.value)}
                    className='w-24 border rounded p-2 text-neutral-950 mt-1'
                    placeholder="Easy"
                  />
                </div>
                <div className='flex flex-col'>
                  <label>Normal</label>
                  <input
                    type='text'
                    value={starRatings.NOR}
                    onChange={(e) => handleStarRatingChange('NOR', e.target.value)}
                    className='w-24 border rounded p-2 text-neutral-950 mt-1'
                    placeholder="Normal"
                  />
                </div>
                <div className='flex flex-col'>
                  <label>Hard</label>
                  <input
                    type='text'
                    value={starRatings.HARD}
                    onChange={(e) => handleStarRatingChange('HARD', e.target.value)}
                    className='w-24 border rounded p-2 text-neutral-950 mt-1'
                    placeholder="Hard"
                  />
                </div>
                <div className='flex flex-col'>
                  <label>Expert</label>
                  <input
                    type='text'
                    value={starRatings.EXP}
                    onChange={(e) => handleStarRatingChange('EXP', e.target.value)}
                    className='w-24 border rounded p-2 text-neutral-950 mt-1'
                    placeholder="Expert"
                  />
                </div>
                <div className='flex flex-col'>
                  <label>Expert+</label>
                  <input
                    type='text'
                    value={starRatings.EXP_PLUS}
                    onChange={(e) => handleStarRatingChange('EXP_PLUS', e.target.value)}
                    className='w-24 border rounded p-2 text-neutral-950 mt-1'
                    placeholder="Expert+"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className='flex flex-col'>
            <button type="submit" className='bg-blue-500 text-white p-2 rounded mt-2'>Generate</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CardForm;
