import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/api';
import './AttendanceManagement.css';

const AttendanceManagement = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    loadAttendanceRecords();
  }, [filter]);

  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);
      const records = await attendanceService.getAll(filter);
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error loading attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLocationModal = (record) => {
    setSelectedRecord(record);
    setShowLocationModal(true);
  };

  const closeLocationModal = () => {
    setSelectedRecord(null);
    setShowLocationModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'half-day': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'half-day': return '⚠️';
      default: return '❓';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getLocationAccuracy = (accuracy) => {
    if (!accuracy) return 'N/A';
    return `${Math.round(accuracy)}m`;
  };

  if (loading) {
    return (
      <div className="attendance-management-container">
        <div className="loading">Loading attendance records...</div>
      </div>
    );
  }

  return (
    <div className="attendance-management-container">
      <div className="attendance-management-header">
        <h1>Attendance Management</h1>
        <p>View and manage employee attendance records with precise location tracking</p>
        
        <div className="filter-controls">
          <label htmlFor="filter">Filter by:</label>
          <select 
            id="filter" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Records</option>
          </select>
          <button 
            className="refresh-btn" 
            onClick={loadAttendanceRecords}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="attendance-records">
        {attendanceRecords.length === 0 ? (
          <div className="no-records">
            <div className="no-records-icon">📅</div>
            <h3>No attendance records found</h3>
            <p>No attendance records match the selected filter.</p>
          </div>
        ) : (
          <div className="records-table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="employee-info">
                      <div className="employee-name">{record.name}</div>
                      <div className="employee-email">{record.email}</div>
                    </td>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      {record.checkIn ? (
                        <div className="time-info">
                          <div className="time">{formatTime(record.checkIn)}</div>
                          {record.checkInAddress && (
                            <div className="location-preview">
                              📍 {record.checkInAddress.length > 30 
                                ? `${record.checkInAddress.substring(0, 30)}...` 
                                : record.checkInAddress}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="no-data">Not checked in</span>
                      )}
                    </td>
                    <td>
                      {record.checkOut ? (
                        <div className="time-info">
                          <div className="time">{formatTime(record.checkOut)}</div>
                          {record.checkOutAddress && (
                            <div className="location-preview">
                              📍 {record.checkOutAddress.length > 30 
                                ? `${record.checkOutAddress.substring(0, 30)}...` 
                                : record.checkOutAddress}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="no-data">Not checked out</span>
                      )}
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(record.status) }}
                      >
                        {getStatusIcon(record.status)} {record.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="location-btn"
                        onClick={() => openLocationModal(record)}
                        disabled={!record.checkInAddress && !record.checkOutAddress}
                      >
                        📍 View Location
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="view-details-btn"
                          onClick={() => openLocationModal(record)}
                        >
                          👁️ Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Location Details Modal */}
      {showLocationModal && selectedRecord && (
        <div className="location-modal-overlay">
          <div className="location-modal">
            <div className="modal-header">
              <h3>Attendance Location Details</h3>
              <button className="close-btn" onClick={closeLocationModal}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="employee-info">
                <h4>{selectedRecord.name}</h4>
                <p>{selectedRecord.email}</p>
                <p>Date: {formatDate(selectedRecord.date)}</p>
              </div>

              <div className="location-details">
                {selectedRecord.checkIn && (
                  <div className="check-in-details">
                    <h4>📍 Check-In Details</h4>
                    <div className="detail-item">
                      <span className="label">Time:</span>
                      <span className="value">{formatTime(selectedRecord.checkIn)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Address:</span>
                      <span className="value">{selectedRecord.checkInAddress || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Coordinates:</span>
                      <span className="value">
                        {selectedRecord.checkInLatitude && selectedRecord.checkInLongitude 
                          ? `${selectedRecord.checkInLatitude}, ${selectedRecord.checkInLongitude}`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}

                {selectedRecord.checkOut && (
                  <div className="check-out-details">
                    <h4>📍 Check-Out Details</h4>
                    <div className="detail-item">
                      <span className="label">Time:</span>
                      <span className="value">{formatTime(selectedRecord.checkOut)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Address:</span>
                      <span className="value">{selectedRecord.checkOutAddress || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Coordinates:</span>
                      <span className="value">
                        {selectedRecord.checkOutLatitude && selectedRecord.checkOutLongitude 
                          ? `${selectedRecord.checkOutLatitude}, ${selectedRecord.checkOutLongitude}`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}

                {selectedRecord.notes && (
                  <div className="notes-section">
                    <h4>📝 Notes</h4>
                    <p>{selectedRecord.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button className="close-modal-btn" onClick={closeLocationModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;