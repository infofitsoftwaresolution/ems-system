import React from 'react';
import './LeaveApprovalPopup.css';

const LeaveApprovalPopup = ({ isOpen, onClose, onConfirm, leaveData, action }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getActionText = () => {
    switch (action) {
      case 'approve': return 'approve';
      case 'reject': return 'reject';
      default: return 'process';
    }
  };

  const getActionColor = () => {
    switch (action) {
      case 'approve': return '#10b981';
      case 'reject': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case 'approve': return '✅';
      case 'reject': return '❌';
      default: return '⚠️';
    }
  };

  return (
    <div className="leave-approval-overlay">
      <div className="leave-approval-popup">
        <div className="popup-header">
          <div className="popup-icon" style={{ color: getActionColor() }}>
            {getActionIcon()}
          </div>
          <h3>Confirm Leave {action === 'approve' ? 'Approval' : 'Rejection'}</h3>
        </div>

        <div className="popup-content">
          <div className="employee-info">
            <p><strong>Employee:</strong> {leaveData?.name || 'Unknown'}</p>
            <p><strong>Employee ID:</strong> {leaveData?.id || 'N/A'}</p>
            <p><strong>Email:</strong> {leaveData?.email || 'N/A'}</p>
            <p><strong>Leave Type:</strong> {leaveData?.type || 'N/A'}</p>
            <p><strong>Date Range:</strong> {leaveData?.startDate} to {leaveData?.endDate}</p>
            {leaveData?.reason && (
              <p><strong>Reason:</strong> {leaveData.reason}</p>
            )}
          </div>

          <div className="confirmation-message">
            <p>
              Are you sure you want to <strong style={{ color: getActionColor() }}>
                {getActionText()}
              </strong> this leave application?
            </p>
          </div>
        </div>

        <div className="popup-actions">
          <button 
            className="btn-cancel" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="btn-confirm" 
            onClick={handleConfirm}
            style={{ backgroundColor: getActionColor() }}
          >
            {action === 'approve' ? 'Approve Leave' : 'Reject Leave'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveApprovalPopup;
