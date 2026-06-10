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
          className="fixed top-17 left-0 right-0 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="relative w-full bg-neutral-100/90 dark:bg-neutral-800/90 backdrop-blur-md shadow-lg border-b border-neutral-200/60 dark:border-neutral-700/60">
            <div className="container mx-auto px-4 py-3">
              <div className="flex w-full">
                <div className="flex flex-col items-center w-full">
                  <div className="flex items-center justify-between mb-2 w-full">
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
                        key={progress}
                      >
                        {progress}%
                      </motion.span>
                    </motion.div>
                  </div>
                  <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                      style={{ width: `${progress}%` }}
                      transition={{ type: "tween", ease: "easeInOut" }}
                    />
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
                </div>
                {onCancel && (
                  <motion.button
                    className="ml-4 p-4 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all duration-200"
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProgressBar;
