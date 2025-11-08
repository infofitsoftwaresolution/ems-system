import React, { useState } from 'react';
import DummyMap from './DummyMap';
import './DummyMap.css';

const MapExample = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [markers, setMarkers] = useState([
    {
      lat: 28.6448,
      lng: 77.2167,
      title: 'New Delhi Railway Station'
    },
    {
      lat: 28.6129,
      lng: 77.2295,
      title: 'India Gate'
    },
    {
      lat: 28.6562,
      lng: 77.2410,
      title: 'Red Fort'
    }
  ]);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    console.log('Selected location:', location);
  };

  const addMarker = () => {
    if (selectedLocation) {
      const newMarker = {
        ...selectedLocation,
        title: `Marker ${markers.length + 1}`
      };
      setMarkers([...markers, newMarker]);
    }
  };

  const clearMarkers = () => {
    setMarkers([]);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🗺️ Dummy Map Component Demo</h2>
      <p>This is a dummy map that works like Google Maps but doesn't require an API key!</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={addMarker}
          disabled={!selectedLocation}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: selectedLocation ? '#4285f4' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: selectedLocation ? 'pointer' : 'not-allowed'
          }}
        >
          Add Marker at Selected Location
        </button>
        
        <button 
          onClick={clearMarkers}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Clear All Markers
        </button>
      </div>

      {selectedLocation && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '5px',
          border: '1px solid #dee2e6'
        }}>
          <strong>Selected Location:</strong><br />
          Latitude: {selectedLocation.lat.toFixed(6)}<br />
          Longitude: {selectedLocation.lng.toFixed(6)}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <DummyMap
          center={{ lat: 28.6139, lng: 77.2090 }}
          zoom={12}
          markers={markers}
          onLocationSelect={handleLocationSelect}
          height="500px"
          showSearch={true}
          showControls={true}
        />
      </div>

      <div style={{ 
        backgroundColor: '#e9ecef', 
        padding: '15px', 
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        <h3>🎯 Features:</h3>
        <ul>
          <li>✅ <strong>Click to select location</strong> - Click anywhere on the map</li>
          <li>✅ <strong>Search functionality</strong> - Search for places (try "India Gate", "Red Fort")</li>
          <li>✅ <strong>Zoom controls</strong> - Use +/- buttons or mouse wheel</li>
          <li>✅ <strong>Map types</strong> - Switch between Road and Satellite view</li>
          <li>✅ <strong>Current location</strong> - Get your real GPS location</li>
          <li>✅ <strong>Custom markers</strong> - Add markers at selected locations</li>
          <li>✅ <strong>Responsive design</strong> - Works on mobile and desktop</li>
          <li>✅ <strong>No API key required</strong> - Perfect for development!</li>
        </ul>
      </div>

      <div style={{ 
        backgroundColor: '#d1ecf1', 
        padding: '15px', 
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        <h3>💡 Usage in Your EMS Application:</h3>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '3px',
          overflow: 'auto'
        }}>
{`// Basic usage
<DummyMap
  center={{ lat: 28.6139, lng: 77.2090 }}
  zoom={10}
  onLocationSelect={(location) => console.log(location)}
/>

// With markers
<DummyMap
  markers={[
    { lat: 28.6448, lng: 77.2167, title: 'Station' },
    { lat: 28.6129, lng: 77.2295, title: 'Landmark' }
  ]}
  height="400px"
  showSearch={true}
  showControls={true}
/>`}
        </pre>
      </div>
    </div>
  );
};

export default MapExample;

