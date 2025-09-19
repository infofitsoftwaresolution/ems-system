import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { attendanceService } from '../services/api';
import './Attendance.css';

const Attendance = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState('not-checked');
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    
    if (userData?.email) {
      loadTodayAttendance(userData.email);
      loadAttendanceHistory(userData.email);
    }
  }, []);

  const loadTodayAttendance = async (email) => {
    try {
      const attendance = await attendanceService.getToday(email);
      if (attendance) {
        setTodayAttendance(attendance);
        if (attendance.checkOutTime) {
          setAttendanceStatus('checked-out');
        } else {
          setAttendanceStatus('checked-in');
        }
      } else {
        setAttendanceStatus('not-checked');
      }
    } catch (error) {
      console.error('Error loading today attendance:', error);
    }
  };

  const loadAttendanceHistory = async (email) => {
    try {
      // This would typically come from an API endpoint
      // For now, we'll use localStorage as fallback
      const history = JSON.parse(localStorage.getItem(`attendance_history_${email}`) || '[]');
      setAttendanceHistory(history.slice(0, 10)); // Show last 10 records
    } catch (error) {
      console.error('Error loading attendance history:', error);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      // Using a free reverse geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();
      
      if (data.locality && data.principalSubdivision && data.countryName) {
        return `${data.locality}, ${data.principalSubdivision}, ${data.countryName}`;
      } else if (data.principalSubdivision && data.countryName) {
        return `${data.principalSubdivision}, ${data.countryName}`;
      } else {
        return `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
      }
    } catch (error) {
      console.warn('Failed to get address from coordinates:', error);
      return `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
    }
  };

  const handleCheckIn = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      let locationData = null;
      let address = '';
      let locationAccuracy = null;

      try {
        const location = await getCurrentLocation();
        locationData = {
          latitude: location.latitude,
          longitude: location.longitude
        };
        locationAccuracy = location.accuracy;
        
        // Get detailed address from coordinates
        address = await getAddressFromCoordinates(location.latitude, location.longitude);
        
        console.log('Location captured:', {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: address
        });
      } catch (locationError) {
        console.warn('Location access denied or failed:', locationError);
        if (manualLocation) {
          address = manualLocation;
        } else {
          address = 'Location not available';
        }
      }

      await attendanceService.checkIn({
        email: user.email,
        name: user.name,
        latitude: locationData?.latitude,
        longitude: locationData?.longitude,
        address: address
      });

      setAttendanceStatus('checked-in');
      setTodayAttendance({
        checkInTime: new Date().toLocaleTimeString(),
        address: address,
        locationAccuracy: locationAccuracy
      });

      // Add to history
      const newRecord = {
        date: new Date().toLocaleDateString(),
        checkInTime: new Date().toLocaleTimeString(),
        checkOutTime: null,
        address: address,
        locationAccuracy: locationAccuracy,
        status: 'present'
      };
      
      const updatedHistory = [newRecord, ...attendanceHistory];
      setAttendanceHistory(updatedHistory);
      localStorage.setItem(`attendance_history_${user.email}`, JSON.stringify(updatedHistory));

      alert(`Successfully checked in!\nLocation: ${address}\nAccuracy: ${locationAccuracy ? `${Math.round(locationAccuracy)}m` : 'N/A'}`);
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      let locationData = null;
      let address = '';
      let locationAccuracy = null;

      try {
        const location = await getCurrentLocation();
        locationData = {
          latitude: location.latitude,
          longitude: location.longitude
        };
        locationAccuracy = location.accuracy;
        
        // Get detailed address from coordinates
        address = await getAddressFromCoordinates(location.latitude, location.longitude);
        
        console.log('Check-out location captured:', {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: address
        });
      } catch (locationError) {
        console.warn('Location access denied or failed:', locationError);
        if (manualLocation) {
          address = manualLocation;
        } else {
          address = 'Location not available';
        }
      }

      await attendanceService.checkOut({
        email: user.email,
        latitude: locationData?.latitude,
        longitude: locationData?.longitude,
        address: address
      });

      setAttendanceStatus('checked-out');
      setTodayAttendance(prev => ({
        ...prev,
        checkOutTime: new Date().toLocaleTimeString(),
        checkOutAddress: address,
        checkOutLocationAccuracy: locationAccuracy,
        workDuration: calculateWorkDuration(prev.checkInTime, new Date().toLocaleTimeString())
      }));

      // Update history
      const updatedHistory = attendanceHistory.map(record => {
        if (record.date === new Date().toLocaleDateString()) {
          return {
            ...record,
            checkOutTime: new Date().toLocaleTimeString(),
            checkOutAddress: address,
            checkOutLocationAccuracy: locationAccuracy,
            workDuration: calculateWorkDuration(record.checkInTime, new Date().toLocaleTimeString())
          };
        }
        return record;
      });
      
      setAttendanceHistory(updatedHistory);
      localStorage.setItem(`attendance_history_${user.email}`, JSON.stringify(updatedHistory));

      alert(`Successfully checked out!\nLocation: ${address}\nAccuracy: ${locationAccuracy ? `${Math.round(locationAccuracy)}m` : 'N/A'}`);
    } catch (error) {
      console.error('Error checking out:', error);
      alert('Failed to check out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkDuration = (checkInTime, checkOutTime) => {
    try {
      const checkIn = new Date(`2000-01-01 ${checkInTime}`);
      const checkOut = new Date(`2000-01-01 ${checkOutTime}`);
      const diffMs = checkOut - checkIn;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (error) {
      return 'N/A';
    }
  };

  if (!user) {
    return (
      <div className="attendance-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h1>Attendance</h1>
        <p>Manage your daily attendance and view your history</p>
      </div>

      <div className="attendance-content">
        {/* Today's Attendance Status */}
        <div className="attendance-status-card">
          <h2>Today's Attendance</h2>
          <div className="attendance-status">
            {attendanceStatus === 'checked-in' ? (
              <div className="checked-in">
                <div className="status-icon">✅</div>
                <div className="status-details">
                  <h3>Checked In</h3>
                  <p>You're currently checked in</p>
                  <p className="check-in-time">
                    Checked in at: {todayAttendance?.checkInTime || 'N/A'}
                  </p>
                  <p className="location">
                    📍 Location: {todayAttendance?.address || 'N/A'}
                    {todayAttendance?.locationAccuracy && (
                      <span className="location-accuracy">
                        (Accuracy: {Math.round(todayAttendance.locationAccuracy)}m)
                      </span>
                    )}
                  </p>
                  <button 
                    className="checkout-btn" 
                    onClick={handleCheckOut}
                    disabled={loading}
                  >
                    {loading ? 'Checking Out...' : 'Check Out'}
                  </button>
                </div>
              </div>
            ) : attendanceStatus === 'checked-out' ? (
              <div className="checked-out">
                <div className="status-icon">✅</div>
                <div className="status-details">
                  <h3>Checked Out</h3>
                  <p>You've completed your work day</p>
                  <p className="check-in-time">
                    Checked in at: {todayAttendance?.checkInTime || 'N/A'}
                  </p>
                  <p className="check-out-time">
                    Checked out at: {todayAttendance?.checkOutTime || 'N/A'}
                  </p>
                  <p className="work-duration">
                    Work duration: {todayAttendance?.workDuration || 'N/A'}
                  </p>
                  <div className="location-details">
                    <p className="check-in-location">
                      📍 Check-in: {todayAttendance?.address || 'N/A'}
                      {todayAttendance?.locationAccuracy && (
                        <span className="location-accuracy">
                          (Accuracy: {Math.round(todayAttendance.locationAccuracy)}m)
                        </span>
                      )}
                    </p>
                    <p className="check-out-location">
                      📍 Check-out: {todayAttendance?.checkOutAddress || 'N/A'}
                      {todayAttendance?.checkOutLocationAccuracy && (
                        <span className="location-accuracy">
                          (Accuracy: {Math.round(todayAttendance.checkOutLocationAccuracy)}m)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="not-checked">
                <div className="status-icon">⏰</div>
                <div className="status-details">
                  <h3>Ready to Check In</h3>
                  <p>Start your work day by checking in</p>
                  <p className="location-note">
                    📍 Your location will be recorded when you check in
                  </p>
                  <button 
                    className="checkin-btn" 
                    onClick={handleCheckIn}
                    disabled={loading}
                  >
                    {loading ? 'Checking In...' : 'Check In'}
                  </button>
                  
                  <button 
                    className="manual-location-btn" 
                    onClick={() => setShowLocationInput(!showLocationInput)}
                  >
                    📝 Enter Location Manually
                  </button>
                  
                  {showLocationInput && (
                    <div className="manual-location-input">
                      <input
                        type="text"
                        placeholder="Enter your location (e.g., Office Building, Home, etc.)"
                        value={manualLocation}
                        onChange={(e) => setManualLocation(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Attendance History */}
        <div className="attendance-history-card">
          <h2>Recent Attendance History</h2>
          <div className="attendance-history">
            {attendanceHistory.length === 0 ? (
              <div className="no-history">
                <p>No attendance records found</p>
              </div>
            ) : (
              <div className="history-list">
                {attendanceHistory.map((record, index) => (
                  <div key={index} className="history-item">
                    <div className="history-date">{record.date}</div>
                    <div className="history-times">
                      <span className="check-in">In: {record.checkInTime}</span>
                      {record.checkOutTime && (
                        <span className="check-out">Out: {record.checkOutTime}</span>
                      )}
                    </div>
                    <div className="history-duration">
                      {record.workDuration || 'In Progress'}
                    </div>
                    <div className="history-status">
                      <span className={`status-badge ${record.status}`}>
                        {record.status}
                      </span>
                    </div>
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

export default Attendance;