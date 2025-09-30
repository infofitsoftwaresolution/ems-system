import { useState, useEffect, useCallback } from 'react';

export function useGeolocation(options = {}) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accuracy, setAccuracy] = useState(null);

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    ...options
  };

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const locationData = {
            latitude,
            longitude,
            accuracy,
            timestamp: new Date().toISOString()
          };
          
          setLocation(locationData);
          setAccuracy(accuracy);
          setLoading(false);
          resolve(locationData);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred';
              break;
          }
          
          setError(errorMessage);
          setLoading(false);
          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  }, [defaultOptions]);

  const getAddressFromCoordinates = useCallback(async (latitude, longitude) => {
    try {
      // Using a free reverse geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get address');
      }
      
      const data = await response.json();
      return {
        address: data.localityInfo?.administrative?.[0]?.name || 'Unknown Location',
        city: data.city || data.locality || 'Unknown City',
        country: data.countryName || 'Unknown Country',
        fullAddress: `${data.locality || ''}, ${data.city || ''}, ${data.countryName || ''}`.replace(/^,\s*|,\s*$/g, '')
      };
    } catch (error) {
      console.error('Error getting address:', error);
      return {
        address: 'Unknown Location',
        city: 'Unknown City',
        country: 'Unknown Country',
        fullAddress: 'Location not available'
      };
    }
  }, []);

  const getLocationWithAddress = useCallback(async () => {
    try {
      const locationData = await getCurrentPosition();
      const addressData = await getAddressFromCoordinates(
        locationData.latitude, 
        locationData.longitude
      );
      
      return {
        ...locationData,
        ...addressData
      };
    } catch (error) {
      throw error;
    }
  }, [getCurrentPosition, getAddressFromCoordinates]);

  const isLocationAccurate = useCallback((accuracyThreshold = 100) => {
    return accuracy !== null && accuracy <= accuracyThreshold;
  }, [accuracy]);

  const getAccuracyStatus = useCallback(() => {
    if (accuracy === null) return 'unknown';
    if (accuracy <= 10) return 'excellent';
    if (accuracy <= 50) return 'good';
    if (accuracy <= 100) return 'fair';
    return 'poor';
  }, [accuracy]);

  return {
    location,
    error,
    loading,
    accuracy,
    getCurrentPosition,
    getLocationWithAddress,
    isLocationAccurate,
    getAccuracyStatus,
    clearLocation: () => {
      setLocation(null);
      setError(null);
      setAccuracy(null);
    }
  };
}
