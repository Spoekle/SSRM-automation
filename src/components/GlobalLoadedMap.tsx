import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { FaChevronUp, FaChevronDown, FaMusic, FaClock, FaPlay, FaPause, FaExternalLinkAlt, FaTimes } from 'react-icons/fa';
import { useMapInfo } from '../hooks';
import { useConfirmationModal } from '../contexts/ConfirmationModalContext';

const GlobalLoadedMap: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { mapInfo, clearMapInfo } = useMapInfo();
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { showConfirmation } = useConfirmationModal();
  const songSubName = mapInfo?.metadata.songSubName ? ` ${mapInfo.metadata.songSubName}` : '';

  useEffect(() => {
    return () => {
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
        audioRef.current.removeEventListener('ended', handleAudioEnded);
      }

      audioRef.current = new Audio(mapInfo.versions[0].previewURL);
      audioRef.current.volume = 0.2;
      audioRef.current.addEventListener('ended', handleAudioEnded);

      setAudioPlaying(false);
      setAudioProgress(0);
    }
  }, [mapInfo]);

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

  const toggleSongPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleClearMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirmation({
      title: "Clear Map",
      message: "Are you sure you want to clear the loaded map?",
      onConfirm: () => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        clearMapInfo();
        localStorage.removeItem("mapId");
        localStorage.removeItem("starRatings");
        localStorage.removeItem("oldStarRatings");
      }
    });
  };

  const handleCollapse = () => {
    setIsAnimating(true);
    // Small delay to let content fade out first
    setTimeout(() => {
      setIsCollapsed(true);
      setTimeout(() => setIsAnimating(false), 300);
    }, 50);
  };

  const handleExpand = () => {
    setIsAnimating(true);
    setIsCollapsed(false);
    setTimeout(() => setIsAnimating(false), 300);
  };

  if (!mapInfo) return null;

  // Show content only when expanded and not animating
  const showContent = !isCollapsed && !isAnimating;

  return (
    <LayoutGroup>
      <motion.div
        className="fixed bottom-4 left-4 z-60 select-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, type: "spring" }}
      >
        {/* Container that expands/collapses */}
        <motion.div
          layout
          className={`relative overflow-hidden ${isCollapsed
              ? ''
              : 'bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 w-[290px]'
            }`}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {/* Header - hidden during animation */}
          {showContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-end px-1 py-1 border-b border-neutral-200/50 dark:border-neutral-700/50 bg-neutral-50/50 dark:bg-neutral-800/50"
            >
              <div className="flex items-center gap-1">
                <motion.button
                  className="p-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 text-neutral-500 dark:text-neutral-400 transition-colors"
                  onClick={handleCollapse}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Minimize"
                >
                  <FaChevronDown size={12} />
                </motion.button>
                <motion.button
                  className="p-1 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-red-700/50 text-neutral-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  onClick={handleClearMap}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Clear map"
                >
                  <FaTimes size={12} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Content area */}
          <motion.div
            layout
            className={isCollapsed ? '' : 'p-1 flex items-center gap-3'}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* Cover art - always visible, animates position */}
            <motion.div
              layout
              layoutId="loaded-map-cover"
              className={`relative shrink-0 ${isCollapsed ? 'cursor-pointer group' : ''}`}
              onMouseEnter={() => !isCollapsed && setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => isCollapsed && handleExpand()}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <motion.img
                layout
                src={mapInfo.versions[0].coverURL}
                alt="Map cover"
                className={`object-cover ${isCollapsed
                    ? 'w-14 h-14 rounded-xl shadow-lg ring-2 ring-white/20 dark:ring-neutral-700/50'
                    : `w-14 h-14 rounded-lg shadow-md ${audioPlaying ? 'brightness-75' : ''}`
                  }`}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />

              {/* Collapsed hover overlay */}
              {isCollapsed && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-colors flex items-center justify-center">
                  <FaChevronUp className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                </div>
              )}

              {/* Progress circle - only when expanded and playing */}
              {!isCollapsed && audioPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      className="text-black/30"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      cx="18"
                      cy="18"
                      r="15"
                    />
                    <circle
                      className="text-white"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${audioProgress * 0.94} 100`}
                      strokeLinecap="round"
                      fill="none"
                      cx="18"
                      cy="18"
                      r="15"
                    />
                  </svg>
                </div>
              )}

              {/* Play/Pause button - only when expanded */}
              {!isCollapsed && (
                <button
                  className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 rounded-lg transition-colors"
                  onClick={toggleSongPreview}
                  title={audioPlaying ? 'Pause preview' : 'Play preview'}
                >
                  {(isHovering || audioPlaying) && (
                    <div className="w-8 h-8 flex items-center justify-center shadow-md">
                      {audioPlaying ? (
                        <FaPause className="text-white" size={20} />
                      ) : (
                        <FaPlay className="text-white" size={20} />
                      )}
                    </div>
                  )}
                </button>
              )}
            </motion.div>

            {/* Song info - hidden during animation */}
            {showContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <h3
                  className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 truncate"
                  title={`${mapInfo.metadata.songName}${songSubName}`}
                >
                  {mapInfo.metadata.songName}{songSubName}
                </h3>
                <div className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 overflow-hidden">
                  <FaMusic size={9} className="shrink-0" />
                  <span className="truncate" title={mapInfo.metadata.songAuthorName}>
                    {mapInfo.metadata.songAuthorName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                  <span className="font-mono bg-neutral-200/50 dark:bg-neutral-700/50 px-1.5 py-0.5 rounded text-[10px]">
                    {mapInfo.id}
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <FaClock size={9} />
                    <span>{formatDuration(mapInfo.metadata.duration)}</span>
                  </div>
                  <span>•</span>
                  <span>{mapInfo.metadata.bpm} BPM</span>
                </div>
              </motion.div>
            )}

            {/* External link - hidden during animation */}
            {showContent && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="shrink-0 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => window.open(`https://beatsaver.com/maps/${mapInfo.id}`, '_blank')}
                title="Open on BeatSaver"
              >
                <FaExternalLinkAlt size={14} />
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </LayoutGroup>
  );
};

export default GlobalLoadedMap;
