import React, { createContext, useState, useContext, ReactNode } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

interface ConfirmationModalContextType {
  showConfirmation: (options: ConfirmationOptions) => void;
  hideConfirmation: () => void;
}

export interface ConfirmationOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModalContext = createContext<ConfirmationModalContextType | null>(null);

export const useConfirmationModal = () => {
  const context = useContext(ConfirmationModalContext);
  if (!context) {
    throw new Error('useConfirmationModal must be used within a ConfirmationModalProvider');
  }
  return context;
};

export const ConfirmationModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmationOptions | null;
  }>({
    isOpen: false,
    options: null,
  });

  const showConfirmation = (options: ConfirmationOptions) => {
    setModalState({
      isOpen: true,
      options,
    });
  };

  const hideConfirmation = () => {
    setModalState({
      isOpen: false,
      options: null,
    });
  };

  const handleConfirm = () => {
    if (modalState.options?.onConfirm) {
      modalState.options.onConfirm();
    }
    hideConfirmation();
  };

  const handleCancel = () => {
    if (modalState.options?.onCancel) {
      modalState.options.onCancel();
    }
    hideConfirmation();
  };

  const value = {
    showConfirmation,
    hideConfirmation,
  };

  return (
    <ConfirmationModalContext.Provider value={value}>
      {children}
      {modalState.isOpen && modalState.options && (
        <ConfirmationModal
          open={modalState.isOpen}
          title={modalState.options.title}
          message={modalState.options.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText={modalState.options.confirmText}
          cancelText={modalState.options.cancelText}
        />
      )}
    </ConfirmationModalContext.Provider>
  );
};
