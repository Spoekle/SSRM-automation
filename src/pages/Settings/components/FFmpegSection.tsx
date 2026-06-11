import React from 'react';
import { motion } from 'framer-motion';

interface FFmpegSectionProps {
    ffmpegInstalled: boolean | null;
    ffmpegLoading: boolean;
    installStatus: string;
    installProgressPercent: number | null;
    handleFfmpegAction: (type: 'install' | 'reinstall') => void;
    sectionVariants: any;
}

const FFmpegSection: React.FC<FFmpegSectionProps> = ({
    ffmpegInstalled,
    ffmpegLoading,
    installStatus,
    installProgressPercent,
    handleFfmpegAction,
    sectionVariants,
}) => {
    return (
        <motion.section
            className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            custom={3}
        >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
                FFmpeg Settings
            </h3>
            <div className="space-y-3">
                <p className="text-sm">
                    Status:{' '}
                    {ffmpegInstalled === null
                        ? 'Checking...'
                        : ffmpegInstalled
                            ? 'Installed'
                            : 'Not Installed'}
                </p>

                {ffmpegLoading && (
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-md">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            {installStatus || 'Installing FFmpeg...'}
                        </p>
                        {installProgressPercent !== null && (
                            <div className="w-full bg-blue-200 dark:bg-blue-800 h-2 rounded-full mt-1">
                                <div
                                    className="bg-blue-600 h-full rounded-full"
                                    style={{ width: `${installProgressPercent}%` }}
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="flex space-x-2">
                    {!ffmpegInstalled && !ffmpegLoading && (
                        <motion.button
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
                            onClick={() => handleFfmpegAction('install')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Install FFmpeg
                        </motion.button>
                    )}

                    {ffmpegInstalled && !ffmpegLoading && (
                        <motion.button
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
                            onClick={() => handleFfmpegAction('reinstall')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Reinstall FFmpeg
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.section>
    );
};

export default FFmpegSection;
