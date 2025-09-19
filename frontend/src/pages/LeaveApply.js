import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { leaveService } from '../services/api';
import './LeaveApply.css';

const LeaveApply = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  const leaveTypes = [
    'Sick Leave',
    'Personal Leave',
    'Vacation Leave',
    'Emergency Leave',
    'Maternity/Paternity Leave',
    'Bereavement Leave',
    'Study Leave',
    'Other'
  ];

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    
    if (userData?.email) {
      loadLeaveHistory(userData.email);
    }
  }, []);

  const loadLeaveHistory = async (email) => {
    try {
      const history = await leaveService.listMine(email);
      // Map backend fields to frontend expected fields
      const mappedHistory = history.map(leave => ({
        ...leave,
        leaveType: leave.type || leave.leaveType,
        employeeEmail: leave.email || leave.employeeEmail,
        employeeName: leave.name || leave.employeeName
      }));
      setLeaveHistory(mappedHistory);
    } catch (error) {
      console.error('Error loading leave history:', error);
      // Fallback to localStorage
      const localHistory = JSON.parse(localStorage.getItem(`leave_history_${email}`) || '[]');
      setLeaveHistory(localHistory);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.email) {
      setError('User information not found. Please login again.');
      return;
    }

    // Validation
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      setError('Please fill in all required fields.');
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (startDate > endDate) {
      setError('End date must be after start date.');
      return;
    }

    if (startDate < new Date()) {
      setError('Start date cannot be in the past.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const leaveData = {
        email: user.email,
        name: user.name,
        type: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        attachmentUrl: '', // Not used in current implementation
        // Additional fields for frontend use (stored in localStorage)
        totalDays: calculateDays(),
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        status: 'pending',
        appliedDate: new Date().toISOString().split('T')[0]
      };

      const response = await leaveService.apply(leaveData);
      
      // Store additional fields in localStorage for frontend use
      const fullLeaveRecord = {
        ...response,
        ...leaveData // Include all the additional fields
      };
      
      // Update localStorage with the complete record
      const existingHistory = JSON.parse(localStorage.getItem(`leave_history_${user.email}`) || '[]');
      existingHistory.unshift(fullLeaveRecord);
      localStorage.setItem(`leave_history_${user.email}`, JSON.stringify(existingHistory));
      
      setSuccess(true);
      setFormData({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
        emergencyContact: '',
        emergencyPhone: ''
      });

      // Refresh leave history
      loadLeaveHistory(user.email);

      // Auto-hide success message
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error applying for leave:', error);
      setError('Failed to submit leave application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  if (!user) {
    return (
      <div className="leave-apply-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="leave-apply-container">
      <div className="leave-apply-header">
        <h1>Leave Application</h1>
        <p>Apply for leave and track your leave history</p>
      </div>

      <div className="leave-apply-content">
        {/* Leave Application Form */}
        <div className="leave-form-card">
          <h2>Apply for Leave</h2>
          
          {success && (
            <div className="success-message">
              <div className="success-icon">✅</div>
              <div className="success-text">
                <h3>Leave Application Submitted!</h3>
                <p>Your leave application has been submitted successfully and is pending approval.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <div className="error-icon">❌</div>
              <div className="error-text">
                <h3>Error</h3>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="leave-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="leaveType">Leave Type *</label>
                <select
                  id="leaveType"
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="totalDays">Total Days</label>
                <input
                  type="text"
                  id="totalDays"
                  value={calculateDays()}
                  readOnly
                  className="readonly-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start Date *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date *</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason for Leave *</label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                rows="4"
                placeholder="Please provide a detailed reason for your leave request..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="emergencyContact">Emergency Contact</label>
                <input
                  type="text"
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  placeholder="Name of emergency contact"
                />
              </div>

              <div className="form-group">
                <label htmlFor="emergencyPhone">Emergency Phone</label>
                <input
                  type="tel"
                  id="emergencyPhone"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  placeholder="Emergency contact phone number"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Leave Application'}
              </button>
            </div>
          </form>
        </div>

        {/* Leave History */}
        <div className="leave-history-card">
          <h2>Leave History</h2>
          <div className="leave-history">
            {leaveHistory.length === 0 ? (
              <div className="no-history">
                <div className="no-history-icon">📅</div>
                <p>No leave applications found</p>
                <small>Your leave applications will appear here</small>
              </div>
            ) : (
              <div className="history-list">
                {leaveHistory.map((leave, index) => (
                  <div key={index} className="history-item">
                    <div className="leave-header">
                      <div className="leave-type">{leave.leaveType}</div>
                      <div 
                        className="leave-status"
                        style={{ color: getStatusColor(leave.status) }}
                      >
                        {getStatusIcon(leave.status)} {leave.status}
                      </div>
                    </div>
                    
                    <div className="leave-dates">
                      <span className="date-range">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </span>
                      <span className="total-days">{leave.totalDays} days</span>
                    </div>
                    
                    <div className="leave-reason">
                      {leave.reason}
                    </div>
                    
                    <div className="leave-meta">
                      <span className="applied-date">
                        Applied: {new Date(leave.appliedDate).toLocaleDateString()}
                      </span>
                      {leave.reviewedBy && (
                        <span className="reviewed-by">
                          Reviewed by: {leave.reviewedBy}
                        </span>
                      )}
                    </div>
                    
                    {leave.remarks && (
                      <div className="leave-remarks">
                        <strong>Remarks:</strong> {leave.remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveApply;