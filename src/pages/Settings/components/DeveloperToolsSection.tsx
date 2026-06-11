import React from 'react';
import { motion } from 'framer-motion';
import { ipcRenderer } from '../../../utils/tauri-api';

interface DeveloperToolsSectionProps {
    sectionVariants: any;
}

const DeveloperToolsSection: React.FC<DeveloperToolsSectionProps> = ({
    sectionVariants,
}) => {
    return (
        <motion.section
            className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            custom={6}
        >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
                Developer Tools
            </h3>
            <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Open DevTools
                </p>
                <motion.button
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => ipcRenderer.send('open-devtools')}
                >
                    Open DevTools
                </motion.button>
            </div>
        </motion.section>
    );
};

export default DeveloperToolsSection;
