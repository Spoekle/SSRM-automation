import React, { useState, useEffect, useRef } from 'react';
import { FaDownload, FaLayerGroup } from 'react-icons/fa';
import CardForm from './components/CardForm';
import { motion } from 'framer-motion';
import AlertSystem from '../../components/AlertSystem';
import ProgressBar from '../../components/ProgressBar';
import { useAlerts } from '../../utils/alertSystem';
import { nativeDialog } from '../../utils/tauri-api';

import { useMapInfo, useStarRatings } from '../../hooks';

interface Progress {
    process: string;
    progress: number;
    visible: boolean;
}

const MapCard: React.FC = () => {
    const [mapId, setMapId] = useState<string>('');
    const [progress, setProgress] = useState<Progress>({ process: "", progress: 0, visible: false });
    const { mapInfo, setMapInfo } = useMapInfo();
    const { starRatings, setStarRatings } = useStarRatings();

    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [useBackground, setUseBackground] = useState(true);
    const [cardFormModal, setCardFormModal] = useState<boolean>(false);
    const cancelGenerationRef = useRef(false);
    const { alerts, createAlert } = useAlerts();

    useEffect(() => {
        const storedMapId = localStorage.getItem('mapId');
        if (storedMapId) {
            setMapId(storedMapId);
        }
    }, []);

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.15,
                duration: 0.5,
                ease: "easeOut" as const
            }
        })
    };

    const downloadCard = async () => {
        if (!imageSrc) return;
        const filename = `${mapInfo?.metadata?.songName || 'Card'} - ${mapInfo?.metadata?.songAuthorName || 'Author'} - ${mapInfo?.metadata?.levelAuthorName || 'LevelAuthor'}.png`;
        const safeFilename = filename.replace(/[<>:"/\\|?*]/g, '_');

        const success = await nativeDialog.saveImage(imageSrc, safeFilename);
        if (success) {
            createAlert('Saved card!', 'success');
        }
    };

    const handleCancelGeneration = () => {
        cancelGenerationRef.current = true;
        setProgress({ process: "Cancelling...", progress: 100, visible: true });
        setTimeout(() => {
            setProgress({ process: "", progress: 0, visible: false });
            createAlert("Operation cancelled by user", "info");
        }, 500);
    };

    return (
        <div className='w-full min-h-full relative p-4 pt-6 overflow-x-hidden custom-scrollbar'>
            <ProgressBar
                visible={progress.visible}
                progress={progress.progress}
                process={progress.process}
                onCancel={handleCancelGeneration}
            />

            <motion.div
                className='flex flex-col items-center max-w-3xl mx-auto'
                initial="hidden"
                animate="visible"
            >
                <motion.div className='text-center mb-4' variants={fadeIn} custom={0}>
                    <div className="flex items-center justify-center gap-3 mb-1">
                        <FaLayerGroup className="text-blue-500 text-xl" />
                        <h1 className='text-2xl font-bold'>Map Card Generator</h1>
                    </div>
                    <p className='text-sm mb-3 text-neutral-600 dark:text-neutral-400'>
                        Generate a map card for your Beat Saber map!
                    </p>
                    <motion.button
                        className='group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl shadow-sm hover:bg-white/80 dark:hover:bg-neutral-800 hover:shadow-md transition-all'
                        onClick={() => setCardFormModal(true)}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <FaLayerGroup size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
                        <span>Generate Card</span>
                    </motion.button>
                </motion.div>

                {imageSrc && (
                    <motion.div
                        className='w-full max-w-md'
                        variants={fadeIn}
                        custom={1}
                    >
                        <motion.div
                            className='relative flex flex-col w-full bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-4 shadow-md overflow-hidden group'
                            whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 rounded-xl transition-opacity duration-300" />

                            <div className="flex justify-between items-center mb-3 relative z-10">
                                <h2 className='text-lg font-bold flex items-center gap-2'>
                                    <FaLayerGroup className="text-blue-500" />
                                    Preview
                                </h2>
                                <motion.button
                                    className='bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 text-sm rounded-lg flex items-center gap-1.5'
                                    onClick={() => downloadCard()}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FaDownload size={14} />
                                    Download
                                </motion.button>
                            </div>
                            <motion.div
                                className='flex justify-center rounded-lg shadow-inner overflow-hidden relative z-10'
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                            >
                                <img src={imageSrc} alt='Card Preview' className='max-h-[180px] w-auto' />
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}

                {!imageSrc && (
                    <motion.div
                        className="w-full max-w-md mx-auto bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-6 rounded-xl shadow-md mt-8 text-center"
                        variants={fadeIn}
                        custom={1}
                    >
                        <p className="text-neutral-600 dark:text-neutral-400">
                            No card generated yet. Click the button above to get started.
                        </p>
                    </motion.div>
                )}
            </motion.div>

            <AlertSystem alerts={alerts} position="top-right" />

            {cardFormModal && (
                <CardForm
                    mapId={mapId}
                    setMapId={setMapId}
                    starRatings={starRatings}
                    setStarRatings={setStarRatings}
                    setMapInfo={setMapInfo}
                    setCardFormModal={setCardFormModal}
                    setImageSrc={setImageSrc}
                    useBackground={useBackground}
                    setUseBackground={setUseBackground}
                    createAlert={createAlert}
                    progress={(process: string, progress: number, visible: boolean) => setProgress({ process, progress, visible })}
                    cancelGenerationRef={cancelGenerationRef}
                />
            )}
        </div>
    );
}

export default MapCard;
