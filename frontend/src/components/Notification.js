import React from 'react';
import './styles/Notification.css';

const Notification = ({ message, isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="notification-overlay">
      <div className="notification-content">
        <p>{message}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Notification;