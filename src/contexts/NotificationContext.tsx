import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

// Types
export type AlertType = 'success' | 'error' | 'alert' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: AlertType;
  timestamp: Date;
  read: boolean;
}

interface Toast {
  id: number;
  message: string;
  type: AlertType;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  createAlert: (message: string, type: AlertType) => void;
  markAllRead: () => void;
  clearAll: () => void;
  removeNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const MAX_NOTIFICATIONS = 50;
const TOAST_DURATION = 3000;

const getToastIcon = (type: AlertType) => {
  switch (type) {
    case 'success':
      return <FaCheckCircle className="text-white shrink-0" size={12} />;
    case 'error':
      return <FaExclamationTriangle className="text-white shrink-0" size={12} />;
    default:
      return <FaInfoCircle className="text-white shrink-0" size={12} />;
  }
};

const getToastBgColor = (type: AlertType) => {
  switch (type) {
    case 'success':
      return 'bg-green-500/90 border-green-400/30';
    case 'error':
      return 'bg-red-500/90 border-red-400/30';
    case 'alert':
      return 'bg-yellow-500/90 border-yellow-400/30';
    case 'info':
    default:
      return 'bg-blue-500/90 border-blue-400/30';
  }
};

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: number) => void }> = ({ toasts, removeToast }) => (
  <div className="fixed top-18 right-3 z-200 flex flex-col gap-1.5 pointer-events-none">
    <AnimatePresence initial={false}>
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          layout
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-white shadow-md backdrop-blur-sm pointer-events-auto ${getToastBgColor(
            toast.type
          )}`}
        >
          {getToastIcon(toast.type)}
          <span className="text-xs font-medium max-w-[250px] truncate">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/75 hover:text-white transition-colors p-0.5 ml-1"
          >
            <FaTimes size={10} />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const createAlert = useCallback((message: string, type: AlertType) => {
    const id = new Date().getTime();
    
    // Add toast
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Set auto-dismiss for toast
    setTimeout(() => {
      removeToast(id);
    }, TOAST_DURATION);

    // Add to history
    setNotifications((prev) => {
      const newNotif: Notification = {
        id,
        message,
        type,
        timestamp: new Date(),
        read: false,
      };
      const updated = [newNotif, ...prev];
      if (updated.length > MAX_NOTIFICATIONS) {
        return updated.slice(0, MAX_NOTIFICATIONS);
      }
      return updated;
    });

    setUnreadCount((c) => c + 1);
  }, [removeToast]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        createAlert,
        markAllRead,
        clearAll,
        removeNotification,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
