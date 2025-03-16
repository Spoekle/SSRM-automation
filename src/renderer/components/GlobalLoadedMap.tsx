import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';

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

  // Load map info from localStorage
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

    // Custom event for direct updates
    const handleMapInfoUpdate = () => loadMapInfo();
    window.addEventListener('mapinfo-updated', handleMapInfoUpdate);

    return () => {
      window.removeEventListener('storage', loadMapInfo);
      window.removeEventListener('mapinfo-updated', handleMapInfoUpdate);
    };
  }, []);

  // If no map is loaded or component is hidden, show only the toggle button
  if (!mapInfo || !isVisible) {
    return (
      <motion.div
        className="fixed left-0 top-20 z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.button
          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-r-md"
          onClick={() => setIsVisible(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaChevronRight size={16} />
        </motion.button>
      </motion.div>
    );
  }

  // Format duration to minutes:seconds
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const songSubName = mapInfo.metadata.songSubName ? ` ${mapInfo.metadata.songSubName}` : '';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-20 z-30 flex items-center shadow-lg"
        initial={{ x: -200 }}
        animate={{ x: isCollapsed ? -200 : 0 }}
        transition={{ duration: 0.3, type: "spring" }}
      >
        {/* Map info card */}
        <motion.div
          className="bg-neutral-300 dark:bg-neutral-800 p-2 rounded-r-lg flex items-center space-x-2 w-[200px]"
          layout
        >
          {/* Cover image */}
          <motion.img
            src={mapInfo.versions[0].coverURL}
            alt="Map cover"
            className="w-10 h-10 object-cover rounded-md hover:cursor-pointer"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
            onClick={() => window.open(`https://beatsaver.com/maps/${mapInfo.id}`, '_blank')}
          />

          {/* Map info */}
          <div className="flex-grow overflow-hidden">
            <h3 className="font-bold text-xs text-neutral-800 dark:text-neutral-200 truncate">
              {mapInfo.metadata.songName}{songSubName}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
              {mapInfo.metadata.songAuthorName} • {mapInfo.metadata.levelAuthorName}
            </p>
            <div className="flex space-x-1 text-xs text-neutral-500 dark:text-neutral-500">
              <span>{formatDuration(mapInfo.metadata.duration)}</span>
              <span>•</span>
              <span>{mapInfo.metadata.bpm}BPM</span>
            </div>
          </div>
        </motion.div>

        {/* Toggle button */}
        <motion.button
          className="bg-blue-500 h-12 w-5 rounded-r-md flex items-center justify-center cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
          whileHover={{ height: 44 }}
          whileTap={{ scale: 0.9 }}
        >
          {isCollapsed ?
            <FaChevronRight size={10} color="white" /> :
            <FaChevronLeft size={10} color="white" />
          }
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalLoadedMap;
