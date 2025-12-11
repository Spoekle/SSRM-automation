import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStop, FaSpinner } from 'react-icons/fa';

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
          <div className="relative w-full bg-neutral-100/90 dark:bg-neutral-800/90 backdrop-blur-md shadow-lg border-b border-neutral-200/60 dark:border-neutral-700/60">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mr-2 text-blue-500"
                  >
                    <FaSpinner size={16} />
                  </motion.div>
                  <motion.span
                    className="font-medium text-neutral-800 dark:text-neutral-200"
                    key={process}
                  >
                    {process}
                  </motion.span>
                </div>
                <motion.div
                  className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <motion.span
                    className="text-sm font-semibold text-blue-600 dark:text-blue-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={progress}
                    transition={{ type: "spring" }}
                  >
                    {progress}%
                  </motion.span>
                </motion.div>
              </div>
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ type: "tween", ease: "easeInOut" }}
                />

                {/* Moving light effect */}
                <motion.div
                  className="absolute top-0 h-full w-20 bg-white/30"
                  animate={{
                    left: ["-10%", "110%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    display: progress < 100 ? "block" : "none"
                  }}
                />
              </div>

              {onCancel && (
                <motion.button
                  className="absolute -right-1 -top-1 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full text-xs flex items-center justify-center shadow-lg"
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
