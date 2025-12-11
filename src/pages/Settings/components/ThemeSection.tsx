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
            className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/50 shadow-sm"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            custom={1}
        >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
                Theme Settings
            </h3>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Dark Mode</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Toggle dark mode on/off
                    </p>
                </div>
                <Switch checked={isDarkMode} onChange={toggleTheme} size="small" />
            </div>
        </motion.section>
    );
};

export default ThemeSection;
