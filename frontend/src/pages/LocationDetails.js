// Enhanced Location Display Component
const LocationDetails = ({ location, title, showMap = false }) => {
  if (!location) return null;

  const openInMaps = () => {
    if (location.latitude && location.longitude) {
      const url = https://www.google.com/maps?q=,;
      window.open(url, '_blank');
    }
  };

  const openStreetView = () => {
    if (location.latitude && location.longitude) {
      const url = https://www.google.com/maps/@,,3a,75y,0h,0t/data=!3m6!1e1!3m4!1s0x0:0x0!2z%2C;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="location-details-enhanced">
      <h4>{title}</h4>
      <div className="location-info-grid">
        <div className="location-address">
          <strong> Address:</strong>
          <p>{location.address || 'N/A'}</p>
        </div>
        
        {location.latitude && location.longitude && (
          <div className="location-coordinates">
            <strong> Coordinates:</strong>
            <p>Lat: {location.latitude.toFixed(8)}</p>
            <p>Lng: {location.longitude.toFixed(8)}</p>
          </div>
        )}
        
        {location.accuracy && (
          <div className="location-accuracy">
            <strong> Accuracy:</strong>
            <p>{Math.round(location.accuracy)} meters</p>
          </div>
        )}
        
        {location.timestamp && (
          <div className="location-timestamp">
            <strong> Captured:</strong>
            <p>{new Date(location.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>
      
      {location.latitude && location.longitude && (
        <div className="location-actions">
          <button onClick={openInMaps} className="map-action-btn">
             Open in Google Maps
          </button>
          <button onClick={openStreetView} className="map-action-btn">
             Street View
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationDetails;
