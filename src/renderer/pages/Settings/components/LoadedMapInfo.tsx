import React from 'react';
import { motion } from 'framer-motion';
import { FaMusic, FaClock } from 'react-icons/fa';
import { useConfirmationModal } from '../../../contexts/ConfirmationModalContext';

interface LoadedMapInfoProps {
    loadedMapInfo: string | null;
    // Remove the setConfirmResetMapOpen prop as we're using the confirmation context now
}

const LoadedMapInfo: React.FC<LoadedMapInfoProps> = ({ loadedMapInfo }) => {
    const { showConfirmation } = useConfirmationModal();

    if (!loadedMapInfo) {
        return <p>No map loaded</p>;
    }

    const handleResetMap = () => {
        showConfirmation({
            title: "Reset Map Data",
            message: "Are you sure you want to reset the loaded map data? This will remove it from local storage.",
            confirmText: "Reset",
            cancelText: "Cancel",
            onConfirm: () => {
                localStorage.removeItem("mapId");
                localStorage.removeItem("mapInfo");
                localStorage.removeItem("starRatings");
                localStorage.removeItem("oldStarRatings");
                window.location.reload();
            }
        });
    };

    try {
        const map = JSON.parse(loadedMapInfo);
        const songName = map.metadata.songName || 'Unknown Song';
        const songSubName = map.metadata.songSubName;
        const songAuthor = map.metadata.songAuthorName || 'Unknown Author';
        const mapper = map.metadata.levelAuthorName || 'Unknown Mapper';
        const bpm = map.metadata.bpm || 'Unknown BPM';
        const duration = map.metadata.duration || 'Unknown Duration';

        const formattedDuration = (seconds: number) => {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        };

        let coverURL = '';
        if (map.versions && map.versions.length > 0 && map.versions[0].coverURL) {
            coverURL = map.versions[0].coverURL;
        }

        return (
            <motion.div layout className="bg-neutral-300/80 dark:bg-neutral-800/80 backdrop-blur-md p-3 rounded-lg flex items-center space-x-3 border border-neutral-200/30 dark:border-neutral-700/30">
                {coverURL && (
                    <img
                        src={coverURL}
                        alt="Map Cover"
                        className="w-12 h-12 object-cover rounded-lg"
                    />
                )}
                <div className="flex-grow overflow-hidden">
                    <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 truncate">
                        {songName} {songSubName}
                    </h3>
                    <div className="flex items-center text-xs text-neutral-600 dark:text-neutral-400 truncate">
                        <FaMusic className="mr-1" size={10} />
                        <span className="truncate" title={songAuthor}>{songAuthor}</span>
                        <span className="mx-1">•</span>
                        <span className="truncate" title={mapper}>{mapper}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-neutral-500 dark:text-neutral-500">
                        <FaClock size={10} />
                        <span>{formattedDuration(duration)}</span>
                        <span>•</span>
                        <span>{bpm} BPM</span>
                    </div>
                </div>
                <motion.button
                    className="bg-red-500 text-white px-2 py-1 rounded-xl hover:bg-red-600 transition duration-200"
                    onClick={handleResetMap}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Reset
                </motion.button>
            </motion.div>
        );
    } catch (error) {
        return <p className="text-red-500">Error parsing map data</p>;
    }
};

export default LoadedMapInfo;
