import { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  AlertCircle,
  Navigation,
  RefreshCw,
  Map,
  AlertTriangle,
  Camera,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useGeolocation } from "@/hooks/use-geolocation";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

export default function EmployeeAttendance() {
  const { user, isLoading: authLoading } = useAuth();

  // Redirect admins, managers, and HR to admin attendance page (wait for auth to load first)
  if (
    !authLoading &&
    (user?.role === "admin" || user?.role === "manager" || user?.role === "hr")
  ) {
    return <Navigate to="/admin-attendance" replace />;
  }
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'checkin' or 'checkout'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const {
    location,
    error: locationError,
    loading: locationLoading,
    accuracy,
    getLocationWithAddress,
    isLocationAccurate,
    getAccuracyStatus,
    clearLocation,
  } = useGeolocation();

  // Camera functions
  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCapturing(false);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Front-facing camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setCameraStream(stream);

      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError(
        "Camera access denied. Please allow camera permission to continue."
      );
      toast.error(
        "Camera permission denied. Please enable camera access in your browser settings."
      );

      // Stop any existing stream
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error("Camera not ready");
      return;
    }

    try {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Get video dimensions
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Calculate new dimensions (max 800px on longest side to reduce file size)
      const MAX_DIMENSION = 800;
      let newWidth = videoWidth;
      let newHeight = videoHeight;

      if (videoWidth > videoHeight) {
        if (videoWidth > MAX_DIMENSION) {
          newWidth = MAX_DIMENSION;
          newHeight = (videoHeight / videoWidth) * MAX_DIMENSION;
        }
      } else {
        if (videoHeight > MAX_DIMENSION) {
          newHeight = MAX_DIMENSION;
          newWidth = (videoWidth / videoHeight) * MAX_DIMENSION;
        }
      }

      // Set canvas dimensions to resized dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw video frame to canvas with resizing
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, newWidth, newHeight);

      // Convert to base64 with lower quality (0.6) to reduce file size further
      // This should result in ~50-150KB images instead of 500KB+
      const photoBase64 = canvas.toDataURL("image/jpeg", 0.6);
      setCapturedPhoto(photoBase64);

      // Log image size for debugging
      const sizeInKB = (photoBase64.length * 3) / 4 / 1024;
      console.log(`Captured photo size: ${sizeInKB.toFixed(2)} KB`);

      // Stop camera
      stopCamera();

      toast.success("Photo captured successfully!");
    } catch (error) {
      console.error("Capture error:", error);
      toast.error("Failed to capture photo");
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const handleCameraClose = () => {
    stopCamera();
    setCameraOpen(false);
    setCapturedPhoto(null);
    setCameraError(null);
    setPendingAction(null);
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setCameraError(null);
    startCamera();
  };

  // Open camera for check-in or check-out
  const openCameraForAction = async (action) => {
    setPendingAction(action);
    setCameraOpen(true);
    setCapturedPhoto(null);
    setCameraError(null);

    // Small delay to ensure dialog is open before starting camera
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        if (user?.email && user?.role !== "admin") {
          // Check KYC status first (skip for admins)
          console.log("🔍 Checking KYC status for:", user.email);
          try {
            const kycInfo = await apiService.getKycStatus(user.email);
            console.log("📋 KYC Info received:", kycInfo);

            // IMPORTANT: Only use the status from KYC request, not from Employee model
            // The status must be explicitly 'approved' from the KYC review process
            let kycStatusValue = kycInfo.status;

            // Handle edge cases
            if (
              !kycStatusValue ||
              (kycStatusValue === "pending" &&
                kycInfo.message === "No KYC request found")
            ) {
              kycStatusValue = "not_submitted";
            }

            // Ensure we're using the actual KYC request status
            if (
              kycStatusValue !== "approved" &&
              kycStatusValue !== "rejected" &&
              kycStatusValue !== "pending" &&
              kycStatusValue !== "not_submitted"
            ) {
              console.warn(
                "Unexpected KYC status:",
                kycStatusValue,
                "Defaulting to not_submitted"
              );
              kycStatusValue = "not_submitted";
            }

            setKycStatus(kycStatusValue);
          } catch (kycError) {
            console.error("Error loading KYC status:", kycError);
            setKycStatus("not_submitted");
          }

          // Always load attendance data, regardless of KYC status
          console.log("📊 Loading attendance data for:", user.email);
          try {
            const attendanceData = await apiService.getTodayAttendance(
              user.email
            );
            console.log("✅ Attendance data loaded:", attendanceData);
            setAttendance(attendanceData);
          } catch (attendanceError) {
            console.error("Error loading attendance:", attendanceError);
            // Don't show error if it's just no data
            if (!attendanceError.message.includes("not found")) {
              toast.error("Failed to load attendance data");
            }
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Request location permission early for better accuracy
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          if (result.state === "prompt") {
            // Pre-request permission to improve accuracy
            navigator.geolocation.getCurrentPosition(
              () => console.log("Location permission granted"),
              () => console.log("Location permission denied"),
              { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
          }
        })
        .catch(() => {
          // Permissions API not supported, ignore
        });
    }

    // Cleanup camera stream on unmount
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [user, cameraStream]);

  const handleCheckIn = async () => {
    // Open camera first
    openCameraForAction("checkin");
  };

  const processCheckIn = async (photoBase64) => {
    try {
      setCheckingIn(true);
      clearLocation();

      // Get accurate location - required for check-in
      let locationData = null;
      try {
        toast.info(
          "Please allow location access when prompted by your browser...",
          { duration: 3000 }
        );
        locationData = await getLocationWithAddress();

        console.log("Check-in location data:", locationData);

        // Validate location accuracy - require at least 100m accuracy
        const locationAccuracy = locationData.accuracy || 999;
        if (locationAccuracy > 100) {
          toast.warning(
            `Location accuracy is ${Math.round(
              locationAccuracy
            )}m. For better accuracy, please move to an open area and try again.`,
            { duration: 5000 }
          );
          // Retry with better accuracy
          toast.info("Retrying with high accuracy GPS...", { duration: 2000 });
          await new Promise((resolve) => setTimeout(resolve, 2000));
          locationData = await getLocationWithAddress();

          // Check accuracy again
          const retryAccuracy = locationData.accuracy || 999;
          if (retryAccuracy > 100) {
            toast.warning(
              `Location accuracy is still ${Math.round(
                retryAccuracy
              )}m. Check-in will proceed, but please ensure you're in an open area for accurate tracking.`,
              { duration: 5000 }
            );
          } else {
            toast.success(
              `Location captured with ${Math.round(retryAccuracy)}m accuracy!`,
              { duration: 2000 }
            );
          }
        } else {
          toast.success(
            `Location captured with ${Math.round(locationAccuracy)}m accuracy!`,
            { duration: 2000 }
          );
        }
      } catch (locationError) {
        console.error("Location error:", locationError);

        // Location is optional - allow check-in without it but show warning
        if (
          locationError.message.includes("denied") ||
          locationError.message.includes("permission")
        ) {
          toast.warning(
            "Location permission denied. Check-in will proceed without location data. For better tracking, please allow location access in your browser settings.",
            { duration: 6000 }
          );
          locationData = null; // Set to null to proceed without location
        } else if (locationError.message.includes("timeout")) {
          toast.warning(
            "Location request timed out. Check-in will proceed without location data. For better tracking, please ensure GPS is enabled.",
            { duration: 5000 }
          );
          locationData = null; // Set to null to proceed without location
        } else {
          toast.warning(
            "Unable to get your location. Check-in will proceed without location data.",
            { duration: 5000 }
          );
          locationData = null; // Set to null to proceed without location
        }
      }

      console.log("User email for check-in:", user?.email);
      console.log("Final location data:", locationData);

      // Proceed with check-in (with or without location data, but with photo)
      await apiService.checkIn(locationData || {}, user?.email, photoBase64);

      if (locationData && locationData.latitude && locationData.longitude) {
        const locationInfo =
          locationData.city && locationData.city !== "Unknown City"
            ? ` from ${locationData.city}`
            : ` (Lat: ${locationData.latitude.toFixed(
                6
              )}, Lng: ${locationData.longitude.toFixed(6)})`;
        toast.success(`Checked in successfully${locationInfo}!`, {
          duration: 3000,
        });
      } else {
        toast.success("Checked in successfully! (Location not available)", {
          duration: 3000,
        });
      }

      // Reload attendance data
      const attendanceData = await apiService.getTodayAttendance(user.email);
      setAttendance(attendanceData);

      // Clear captured photo
      setCapturedPhoto(null);
    } catch (err) {
      console.error("Check-in error:", err);
      if (err.message.includes("Location")) {
        toast.error(
          `Location error: ${err.message}. Please enable location access and try again.`
        );
      } else {
        toast.error("Failed to check in");
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    // Open camera first
    openCameraForAction("checkout");
  };

  const processCheckOut = async (photoBase64) => {
    try {
      setCheckingOut(true);
      clearLocation();

      // Get accurate location - required for check-out
      let locationData = null;
      try {
        toast.info(
          "Please allow location access when prompted by your browser...",
          { duration: 3000 }
        );
        locationData = await getLocationWithAddress();

        console.log("Check-out location data:", locationData);

        // Validate location accuracy - require at least 100m accuracy
        const locationAccuracy = locationData.accuracy || 999;
        if (locationAccuracy > 100) {
          toast.warning(
            `Location accuracy is ${Math.round(
              locationAccuracy
            )}m. For better accuracy, please move to an open area and try again.`,
            { duration: 5000 }
          );
          // Retry with better accuracy
          toast.info("Retrying with high accuracy GPS...", { duration: 2000 });
          await new Promise((resolve) => setTimeout(resolve, 2000));
          locationData = await getLocationWithAddress();

          // Check accuracy again
          const retryAccuracy = locationData.accuracy || 999;
          if (retryAccuracy > 100) {
            toast.warning(
              `Location accuracy is still ${Math.round(
                retryAccuracy
              )}m. Check-out will proceed, but please ensure you're in an open area for accurate tracking.`,
              { duration: 5000 }
            );
          } else {
            toast.success(
              `Location captured with ${Math.round(retryAccuracy)}m accuracy!`,
              { duration: 2000 }
            );
          }
        } else {
          toast.success(
            `Location captured with ${Math.round(locationAccuracy)}m accuracy!`,
            { duration: 2000 }
          );
        }
      } catch (locationError) {
        console.error("Location error:", locationError);

        // Location is required - don't allow check-out without it
        if (
          locationError.message.includes("denied") ||
          locationError.message.includes("permission")
        ) {
          toast.error(
            "Location permission is required for check-out. Please click the lock icon in your browser address bar, allow location access, and try again.",
            { duration: 6000 }
          );
          setCheckingOut(false);
          return; // Stop check-out process
        } else if (locationError.message.includes("timeout")) {
          toast.error(
            "Location request timed out. Please ensure GPS is enabled and try again in an open area.",
            { duration: 5000 }
          );
          setCheckingOut(false);
          return; // Stop check-out process
        } else {
          toast.error(
            "Unable to get your location. Please check your device GPS settings and try again.",
            { duration: 5000 }
          );
          setCheckingOut(false);
          return; // Stop check-out process
        }
      }

      // Validate that we have location data
      if (!locationData || !locationData.latitude || !locationData.longitude) {
        toast.error("Location data is incomplete. Please try again.", {
          duration: 3000,
        });
        setCheckingOut(false);
        return;
      }

      console.log("User email for check-out:", user?.email);
      console.log("Final location data:", locationData);

      // Proceed with check-out with location data and photo
      await apiService.checkOut(locationData, user?.email, photoBase64);

      const locationInfo =
        locationData.city && locationData.city !== "Unknown City"
          ? ` from ${locationData.city}`
          : ` (Lat: ${locationData.latitude.toFixed(
              6
            )}, Lng: ${locationData.longitude.toFixed(6)})`;

      toast.success(`Checked out successfully${locationInfo}!`, {
        duration: 3000,
      });

      // Reload attendance data
      const attendanceData = await apiService.getTodayAttendance(user.email);
      setAttendance(attendanceData);

      // Clear captured photo
      setCapturedPhoto(null);
    } catch (err) {
      console.error("Check-out error:", err);
      if (
        err.message.includes("Location") ||
        err.message.includes("location")
      ) {
        toast.error(
          `Location error: ${err.message}. Please enable location access and try again.`
        );
      } else if (err.message.includes("cancelled")) {
        toast.info("Checkout cancelled");
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

  // Show KYC warning banner if not approved, but still show attendance records
  const showKycWarning = kycStatus !== "approved" && kycStatus !== null;

  return (
    <div className="space-y-6">
      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onOpenChange={handleCameraClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {pendingAction === "checkin"
                ? "Check-In Photo"
                : "Check-Out Photo"}
            </DialogTitle>
            <DialogDescription>
              {capturedPhoto
                ? 'Review your photo. Click "Retake" to capture again or "Confirm" to proceed.'
                : 'Please allow camera access and position yourself in the frame. Click "Capture Photo" when ready.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {cameraError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-800">{cameraError}</p>
                </div>
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="mt-3">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : capturedPhoto ? (
              <div className="space-y-4">
                <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={capturedPhoto}
                    alt="Captured photo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleRetakePhoto}
                    variant="outline"
                    className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Retake
                  </Button>
                  <Button
                    onClick={() => {
                      handleCameraClose();
                      if (pendingAction === "checkin") {
                        processCheckIn(capturedPhoto);
                      } else {
                        processCheckOut(capturedPhoto);
                      }
                    }}
                    className="flex-1"
                    disabled={checkingIn || checkingOut}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm &{" "}
                    {pendingAction === "checkin" ? "Check In" : "Check Out"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!cameraStream && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Starting camera...</p>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={capturePhoto}
                  disabled={!cameraStream || isCapturing}
                  className="w-full"
                  size="lg">
                  {isCapturing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Capture Photo
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleCameraClose} variant="outline">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* KYC Warning Banner */}
      {showKycWarning && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800">
                  KYC Required
                </h3>
                <p className="text-sm text-yellow-700">
                  You need to complete and get your KYC approved to use
                  check-in/check-out features.
                </p>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                <a href="/profile">Complete KYC</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendance ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">Check In</p>
                      {attendance.isLate && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Late
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {attendance.checkIn
                        ? new Date(attendance.checkIn).toLocaleTimeString()
                        : "Not checked in"}
                    </p>
                    {attendance.isLate && attendance.checkIn && (
                      <p className="text-xs text-red-600 mt-1">
                        Expected: 10:00 AM
                      </p>
                    )}
                    {attendance.checkInPhoto && (
                      <div className="mt-2">
                        <img
                          src={attendance.checkInPhoto}
                          alt="Check-in photo"
                          className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            // Open full-size image in new window
                            const newWindow = window.open();
                            if (newWindow) {
                              newWindow.document.write(
                                `<img src="${attendance.checkInPhoto}" style="max-width:100%; height:auto;" />`
                              );
                            }
                          }}
                          title="Click to view full size"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-red-500" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">Check Out</p>
                      {attendance.checkoutType === "auto-midnight" && (
                        <Badge variant="secondary" className="text-xs">
                          Auto
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {attendance.checkOut
                        ? new Date(attendance.checkOut).toLocaleTimeString()
                        : "Not checked out"}
                    </p>
                    {attendance.checkoutType === "auto-midnight" && (
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-checkout (midnight reset)
                      </p>
                    )}
                    {attendance.checkOutPhoto && (
                      <div className="mt-2">
                        <img
                          src={attendance.checkOutPhoto}
                          alt="Check-out photo"
                          className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            // Open full-size image in new window
                            const newWindow = window.open();
                            if (newWindow) {
                              newWindow.document.write(
                                `<img src="${attendance.checkOutPhoto}" style="max-width:100%; height:auto;" />`
                              );
                            }
                          }}
                          title="Click to view full size"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge
                      variant={
                        attendance.status === "present"
                          ? "default"
                          : "secondary"
                      }>
                      {attendance.status === "present" ? (
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
                    <Navigation className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Check-in Location</p>
                      <p className="text-xs text-gray-600 truncate">
                        {attendance.checkInAddress ||
                          `${attendance.checkInLatitude}, ${attendance.checkInLongitude}`}
                      </p>
                    </div>
                  </div>
                )}

                {attendance.checkOutLatitude &&
                  attendance.checkOutLongitude && (
                    <div className="flex items-center space-x-3">
                      <Navigation className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">
                          Check-out Location
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {attendance.checkOutAddress ||
                            `${attendance.checkOutLatitude}, ${attendance.checkOutLongitude}`}
                        </p>
                      </div>
                    </div>
                  )}
              </div>

              <div className="space-y-4">
                {/* Location Status */}
                {location && (
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Map className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary">
                          Current Location
                        </p>
                        <p className="text-xs text-primary/80">
                          {location.fullAddress}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge
                            variant={
                              getAccuracyStatus() === "excellent"
                                ? "default"
                                : getAccuracyStatus() === "good"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs">
                            {getAccuracyStatus().toUpperCase()} (
                            {Math.round(accuracy)}m)
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
                      disabled={
                        checkingIn ||
                        locationLoading ||
                        kycStatus !== "approved"
                      }
                      className="flex items-center space-x-2"
                      title={
                        kycStatus !== "approved"
                          ? "KYC approval required to check in"
                          : ""
                      }>
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
                      disabled={
                        checkingOut ||
                        locationLoading ||
                        kycStatus !== "approved"
                      }
                      className="flex items-center space-x-2"
                      title={
                        kycStatus !== "approved"
                          ? "KYC approval required to check out"
                          : ""
                      }>
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
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg max-w-md mx-auto">
                  <div className="flex items-center space-x-2">
                    <Map className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary">
                        Ready to Check In
                      </p>
                      <p className="text-xs text-primary/80">
                        {location.fullAddress}
                      </p>
                      <Badge
                        variant={
                          getAccuracyStatus() === "excellent"
                            ? "default"
                            : getAccuracyStatus() === "good"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs mt-1">
                        {getAccuracyStatus().toUpperCase()} (
                        {Math.round(accuracy)}m)
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleCheckIn}
                disabled={
                  checkingIn || locationLoading || kycStatus !== "approved"
                }
                className="flex items-center space-x-2 mx-auto"
                title={
                  kycStatus !== "approved"
                    ? "KYC approval required to check in"
                    : ""
                }>
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
              <p className="text-2xl font-bold text-primary">22</p>
              <p className="text-sm text-gray-600">Days Present</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-red-600">1</p>
              <p className="text-sm text-gray-600">Days Absent</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-accent">95.7%</p>
              <p className="text-sm text-gray-600">Attendance Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
