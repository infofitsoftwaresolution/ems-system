import React, { useState, useEffect } from 'react';
import { kycService } from '../services/api';
import './KycReminder.css';

const KycReminder = ({ user, onClose, onProceed }) => {
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const checkKycStatus = async () => {
      // Show reminder if user is not admin and KYC status is pending
      if (user && user.role !== 'admin') {
        try {
          // Check KYC status from backend
          const kycStatusData = await kycService.checkStatus(user.email);
          console.log('KYC Reminder - Status check:', kycStatusData);
          
          // Only show reminder if KYC is pending or not found
          console.log('KYC Reminder - Status check result:', kycStatusData.status);
          if (kycStatusData.status === 'approved') {
            console.log('KYC Reminder - Hiding popup (status is approved)');
            // KYC is approved, don't show reminder
            setShowReminder(false);
            localStorage.setItem(`kyc_completed_${user.email}`, 'true');
          } else {
            console.log('KYC Reminder - Showing popup (status is not approved)');
            // Add a small delay to ensure the dashboard is fully loaded
            setTimeout(() => {
              setShowReminder(true);
            }, 1000);
          }
        } catch (error) {
          console.error('Error checking KYC status in reminder:', error);
          // If backend check fails, show reminder
          setTimeout(() => {
            setShowReminder(true);
          }, 1000);
        }
      }
    };

    // Initial check
    checkKycStatus();

    // Set up periodic refresh every 30 seconds to check for KYC status updates
    const intervalId = setInterval(checkKycStatus, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [user]);

  const handleProceed = () => {
    setShowReminder(false);
    localStorage.setItem(`kyc_completed_${user.email}`, 'true');
    if (onProceed) onProceed();
  };

  const handleClose = () => {
    setShowReminder(false);
    if (onClose) onClose();
  };

  const handleRefresh = async () => {
    console.log('🔄 Check Status button clicked!');
    console.log('User:', user);
    
    if (user && user.role !== 'admin') {
      try {
        console.log('🔄 Checking KYC status for:', user.email);
        const kycStatusData = await kycService.checkStatus(user.email);
        console.log('🔄 KYC Reminder - Manual refresh result:', kycStatusData);
        
        if (kycStatusData.status === 'approved') {
          console.log('✅ KYC Reminder - Hiding popup after manual refresh (status is approved)');
          setShowReminder(false);
          localStorage.setItem(`kyc_completed_${user.email}`, 'true');
        } else {
          console.log('⏳ KYC still pending, popup will remain visible');
        }
      } catch (error) {
        console.error('❌ Error during manual refresh:', error);
      }
    } else {
      console.log('❌ User is admin or no user data');
    }
  };

  if (!showReminder) return null;

  return (
    <div className="kyc-reminder-overlay">
      <div className="kyc-reminder-modal">
        <div className="kyc-reminder-header">
          <h2>⚠️ KYC Verification Required</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        
        <div className="kyc-reminder-content">
          <div className="kyc-reminder-icon">📋</div>
          
          <h3>Complete Your KYC Verification</h3>
          <p>To access all features and get your permanent employee ID, please complete your KYC verification.</p>
          
          <div className="kyc-reminder-steps">
            <h4>Required Documents:</h4>
            <ul>
              <li>Government ID (Aadhaar, PAN, Passport)</li>
              <li>Address proof</li>
              <li>Recent photograph</li>
              <li>Any additional documents as required</li>
            </ul>
          </div>
          
          <div className="kyc-reminder-benefits">
            <h4>After KYC Approval:</h4>
            <ul>
              <li>✅ Get permanent employee ID</li>
              <li>✅ Access attendance check-in/check-out</li>
              <li>✅ Apply for leave</li>
              <li>✅ Full dashboard access</li>
            </ul>
          </div>
        </div>
        
        <div className="kyc-reminder-actions">
          <button className="kyc-reminder-btn secondary" onClick={handleClose}>
            Remind Me Later
          </button>
          <button 
            className="kyc-reminder-btn secondary" 
            onClick={handleRefresh} 
            style={{ 
              marginLeft: '10px',
              cursor: 'pointer',
              padding: '10px 15px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              fontWeight: 'bold'
            }}
          >
            🔄 Check Status
          </button>
          <button className="kyc-reminder-btn primary" onClick={handleProceed}>
            Complete KYC Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default KycReminder;
