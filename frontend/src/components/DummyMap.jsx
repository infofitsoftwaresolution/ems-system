import React, { useState, useEffect, useRef } from 'react';
import './DummyMap.css';

const DummyMap = ({ 
  center = { lat: 28.6139, lng: 77.2090 }, // Default to Delhi
  zoom = 10,
  markers = [],
  onLocationSelect,
  height = '400px',
  width = '100%',
  showSearch = true,
  showControls = true
}) => {
  const mapRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState(center);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [isLoading, setIsLoading] = useState(false);
  const [mapType, setMapType] = useState('roadmap');

  // Dummy locations for search
  const dummyLocations = [
    { name: 'New Delhi Railway Station', lat: 28.6448, lng: 77.2167 },
    { name: 'India Gate', lat: 28.6129, lng: 77.2295 },
    { name: 'Red Fort', lat: 28.6562, lng: 77.2410 },
    { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
    { name: 'Lotus Temple', lat: 28.5535, lng: 77.2588 },
    { name: 'Qutub Minar', lat: 28.5244, lng: 77.1855 },
    { name: 'Akshardham Temple', lat: 28.6127, lng: 77.2773 },
    { name: 'Jama Masjid', lat: 28.6504, lng: 77.2332 }
  ];

  // Handle map click
  const handleMapClick = (event) => {
    const rect = mapRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates to lat/lng (simplified)
    const lat = currentLocation.lat + (rect.height/2 - y) * 0.001;
    const lng = currentLocation.lng + (x - rect.width/2) * 0.001;
    
    const newLocation = { lat, lng };
    setCurrentLocation(newLocation);
    
    if (onLocationSelect) {
      onLocationSelect(newLocation);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const foundLocation = dummyLocations.find(loc => 
        loc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (foundLocation) {
        setCurrentLocation(foundLocation);
        if (onLocationSelect) {
          onLocationSelect(foundLocation);
        }
      } else {
        alert('Location not found in dummy database');
      }
      
      setIsLoading(false);
    }, 1000);
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setCurrentZoom(prev => Math.min(prev + 1, 20));
  };

  const handleZoomOut = () => {
    setCurrentZoom(prev => Math.max(prev - 1, 1));
  };

  // Handle map type change
  const handleMapTypeChange = (type) => {
    setMapType(type);
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          if (onLocationSelect) {
            onLocationSelect(location);
          }
        },
        (error) => {
          alert('Unable to get your location. Using default location.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="dummy-map-container" style={{ height, width }}>
      {/* Search Bar */}
      {showSearch && (
        <div className="map-search-container">
          <div className="map-search-box">
            <input
              type="text"
              placeholder="Search for places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="map-search-input"
            />
            <button 
              onClick={handleSearch}
              disabled={isLoading}
              className="map-search-button"
            >
              {isLoading ? '🔍' : '🔍'}
            </button>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {showControls && (
        <div className="map-controls">
          <div className="zoom-controls">
            <button onClick={handleZoomIn} className="zoom-btn">+</button>
            <button onClick={handleZoomOut} className="zoom-btn">-</button>
          </div>
          
          <div className="map-type-controls">
            <button 
              onClick={() => handleMapTypeChange('roadmap')}
              className={mapType === 'roadmap' ? 'active' : ''}
            >
              Road
            </button>
            <button 
              onClick={() => handleMapTypeChange('satellite')}
              className={mapType === 'satellite' ? 'active' : ''}
            >
              Satellite
            </button>
          </div>
          
          <button onClick={getCurrentLocation} className="location-btn">
            📍 My Location
          </button>
        </div>
      )}

      {/* Map Canvas */}
      <div 
        ref={mapRef}
        className={`dummy-map ${mapType}`}
        onClick={handleMapClick}
        style={{
          backgroundImage: mapType === 'satellite' 
            ? 'linear-gradient(45deg, #2d5016 25%, #3a5f1a 25%, #3a5f1a 50%, #2d5016 50%, #2d5016 75%, #3a5f1a 75%)'
            : 'linear-gradient(45deg, #e8f4f8 25%, #d1e7dd 25%, #d1e7dd 50%, #e8f4f8 50%, #e8f4f8 75%, #d1e7dd 75%)',
          backgroundSize: '20px 20px'
        }}
      >
        {/* Grid lines for roadmap */}
        {mapType === 'roadmap' && (
          <div className="map-grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid-line horizontal" style={{ top: `${i * 10}%` }} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid-line vertical" style={{ left: `${i * 10}%` }} />
            ))}
          </div>
        )}

        {/* Center marker */}
        <div className="center-marker">
          <div className="marker-pin"></div>
          <div className="marker-pulse"></div>
        </div>

        {/* Custom markers */}
        {markers.map((marker, index) => (
          <div
            key={index}
            className="custom-marker"
            style={{
              left: `${50 + (marker.lng - currentLocation.lng) * 100}%`,
              top: `${50 - (marker.lat - currentLocation.lat) * 100}%`
            }}
            title={marker.title || `Marker ${index + 1}`}
          >
            <div className="marker-icon">📍</div>
            {marker.title && <div className="marker-label">{marker.title}</div>}
          </div>
        ))}

        {/* Location info */}
        <div className="location-info">
          <div className="coordinates">
            <strong>Lat:</strong> {currentLocation.lat.toFixed(6)}
            <br />
            <strong>Lng:</strong> {currentLocation.lng.toFixed(6)}
          </div>
          <div className="zoom-level">
            Zoom: {currentZoom}
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div>Searching...</div>
        </div>
      )}
    </div>
  );
};

export default DummyMap;

