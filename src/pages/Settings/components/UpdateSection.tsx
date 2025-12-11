import React from 'react';
import { motion } from 'framer-motion';
import { FaDownload } from 'react-icons/fa';

interface UpdateSectionProps {
    appVersion: string;
    latestVersion: string;
    latestStableVersion: string | null;
    isVersionLoading: boolean;
    isDevBranch: boolean;
    isUpdating: boolean;
    updateProgress: string;
    shouldUpdateToStable: boolean;
    updateApplication: () => void;
    getLatestVersion?: () => void;
    setLatestStableVersion: (version: string | null) => void;
    sectionVariants: any;
    sectionRef?: React.RefObject<HTMLElement | null>;
}

const UpdateSection: React.FC<UpdateSectionProps> = ({
    appVersion,
    latestVersion,
    latestStableVersion,
    isVersionLoading,
    isDevBranch,
    isUpdating,
    updateProgress,
    shouldUpdateToStable,
    updateApplication,
    getLatestVersion,
    setLatestStableVersion,
    sectionVariants,
    sectionRef,
}) => {
    return (
        <motion.section
            ref={sectionRef}
            className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            custom={4}
            id="updates-section"
        >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
                Updates
            </h3>
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm">
                            Current Version: <span className="font-semibold">{appVersion}</span>
                        </p>

                        {/* Display appropriate version info based on branch */}
                        {isDevBranch ? (
                            <>
                                <p className="text-sm">
                                    Latest Dev:{' '}
                                    <span className="font-semibold">
                                        {isVersionLoading ? 'Checking...' : latestVersion}
                                    </span>
                                </p>
                                {latestStableVersion && (
                                    <p className="text-sm">
                                        Latest Stable:{' '}
                                        <span className="font-semibold text-green-600">
                                            {latestStableVersion}
                                        </span>
                                    </p>
                                )}
                                <p className="text-xs mt-1 text-amber-500 dark:text-amber-400">
                                    Using development branch
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm">
                                    Latest Version:{' '}
                                    <span className="font-semibold">
                                        {isVersionLoading ? 'Checking...' : latestVersion}
                                    </span>
                                </p>
                                {appVersion.includes('-') && (
                                    <p className="text-xs mt-1 text-amber-500 dark:text-amber-400">
                                        Currently on beta version
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex flex-col space-y-2">
                        {isUpdating ? (
                            <div className="text-center">
                                <motion.div
                                    className="inline-block w-6 h-6 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                />
                                <p className="text-xs mt-1">{updateProgress}</p>
                            </div>
                        ) : (
                            <>
                                <motion.button
                                    onClick={updateApplication}
                                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg flex items-center justify-center space-x-1"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={
                                        isVersionLoading ||
                                        (!shouldUpdateToStable && appVersion === latestVersion)
                                    }
                                >
                                    <FaDownload size={12} />
                                    <span>
                                        {shouldUpdateToStable
                                            ? `Update to Stable ${latestStableVersion}`
                                            : latestVersion.includes('-') && !appVersion.includes('-')
                                                ? 'Update to Beta'
                                                : 'Update Now'}
                                    </span>
                                </motion.button>
                                <motion.button
                                    onClick={async () => {
                                        getLatestVersion && (await getLatestVersion());
                                        // Refresh the stable version after checking
                                        setLatestStableVersion(
                                            localStorage.getItem('latestStableVersion')
                                        );
                                        localStorage.removeItem('skipUpdateCheck');
                                        window.location.reload();
                                    }}
                                    className="px-3 py-1.5 bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500 text-sm rounded-lg"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Check for Updates
                                </motion.button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.section>
    );
};

export default UpdateSection;
