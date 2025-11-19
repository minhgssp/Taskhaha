import React, { useEffect, useState } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Allow time for fade-out animation before calling onClose
        setTimeout(onClose, 300); 
      }, 5000); // Notification disappears after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  const baseClasses = "fixed bottom-5 right-5 max-w-sm px-6 py-4 rounded-lg shadow-lg text-white transition-all duration-300 transform";
  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
  };
  const visibilityClasses = isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5';

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${visibilityClasses}`} role="alert">
      <p>{message}</p>
      <button onClick={onClose} className="absolute top-2 right-2 p-1 text-white/70 hover:text-white">
        &times;
      </button>
    </div>
  );
};