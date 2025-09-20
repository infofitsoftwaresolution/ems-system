import React, { useState, useEffect } from 'react';
import './LocationTracker.css';

const LocationTracker = ({ onLocationUpdate, showMap = true }) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          };
          resolve(locationData);
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

  const getDetailedAddress = async (latitude, longitude) => {
    try {
      // Using multiple geocoding services for better accuracy
      const responses = await Promise.allSettled([
        // Primary service
        fetch(https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=&longitude=&localityLanguage=en),
        // Backup service
        fetch(https://api.opencagedata.com/geocode/v1/json?q=+&key=YOUR_API_KEY&language=en&pretty=1)
      ]);

      const primaryResponse = responses[0];
      if (primaryResponse.status === 'fulfilled') {
        const data = await primaryResponse.value.json();
        
        if (data.locality && data.principalSubdivision && data.countryName) {
          return {
            fullAddress: ${data.locality}, , ,
            city: data.locality,
            state: data.principalSubdivision,
            country: data.countryName,
            postcode: data.postcode || '',
            street: data.street || '',
            building: data.building || ''
          };
        }
      }

      // Fallback to coordinates
      return {
        fullAddress: Lat: , Lng: ,
        city: 'Unknown',
        state: 'Unknown',
        country: 'Unknown',
        postcode: '',
        street: '',
        building: ''
      };
    } catch (error) {
      console.warn('Failed to get detailed address:', error);
      return {
        fullAddress: Lat: , Lng: ,
        city: 'Unknown',
        state: 'Unknown',
        country: 'Unknown',
        postcode: '',
        street: '',
        building: ''
      };
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const captureLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const locationData = await getCurrentLocation();
      const addressData = await getDetailedAddress(locationData.latitude, locationData.longitude);
      
      const locationInfo = {
        ...locationData,
        address: addressData.fullAddress,
        addressDetails: addressData,
        timestamp: new Date().toISOString(),
        id: Date.now()
      };

      setLocation(locationInfo);
      setAddress(addressData.fullAddress);
      setAccuracy(locationData.accuracy);

      // Add to location history
      setLocationHistory(prev => [locationInfo, ...prev.slice(0, 9)]); // Keep last 10

      // Notify parent component
      if (onLocationUpdate) {
        onLocationUpdate(locationInfo);
      }

      return locationInfo;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy <= 10) return '#10b981'; // Green - Excellent
    if (accuracy <= 50) return '#f59e0b'; // Yellow - Good
    if (accuracy <= 100) return '#f97316'; // Orange - Fair
    return '#ef4444'; // Red - Poor
  };

  const getAccuracyLabel = (accuracy) => {
    if (accuracy <= 10) return 'Excellent';
    if (accuracy <= 50) return 'Good';
    if (accuracy <= 100) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="location-tracker">
      <div className="location-controls">
        <button 
          className="capture-location-btn"
          onClick={captureLocation}
          disabled={loading}
        >
          {loading ? ' Capturing Location...' : ' Capture Current Location'}
        </button>
        
        {error && (
          <div className="location-error">
             {error}
          </div>
        )}
      </div>

      {location && (
        <div className="location-details">
          <div className="location-header">
            <h3> Current Location</h3>
            <div className="location-accuracy">
              <span 
                className="accuracy-badge"
                style={{ backgroundColor: getAccuracyColor(accuracy) }}
              >
                {getAccuracyLabel(accuracy)} ({Math.round(accuracy)}m)
              </span>
            </div>
          </div>

          <div className="location-info">
            <div className="address-section">
              <h4>Address</h4>
              <p className="full-address">{address}</p>
              
              {location.addressDetails && (
                <div className="address-breakdown">
                  {location.addressDetails.street && (
                    <div className="address-item">
                      <span className="label">Street:</span>
                      <span className="value">{location.addressDetails.street}</span>
                    </div>
                  )}
                  {location.addressDetails.building && (
                    <div className="address-item">
                      <span className="label">Building:</span>
                      <span className="value">{location.addressDetails.building}</span>
                    </div>
                  )}
                  <div className="address-item">
                    <span className="label">City:</span>
                    <span className="value">{location.addressDetails.city}</span>
                  </div>
                  <div className="address-item">
                    <span className="label">State:</span>
                    <span className="value">{location.addressDetails.state}</span>
                  </div>
                  <div className="address-item">
                    <span className="label">Country:</span>
                    <span className="value">{location.addressDetails.country}</span>
                  </div>
                  {location.addressDetails.postcode && (
                    <div className="address-item">
                      <span className="label">Postal Code:</span>
                      <span className="value">{location.addressDetails.postcode}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="coordinates-section">
              <h4>Coordinates</h4>
              <div className="coordinate-item">
                <span className="label">Latitude:</span>
                <span className="value">{location.latitude.toFixed(8)}</span>
              </div>
              <div className="coordinate-item">
                <span className="label">Longitude:</span>
                <span className="value">{location.longitude.toFixed(8)}</span>
              </div>
              {location.altitude && (
                <div className="coordinate-item">
                  <span className="label">Altitude:</span>
                  <span className="value">{location.altitude.toFixed(2)}m</span>
                </div>
              )}
            </div>

            <div className="location-meta">
              <div className="meta-item">
                <span className="label">Captured:</span>
                <span className="value">{new Date(location.timestamp).toLocaleString()}</span>
              </div>
              {location.speed && (
                <div className="meta-item">
                  <span className="label">Speed:</span>
                  <span className="value">{location.speed.toFixed(2)} m/s</span>
                </div>
              )}
              {location.heading && (
                <div className="meta-item">
                  <span className="label">Heading:</span>
                  <span className="value">{location.heading.toFixed(0)}</span>
                </div>
              )}
            </div>
          </div>

          {showMap && (
            <div className="location-map">
              <h4> Location on Map</h4>
              <div className="map-container">
                <iframe
                  src={https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=,&zoom=18&maptype=satellite}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="map-links">
                  <a 
                    href={https://www.google.com/maps?q=,}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-link"
                  >
                     Open in Google Maps
                  </a>
                  <a 
                    href={https://www.google.com/maps/@,,3a,75y,0h,0t/data=!3m6!1e1!3m4!1s0x0:0x0!2z%2C}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-link"
                  >
                     Street View
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {locationHistory.length > 0 && (
        <div className="location-history">
          <h4> Recent Locations</h4>
          <div className="history-list">
            {locationHistory.slice(0, 5).map((loc, index) => (
              <div key={loc.id} className="history-item">
                <div className="history-time">
                  {new Date(loc.timestamp).toLocaleTimeString()}
                </div>
                <div className="history-address">
                  {loc.address}
                </div>
                <div className="history-coords">
                  {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                </div>
                <div className="history-accuracy">
                  <span 
                    className="accuracy-dot"
                    style={{ backgroundColor: getAccuracyColor(loc.accuracy) }}
                  />
                  {Math.round(loc.accuracy)}m
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationTracker;
