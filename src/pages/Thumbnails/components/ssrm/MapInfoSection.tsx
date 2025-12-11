import React, { useState } from 'react';
import log from '../../../../utils/log';
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

  // Helper to handle mapId changes - prop setMapId handles state update
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
      // Storage update for STAR_RATINGS is handled by the useStarRatings hook in parent
      // storage.set(STORAGE_KEYS.STAR_RATINGS, ratings); 
    } catch (error) {
      log.error('Error fetching map info or star ratings:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const updateStarRating = (diff: keyof StarRatings, value: string) => {
    const newRatings = { ...starRatings, [diff]: value };
    setStarRatings(newRatings);
    // storage.set(STORAGE_KEYS.STAR_RATINGS, newRatings); // Handled by hook
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
            className="flex-1 px-3 py-1.5 text-sm border bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:text-white transition-shadow"
          />
          <motion.button
            type="button"
            onClick={fetchStarRatings}
            disabled={isFetching}
            className="absolute right-1 bg-orange-500 text-white px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 shadow-sm hover:bg-orange-600 transition-colors"
            whileHover={!isFetching ? { scale: 1.05 } : {}}
            whileTap={!isFetching ? { scale: 0.95 } : {}}
          >
            {isFetching ? <FaSync className="animate-spin" /> : <FaStar />}
            <span className="hidden sm:inline">{isFetching ? 'Fetching...' : 'Fetch'}</span>
          </motion.button>
        </div>
        {songName && (
          <motion.p
            className="mt-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded inline-block border border-green-200 dark:border-green-800/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Found: {songName}
          </motion.p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className='block mb-1 text-sm text-neutral-700 dark:text-neutral-200 font-medium'>Difficulty:</label>
          <select
            className="w-full px-3 py-1.5 text-sm border bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:text-white transition-shadow"
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
          <div className="flex items-center mb-1">
            <FaStar className="text-yellow-500 mr-2" />
            <label className='text-sm text-neutral-700 dark:text-neutral-200 font-medium'>Star Rating:</label>
          </div>
          <input
            type="text"
            value={starRatings[chosenDiff as keyof StarRatings]}
            onChange={(e) => updateStarRating(chosenDiff as keyof StarRatings, e.target.value)}
            className="w-full px-3 py-1.5 text-sm border bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:text-white transition-shadow"
            placeholder="Enter star rating"
          />
        </div>
      </div>
    </div>
  );
};

export default MapInfoSection;
