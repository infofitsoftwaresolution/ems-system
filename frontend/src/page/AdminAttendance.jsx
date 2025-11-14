import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Users
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

export default function AdminAttendance() {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");

  // Load attendance data
  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all attendance data
        const data = await apiService.getAllAttendance(dateFilter);
        setAttendanceData(data);
      } catch (err) {
        console.error('Error loading attendance data:', err);
        setError('Failed to load attendance data');
        toast.error('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };
    
    loadAttendanceData();
  }, [dateFilter]);

  // Handle search
  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm("");
    setAppliedSearchTerm("");
  };

  // Filter attendance data
  const filteredAttendance = attendanceData.filter(record => {
    if (!appliedSearchTerm) return true;
    const matchesSearch = record.name?.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
                         record.email?.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
                         record.employeeId?.toLowerCase().includes(appliedSearchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Present</Badge>;
      case 'absent':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Absent</Badge>;
      case 'half-day':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Half Day</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get location display
  const getLocationDisplay = (latitude, longitude, address) => {
    if (!latitude || !longitude) return 'No location data';
    return address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  };

  // Export attendance data
  const exportAttendanceData = () => {
    const csvContent = [
      ['Date', 'Employee Name/ID', 'Email', 'Check In', 'Check Out', 'Status', 'Check In Location', 'Check Out Location'],
      ...filteredAttendance.map(record => [
        formatDate(record.date),
        record.name || record.employeeId || record.email.split('@')[0] || 'N/A',
        record.email || 'N/A',
        formatTime(record.checkIn),
        formatTime(record.checkOut),
        record.status || 'N/A',
        getLocationDisplay(record.checkInLatitude, record.checkInLongitude, record.checkInAddress),
        getLocationDisplay(record.checkOutLatitude, record.checkOutLongitude, record.checkOutAddress)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${dateFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Attendance data exported successfully!');
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

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Attendance</h1>
          <p className="text-muted-foreground">
            View and manage employee attendance with location tracking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={exportAttendanceData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  variant="default"
                  className="px-4"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                {appliedSearchTerm && (
                  <Button
                    onClick={handleClearSearch}
                    variant="outline"
                    size="icon"
                    title="Clear search"
                  >
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
            <div className="space-y-2">
              <Label htmlFor="dateFilter">Date Range</Label>
              <select
                id="dateFilter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Total Records</Label>
              <div className="text-2xl font-bold">{filteredAttendance.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Attendance Records
          </CardTitle>
          <CardDescription>
            Employee attendance with location tracking data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
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
                      <p className="font-medium">{record.name || record.employeeId || record.email.split('@')[0] || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{record.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatTime(record.checkIn)}</p>
                      {record.checkInLatitude && record.checkInLongitude && (
                        <p className="text-xs text-gray-500">
                          <Navigation className="h-3 w-3 inline mr-1" />
                          {getLocationDisplay(record.checkInLatitude, record.checkInLongitude, record.checkInAddress)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatTime(record.checkOut)}</p>
                      {record.checkOutLatitude && record.checkOutLongitude && (
                        <p className="text-xs text-gray-500">
                          <Navigation className="h-3 w-3 inline mr-1" />
                          {getLocationDisplay(record.checkOutLatitude, record.checkOutLongitude, record.checkOutAddress)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>
                    {record.checkInLatitude && record.checkInLongitude ? (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-green-500" />
                        <span className="text-xs">
                          {record.checkInAddress || 'Location Available'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No location</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.checkOutLatitude && record.checkOutLongitude ? (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-red-500" />
                        <span className="text-xs">
                          {record.checkOutAddress || 'Location Available'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No location</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAttendance(record)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Attendance Details</DialogTitle>
                          <DialogDescription>
                            Complete attendance record for {record.name || record.employeeId || record.email.split('@')[0] || 'Employee'} on {formatDate(record.date)}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Employee Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold">Employee Name/ID</Label>
                              <p>{record.name || record.employeeId || record.email.split('@')[0] || 'N/A'}</p>
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
                            <Label className="font-semibold">Check In Details</Label>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <div>
                                <p className="text-sm text-gray-600">Time</p>
                                <p className="font-medium">{formatTime(record.checkIn)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Location</p>
                                <p className="font-medium">
                                  {record.checkInAddress || 'No address available'}
                                </p>
                                {record.checkInLatitude && record.checkInLongitude && (
                                  <p className="text-xs text-gray-500">
                                    {record.checkInLatitude.toFixed(6)}, {record.checkInLongitude.toFixed(6)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Check Out Details */}
                          <div>
                            <Label className="font-semibold">Check Out Details</Label>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <div>
                                <p className="text-sm text-gray-600">Time</p>
                                <p className="font-medium">{formatTime(record.checkOut)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Location</p>
                                <p className="font-medium">
                                  {record.checkOutAddress || 'No address available'}
                                </p>
                                {record.checkOutLatitude && record.checkOutLongitude && (
                                  <p className="text-xs text-gray-500">
                                    {record.checkOutLatitude.toFixed(6)}, {record.checkOutLongitude.toFixed(6)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Notes */}
                          {record.notes && (
                            <div>
                              <Label className="font-semibold">Notes</Label>
                              <p className="mt-1 p-2 bg-gray-50 rounded">{record.notes}</p>
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
          
          {filteredAttendance.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance records found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters or date range</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
