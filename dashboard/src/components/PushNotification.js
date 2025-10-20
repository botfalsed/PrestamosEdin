import React, { useState, useEffect } from 'react';

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

  const getBorderColor = () => {
    switch (notification.type) {
      case 'payment':
        return 'border-l-green-500';
      case 'sync':
        return 'border-l-blue-500';
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'info':
        return 'border-l-orange-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getProgressColor = () => {
    switch (notification.type) {
      case 'payment':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'sync':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'info':
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className={`
      fixed top-5 right-5 min-w-[350px] max-w-[400px] 
      bg-white dark:bg-gray-800 rounded-xl 
      shadow-[0_8px_32px_rgba(0,0,0,0.12)] 
      border border-white/20 dark:border-white/10
      backdrop-blur-[10px] z-[10000] overflow-hidden
      font-sans border-l-4 ${getBorderColor()}
      ${isExiting ? 'animate-[slideOutRight_0.3s_ease-in_forwards]' : 'animate-[slideInRight_0.3s_ease-out_forwards]'}
      max-[480px]:top-2.5 max-[480px]:right-2.5 max-[480px]:left-2.5 max-[480px]:min-w-0 max-[480px]:max-w-none
    `}>
      <div className="flex items-start p-4 gap-3 max-[480px]:p-3.5">
        <div className="text-2xl flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1 leading-tight max-[480px]:text-[13px]">
            {notification.title}
          </div>
          <div className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed mb-1 max-[480px]:text-xs">
            {notification.message}
          </div>
          {notification.details && (
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight max-[480px]:text-[11px]">
              {notification.details}
            </div>
          )}
        </div>
        <button 
          className="
            bg-transparent border-none text-xl text-gray-400 dark:text-gray-500 
            cursor-pointer p-0 w-6 h-6 flex items-center justify-center 
            rounded-full transition-all duration-200 flex-shrink-0
            hover:bg-black/10 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-white
          "
          onClick={handleClose}
        >
          ×
        </button>
      </div>
      <div className={`h-[3px] ${getProgressColor()} animate-[progress_5s_linear_forwards]`}></div>
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default PushNotification;