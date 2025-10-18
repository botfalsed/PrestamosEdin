import React, { useState, useEffect } from 'react';
import './PushNotification.css';

const PushNotification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      setIsExiting(false);
      
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!notification || !isVisible) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'payment':
        return '💰';
      case 'sync':
        return '🔄';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getTypeClass = () => {
    switch (notification.type) {
      case 'payment':
        return 'notification-payment';
      case 'sync':
        return 'notification-sync';
      case 'success':
        return 'notification-success';
      case 'error':
        return 'notification-error';
      case 'info':
        return 'notification-info';
      default:
        return 'notification-default';
    }
  };

  return (
    <div className={`push-notification ${getTypeClass()} ${isExiting ? 'notification-exit' : 'notification-enter'}`}>
      <div className="notification-content">
        <div className="notification-icon">
          {getIcon()}
        </div>
        <div className="notification-text">
          <div className="notification-title">{notification.title}</div>
          <div className="notification-message">{notification.message}</div>
          {notification.details && (
            <div className="notification-details">{notification.details}</div>
          )}
        </div>
        <button className="notification-close" onClick={handleClose}>
          ×
        </button>
      </div>
      <div className="notification-progress"></div>
    </div>
  );
};

export default PushNotification;