import React from 'react';
import { motion } from 'framer-motion';
import { FaDesktop, FaSun, FaMoon } from 'react-icons/fa';
import { ThemeMode } from '../../../contexts/ThemeContext';

interface ThemeSectionProps {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  sectionVariants?: any;
}

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
  {
    id: 'system',
    label: 'System',
    icon: <FaDesktop size={13} />,
  },
  {
    id: 'light',
    label: 'Light',
    icon: <FaSun size={13} />,
  },
  {
    id: 'dark',
    label: 'Dark',
    icon: <FaMoon size={13} />,
  },
];

const ThemeSection: React.FC<ThemeSectionProps> = ({
  theme,
  setTheme,
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
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Theme Settings
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Choose your interface appearance
          </p>
        </div>
      </div>

      <div className="relative flex items-center p-1 bg-neutral-200/60 dark:bg-neutral-900/60 rounded-xl border border-neutral-300/40 dark:border-neutral-800/80">
        {THEME_OPTIONS.map((option) => {
          const isSelected = theme === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setTheme(option.id)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors z-10 select-none ${
                isSelected
                  ? 'text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeThemeSegment"
                  className="absolute inset-0 bg-white dark:bg-neutral-700/90 rounded-lg shadow-sm border border-neutral-200/80 dark:border-neutral-600/60 -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className={isSelected ? 'text-yellow-500 dark:text-indigo-400' : 'text-neutral-400'}>
                {option.icon}
              </span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </motion.section>
  );
};

export default ThemeSection;
