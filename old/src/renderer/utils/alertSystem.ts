import { useState } from 'react';
import { Alert } from '../components/AlertSystem';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const createAlert = (text: string, type: 'success' | 'error' | 'alert' | 'info' = 'info') => {
    const id = new Date().getTime();
    setAlerts(prev => [...prev, { id, message: text, type, fadeOut: false }]);

    setTimeout(() => {
      setAlerts(alerts => alerts.map(alert =>
        alert.id === id ? { ...alert, fadeOut: true } : alert
      ));

      setTimeout(() => {
        setAlerts(alerts => alerts.filter(alert => alert.id !== id));
      }, 500);
    }, 3000);

    return id;
  };

  const removeAlert = (id: number) => {
    setAlerts(alerts => alerts.filter(alert => alert.id !== id));
  };

  return {
    alerts,
    createAlert,
    removeAlert
  };
};
