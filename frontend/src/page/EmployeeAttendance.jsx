import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  MapPin,
  AlertCircle,
  Navigation,
  RefreshCw,
  Map
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useGeolocation } from "@/hooks/use-geolocation";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

export default function EmployeeAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  
  const {
    location,
    error: locationError,
    loading: locationLoading,
    accuracy,
    getLocationWithAddress,
    isLocationAccurate,
    getAccuracyStatus,
    clearLocation
  } = useGeolocation();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
          // Check KYC status first
          if (user?.email) {
            console.log('🔍 Checking KYC status for:', user.email);
            const kycInfo = await apiService.getKycStatus(user.email);
            console.log('📋 KYC Info received:', kycInfo);
            
            // IMPORTANT: Only use the status from KYC request, not from Employee model
            // The status must be explicitly 'approved' from the KYC review process
            let kycStatusValue = kycInfo.status;
            
            // Handle edge cases
            if (!kycStatusValue || (kycStatusValue === 'pending' && kycInfo.message === 'No KYC request found')) {
              kycStatusValue = 'not_submitted';
            }
            
            // Ensure we're using the actual KYC request status
            if (kycStatusValue !== 'approved' && kycStatusValue !== 'rejected' && kycStatusValue !== 'pending' && kycStatusValue !== 'not_submitted') {
              console.warn('Unexpected KYC status:', kycStatusValue, 'Defaulting to not_submitted');
              kycStatusValue = 'not_submitted';
            }
            
            setKycStatus(kycStatusValue);
            
            if (kycStatusValue === 'approved') {
              console.log('✅ KYC approved, loading attendance data');
              // Load attendance data
              const attendanceData = await apiService.getTodayAttendance(user.email);
              setAttendance(attendanceData);
            } else {
              console.log('❌ KYC not approved, status:', kycStatusValue);
            }
          }
      } catch (err) {
        console.error('Error loading attendance data:', err);
        toast.error('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    // Request location permission early for better accuracy
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'prompt') {
          // Pre-request permission to improve accuracy
          navigator.geolocation.getCurrentPosition(
            () => console.log('Location permission granted'),
            () => console.log('Location permission denied'),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        }
      }).catch(() => {
        // Permissions API not supported, ignore
      });
    }
  }, [user]);

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      clearLocation();
      
      // Get accurate location - required for check-in
      let locationData = null;
      try {
        toast.info('Please allow location access when prompted by your browser...', { duration: 3000 });
        locationData = await getLocationWithAddress();
        
        console.log('Check-in location data:', locationData);
        
        // Validate location accuracy - require at least 100m accuracy
        const locationAccuracy = locationData.accuracy || 999;
        if (locationAccuracy > 100) {
          toast.warning(
            `Location accuracy is ${Math.round(locationAccuracy)}m. For better accuracy, please move to an open area and try again.`,
            { duration: 5000 }
          );
          // Retry with better accuracy
          toast.info('Retrying with high accuracy GPS...', { duration: 2000 });
          await new Promise(resolve => setTimeout(resolve, 2000));
          locationData = await getLocationWithAddress();
          
          // Check accuracy again
          const retryAccuracy = locationData.accuracy || 999;
          if (retryAccuracy > 100) {
            toast.warning(
              `Location accuracy is still ${Math.round(retryAccuracy)}m. Check-in will proceed, but please ensure you're in an open area for accurate tracking.`,
              { duration: 5000 }
            );
          } else {
            toast.success(`Location captured with ${Math.round(retryAccuracy)}m accuracy!`, { duration: 2000 });
          }
        } else {
          toast.success(`Location captured with ${Math.round(locationAccuracy)}m accuracy!`, { duration: 2000 });
        }
      } catch (locationError) {
        console.error('Location error:', locationError);
        
        // Location is optional - allow check-in without it but show warning
        if (locationError.message.includes('denied') || locationError.message.includes('permission')) {
          toast.warning(
            'Location permission denied. Check-in will proceed without location data. For better tracking, please allow location access in your browser settings.',
            { duration: 6000 }
          );
          locationData = null; // Set to null to proceed without location
        } else if (locationError.message.includes('timeout')) {
          toast.warning(
            'Location request timed out. Check-in will proceed without location data. For better tracking, please ensure GPS is enabled.',
            { duration: 5000 }
          );
          locationData = null; // Set to null to proceed without location
        } else {
          toast.warning(
            'Unable to get your location. Check-in will proceed without location data.',
            { duration: 5000 }
          );
          locationData = null; // Set to null to proceed without location
        }
      }
      
      console.log('User email for check-in:', user?.email);
      console.log('Final location data:', locationData);
      
      // Proceed with check-in (with or without location data)
      await apiService.checkIn(locationData || {}, user?.email);
      
      if (locationData && locationData.latitude && locationData.longitude) {
        const locationInfo = locationData.city && locationData.city !== 'Unknown City' 
          ? ` from ${locationData.city}`
          : ` (Lat: ${locationData.latitude.toFixed(6)}, Lng: ${locationData.longitude.toFixed(6)})`;
        toast.success(`Checked in successfully${locationInfo}!`, { duration: 3000 });
      } else {
        toast.success('Checked in successfully! (Location not available)', { duration: 3000 });
      }
      
      // Reload attendance data
      const attendanceData = await apiService.getTodayAttendance(user.email);
      setAttendance(attendanceData);
    } catch (err) {
      console.error('Check-in error:', err);
      if (err.message.includes('Location')) {
        toast.error(`Location error: ${err.message}. Please enable location access and try again.`);
      } else {
        toast.error('Failed to check in');
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckingOut(true);
      clearLocation();
      
      // Get accurate location - required for check-out
      let locationData = null;
      try {
        toast.info('Please allow location access when prompted by your browser...', { duration: 3000 });
        locationData = await getLocationWithAddress();
        
        console.log('Check-out location data:', locationData);
        
        // Validate location accuracy - require at least 100m accuracy
        const locationAccuracy = locationData.accuracy || 999;
        if (locationAccuracy > 100) {
          toast.warning(
            `Location accuracy is ${Math.round(locationAccuracy)}m. For better accuracy, please move to an open area and try again.`,
            { duration: 5000 }
          );
          // Retry with better accuracy
          toast.info('Retrying with high accuracy GPS...', { duration: 2000 });
          await new Promise(resolve => setTimeout(resolve, 2000));
          locationData = await getLocationWithAddress();
          
          // Check accuracy again
          const retryAccuracy = locationData.accuracy || 999;
          if (retryAccuracy > 100) {
            toast.warning(
              `Location accuracy is still ${Math.round(retryAccuracy)}m. Check-out will proceed, but please ensure you're in an open area for accurate tracking.`,
              { duration: 5000 }
            );
          } else {
            toast.success(`Location captured with ${Math.round(retryAccuracy)}m accuracy!`, { duration: 2000 });
          }
        } else {
          toast.success(`Location captured with ${Math.round(locationAccuracy)}m accuracy!`, { duration: 2000 });
        }
      } catch (locationError) {
        console.error('Location error:', locationError);
        
        // Location is required - don't allow check-out without it
        if (locationError.message.includes('denied') || locationError.message.includes('permission')) {
          toast.error(
            'Location permission is required for check-out. Please click the lock icon in your browser address bar, allow location access, and try again.',
            { duration: 6000 }
          );
          setCheckingOut(false);
          return; // Stop check-out process
        } else if (locationError.message.includes('timeout')) {
          toast.error(
            'Location request timed out. Please ensure GPS is enabled and try again in an open area.',
            { duration: 5000 }
          );
          setCheckingOut(false);
          return; // Stop check-out process
        } else {
          toast.error(
            'Unable to get your location. Please check your device GPS settings and try again.',
            { duration: 5000 }
          );
          setCheckingOut(false);
          return; // Stop check-out process
        }
      }
      
      // Validate that we have location data
      if (!locationData || !locationData.latitude || !locationData.longitude) {
        toast.error('Location data is incomplete. Please try again.', { duration: 3000 });
        setCheckingOut(false);
        return;
      }
      
      console.log('User email for check-out:', user?.email);
      console.log('Final location data:', locationData);
      
      // Proceed with check-out with location data
      await apiService.checkOut(locationData, user?.email);
      
      const locationInfo = locationData.city && locationData.city !== 'Unknown City' 
        ? ` from ${locationData.city}`
        : ` (Lat: ${locationData.latitude.toFixed(6)}, Lng: ${locationData.longitude.toFixed(6)})`;
      
      toast.success(`Checked out successfully${locationInfo}!`, { duration: 3000 });
      
      // Reload attendance data
      const attendanceData = await apiService.getTodayAttendance(user.email);
      setAttendance(attendanceData);
    } catch (err) {
      console.error('Check-out error:', err);
      if (err.message.includes('Location') || err.message.includes('location')) {
        toast.error(`Location error: ${err.message}. Please enable location access and try again.`);
      } else if (err.message.includes('cancelled')) {
        toast.info('Checkout cancelled');
      } else {
        toast.error(`Failed to check out: ${err.message}`);
      }
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading attendance...</p>
        </div>
      </div>
    );
  }

  if (kycStatus !== 'approved') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">KYC Required</h2>
          <p className="text-gray-600 mb-4">
            You need to complete and get your KYC approved to access attendance features.
          </p>
          <Button asChild>
            <a href="/profile">Complete KYC</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Track your daily attendance and working hours
          </p>
        </div>
      </div>

      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Today's Attendance
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendance ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Check In</p>
                    <p className="text-sm text-gray-600">
                      {attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : 'Not checked in'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Check Out</p>
                    <p className="text-sm text-gray-600">
                      {attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : 'Not checked out'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge variant={attendance.status === 'present' ? 'default' : 'secondary'}>
                      {attendance.status === 'present' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Present
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Absent
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                
                {/* Location Information */}
                {attendance.checkInLatitude && attendance.checkInLongitude && (
                  <div className="flex items-center space-x-3">
                    <Navigation className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Check-in Location</p>
                      <p className="text-xs text-gray-600 truncate">
                        {attendance.checkInAddress || `${attendance.checkInLatitude}, ${attendance.checkInLongitude}`}
                      </p>
                    </div>
                  </div>
                )}
                
                {attendance.checkOutLatitude && attendance.checkOutLongitude && (
                  <div className="flex items-center space-x-3">
                    <Navigation className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Check-out Location</p>
                      <p className="text-xs text-gray-600 truncate">
                        {attendance.checkOutAddress || `${attendance.checkOutLatitude}, ${attendance.checkOutLongitude}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Location Status */}
                {location && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Map className="h-4 w-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">Current Location</p>
                        <p className="text-xs text-blue-600">{location.fullAddress}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant={getAccuracyStatus() === 'excellent' ? 'default' : 
                                   getAccuracyStatus() === 'good' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {getAccuracyStatus().toUpperCase()} ({Math.round(accuracy)}m)
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {!attendance.checkIn && (
                    <Button 
                      onClick={handleCheckIn} 
                      disabled={checkingIn || locationLoading}
                      className="flex items-center space-x-2"
                    >
                      {checkingIn || locationLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Getting Location...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Check In</span>
                        </>
                      )}
                    </Button>
                  )}
                  
                  {attendance.checkIn && !attendance.checkOut && (
                    <Button 
                      onClick={handleCheckOut} 
                      variant="outline"
                      disabled={checkingOut || locationLoading}
                      className="flex items-center space-x-2"
                    >
                      {checkingOut || locationLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Getting Location...</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          <span>Check Out</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {/* Location Error */}
                {locationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-red-800">{locationError}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance record for today</p>
              
              {/* Location Status for new check-in */}
              {location && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
                  <div className="flex items-center space-x-2">
                    <Map className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">Ready to Check In</p>
                      <p className="text-xs text-blue-600">{location.fullAddress}</p>
                      <Badge 
                        variant={getAccuracyStatus() === 'excellent' ? 'default' : 
                               getAccuracyStatus() === 'good' ? 'secondary' : 'outline'}
                        className="text-xs mt-1"
                      >
                        {getAccuracyStatus().toUpperCase()} ({Math.round(accuracy)}m)
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleCheckIn} 
                disabled={checkingIn || locationLoading}
                className="flex items-center space-x-2 mx-auto"
              >
                {checkingIn || locationLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Getting Location...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Check In</span>
                  </>
                )}
              </Button>
              
              {locationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800">{locationError}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>This Month's Summary</CardTitle>
          <CardDescription>
            Your attendance overview for the current month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">22</p>
              <p className="text-sm text-gray-600">Days Present</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-red-600">1</p>
              <p className="text-sm text-gray-600">Days Absent</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-blue-600">95.7%</p>
              <p className="text-sm text-gray-600">Attendance Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
