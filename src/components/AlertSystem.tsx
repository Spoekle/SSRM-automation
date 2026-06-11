import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export interface Alert {
  id: number;
  message: string;
  fadeOut: boolean;
  type: 'success' | 'error' | 'alert' | 'info';
}

interface AlertSystemProps {
  alerts: Alert[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const AlertSystem: React.FC<AlertSystemProps> = ({ alerts, position = 'top-right' }) => {
  const positionClasses = {
    'top-right': 'top-0 right-0 mt-4 mr-4 items-end',
    'top-left': 'top-0 left-0 mt-4 ml-4 items-start',
    'bottom-right': 'bottom-0 right-0 mb-4 mr-4 items-end',
    'bottom-left': 'bottom-0 left-0 mb-4 ml-4 items-start'
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return <FaCheckCircle className="mr-2 text-white" size={16} />;
      case 'error': return <FaExclamationTriangle className="mr-2 text-white" size={16} />;
      case 'info': return <FaInfoCircle className="mr-2 text-white" size={16} />;
      default: return <FaInfoCircle className="mr-2 text-white" size={16} />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500/90 border-green-400/40';
      case 'error': return 'bg-red-500/90 border-red-400/40';
      case 'info': return 'bg-blue-500/90 border-blue-400/40';
      case 'alert': return 'bg-yellow-500/90 border-yellow-400/40';
      default: return 'bg-blue-500/90 border-blue-400/40';
    }
  };

  return (
    <div className={`absolute ${positionClasses[position]} pl-4 overflow-hidden z-50`}>
      <div className="flex flex-col">
        <AnimatePresence initial={false}>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: {
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2, type: "spring" }
                }
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                transition: {
                  opacity: { duration: 0.15 },
                  scale: { duration: 0.2 }
                }
              }}
              className="mb-2 overflow-hidden"
              style={{
                transformOrigin: position.includes('bottom') ? 'bottom' : 'top'
              }}
            >
              <motion.div
                className={`flex items-center backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border ${getBgColor(alert.type)} ${alert.fadeOut ? 'animate-fade-out' : ''}`}
              >
                {getAlertIcon(alert.type)}
                <p className='text-sm text-white font-medium'>{alert.message}</p>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlertSystem;
