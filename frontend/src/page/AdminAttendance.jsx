import { useState, useEffect, useCallback, startTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  AlertCircle,
  Navigation,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Users,
  Camera,
  ExternalLink,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

// Late check-in rule: after 11:00 AM (Asia/Kolkata) is late; at/before 11:00 AM is on-time.
const LATE_TIMEZONE = "Asia/Kolkata";
const LATE_CUTOFF_HOUR = 11;

const toTimeZoneDate = (date, timeZone = LATE_TIMEZONE) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  const isoLike = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  return new Date(isoLike);
};

const isLateCheckInClient = (checkIn) => {
  if (!checkIn) return false;
  const checkInDate = new Date(checkIn);
  if (Number.isNaN(checkInDate.getTime())) return false;
  const localCheckIn = toTimeZoneDate(checkInDate);
  const cutoff = new Date(localCheckIn);
  cutoff.setHours(LATE_CUTOFF_HOUR, 0, 0, 0);
  return localCheckIn > cutoff;
};

export default function AdminAttendance() {
  const { user } = useAuth();

  // Check if user has permission to export (admin, manager, or HR)
  const canExport =
    user?.role === "admin" || user?.role === "manager" || user?.role === "hr";
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("today"); // Default to "today" to show only today's records
  const [selectedDate, setSelectedDate] = useState(""); // For specific date filter
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState(null); // For image lightbox
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Load attendance data - now includes search and date filters from backend
  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Loading attendance data with filters:", {
          dateFilter,
          search: appliedSearchTerm,
          date: selectedDate,
        });
        // Get all attendance data with error handling
        let data = [];
        try {
          // Determine which date filter to use: specific date takes priority
          const dateFilterToUse = selectedDate ? "all" : dateFilter;
          const dateToUse = selectedDate || "";
          data = await apiService.getAllAttendance(
            dateFilterToUse,
            appliedSearchTerm,
            dateToUse
          );
          console.log("Attendance data received:", data);
          console.log("Number of records:", data?.length || 0);
        } catch (apiError) {
          console.error("Error fetching attendance from API:", apiError);
          console.error("Error details:", {
            message: apiError.message,
            stack: apiError.stack,
            response: apiError.response,
          });
          // Set error but don't crash - show empty state
          setError(apiError.message || "Failed to load attendance data");
          toast.error(apiError.message || "Failed to load attendance data");
          data = []; // Default to empty array
        }

        // Ensure data is an array - use startTransition for large datasets
        if (Array.isArray(data)) {
          // Use startTransition for large datasets to avoid blocking
          if (data.length > 50) {
            startTransition(() => {
              setAttendanceData(data);
            });
          } else {
            setAttendanceData(data);
          }
        } else {
          console.warn("Received non-array data:", data);
          setAttendanceData([]);
          setError("Invalid data format received from server");
        }
      } catch (err) {
        console.error("Unexpected error loading attendance data:", err);
        setError(err.message || "Failed to load attendance data");
        toast.error(err.message || "Failed to load attendance data");
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };

    loadAttendanceData();
  }, [dateFilter, appliedSearchTerm, selectedDate]);

  // Debounce search input to improve performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setAppliedSearchTerm(searchTerm);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle search - memoized (for button click)
  const handleSearch = useCallback(() => {
    setAppliedSearchTerm(searchTerm);
  }, [searchTerm]);

  // Handle clear search - memoized
  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
    setAppliedSearchTerm("");
  }, []);

  // Handle refresh - memoized
  const handleRefresh = useCallback(() => {
    setDateFilter("today");
    setSelectedDate("");
    setSearchTerm("");
    setAppliedSearchTerm("");
  }, []);

  // Format time - memoized
  const formatTime = useCallback((timeString) => {
    if (!timeString) return "N/A";
    try {
      return new Date(timeString).toLocaleTimeString();
    } catch (e) {
      return "N/A";
    }
  }, []);

  // Format date for display - memoized
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return "N/A";
    }
  }, []);

  // Format date for CSV (date only, YYYY-MM-DD format)
  const formatDateForCSV = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (e) {
      return "N/A";
    }
  };

  // Calculate time between check in and check out
  const calculateWorkingHours = (checkIn, checkOut) => {
    // If only checkIn exists (incomplete record), return "Pending"
    if (checkIn && !checkOut) {
      return "Pending";
    }

    // If both exist, calculate the difference
    if (!checkIn || !checkOut) return "N/A";

    try {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      const diffMs = checkOutTime - checkInTime;

      if (diffMs < 0) return "N/A"; // Invalid if check out is before check in

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      // Format as HH:MM:SS
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`;
    } catch (e) {
      return "N/A";
    }
  };

  // No client-side filtering needed - backend handles all filtering
  // filteredAttendance is just attendanceData since filtering is done server-side
  const filteredAttendance = attendanceData;

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "checked_in":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Checked In
          </Badge>
        );
      case "present":
        return (
          <Badge variant="default" className="bg-primary">
            <CheckCircle className="h-3 w-3 mr-1" />
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Absent
          </Badge>
        );
      case "half-day":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Half Day
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get location display
  const getLocationDisplay = (latitude, longitude, address) => {
    if (!latitude || !longitude) return "No location data";
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng)) return "Invalid location data";
    return address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Open map link
  const openMapLink = (latitude, longitude) => {
    if (!latitude || !longitude) return;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng)) return;
    // Open in Google Maps
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Open image in lightbox
  const openImageModal = (imageSrc, title) => {
    setSelectedImage({ src: imageSrc, title });
    setImageModalOpen(true);
  };

  // Close image modal
  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

  // Export single employee attendance data
  const exportSingleEmployeeAttendance = (record) => {
    // Calculate isLate if not present (for older records)
    let isLate = record.isLate;
    if (isLate === null || isLate === undefined) {
      isLate = isLateCheckInClient(record.checkIn);
    }

    // Helper function to escape CSV values
    const escapeCsvValue = (value) => {
      const stringValue = String(value || "N/A");
      // Escape quotes by doubling them and wrap in quotes
      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    // Get employee ID separately
    const employeeId = record.employeeId || record.emp_id || "N/A";
    const employeeName =
      record.name ||
      record.employeeId ||
      record.email?.split("@")[0] ||
      "employee";

    // Calculate working hours - use backend value if available, otherwise calculate
    const workingHours =
      record.workingHours ||
      calculateWorkingHours(record.checkIn, record.checkOut);

    // Format checkout type: Normal / Auto-checkout / Manual
    let checkoutType = "Normal";
    if (record.checkoutType === "auto-midnight") {
      checkoutType = "Auto-checkout";
    } else if (record.checkoutType === "manual") {
      checkoutType = "Manual";
    } else if (record.checkoutType === "normal" || !record.checkoutType) {
      checkoutType = "Normal";
    } else if (record.checkoutType) {
      // Map other values
      const typeMap = {
        auto: "Auto-checkout",
        "auto-midnight": "Auto-checkout",
        manual: "Manual",
      };
      checkoutType =
        typeMap[record.checkoutType.toLowerCase()] || record.checkoutType;
    }

    // Format dates of joining and leaving - fetch from record data
    // Debug: Log what we're receiving
    if (process.env.NODE_ENV === "development") {
      console.log("📅 Record data for CSV export:", {
        email: record.email,
        hireDate: record.hireDate,
        dateOfJoining: record.dateOfJoining,
        leaveDate: record.leaveDate,
        dateOfLeaving: record.dateOfLeaving,
        allKeys: Object.keys(record),
      });
    }

    const dateOfJoining =
      record.hireDate || record.dateOfJoining
        ? formatDateForCSV(record.hireDate || record.dateOfJoining)
        : "N/A";
    const dateOfLeaving =
      record.leaveDate || record.dateOfLeaving
        ? formatDateForCSV(record.leaveDate || record.dateOfLeaving)
        : "N/A";

    // Get mobile number
    const mobileNumber = record.mobileNumber || record.mobile_number || "N/A";

    const csvRows = [
      [
        "Date",
        "Employee ID",
        "Employee Name",
        "Email",
        "Mobile Number",
        "Date of Joining",
        "Date of Leaving",
        "Check In Time",
        "Check In Date & Time",
        "Check In Address",
        "Late",
        "Check Out Time",
        "Check Out Date & Time",
        "Check Out Address",
        "Working Hours",
        "Checkout Type",
        "Status",
      ],
      [
        formatDateForCSV(record.date),
        employeeId,
        employeeName,
        record.email || "N/A",
        mobileNumber,
        dateOfJoining,
        dateOfLeaving,
        formatTime(record.checkIn),
        record.checkIn ? new Date(record.checkIn).toLocaleString() : "N/A",
        record.checkInAddress || "N/A",
        isLate ? "Yes" : "No",
        formatTime(record.checkOut),
        record.checkOut ? new Date(record.checkOut).toLocaleString() : "N/A",
        record.checkOutAddress || "N/A",
        workingHours,
        checkoutType,
        record.status || "N/A",
      ],
    ];

    const csvContent = csvRows
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = formatDate(record.date).replace(/\//g, "-");
    a.download = `attendance-${employeeName}-${dateStr}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(
      `Attendance record for ${employeeName} exported successfully!`
    );
  };

  // Export attendance data (all employees)
  const exportAttendanceData = () => {
    // Helper function to escape CSV values
    const escapeCsvValue = (value) => {
      const stringValue = String(value || "N/A");
      // Escape quotes by doubling them and wrap in quotes
      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const csvRows = [
      [
        "Date",
        "Employee ID",
        "Employee Name",
        "Email",
        "Mobile Number",
        "Date of Joining",
        "Date of Leaving",
        "Check In Time",
        "Check In Date & Time",
        "Check In Address",
        "Late",
        "Check Out Time",
        "Check Out Date & Time",
        "Check Out Address",
        "Working Hours",
        "Checkout Type",
        "Status",
      ],
      ...filteredAttendance.map((record) => {
        // Calculate isLate if not present (for older records)
        let isLate = record.isLate;
        if (isLate === null || isLate === undefined) {
          isLate = isLateCheckInClient(record.checkIn);
        }

        // Get employee ID separately
        const employeeId = record.employeeId || record.emp_id || "N/A";
        const employeeName = record.name || "N/A";

        // Get mobile number
        const mobileNumber =
          record.mobileNumber || record.mobile_number || "N/A";

        // Format dates of joining and leaving - fetch from record data
        // Debug: Log what we're receiving (only for first record to avoid spam)
        if (
          process.env.NODE_ENV === "development" &&
          filteredAttendance.indexOf(record) === 0
        ) {
          console.log("📅 First record data for CSV export:", {
            email: record.email,
            hireDate: record.hireDate,
            dateOfJoining: record.dateOfJoining,
            leaveDate: record.leaveDate,
            dateOfLeaving: record.dateOfLeaving,
            mobileNumber: mobileNumber,
          });
        }

        const dateOfJoining =
          record.hireDate || record.dateOfJoining
            ? formatDateForCSV(record.hireDate || record.dateOfJoining)
            : "N/A";
        const dateOfLeaving =
          record.leaveDate || record.dateOfLeaving
            ? formatDateForCSV(record.leaveDate || record.dateOfLeaving)
            : "N/A";

        // Calculate working hours - use backend value if available, otherwise calculate
        const workingHours =
          record.workingHours ||
          calculateWorkingHours(record.checkIn, record.checkOut);

        // Format checkout type: Normal / Auto-checkout / Manual
        let checkoutType = "Normal";
        if (record.checkoutType === "auto-midnight") {
          checkoutType = "Auto-checkout";
        } else if (record.checkoutType === "manual") {
          checkoutType = "Manual";
        } else if (record.checkoutType === "normal" || !record.checkoutType) {
          checkoutType = "Normal";
        } else if (record.checkoutType) {
          // Map other values
          const typeMap = {
            auto: "Auto-checkout",
            "auto-midnight": "Auto-checkout",
            manual: "Manual",
          };
          checkoutType =
            typeMap[record.checkoutType.toLowerCase()] || record.checkoutType;
        }

        return [
          formatDateForCSV(record.date),
          employeeId,
          employeeName,
          record.email || "N/A",
          mobileNumber,
          dateOfJoining,
          dateOfLeaving,
          formatTime(record.checkIn),
          record.checkIn ? new Date(record.checkIn).toLocaleString() : "N/A",
          record.checkInAddress || "N/A",
          isLate ? "Yes" : "No",
          formatTime(record.checkOut),
          record.checkOut ? new Date(record.checkOut).toLocaleString() : "N/A",
          record.checkOutAddress || "N/A",
          workingHours,
          checkoutType,
          record.status || "N/A",
        ];
      }),
    ];

    const csvContent = csvRows
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${dateFilter}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Attendance data exported successfully!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  // Don't block the entire page on error - show error banner instead
  // The page will still render with empty data

  return (
    <div className="space-y-6">
      {/* Image Lightbox Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedImage?.title || "Photo"}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeImageModal}
                className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            {selectedImage && (
              <div className="relative w-full bg-black rounded-lg overflow-hidden">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
          <Button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            variant="outline"
            size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between max-w-[80%]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Employee Attendance
          </h1>
          <p className="text-muted-foreground">
            View and manage employee attendance with location tracking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            title="Refresh data">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {canExport && (
            <Button
              onClick={exportAttendanceData}
              variant="outline"
              disabled={filteredAttendance.length === 0}
              title="Download all attendance records as CSV">
              <Download className="h-4 w-4 mr-2" />
              Export All CSV
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="max-w-[80%]">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            <div className="space-y-2 md:col-span-2 lg:col-span-6">
              <Label htmlFor="search">Search</Label>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, or ID..."
                    value={searchTerm}
                    onChange={(e) => {
                      // Immediate update for controlled input, filtering is debounced
                      setSearchTerm(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    className="pl-10 w-full"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  variant="default"
                  className="px-4 flex-shrink-0">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                {appliedSearchTerm && (
                  <Button
                    onClick={handleClearSearch}
                    variant="outline"
                    size="icon"
                    title="Clear search"
                    className="flex-shrink-0">
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {appliedSearchTerm && (
                <p className="text-sm text-muted-foreground">
                  Showing results for: <strong>{appliedSearchTerm}</strong>
                </p>
              )}
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="dateFilter">Date Range</Label>
              <select
                id="dateFilter"
                value={dateFilter}
                onChange={(e) => {
                  // Use startTransition to mark as non-urgent update
                  const value = e.target.value;
                  startTransition(() => {
                    setDateFilter(value);
                    setSelectedDate(""); // Clear specific date when changing range filter
                  });
                }}
                className="w-full p-2 border rounded-md">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="specificDate">Specific Date</Label>
              <Input
                id="specificDate"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  // Use startTransition to mark as non-urgent update
                  const value = e.target.value;
                  startTransition(() => {
                    setSelectedDate(value);
                    if (value) {
                      setDateFilter("all"); // Switch to "all" when specific date is selected
                    }
                  });
                }}
                className="w-full"
              />
              {selectedDate && (
                <Button
                  onClick={() => setSelectedDate("")}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
                  Clear
                </Button>
              )}
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Total Records</Label>
              <div className="text-2xl font-bold">
                {filteredAttendance.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="rounded-xl shadow-lg max-w-[80%]">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Attendance Records
          </CardTitle>
          <CardDescription>
            Employee attendance with location tracking data
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
          <div className="overflow-x-auto -mx-2 sm:-mx-4 md:-mx-6 px-2 sm:px-4 md:px-6">
            <Table className="min-w-[800px] sm:min-w-0">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check In Photo</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Check Out Photo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Check In Location</TableHead>
                  <TableHead>Check Out Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.map((record) => (
                  <TableRow key={`${record.email}-${record.date}`}>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {record.name ||
                            record.employeeId ||
                            record.email.split("@")[0] ||
                            "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">{record.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">
                            {formatTime(record.checkIn)}
                          </p>
                          {(() => {
                            // Calculate isLate if not present (for older records)
                            let isLate = record.isLate;
                            if (isLate === null || isLate === undefined) {
                              isLate = isLateCheckInClient(record.checkIn);
                            }
                            return isLate ? (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Late
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.checkInPhoto ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={record.checkInPhoto}
                            alt="Check-in photo"
                            className="w-12 h-12 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() =>
                              openImageModal(
                                record.checkInPhoto,
                                `Check-in Photo - ${
                                  record.name || record.email
                                }`
                              )
                            }
                            title="Click to view full size"
                          />
                          <Camera className="h-3 w-3 text-gray-400" />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No photo</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">
                            {formatTime(record.checkOut)}
                          </p>
                          {record.checkoutType === "auto-midnight" && (
                            <Badge variant="secondary" className="text-xs">
                              Auto
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.checkOutPhoto ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={record.checkOutPhoto}
                            alt="Check-out photo"
                            className="w-12 h-12 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() =>
                              openImageModal(
                                record.checkOutPhoto,
                                `Check-out Photo - ${
                                  record.name || record.email
                                }`
                              )
                            }
                            title="Click to view full size"
                          />
                          <Camera className="h-3 w-3 text-gray-400" />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No photo</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      {(() => {
                        // Calculate isLate if not present (for older records)
                        let isLate = record.isLate;
                        if (isLate === null || isLate === undefined) {
                          isLate = isLateCheckInClient(record.checkIn);
                        }

                        return isLate ? (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Late
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">On Time</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {record.checkInLatitude && record.checkInLongitude ? (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          <button
                            onClick={() =>
                              openMapLink(
                                record.checkInLatitude,
                                record.checkInLongitude
                              )
                            }
                            className="text-xs text-primary hover:text-primary/80 hover:underline flex items-center space-x-1"
                            title="Open in Google Maps">
                            <span>
                              {record.checkInAddress || "View on Map"}
                            </span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          No location
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.checkOutLatitude && record.checkOutLongitude ? (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-red-500" />
                          <button
                            onClick={() =>
                              openMapLink(
                                record.checkOutLatitude,
                                record.checkOutLongitude
                              )
                            }
                            className="text-xs text-primary hover:text-primary/80 hover:underline flex items-center space-x-1"
                            title="Open in Google Maps">
                            <span>
                              {record.checkOutAddress || "View on Map"}
                            </span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          No location
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAttendance(record)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Attendance Details</DialogTitle>
                            <DialogDescription>
                              Complete attendance record for{" "}
                              {record.name ||
                                record.employeeId ||
                                record.email.split("@")[0] ||
                                "Employee"}{" "}
                              on {formatDate(record.date)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Employee Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="font-semibold">
                                  Employee Name/ID
                                </Label>
                                <p>
                                  {record.name ||
                                    record.employeeId ||
                                    record.email.split("@")[0] ||
                                    "N/A"}
                                </p>
                              </div>
                              <div>
                                <Label className="font-semibold">Email</Label>
                                <p>{record.email}</p>
                              </div>
                              <div>
                                <Label className="font-semibold">Date</Label>
                                <p>{formatDate(record.date)}</p>
                              </div>
                              <div>
                                <Label className="font-semibold">Status</Label>
                                <div>{getStatusBadge(record.status)}</div>
                              </div>
                            </div>

                            {/* Check In Details */}
                            <div>
                              <Label className="font-semibold">
                                Check In Details
                              </Label>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm text-gray-600">
                                      Time
                                    </p>
                                    {(() => {
                                      // Calculate isLate if not present (for older records)
                                      let isLate = record.isLate;
                                      if (
                                        isLate === null ||
                                        isLate === undefined
                                      ) {
                                        isLate = isLateCheckInClient(
                                          record.checkIn
                                        );
                                      }
                                      return isLate ? (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs">
                                          <AlertCircle className="h-3 w-3 mr-1" />
                                          Late
                                        </Badge>
                                      ) : null;
                                    })()}
                                  </div>
                                  <p className="font-medium">
                                    {formatTime(record.checkIn)}
                                  </p>
                                  {(() => {
                                    // Calculate isLate if not present (for older records)
                                    let isLate = record.isLate;
                                    if (
                                      isLate === null ||
                                      isLate === undefined
                                    ) {
                                      isLate = isLateCheckInClient(
                                        record.checkIn
                                      );
                                    }
                                    return isLate ? (
                                      <p className="text-xs text-red-600 mt-1">
                                        Expected: 11:00 AM
                                      </p>
                                    ) : null;
                                  })()}
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Location
                                  </p>
                                  {record.checkInLatitude &&
                                  record.checkInLongitude ? (
                                    <button
                                      onClick={() =>
                                        openMapLink(
                                          record.checkInLatitude,
                                          record.checkInLongitude
                                        )
                                      }
                                      className="text-primary hover:text-primary/80 hover:underline flex items-center space-x-1 text-left"
                                      title="Open in Google Maps">
                                      <span className="font-medium">
                                        {record.checkInAddress || "View on Map"}
                                      </span>
                                      <ExternalLink className="h-3 w-3" />
                                    </button>
                                  ) : (
                                    <p className="font-medium">
                                      No address available
                                    </p>
                                  )}
                                  {record.checkInLatitude &&
                                    record.checkInLongitude && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {Number(record.checkInLatitude).toFixed(
                                          6
                                        )}
                                        ,{" "}
                                        {Number(
                                          record.checkInLongitude
                                        ).toFixed(6)}
                                      </p>
                                    )}
                                </div>
                              </div>
                              {record.checkInPhoto && (
                                <div className="mt-3">
                                  <p className="text-sm text-gray-600 mb-2">
                                    Check-in Photo
                                  </p>
                                  <img
                                    src={record.checkInPhoto}
                                    alt="Check-in photo"
                                    className="w-32 h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() =>
                                      openImageModal(
                                        record.checkInPhoto,
                                        `Check-in Photo - ${
                                          record.name || record.email
                                        }`
                                      )
                                    }
                                    title="Click to view full size"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Check Out Details */}
                            <div>
                              <Label className="font-semibold">
                                Check Out Details
                              </Label>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm text-gray-600">
                                      Time
                                    </p>
                                    {record.checkoutType ===
                                      "auto-midnight" && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs">
                                        Auto
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="font-medium">
                                    {formatTime(record.checkOut)}
                                  </p>
                                  {record.checkoutType === "auto-midnight" && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Auto-checkout (midnight reset)
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Location
                                  </p>
                                  {record.checkOutLatitude &&
                                  record.checkOutLongitude ? (
                                    <button
                                      onClick={() =>
                                        openMapLink(
                                          record.checkOutLatitude,
                                          record.checkOutLongitude
                                        )
                                      }
                                      className="text-primary hover:text-primary/80 hover:underline flex items-center space-x-1 text-left"
                                      title="Open in Google Maps">
                                      <span className="font-medium">
                                        {record.checkOutAddress ||
                                          "View on Map"}
                                      </span>
                                      <ExternalLink className="h-3 w-3" />
                                    </button>
                                  ) : (
                                    <p className="font-medium">
                                      No address available
                                    </p>
                                  )}
                                  {record.checkOutLatitude &&
                                    record.checkOutLongitude && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {Number(
                                          record.checkOutLatitude
                                        ).toFixed(6)}
                                        ,{" "}
                                        {Number(
                                          record.checkOutLongitude
                                        ).toFixed(6)}
                                      </p>
                                    )}
                                </div>
                              </div>
                              {record.checkOutPhoto && (
                                <div className="mt-3">
                                  <p className="text-sm text-gray-600 mb-2">
                                    Check-out Photo
                                  </p>
                                  <img
                                    src={record.checkOutPhoto}
                                    alt="Check-out photo"
                                    className="w-32 h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() =>
                                      openImageModal(
                                        record.checkOutPhoto,
                                        `Check-out Photo - ${
                                          record.name || record.email
                                        }`
                                      )
                                    }
                                    title="Click to view full size"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            {record.notes && (
                              <div>
                                <Label className="font-semibold">Notes</Label>
                                <p className="mt-1 p-2 bg-gray-50 rounded">
                                  {record.notes}
                                </p>
                              </div>
                            )}

                            {/* Download Button for Single Employee */}
                            {canExport && (
                              <div className="flex justify-end pt-4 border-t">
                                <Button
                                  onClick={() =>
                                    exportSingleEmployeeAttendance(record)
                                  }
                                  variant="outline"
                                  className="flex items-center space-x-2">
                                  <Download className="h-4 w-4" />
                                  <span>Download This Record (CSV)</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAttendance.length === 0 && !loading && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                No attendance records found
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {appliedSearchTerm
                  ? `No records match your search for "${appliedSearchTerm}"`
                  : dateFilter === "today"
                  ? "No attendance records for today. Try selecting 'All Time' to see all records."
                  : "No attendance records found for the selected date range. Try adjusting your filters."}
              </p>
              <div className="flex justify-center gap-2">
                {appliedSearchTerm && (
                  <Button
                    onClick={handleClearSearch}
                    variant="outline"
                    size="sm">
                    Clear Search
                  </Button>
                )}
                {dateFilter !== "all" && (
                  <Button
                    onClick={() => {
                      setDateFilter("all");
                      setSelectedDate("");
                    }}
                    variant="outline"
                    size="sm">
                    Show All Records
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setDateFilter("today");
                    setSelectedDate("");
                    setSearchTerm("");
                    setAppliedSearchTerm("");
                  }}
                  variant="default"
                  size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
