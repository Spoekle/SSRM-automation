/**
 * Shared modal state management hook
 * Provides consistent open/close animations for all modals
 */

import { useState, useEffect } from 'react';

export function useModal(onClose?: () => void) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  useEffect(() => {
    setIsOverlayVisible(true);
    setIsPanelOpen(true);
  }, []);

  const handleClose = () => {
    setIsPanelOpen(false);
    setIsOverlayVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  return {
    isPanelOpen,
    isOverlayVisible,
    handleClose,
  };
}
