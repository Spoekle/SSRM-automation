/**
 * Shared animation configurations for consistent UI behavior
 */

export const MODAL_ANIMATIONS = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  panel: {
    initial: { x: '-100%' },
    animate: { x: '0%' },
    exit: { x: '-100%' },
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  header: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.1, type: 'spring' },
  },
  staggerChildren: {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
  },
  button: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  },
  closeButton: {
    whileHover: {
      scale: 1.1,
      backgroundColor: '#ef4444',
      color: '#ffffff',
    },
    whileTap: { scale: 0.95 },
  },
};
