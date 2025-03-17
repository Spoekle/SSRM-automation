import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import { useConfirmationModal } from '../../contexts/ConfirmationModalContext';

interface MapInfo {
  metadata: {
    songAuthorName: string;
    songName: string;
    songSubName: string;
    levelAuthorName: string;
    duration: number;
    bpm: number;
  };
  id: string;
  versions: {
    coverURL: string;
    hash: string;
  }[];
}

interface LoadedMapProps {
  mapInfo: MapInfo;
}

const LoadedMap: React.FC<LoadedMapProps> = ({ mapInfo }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const songSubName = mapInfo.metadata.songSubName ? ` ${mapInfo.metadata.songSubName}` : '';
  const { showConfirmation } = useConfirmationModal();

  // Format duration to minutes:seconds
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleClearMapData = () => {
    showConfirmation({
      title: "Clear Map Data",
      message: "Are you sure you want to clear the loaded map data? This will remove it from local storage.",
      onConfirm: () => {
        localStorage.removeItem("mapId");
        localStorage.removeItem("mapInfo");
        localStorage.removeItem("starRatings");
        localStorage.removeItem("oldStarRatings");
        window.location.reload();
      }
    });
  };

  return (
    <motion.div
      className={`fixed top-20 z-30 flex items-center shadow-lg ${isCollapsed ? 'left-0' : 'left-4'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, x: isCollapsed ? -225 : 0 }}
      transition={{ duration: 0.3, type: "spring" }}
    >
      {/* Collapse toggle button */}
      <motion.button
        className="bg-blue-500 h-16 w-5 rounded-r-md flex items-center justify-center cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
        whileHover={{ width: 10 }}
      >
        {isCollapsed ? <FaChevronRight size={10} color="white" /> : <FaChevronLeft size={10} color="white" />}
      </motion.button>

      {/* Map info content */}
      <motion.div
        className="bg-neutral-300 dark:bg-neutral-800 p-3 rounded-r-lg flex items-center space-x-2 w-[225px]"
      >
        <motion.img
          src={mapInfo.versions[0].coverURL}
          alt="Map cover"
          className="w-12 h-12 object-cover rounded-md hover:cursor-pointer"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
          title='Open map on BeatSaver'
          onClick={() => window.open(`https://beatsaver.com/maps/${mapInfo.id}`, '_blank')}
        />
        <div className="flex-grow overflow-hidden">
          <motion.h3
            className="font-bold text-sm truncate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {mapInfo.metadata.songName}{songSubName}
          </motion.h3>
          <motion.p
            className="text-xs text-neutral-600 dark:text-neutral-400 truncate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {mapInfo.metadata.songAuthorName} | {mapInfo.metadata.levelAuthorName}
          </motion.p>
          <motion.div
            className="flex space-x-2 text-xs text-neutral-500 dark:text-neutral-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span>{formatDuration(mapInfo.metadata.duration)}</span>
            <span>•</span>
            <span>{mapInfo.metadata.bpm}BPM</span>
          </motion.div>
        </div>
        <motion.button
          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"
          onClick={handleClearMapData}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          title="Clear map data"
        >
          <FaTimes size={16} />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default LoadedMap;
