import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronUp, FaChevronDown, FaTimes, FaMusic, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { useConfirmationModal } from '../contexts/ConfirmationModalContext';

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

const GlobalLoadedMap: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null);
  const { showConfirmation } = useConfirmationModal();

  useEffect(() => {
    const loadMapInfo = () => {
      const storedMapInfo = localStorage.getItem('mapInfo');
      if (storedMapInfo) {
        try {
          setMapInfo(JSON.parse(storedMapInfo));
        } catch (error) {
          console.error('Failed to parse map info:', error);
        }
      }
    };

    loadMapInfo();

    window.addEventListener('storage', loadMapInfo);

    const handleMapInfoUpdate = () => loadMapInfo();
    window.addEventListener('mapinfo-updated', handleMapInfoUpdate);

    return () => {
      window.removeEventListener('storage', loadMapInfo);
      window.removeEventListener('mapinfo-updated', handleMapInfoUpdate);
    };
  }, []);

  const handleClearMapData = () => {
    showConfirmation({
      title: "Clear Map Data",
      message: "Are you sure you want to clear the loaded map data? This will remove it from local storage.",
      onConfirm: () => {
        localStorage.removeItem("mapId");
        localStorage.removeItem("mapInfo");
        localStorage.removeItem("starRatings");
        localStorage.removeItem("oldStarRatings");
        setMapInfo(null);
      }
    });
  };

  if (!mapInfo || !isVisible) {
    return null;
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const songSubName = mapInfo.metadata.songSubName ? ` ${mapInfo.metadata.songSubName}` : '';

  return (
    <AnimatePresence>
      <motion.div
        className="z-50 fixed bottom-0 left-10 flex flex-col"
        initial={{ y: 50 }}
        animate={{ y: isCollapsed ? 50 : 0 }}
        transition={{ duration: 0.3, type: "spring" }}
      >
        <motion.button
          className="bg-gradient-to-b from-blue-500 to-blue-600 w-12 h-5 ml-3 rounded-t-md flex items-center justify-center cursor-pointer shadow-lg"
          onClick={() => setIsCollapsed(!isCollapsed)}
          whileHover={{ width: 44 }}
          whileTap={{ scale: 0.9 }}
        >
          {isCollapsed ?
            <FaChevronUp size={10} color="white" /> :
            <FaChevronDown size={10} color="white" />
          }
        </motion.button>
        <motion.div
          className="bg-neutral-300/80 dark:bg-neutral-800/80 backdrop-blur-md p-3 rounded-t-lg flex items-center space-x-2 w-[360px] h-[59px] border border-neutral-200/30 dark:border-neutral-700/30"
          layout
        >
          <motion.div
            className="relative group"
            whileHover={{ scale: 1.1 }}
          >
            <motion.img
              src={mapInfo.versions[0].coverURL}
              alt="Map cover"
              className=" max-h-12 object-cover rounded-lg"
              transition={{ type: "spring", stiffness: 300 }}
            />
            <motion.div
              className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:cursor-pointer transition-opacity"
              whileHover={{ scale: 1.05 }}
              onClick={() => window.open(`https://beatsaver.com/maps/${mapInfo.id}`, '_blank')}
              title='Open map on BeatSaver'
            >
              <FaMapMarkerAlt className="text-white" size={16} />
            </motion.div>
          </motion.div>

          <div className="flex-grow overflow-hidden">
            <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 truncate" title={`${mapInfo.metadata.songName}${songSubName}`}>
              {mapInfo.metadata.songName}{songSubName}
            </h3>
            <div className="flex items-center text-xs text-neutral-600 dark:text-neutral-400 truncate">
              <FaMusic className="mr-1" size={10} />
              <span className="truncate" title={mapInfo.metadata.songAuthorName}>{mapInfo.metadata.songAuthorName}</span>
              <span className="mx-1">•</span>
              <span className="truncate" title={mapInfo.metadata.levelAuthorName}>{mapInfo.metadata.levelAuthorName}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-neutral-500 dark:text-neutral-500">
              <div className="flex items-center">
                <FaClock className="mr-1" size={10} />
                <span>{formatDuration(mapInfo.metadata.duration)}</span>
              </div>
              <span>•</span>
              <span>{mapInfo.metadata.bpm}BPM</span>
            </div>
          </div>

          <motion.button
            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"
            onClick={handleClearMapData}
            whileHover={{ scale: 1.2, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            title="Clear map data"
          >
            <FaTimes size={14} />
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalLoadedMap;
