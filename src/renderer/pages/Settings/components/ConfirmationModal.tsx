import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationCircle, FaTimes } from 'react-icons/fa';

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const SettingsConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
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

  const handleConfirm = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      onConfirm();
    }, 300);
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-neutral-300/50 dark:border-neutral-700/50"
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200 dark:border-neutral-700 rounded-t-xl">
              <div className="flex items-center">
                <div className="text-amber-500 mr-3">
                  <FaExclamationCircle size={22} />
                </div>
                <h2 className="text-lg font-bold text-neutral-800 dark:text-white">{title}</h2>
              </div>
              <motion.button
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 bg-neutral-200/50 dark:bg-neutral-700/50 p-2 rounded-full"
                onClick={handleClose}
                whileHover={{ scale: 1.1, backgroundColor: "#ef4444", color: "#ffffff" }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close"
              >
                <FaTimes />
              </motion.button>
            </div>

            <div className="p-5">
              <p className="text-neutral-600 dark:text-neutral-300 text-base">{message}</p>
            </div>

            <div className="flex justify-end gap-3 p-5 pt-3 border-t border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-b-xl">
              <motion.button
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                onClick={handleClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {cancelText}
              </motion.button>
              <motion.button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                onClick={handleConfirm}
                whileHover={{ scale: 1.05, boxShadow: "0px 4px 12px rgba(59, 130, 246, 0.35)" }}
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

export default SettingsConfirmationModal;
