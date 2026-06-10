import React, { useState, useRef } from 'react';
import { FaImage, FaDownload } from 'react-icons/fa';
import PlaylistThumbnailForm from './components/thumbnail/PlaylistThumbnailForm';
import { motion } from 'framer-motion';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTasks } from '../../contexts/TaskContext';
import { nativeDialog } from '../../utils/tauri-api';

const PlaylistThumbnail: React.FC = () => {
    const [playlistThumbnailFormModal, setPlaylistThumbnailFormModal] = useState<boolean>(false);
    const [chosenMonth, setChosenMonth] = useState<string>('');
    const [imageSrc, setImageSrc] = useState<string>('');
    const { createAlert } = useNotifications();
    const { addTask, updateTask, completeTask, cancelTask } = useTasks();
    const taskIdRef = useRef<string | null>(null);

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.15,
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94] as const
            }
        })
    };

    const handleCancelOperation = () => {
        if (taskIdRef.current) {
            cancelTask(taskIdRef.current);
            taskIdRef.current = null;
        }
        createAlert("Operation cancelled by user", "info");
    };

    const progressAdapter = (process: string, progress: number, visible: boolean) => {
        if (visible && !taskIdRef.current) {
            taskIdRef.current = addTask("Generating Playlist Thumbnail", handleCancelOperation);
        }
        if (taskIdRef.current) {
            if (!visible) {
                completeTask(taskIdRef.current);
                taskIdRef.current = null;
            } else {
                updateTask(taskIdRef.current, { process, progress });
            }
        }
    };

    return (
        <div className='w-full min-h-full relative p-4 pt-6 overflow-x-hidden custom-scrollbar'>
            <motion.div
                className='flex flex-col items-center max-w-3xl mx-auto'
                initial="hidden"
                animate="visible"
            >
                <motion.div className='text-center mb-4' variants={fadeIn} custom={0}>
                    <div className="flex items-center justify-center gap-3 mb-1">
                        <FaImage className="text-amber-500 text-xl" />
                        <h1 className='text-2xl font-bold'>Playlist Thumbnail</h1>
                    </div>
                    <p className='text-sm mb-3 text-neutral-600 dark:text-neutral-400'>
                        Create thumbnails for the Ranked Batch playlists!
                    </p>
                    <motion.button
                        className='group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl shadow-sm hover:bg-white/80 dark:hover:bg-neutral-800 hover:shadow-md transition-all'
                        onClick={() => setPlaylistThumbnailFormModal(true)}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring" }}
                    >
                        <FaImage size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
                        <span>Create Thumbnail</span>
                    </motion.button>
                </motion.div>

                {/* Thumbnail Display Section */}
                {imageSrc && (
                    <motion.div
                        className="w-full max-w-md mx-auto bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-4 rounded-xl shadow-md mt-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, type: "spring" }}
                    >
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-semibold mb-2">Generated Thumbnail</h2>
                            <div className="flex justify-center">
                                <img
                                    src={imageSrc}
                                    alt="Generated thumbnail"
                                    className="max-w-full h-auto rounded-lg shadow-md border border-neutral-300 dark:border-neutral-600"
                                    style={{ maxHeight: '300px' }}
                                />
                            </div>
                            <div className="mt-3 flex justify-center gap-2">
                                <motion.button
                                    onClick={async () => {
                                        await nativeDialog.saveImage(imageSrc, `playlist-thumbnail-${chosenMonth}.png`);
                                        createAlert('Saved thumbnail!', 'success');
                                    }}
                                    className='bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 px-3 text-sm rounded-lg flex items-center gap-1.5'
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FaDownload size={14} />
                                    Download
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {!imageSrc && (
                    <motion.div
                        className="w-full max-w-md mx-auto bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-6 rounded-xl shadow-md mt-8 text-center"
                        variants={fadeIn}
                        custom={1}
                    >
                        <p className="text-neutral-600 dark:text-neutral-400">
                            No thumbnail generated yet. Click the button above to get started.
                        </p>
                    </motion.div>
                )}
            </motion.div>

            {playlistThumbnailFormModal && (
                <PlaylistThumbnailForm
                    setPlaylistThumbnailFormModal={setPlaylistThumbnailFormModal}
                    month={chosenMonth}
                    setMonth={setChosenMonth}
                    setImageSrc={setImageSrc}
                    createAlert={createAlert}
                    progress={progressAdapter}
                />
            )}
        </div>
    );
}

export default PlaylistThumbnail;
