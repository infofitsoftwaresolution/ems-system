import React, { useEffect } from 'react';
import './LeaveActionSuccessPopup.css';

const LeaveActionSuccessPopup = ({ isOpen, onClose, leaveData, action }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getActionText = () => {
    switch (action) {
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      default: return 'processed';
    }
  };

  const getActionColor = () => {
    switch (action) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="leave-success-overlay">
      <div className="leave-success-popup">
        <div className="success-header">
          <div className="success-icon" style={{ color: getActionColor() }}>
            {getActionIcon()}
          </div>
          <h3>Leave Application {action === 'approved' ? 'Approved' : 'Rejected'}!</h3>
        </div>

        <div className="success-content">
          <div className="success-message">
            <p>
              You <strong style={{ color: getActionColor() }}>{getActionText()}</strong> the leave application of:
            </p>
          </div>

          <div className="employee-details">
            <div className="detail-item">
              <span className="label">Employee ID:</span>
              <span className="value">{leaveData?.id || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Name:</span>
              <span className="value">{leaveData?.name || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Email:</span>
              <span className="value">{leaveData?.email || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Leave Type:</span>
              <span className="value">{leaveData?.type || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Date Range:</span>
              <span className="value">{leaveData?.startDate} to {leaveData?.endDate}</span>
            </div>
          </div>
        </div>

        <div className="success-actions">
          <button 
            className="btn-close" 
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveActionSuccessPopup;
