import React, { useEffect } from 'react';
import './SuccessPopup.css';

const SuccessPopup = ({ isOpen, onClose, message, employeeName, autoClose = true, duration = 3000 }) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="success-popup-overlay" onClick={onClose}>
      <div className="success-popup" onClick={(e) => e.stopPropagation()}>
        <div className="success-popup-content">
          <div className="success-icon">
            <div className="checkmark">
              <div className="checkmark-circle">
                <div className="checkmark-stem"></div>
                <div className="checkmark-kick"></div>
              </div>
            </div>
          </div>
          
          <div className="success-message">
            <h3>Success!</h3>
            <p>{message}</p>
            {employeeName && (
              <div className="employee-name-display">
                <strong>{employeeName.toUpperCase()}</strong>
              </div>
            )}
          </div>
          
          <div className="success-actions">
            <button className="success-btn" onClick={onClose}>
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPopup;
