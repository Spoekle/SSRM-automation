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
  // Define position classes
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
      case 'success': return 'from-green-500/90 to-green-600/90 border-green-400/40';
      case 'error': return 'from-red-500/90 to-red-600/90 border-red-400/40';
      case 'info': return 'from-blue-500/90 to-blue-600/90 border-blue-400/40';
      case 'alert': return 'from-yellow-500/90 to-yellow-600/90 border-yellow-400/40';
      default: return 'from-blue-500/90 to-blue-600/90 border-blue-400/40';
    }
  };

  return (
    <AnimatePresence>
      <div className={`absolute ${positionClasses[position]} pl-4 flex flex-col space-y-2 overflow-hidden z-60`}>
        {alerts.map(alert => (
          <motion.div
            key={alert.id}
            className={`flex items-center backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border ${getBgColor(alert.type)} bg-gradient-to-r ${alert.fadeOut ? 'animate-fade-out' : ''}`}
            initial={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {getAlertIcon(alert.type)}
            <p className='text-sm text-white font-medium'>{alert.message}</p>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
};

export default AlertSystem;
