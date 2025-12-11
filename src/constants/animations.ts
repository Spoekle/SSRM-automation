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
    whileHover: { scale: 1.02, y: -1 },
    whileTap: { scale: 0.98 },
  },
  closeButton: {
    whileHover: { rotate: 90 },
    whileTap: { scale: 0.9 },
  },
};

// Card hover animations
export const CARD_ANIMATIONS = {
  hover: {
    whileHover: { y: -4, transition: { duration: 0.2 } },
  },
  tap: {
    whileTap: { scale: 0.98 },
  },
  fadeIn: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  },
};

// List stagger animations
export const LIST_ANIMATIONS = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
  item: {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  },
};

// Loading state animations
export const LOADING_ANIMATIONS = {
  pulse: {
    animate: { opacity: [0.5, 1, 0.5] },
    transition: { duration: 1.5, repeat: Infinity },
  },
  spin: {
    animate: { rotate: 360 },
    transition: { duration: 1, repeat: Infinity, ease: 'linear' },
  },
  bounce: {
    animate: { y: [0, -10, 0] },
    transition: { duration: 0.6, repeat: Infinity },
  },
};

// Page transition animations
export const PAGE_TRANSITIONS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },
};
