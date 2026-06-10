import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaTrash } from 'react-icons/fa';
import { useNotifications } from '../../contexts/NotificationContext';
import type { AlertType } from '../../contexts/NotificationContext';

const getNotifIcon = (type: AlertType) => {
  switch (type) {
    case 'success':
      return <FaCheckCircle className="text-green-500 shrink-0" size={14} />;
    case 'error':
      return <FaExclamationTriangle className="text-red-500 shrink-0" size={14} />;
    case 'alert':
      return <FaExclamationTriangle className="text-yellow-500 shrink-0" size={14} />;
    case 'info':
    default:
      return <FaInfoCircle className="text-blue-500 shrink-0" size={14} />;
  }
};

const formatTime = (date: any) => {
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllRead, clearAll, removeNotification } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      markAllRead();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div ref={dropdownRef} className="relative no-drag">
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-2 rounded-lg hover:bg-neutral-400/20 dark:hover:bg-neutral-700/50 transition-all duration-200 relative flex items-center justify-center cursor-pointer"
        title="Notifications"
      >
        <FaBell className="text-neutral-500 dark:text-neutral-400" size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 rounded-xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl border border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200/50 dark:border-neutral-800/50">
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Notifications
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <FaTrash size={10} /> Clear all
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto custom-scrollbar flex-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No notifications yet.
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800/30">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-2.5 p-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors relative group ${
                        !notif.read ? 'bg-blue-50/10 dark:bg-blue-500/5' : ''
                      }`}
                    >
                      {getNotifIcon(notif.type)}
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs text-neutral-700 dark:text-neutral-300 wrap-break-word leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-neutral-400 mt-1 block">
                          {formatTime(notif.timestamp)}
                        </span>
                      </div>
                      <button
                        onClick={() => removeNotification(notif.id)}
                        className="absolute right-2.5 top-3 text-neutral-300 hover:text-neutral-500 dark:hover:text-neutral-400 opacity-0 group-hover:opacity-100 transition-all p-0.5"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
