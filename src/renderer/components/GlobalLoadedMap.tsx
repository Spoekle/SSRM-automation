import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronUp, FaChevronDown, FaTimes, FaMusic, FaMapMarkerAlt, FaClock, FaPlay, FaPause, FaExternalLinkAlt } from 'react-icons/fa';

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
    previewURL: string
  }[];
}

const GlobalLoadedMap: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const songSubName = mapInfo?.metadata.songSubName ? ` ${mapInfo.metadata.songSubName}` : '';

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

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mapInfo && mapInfo.versions[0].previewURL) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('ended', handleAudioEnded);
      }
      
      audioRef.current = new Audio(mapInfo.versions[0].previewURL);
      audioRef.current.volume = 0.2;
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('ended', handleAudioEnded);
      
      setAudioPlaying(false);
      setAudioProgress(0);
    }
  }, [mapInfo]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setAudioPlaying(false);
    setAudioProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setAudioProgress(progress);
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const toggleSongPreview = () => {
    if (!audioRef.current || !mapInfo) return;

    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
      stopProgressTracking();
    } else {
      audioRef.current.play().then(() => {
        setAudioPlaying(true);
        startProgressTracking();
      }).catch((error) => {
        console.error('Failed to play audio:', error);
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };


  return (
    !mapInfo ? null :
    <AnimatePresence>
      <motion.div
        className="z-50 fixed bottom-0 left-10 flex flex-col select-none"
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
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <motion.img
              src={mapInfo.versions[0].coverURL}
              alt="Map cover"
              className={`max-h-12 object-cover rounded-lg transition-all duration-300 select-none ${
                audioPlaying ? 'blur-[1px] brightness-75' : ''
              }`}
              transition={{ type: "spring", stiffness: 300 }}
            />
            
            {/* Progress Circle */}
            {audioPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-10 h-10 transform -rotate-90 drop-shadow-lg" viewBox="0 0 36 36">
                  <path
                    className="text-black/40"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-white drop-shadow-md"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${audioProgress}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            )}
            
            <motion.div
              className="absolute inset-0 bg-black/0 hover:bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:cursor-pointer transition-opacity"
              whileHover={{ scale: 1.05 }}
              onClick={toggleSongPreview}
              title={audioPlaying ? 'Pause Song Preview' : 'Play Song Preview'}
            >
              {isHovering && audioPlaying ? (
                <FaPause className="text-white" size={16} />
              ) : (
                <FaPlay className="text-white" size={16} />
              )}
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
              <span>{mapInfo.metadata.bpm} BPM</span>
            </div>
          </div>

          <motion.button
            className="font-bold text-sm text-neutral-800 dark:text-neutral-200 hover:text-neutral-800 dark:hover:text-neutral-200 p-1"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.open(`https://beatsaver.com/maps/${mapInfo.id}`, '_blank')}
            title="Open map on BeatSaver"
          >
            <FaExternalLinkAlt size={14} />
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalLoadedMap;
