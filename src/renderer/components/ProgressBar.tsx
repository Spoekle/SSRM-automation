import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStop } from 'react-icons/fa';

interface ProgressBarProps {
  visible: boolean;
  progress: number;
  process: string;
  onCancel?: () => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ visible, progress, process, onCancel }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-16 left-0 right-0 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="relative w-full bg-neutral-100/90 dark:bg-neutral-800/90 backdrop-blur-md shadow-lg">
            <div className="container mx-auto px-4 py-2">
              <div className="flex items-center justify-between mb-1">
                <motion.span
                  className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
                  key={process}
                >
                  {process}
                </motion.span>
                <motion.span
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {progress}%
                </motion.span>
              </div>
              <div className="relative h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "tween", ease: "easeInOut" }}
                />
              </div>
              {onCancel && (
                <motion.button
                  className="absolute -right-1 -top-1 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full text-xs flex items-center justify-center shadow-lg"
                  onClick={onCancel}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Cancel operation"
                >
                  <FaStop size={10} />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProgressBar;
