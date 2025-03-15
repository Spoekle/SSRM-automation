import React from 'react';
import axios from 'axios';
import log from 'electron-log';

interface StarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EX: string;
  EXP: string;
}

interface MapInfoSectionProps {
  mapId: string;
  setMapId: (id: string) => void;
  starRatings: StarRatings;
  setStarRatings: (ratings: StarRatings) => void;
  chosenDiff: string;
  setChosenDiff: (diff: string) => void;
}

const MapInfoSection: React.FC<MapInfoSectionProps> = ({
  mapId,
  setMapId,
  starRatings,
  setStarRatings,
  chosenDiff,
  setChosenDiff
}) => {
  const [songName, setSongName] = React.useState('');

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
      log.error('Error fetching map info:', error);
    }
  };

  async function getStarRating(hash: string): Promise<StarRatings> {
    const diffs = ['1', '3', '5', '7', '9'];
    const ratings: StarRatings = { ES: '', NOR: '', HARD: '', EX: '', EXP: '' };

    for (let i = 0; i < diffs.length; i++) {
      try {
        const { data } = await axios.get(`http://localhost:3000/api/scoresaber/${hash}/${diffs[i]}`);
        const key = Object.keys(ratings)[i] as keyof StarRatings;
        ratings[key] = data.stars === 0 ? (data.qualified ? 'Qualified' : 'Unranked') : `${data.stars}`;
        localStorage.setItem('starRatings', JSON.stringify(ratings));
      } catch (error) {
        log.error(error);
      }
    }
    return ratings;
  }

  const updateStarRating = (diff: keyof StarRatings, value: string) => {
    const newRatings = { ...starRatings, [diff]: value };
    setStarRatings(newRatings);
    localStorage.setItem('starRatings', JSON.stringify(newRatings));
  };

  return (
    <div className="relative w-full bg-white dark:bg-neutral-800 p-2 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-2">Map Info</h2>
      <div className='flex justify-between space-x-2'>
        <div>
          <label className='block mb-2 text-gray-700 dark:text-gray-200'>Map ID:</label>
          <input
            type="text"
            value={mapId}
            onChange={(e) => fetchName(e.target.value)}
            className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white text-sm"
          />
          {songName && (
            <div className="mt-1 text-xs text-gray-500 italic">
              {songName}
            </div>
          )}
        </div>
        <div>
          <div>
            <label className='block mb-2 text-gray-700 dark:text-gray-200'>Difficulty:</label>
            <select
              className="w-full px-2 py-1 border rounded-md rounded-br-none focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white text-sm"
              onChange={(e) => {
                setChosenDiff(e.target.value);
                localStorage.setItem('chosenDiff', e.target.value)

               }}
              value={chosenDiff}
            >
              <option value="ES">Easy</option>
              <option value="NOR">Normal</option>
              <option value="HARD">Hard</option>
              <option value="EX">Expert</option>
              <option value="EXP">Expert+</option>
            </select>
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="text-sm font-semibold mr-2">Star Rating:</h3>
              <div className="flex-1">
                <input
                  type="text"
                  value={starRatings[chosenDiff as keyof StarRatings]}
                  onChange={(e) => updateStarRating(chosenDiff as keyof StarRatings, e.target.value)}
                  className="w-full px-2 py-1 border text-center rounded-md rounded-t-none focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white text-sm"
                  placeholder="Enter star rating"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapInfoSection;
