import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

interface ThumbnailPreviewProps {
  setThumbnailPreviewModal: (show: boolean) => void;
  imageSrc: string | null;
}

const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({ setThumbnailPreviewModal, imageSrc }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  useEffect(() => {
    setIsOverlayVisible(true);
    setIsModalOpen(true);
  }, []);

  const handleClose = () => {
    setIsModalOpen(false);
    setIsOverlayVisible(false);
    setTimeout(() => {
      setThumbnailPreviewModal(false);
    }, 300);
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {true && (
        <motion.div
          className={`fixed inset-0 backdrop-blur-md flex items-center justify-center z-70 ${
            isOverlayVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: isOverlayVisible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="relative max-w-[80vw] max-h-[90vh]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isModalOpen ? 1 : 0, scale: isModalOpen ? 1 : 0.8 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              className="absolute -top-4 -right-4 text-white bg-red-500 p-2 rounded-full hover:bg-red-600 transition duration-200 z-10"
              onClick={handleClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaTimes />
            </motion.button>

            <motion.div
              className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl"
              whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
            >
              {imageSrc && (
                <motion.img
                  src={imageSrc}
                  alt="Thumbnail Full Preview"
                  className="rounded max-h-[85vh] object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                />
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ThumbnailPreview;
