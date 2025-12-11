import React, { ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import LoadedMapInfo from './LoadedMapInfo';

interface DataManagementSectionProps {
    loadedMapInfo: string | null;
    storedCardConfigName: string | null;
    handleCardConfigUpload: (event: ChangeEvent<HTMLInputElement>) => void;
    resetLocalStorage: () => void;
    sectionVariants: any;
}

const DataManagementSection: React.FC<DataManagementSectionProps> = ({
    loadedMapInfo,
    storedCardConfigName,
    handleCardConfigUpload,
    resetLocalStorage,
    sectionVariants,
}) => {
    return (
        <motion.section
            className="bg-white dark:bg-neutral-700 rounded-xl shadow p-4"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            custom={2}
        >
            <h3 className="text-lg font-semibold border-b pb-2 mb-4 border-neutral-200 dark:border-neutral-600">
                Data Management
            </h3>

            {/* Loaded Map Data */}
            <div className="mb-4">
                <h4 className="text-base font-medium mb-2">Currently Loaded Map:</h4>
                {loadedMapInfo ? (
                    <LoadedMapInfo loadedMapInfo={loadedMapInfo} />
                ) : (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        No map loaded
                    </p>
                )}
            </div>

            {/* Card Configuration */}
            <div className="mb-4">
                <h4 className="text-base font-medium mb-2">Card Configuration:</h4>
                <div className="flex items-center">
                    {storedCardConfigName ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 flex-grow">
                            Loaded:{' '}
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                {storedCardConfigName}
                            </span>
                        </p>
                    ) : (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 flex-grow">
                            No card configuration loaded
                        </p>
                    )}
                    <label className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg cursor-pointer">
                        Upload Config
                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleCardConfigUpload}
                        />
                    </label>
                </div>
            </div>

            {/* Reset Options */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-600">
                <motion.button
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg mt-2"
                    onClick={resetLocalStorage}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Reset All Data
                </motion.button>
            </div>
        </motion.section>
    );
};

export default DataManagementSection;
