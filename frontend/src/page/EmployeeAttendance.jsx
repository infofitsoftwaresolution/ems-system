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
          setKycStatus(kycInfo.status);
          
          if (kycInfo.status === 'approved') {
            console.log('✅ KYC approved, loading attendance data');
            // Load attendance data
            const attendanceData = await apiService.getTodayAttendance(user.email);
            setAttendance(attendanceData);
          } else {
            console.log('❌ KYC not approved, status:', kycInfo.status);
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
  }, [user]);

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      clearLocation();
      
      // Try to get location - browser will prompt for permission
      let locationData = null;
      try {
        toast.info('Please allow location access when prompted by your browser...', { duration: 3000 });
        locationData = await getLocationWithAddress();
        
        console.log('Check-in location data:', locationData);
        
        // Check location accuracy
        if (!isLocationAccurate(100)) {
          toast.warning(`Location accuracy is ${Math.round(accuracy)}m. For better accuracy, try moving to an open area.`);
        }
      } catch (locationError) {
        console.warn('Location not available:', locationError);
        
        // Check if it's a permission denied error
        if (locationError.message.includes('denied') || locationError.message.includes('permission')) {
          // Show helpful message with instructions
          toast.error(
            'Location permission denied. Please click the lock icon in your browser address bar and allow location access, then try again.',
            { duration: 5000 }
          );
          // Still allow check-in without location
          toast.warning('Proceeding with check-in without location data.', { duration: 3000 });
        } else {
          // Other location errors
          toast.warning('Location not available. Check-in will proceed without location data.', { duration: 3000 });
        }
      }
      
      console.log('User email for check-in:', user?.email);
      
      // Proceed with check-in - pass location data if available, or null
      await apiService.checkIn(locationData, user?.email);
      
      if (locationData?.city) {
        toast.success(`Checked in successfully from ${locationData.city}!`);
      } else {
        toast.success('Checked in successfully!');
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
      
      // Get high-accuracy location with fallback
      toast.info('Getting your location...', { duration: 2000 });
      
      let locationData = null;
      let locationError = null;
      
      try {
        locationData = await getLocationWithAddress();
        console.log('Check-out location data:', locationData);
      } catch (locErr) {
        console.warn('Location capture failed:', locErr);
        locationError = locErr.message;
        
        // Show user-friendly error and ask for manual confirmation
        const shouldProceed = window.confirm(
          `Location capture failed: ${locErr.message}\n\n` +
          'Would you like to proceed with checkout without location data?\n' +
          'Note: This may affect attendance tracking accuracy.'
        );
        
        if (!shouldProceed) {
          throw new Error('Checkout cancelled by user');
        }
        
        // Create fallback location data
        locationData = {
          latitude: null,
          longitude: null,
          address: 'Location not available',
          city: 'Unknown',
          fullAddress: 'Location capture failed',
          fallback: true,
          error: locationError
        };
      }
      
      console.log('User email for check-out:', user?.email);
      
      // Check location accuracy if we have location data
      if (locationData && locationData.latitude && !isLocationAccurate(100)) {
        toast.warning(`Location accuracy is ${Math.round(accuracy)}m. For better accuracy, try moving to an open area.`);
      }
      
      // Proceed with check-out - pass user email as fallback
      await apiService.checkOut(locationData, user?.email);
      
      const successMessage = locationData?.city && locationData.city !== 'Unknown' 
        ? `Checked out successfully from ${locationData.city}!`
        : 'Checked out successfully!';
      
      toast.success(successMessage);
      
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
