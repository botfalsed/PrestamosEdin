import React, { createContext, useContext, useState, useCallback } from 'react';
import PushNotification from '../components/PushNotification';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after 6 seconds (1 second buffer after component auto-close)
    setTimeout(() => {
      removeNotification(id);
    }, 6000);

    return id;
  }, [removeNotification]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Predefined notification types for common use cases
  const showPaymentNotification = useCallback((paymentData) => {
    return showNotification({
      type: 'payment',
      title: '💰 Pago Recibido',
      message: `Se ha registrado un nuevo pago`,
      details: paymentData ? `Monto: $${paymentData.monto || 'N/A'} - ${paymentData.prestatario || 'Cliente'}` : null
    });
  }, [showNotification]);

  const showSyncNotification = useCallback((syncData) => {
    return showNotification({
      type: 'sync',
      title: '🔄 Sincronización Completada',
      message: `${syncData.cambios || 0} cambios procesados`,
      details: syncData.timestamp ? `Última sync: ${new Date(syncData.timestamp).toLocaleTimeString()}` : null
    });
  }, [showNotification]);

  const showSuccessNotification = useCallback((message, details = null) => {
    return showNotification({
      type: 'success',
      title: '✅ Éxito',
      message,
      details
    });
  }, [showNotification]);

  const showErrorNotification = useCallback((message, details = null) => {
    return showNotification({
      type: 'error',
      title: '❌ Error',
      message,
      details
    });
  }, [showNotification]);

  const showInfoNotification = useCallback((message, details = null) => {
    return showNotification({
      type: 'info',
      title: 'ℹ️ Información',
      message,
      details
    });
  }, [showNotification]);

  const contextValue = {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    // Convenience methods
    showPaymentNotification,
    showSyncNotification,
    showSuccessNotification,
    showErrorNotification,
    showInfoNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* Render notifications */}
      <div className="notification-container">
        {notifications.map((notification, index) => (
          <div 
            key={notification.id} 
            style={{ 
              position: 'fixed',
              top: `${20 + (index * 80)}px`, // Stack notifications
              right: '20px',
              zIndex: 10000 + index
            }}
          >
            <PushNotification
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;