import React from 'react';
import { motion } from 'framer-motion';
import Switch from '@mui/material/Switch';

interface ThemeSectionProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
    sectionVariants: any;
}

const ThemeSection: React.FC<ThemeSectionProps> = ({
    isDarkMode,
    toggleTheme,
    sectionVariants,
}) => {
    return (
        <motion.section
            className="bg-white dark:bg-neutral-700 rounded-xl shadow p-4"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            custom={1}
        >
            <h3 className="text-lg font-semibold border-b pb-2 mb-4 border-neutral-200 dark:border-neutral-600">
                Theme Settings
            </h3>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Dark Mode</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Toggle dark mode on/off
                    </p>
                </div>
                <Switch checked={isDarkMode} onChange={toggleTheme} />
            </div>
        </motion.section>
    );
};

export default ThemeSection;
