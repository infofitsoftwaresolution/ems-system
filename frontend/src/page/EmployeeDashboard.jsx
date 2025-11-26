import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Settings,
  Bell,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  CheckSquare
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiService } from "@/lib/api";
import { Link } from "react-router-dom";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState({
    today: "Not checked in",
    thisWeek: 0,
    thisMonth: 0
  });
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  const loadAttendanceData = useCallback(async () => {
    try {
      if (user?.email) {
        const todayAttendance = await apiService.getTodayAttendance(user.email);
        // Use employee-specific endpoint instead of admin endpoint
        const userAttendance = await apiService.getMyAttendance('all');
        
        // Calculate this week's attendance
        const thisWeek = userAttendance.filter(att => {
          const attDate = new Date(att.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return attDate >= weekAgo;
        }).length;
        
        // Calculate this month's attendance
        const thisMonth = userAttendance.filter(att => {
          const attDate = new Date(att.date);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return attDate >= monthAgo;
        }).length;
        
        setAttendance({
          today: todayAttendance ? (todayAttendance.checkIn ? "Present" : "Not checked in") : "Not checked in",
          thisWeek,
          thisMonth
        });
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  }, [user?.email]);

  const loadKycStatus = useCallback(async () => {
    try {
      setLoading(true);
      if (user?.email) {
        console.log('Loading KYC status for user:', user.email);
        const kycInfo = await apiService.getKycStatus(user.email);
        console.log('Dashboard KYC Info:', kycInfo);
        
        // Handle different possible status values
        if (!kycInfo || !kycInfo.status) {
          setKycStatus('not_submitted');
        } else {
          // IMPORTANT: Only use the status from KYC request, not from Employee model
          // The status must be explicitly 'approved' from the KYC review process
          let frontendStatus = kycInfo.status;
          
          // Handle edge cases
          if (kycInfo.status === 'pending' && kycInfo.message === 'No KYC request found') {
            frontendStatus = 'not_submitted';
          }
          
          // Ensure we're using the actual KYC request status, not a default
          // Only 'approved' status means it's been reviewed and approved by admin
          if (frontendStatus !== 'approved' && frontendStatus !== 'rejected' && frontendStatus !== 'pending' && frontendStatus !== 'not_submitted') {
            console.warn('Unexpected KYC status:', frontendStatus, 'Defaulting to not_submitted');
            frontendStatus = 'not_submitted';
          }
          
          setKycStatus(frontendStatus);
        }
      }
    } catch (err) {
      console.error('Error loading KYC status:', err);
      setKycStatus('not_submitted');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  const loadUpcomingEvents = useCallback(async () => {
    try {
      if (user?.id) {
        // Fetch upcoming events for the employee
        const eventsData = await apiService.getMyEvents();

        // Handle response format: could be array or { success: true, data: [...] }
        const eventsList = Array.isArray(eventsData)
          ? eventsData
          : eventsData?.data || eventsData?.events || [];

        // Transform events for display
        const formattedEvents = eventsList.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description || "",
          start: event.start || event.start_date_time,
          end: event.end || event.end_date_time,
          startDate: event.start || event.start_date_time
            ? new Date(event.start || event.start_date_time).toLocaleDateString()
            : "Date TBD",
          startTime: event.start || event.start_date_time
            ? new Date(event.start || event.start_date_time).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        }));

        setUpcomingEvents(formattedEvents);
      }
    } catch (error) {
      console.error("Error loading upcoming events:", error);
      setUpcomingEvents([]);
    }
  }, [user?.id]);

  const loadTasks = useCallback(async () => {
    try {
      if (user?.id) {
        // Fetch upcoming tasks for the employee
        const tasksData = await apiService.getMyTasks();

        // Handle response format: could be array or { success: true, data: [...] }
        const tasksList = Array.isArray(tasksData)
          ? tasksData
          : tasksData?.data || tasksData?.tasks || [];

        // Transform tasks for display
        const formattedTasks = tasksList.map((task) => ({
          id: task.id,
          title: task.title || task.name,
          due: task.dueDate
            ? new Date(task.dueDate).toLocaleDateString()
            : "No due date",
          priority: task.priority || "Medium",
          status: task.status || "todo",
        }));

        setUpcomingTasks(formattedTasks);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      setUpcomingTasks([]);
    }
  }, [user?.id]);

  const loadNotifications = useCallback(async () => {
    try {
      if (!user?.id) return;
      
      // Fetch recent notifications (last 5) - unread first
      const notificationsData = await apiService.getNotifications(5, 0, false);

      // Handle response format: could be array or { success: true, data: [...] }
      const notificationsList = Array.isArray(notificationsData)
        ? notificationsData
        : notificationsData?.data || notificationsData?.notifications || [];

      // Transform notifications for display
      const formattedNotifications = notificationsList.map((notif) => ({
        id: notif.id,
        title: notif.title || "Notification",
        message: notif.message || notif.text,
        type: notif.type || "info",
        isRead: notif.isRead || false,
        eventId: notif.eventId || null,
        time: notif.createdAt
          ? new Date(notif.createdAt).toLocaleString()
          : "Just now",
        link: notif.link || null,
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    }
  }, [user?.id]);

  useEffect(() => {
    loadKycStatus();
    loadAttendanceData();
    loadNotifications();
    loadUpcomingEvents();
    loadTasks();
  }, [user, loadKycStatus, loadAttendanceData, loadNotifications, loadUpcomingEvents, loadTasks]);

  // Refresh KYC status every 30 seconds to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.email) {
        console.log('Auto-refreshing KYC status...');
        loadKycStatus();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, loadKycStatus]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "destructive";
      case "Medium": return "default";
      case "Low": return "secondary";
      default: return "default";
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-primary" />;
      case "warning": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "info": return <Bell className="h-4 w-4 text-accent" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getKycStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-primary">
            <CheckCircle className="h-3 w-3 mr-1" />
            KYC Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            KYC Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            KYC Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            KYC Required
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name || "Employee"}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your work today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadKycStatus();
              loadAttendanceData();
              loadNotifications();
              loadUpcomingEvents();
              loadTasks();
            }}
            disabled={loading}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Badge variant="outline" className="text-sm">
            {user?.role || "Employee"}
          </Badge>
          {getKycStatusBadge(kycStatus)}
        </div>
      </div>

      {/* KYC Status Alert */}
      {kycStatus !== 'approved' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  {kycStatus === 'not_submitted' 
                    ? 'Complete your KYC to access all features'
                    : kycStatus === 'pending'
                    ? 'Your KYC is under review'
                    : 'Your KYC needs attention'
                  }
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  {kycStatus === 'not_submitted' 
                    ? 'Submit your KYC documents to unlock attendance, payslip, and leave features.'
                    : kycStatus === 'pending'
                    ? 'You will be notified once your KYC is approved.'
                    : 'Please contact HR for assistance.'
                  }
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/profile">
                  <User className="h-4 w-4 mr-2" />
                  {kycStatus === 'not_submitted' ? 'Complete KYC' : 'View Profile'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendance.today}</div>
            <p className="text-xs text-muted-foreground">
              Last updated: 9:00 AM
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendance.thisWeek}/5</div>
            <p className="text-xs text-muted-foreground">
              Days present this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendance.thisMonth}/22</div>
            <p className="text-xs text-muted-foreground">
              Days present this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Pending tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Upcoming Tasks */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>
              Your pending tasks and deadlines
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[400px]">
            <div className="space-y-4">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </p>
                        {task.status === "completed" && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Due: {task.due}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      {task.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2"
                          onClick={async () => {
                            try {
                              await apiService.markTaskAsComplete(task.id);
                              // Refresh tasks
                              loadTasks();
                            } catch (error) {
                              console.error("Error marking task as complete:", error);
                            }
                          }}
                          title="Mark as complete">
                          <CheckSquare className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending tasks
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              Latest updates and announcements
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[400px]">
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                      !notification.isRead
                        ? "bg-primary/5 border-primary/20"
                        : "hover:bg-accent/50"
                    }`}>
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 space-y-1">
                      <p className={`text-sm ${!notification.isRead ? "font-semibold" : ""}`}>
                        {notification.title || notification.message}
                      </p>
                      {notification.title && notification.message && (
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{notification.time}</p>
                    </div>
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-1"></div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notifications
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Your scheduled events and activities</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[400px]">
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <Calendar className="h-4 w-4 text-primary mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.startDate} {event.startTime && `at ${event.startTime}`}
                      </p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming events
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              asChild
              variant="outline" 
              className={`h-20 flex flex-col items-center justify-center space-y-2 ${kycStatus !== 'approved' ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={kycStatus !== 'approved'}
            >
              <Link to={kycStatus === 'approved' ? "/attendance" : "#"}>
                <Clock className="h-6 w-6" />
                <span>Mark Attendance</span>
                {kycStatus !== 'approved' && <span className="text-xs text-gray-500">(KYC Required)</span>}
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline" 
              className={`h-20 flex flex-col items-center justify-center space-y-2 ${kycStatus !== 'approved' ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={kycStatus !== 'approved'}
            >
              <Link to={kycStatus === 'approved' ? "/leave" : "#"}>
                <FileText className="h-6 w-6" />
                <span>Apply Leave</span>
                {kycStatus !== 'approved' && <span className="text-xs text-gray-500">(KYC Required)</span>}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Link to="/profile">
                <Settings className="h-6 w-6" />
                <span>Update Profile</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
