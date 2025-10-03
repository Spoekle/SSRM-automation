import React, { useState } from 'react';
import log from 'electron-log';
import { FaStar, FaSync } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getStarRating } from '../../../../api/scoresaber';
import { fetchMapData } from '../../../../api/beatsaver';
import { storage, STORAGE_KEYS } from '../../../../utils/storage';
import { handleError } from '../../../../utils/errorHandler';
import type { StarRatings } from '../../../../types';



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
  const [songName, setSongName] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  const handleMapIdChange = (id: string) => {
    setMapId(id);
  };



  const fetchStarRatings = async () => {
    if (!mapId) {
      return;
    }

    setIsFetching(true);
    try {
      const data = await fetchMapData(mapId);
      setSongName(data.metadata.songName);

      const ratings = await getStarRating(data.versions[0].hash);
      setStarRatings(ratings);
      storage.set(STORAGE_KEYS.STAR_RATINGS, ratings);
    } catch (error) {
      log.error('Error fetching map info or star ratings:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const updateStarRating = (diff: keyof StarRatings, value: string) => {
    const newRatings = { ...starRatings, [diff]: value };
    setStarRatings(newRatings);
    storage.set(STORAGE_KEYS.STAR_RATINGS, newRatings);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className='block mb-1 text-sm text-neutral-700 dark:text-neutral-200 font-medium'>Map ID:</label>
        <div className="relative flex space-x-2 items-center">
          <input
            type="text"
            value={mapId}
            onChange={(e) => handleMapIdChange(e.target.value)}
            placeholder="Enter map ID..."
            className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
          />
          <motion.button
            type="button"
            onClick={fetchStarRatings}
            disabled={isFetching}
            className="absolute right-0 bg-orange-500 text-white px-3 py-1.5 text-sm rounded-lg flex items-center gap-1"
            whileHover={!isFetching ? { scale: 1.05 } : {}}
            whileTap={!isFetching ? { scale: 0.95 } : {}}
          >
            {isFetching ? <FaSync className="animate-spin" size={12} /> : <FaStar size={12} />}
            <span className="hidden sm:inline">{isFetching ? 'Fetching...' : 'Fetch Ratings'}</span>
          </motion.button>
        </div>
        {songName && (
          <div className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium">
            {songName}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className='block mb-1 text-sm text-neutral-700 dark:text-neutral-200 font-medium'>Difficulty:</label>
          <select
            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
            onChange={(e) => {
              setChosenDiff(e.target.value);
              storage.setString(STORAGE_KEYS.CHOSEN_DIFF, e.target.value);
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
            <FaStar className="text-yellow-500 mr-1.5" />
            <label className='text-sm text-neutral-700 dark:text-neutral-200 font-medium'>Star Rating:</label>
          </div>
          <input
            type="text"
            value={starRatings[chosenDiff as keyof StarRatings]}
            onChange={(e) => updateStarRating(chosenDiff as keyof StarRatings, e.target.value)}
            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-300 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white mt-1"
            placeholder="Enter star rating"
          />
        </div>
      </div>
    </div>
  );
};

export default MapInfoSection;
