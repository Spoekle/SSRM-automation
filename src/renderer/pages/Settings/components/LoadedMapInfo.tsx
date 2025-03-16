import React from 'react';
import { motion } from 'framer-motion';

interface LoadedMapInfoProps {
    loadedMapInfo: string | null;
    setConfirmResetMapOpen: (open: boolean) => void;
}

const LoadedMapInfo: React.FC<LoadedMapInfoProps> = ({ loadedMapInfo, setConfirmResetMapOpen }) => {
    if (!loadedMapInfo) {
        return <p>No map loaded</p>;
    }

    try {
        const map = JSON.parse(loadedMapInfo);
        const songName = map.metadata.songName || 'Unknown Song';
        const songSubName = map.metadata.songSubName;
        const songAuthor = map.metadata.songAuthorName || 'Unknown Author';
        const mapper = map.metadata.levelAuthorName || 'Unknown Mapper';
        const bpm = map.metadata.bpm || 'Unknown BPM';
        const duration = map.metadata.duration || 'Unknown Duration';

        const formattedDuration = new Date(duration * 1000).toISOString().substr(14, 5);

        let coverURL = '';
        if (map.versions && map.versions.length > 0 && map.versions[0].coverURL) {
            coverURL = map.versions[0].coverURL;
        }

        return (
            <div className="relative p-3 rounded-2xl overflow-hidden text-white">
                {/* Background with image */}
                {coverURL && (
                    <>
                        <div
                            className="absolute top-0 bottom-0 left-0 right-0 bg-cover bg-center filter blur-lg opacity-60 z-[-2]"
                            style={{ backgroundImage: `url(${coverURL})` }}
                        />
                        <div className="absolute top-0 bottom-0 left-0 right-0 bg-black/50 z-[-1]" />
                    </>
                )}

                <div className="flex">
                    {/* Cover image */}
                    {coverURL && (
                        <motion.img
                            src={coverURL}
                            alt="Map Cover"
                            className="w-16 h-16 object-cover rounded-md mr-3 z-10"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                        />
                    )}

                    {/* Map info */}
                    <div className="flex flex-col flex-grow">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <h3 className="text-md">{songAuthor}</h3>
                                <h3 className="text-lg font-semibold">
                                    {songName}{" "}
                                    {songSubName && <span className="text-sm font-normal truncate">{songSubName}</span>}
                                </h3>
                            </div>
                            <div className="flex flex-col items-end">
                                <h4 className="text-right text-sm font-semibold">BPM: {bpm}</h4>
                                <h4 className="text-right text-sm font-semibold">Duration: {formattedDuration}</h4>
                            </div>
                        </div>
                        <div className="flex items-center mt-1">
                            <p className="m-0">
                                Mapped by <span className="font-semibold">{mapper}</span>
                            </p>
                        </div>

                        {/* Reset button */}
                        <motion.button
                            className="absolute bottom-0 right-0 bg-red-500 text-white px-2 py-1 rounded-tl-xl hover:bg-red-600 transition duration-200"
                            onClick={() => {
                                setConfirmResetMapOpen(true);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Reset Loaded Map
                        </motion.button>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        return <p className="text-red-500">Error parsing map data</p>;
    }
};

export default LoadedMapInfo;
