import React, { useState } from 'react';
import { FaList, FaCloudUploadAlt, FaCopy } from 'react-icons/fa';
import log from '../../utils/log';
import PlaylistForm from './components/PlaylistForm';
import { motion } from 'framer-motion';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTasks } from '../../contexts/TaskContext';

const Playlist: React.FC = () => {
    const [playlistFormModal, setPlaylistFormModal] = useState<boolean>(false);
    const [songHashes, setSongHashes] = useState<string[]>([]);
    const [outputText, setOutputText] = useState<string>('');
    const { createAlert } = useNotifications();
    const { addTask, updateTask, completeTask, cancelTask } = useTasks();
    const taskIdRef = React.useRef<string | null>(null);

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
            taskIdRef.current = addTask("Processing Playlist", handleCancelOperation);
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

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(outputText);
            createAlert('Song hashes copied to clipboard!', 'success');
        } catch (error) {
            log.error('Failed to copy to clipboard:', error);
            createAlert('Failed to copy to clipboard', 'error');
        }
    };

    const handleProcessComplete = (hashes: string[], output: string) => {
        setSongHashes(hashes);
        setOutputText(output);
        setPlaylistFormModal(false);
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
                        <FaList className="text-amber-500 text-xl" />
                        <h1 className='text-2xl font-bold'>Playlist Processor</h1>
                    </div>
                    <p className='text-sm mb-3 text-neutral-600 dark:text-neutral-400'>
                        Extract unique song hashes from JSON files!
                    </p>
                    <motion.button
                        className='group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl shadow-sm hover:bg-white/80 dark:hover:bg-neutral-800 hover:shadow-md transition-all'
                        onClick={() => setPlaylistFormModal(true)}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring" }}
                    >
                        <FaCloudUploadAlt size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
                        <span>Process Playlist</span>
                    </motion.button>
                </motion.div>

                {/* Output Section */}
                {songHashes.length > 0 && (
                    <motion.div
                        className="w-2/3 max-w-2xl mx-auto bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-4 rounded-xl shadow-md mt-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, type: "spring" }}
                    >
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-semibold">{songHashes.length} Extracted Song Hashes</h2>
                            <div className="absolute top-2 right-2 flex gap-2">
                                <motion.button
                                    onClick={copyToClipboard}
                                    className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 px-3 text-sm rounded-lg flex items-center gap-1.5'
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FaCopy size={14} />
                                    Copy
                                </motion.button>
                            </div>
                        </div>

                        <div className="relative">
                            <textarea
                                value={outputText}
                                readOnly
                                className="w-full h-32 p-3 text-sm font-mono bg-white/60 dark:bg-neutral-700/60 border rounded-lg resize-none custom-scrollbar"
                            />
                        </div>
                    </motion.div>
                )}

                {!songHashes.length && (
                    <motion.div
                        className="w-full max-w-md mx-auto bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-6 rounded-xl shadow-md mt-8 text-center"
                        variants={fadeIn}
                        custom={1}
                    >
                        <p className="text-neutral-600 dark:text-neutral-400">
                            No content generated yet. Click the button above to get started.
                        </p>
                    </motion.div>
                )}
            </motion.div>

            {playlistFormModal && (
                <PlaylistForm
                    setPlaylistFormModal={setPlaylistFormModal}
                    createAlert={createAlert}
                    progress={progressAdapter}
                    onProcessComplete={handleProcessComplete}
                />
            )}
        </div>
    );
}

export default Playlist;
