import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(open);

  useEffect(() => {
    setIsModalOpen(open);
  }, [open]);

  const handleClose = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      onCancel();
    }, 300);
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-neutral-200/50 dark:border-neutral-700/50"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900">
              <div className="flex items-center">
                <div className="mr-3 text-yellow-500 dark:text-yellow-400">
                  <FaExclamationTriangle size={20} />
                </div>
                <h2 className="text-lg font-bold text-neutral-800 dark:text-white">{title}</h2>
              </div>
              <motion.button
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
                onClick={handleClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes />
              </motion.button>
            </div>

            <div className="p-5 text-neutral-600 dark:text-neutral-300">
              <p className="text-base leading-relaxed">{message}</p>
            </div>

            <div className="flex justify-end space-x-3 p-5 border-t border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900">
              <motion.button
                className="px-5 py-2 rounded-lg bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600 transition-colors shadow-sm"
                onClick={handleClose}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {cancelText}
              </motion.button>
              <motion.button
                className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                onClick={onConfirm}
                whileHover={{ scale: 1.05, y: -2, boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ConfirmationModal;
