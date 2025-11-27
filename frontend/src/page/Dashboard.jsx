import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Building2,
  UserPlus,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Download,
  ArrowUpRight,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { parseISO, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
// Type imports removed - types are now JSDoc comments in types/index.js
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [kycData, setKycData] = useState([]);
  const [timeRange, setTimeRange] = useState("week");
  const [isLoading, setIsLoading] = useState(true);
  const [trainingMetrics, setTrainingMetrics] = useState(null);
  const [departmentStats, setDepartmentStats] = useState([]);

  // Fetch events dynamically with React Query for auto-refresh
  const {
    data: eventsData = [],
    isLoading: eventsLoading,
    refetch: refetchEvents,
    isRefetching: isRefetchingEvents,
  } = useQuery({
    queryKey: ["dashboard-events"],
    queryFn: async () => {
      try {
        const events = await apiService.getEvents();
        return events || [];
      } catch (error) {
        console.error("Error fetching events:", error);
        return [];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds to get new events
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
    refetchOnMount: true, // Always refetch when component mounts
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Process and filter upcoming events
  const upcomingEvents = (() => {
    if (!Array.isArray(eventsData) || eventsData.length === 0) {
      return [];
    }

    const now = new Date();

    // Comprehensive filter out dummy/test data
    const dummyPatterns = [
      /^test\s+/i,
      /^dummy\s+/i,
      /test\./i,
      /^\d+\s+event/i,
      /->\s*all\s+employee/i,
      /department\s+review\s+meeting/i,
      /monthly\s+all-hands\s+meeting/i,
      /team\s+training\s+session/i,
    ];

    // Specific dummy event titles to filter
    const dummyTitles = [
      "27 event -> all employee",
      "department review meeting",
      "monthly all-hands meeting",
      "team training session",
      "test event",
      "dummy event",
    ];

    const filteredEvents = eventsData.filter((event) => {
      if (!event || !event.start) return false;

      const title = (event.title || "").toLowerCase().trim();
      const description = (event.description || "").toLowerCase().trim();
      const fullText = `${title} ${description}`.trim();

      // Skip if title is empty
      if (!title) {
        return false;
      }

      // Filter out events matching dummy patterns
      if (
        dummyPatterns.some(
          (pattern) =>
            pattern.test(title) ||
            pattern.test(description) ||
            pattern.test(fullText)
        )
      ) {
        return false;
      }

      // Filter out events containing dummy titles
      if (
        dummyTitles.some(
          (dummyTitle) =>
            title.includes(dummyTitle) ||
            description.includes(dummyTitle) ||
            fullText.includes(dummyTitle)
        )
      ) {
        return false;
      }

      // Only show future events
      try {
        const eventStart = parseISO(event.start);
        return eventStart >= now;
      } catch (error) {
        console.error("Error parsing event date:", error, event);
        return false;
      }
    });

    // Remove duplicates by id (keep the most recent one)
    const uniqueById = new Map();
    filteredEvents.forEach((event) => {
      if (!uniqueById.has(event.id)) {
        uniqueById.set(event.id, event);
      } else {
        // If duplicate id exists, keep the one with later createdAt
        const existing = uniqueById.get(event.id);
        const existingDate = existing.createdAt
          ? new Date(existing.createdAt)
          : new Date(0);
        const currentDate = event.createdAt
          ? new Date(event.createdAt)
          : new Date(0);
        if (currentDate > existingDate) {
          uniqueById.set(event.id, event);
        }
      }
    });

    // Also remove duplicates by title+start combination
    const uniqueByContent = new Map();
    Array.from(uniqueById.values()).forEach((event) => {
      const contentKey = `${(event.title || "").trim()}_${event.start || ""}`;
      if (!uniqueByContent.has(contentKey)) {
        uniqueByContent.set(contentKey, event);
      } else {
        // If duplicate content exists, keep the one with later createdAt
        const existing = uniqueByContent.get(contentKey);
        const existingDate = existing.createdAt
          ? new Date(existing.createdAt)
          : new Date(0);
        const currentDate = event.createdAt
          ? new Date(event.createdAt)
          : new Date(0);
        if (currentDate > existingDate) {
          uniqueByContent.set(contentKey, event);
        }
      }
    });

    const finalEvents = Array.from(uniqueByContent.values());

    return finalEvents
      .sort((a, b) => {
        try {
          const aTime = parseISO(a.start).getTime();
          const bTime = parseISO(b.start).getTime();
          return aTime - bTime; // Sort ascending (earliest first)
        } catch {
          return 0;
        }
      })
      .slice(0, 5); // Show only next 5 events
  })();

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch real data from API - handle errors individually
        // Note: Events are now fetched via React Query (see useQuery above)
        const [employeesData, attendanceData, kycData] =
          await Promise.allSettled([
            apiService.getEmployees().catch((err) => {
              console.error("Error fetching employees:", err);
              return [];
            }),
            apiService.getAllAttendance("all").catch((err) => {
              console.error("Error fetching attendance:", err);
              return [];
            }),
            apiService.getKycSubmissions().catch((err) => {
              console.error("Error fetching KYC data:", err);
              return [];
            }),
          ]);

        // Extract values from Promise.allSettled results
        // Handle new API response format: { success: true, data: [...], count: ... }
        const employeesRaw =
          employeesData.status === "fulfilled" ? employeesData.value : null;
        let employeesResult = [];

        if (Array.isArray(employeesRaw)) {
          // Direct array response (legacy format)
          employeesResult = employeesRaw;
        } else if (employeesRaw && typeof employeesRaw === "object") {
          // Handle new API response format: { success: true, data: [...], count: ... }
          if (employeesRaw.data && Array.isArray(employeesRaw.data)) {
            employeesResult = employeesRaw.data;
          } else if (
            employeesRaw.success &&
            employeesRaw.data &&
            Array.isArray(employeesRaw.data)
          ) {
            employeesResult = employeesRaw.data;
          } else {
            // Fallback: if data is not an array, use empty array
            console.warn(
              "Employees data is not in expected format:",
              employeesRaw
            );
            employeesResult = [];
          }
        }

        // Ensure employeesResult is always an array
        if (!Array.isArray(employeesResult)) {
          console.warn(
            "Employees result is not an array, defaulting to empty array:",
            employeesResult
          );
          employeesResult = [];
        }

        const attendanceRaw =
          attendanceData.status === "fulfilled" ? attendanceData.value : null;
        const attendanceResult = Array.isArray(attendanceRaw)
          ? attendanceRaw
          : attendanceRaw?.data && Array.isArray(attendanceRaw.data)
          ? attendanceRaw.data
          : [];

        const kycRaw = kycData.status === "fulfilled" ? kycData.value : null;
        const kycResult = Array.isArray(kycRaw)
          ? kycRaw
          : kycRaw?.data && Array.isArray(kycRaw.data)
          ? kycRaw.data
          : [];

        // Ensure all state values are arrays before setting
        setEmployees(Array.isArray(employeesResult) ? employeesResult : []);
        setAttendance(Array.isArray(attendanceResult) ? attendanceResult : []);
        setKycData(Array.isArray(kycResult) ? kycResult : []);
        // Events are now handled by React Query - see useQuery hook above

        // Calculate real stats
        const totalEmployees = Array.isArray(employeesResult)
          ? employeesResult.length
          : 0;
        const activeEmployees = Array.isArray(employeesResult)
          ? employeesResult.filter(
              (emp) => emp.status === "active" || emp.status === "Working"
            ).length
          : 0;
        const departmentsCount = Array.isArray(employeesResult)
          ? new Set(employeesResult.map((emp) => emp.department)).size
          : 0;
        const newHires = Array.isArray(employeesResult)
          ? employeesResult.filter((emp) => {
              if (!emp.hireDate) return false;
              const hireDate = new Date(emp.hireDate);
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return hireDate > thirtyDaysAgo;
            }).length
          : 0;

        const approvedKyc = Array.isArray(kycResult)
          ? kycResult.filter((kyc) => kyc.status === "approved").length
          : 0;
        const kycCompletionRate =
          totalEmployees > 0
            ? Math.round((approvedKyc / totalEmployees) * 100)
            : 0;

        const todayAttendance = Array.isArray(attendanceResult)
          ? attendanceResult.filter((att) => {
              if (!att.date) return false;
              const attDate = new Date(att.date);
              const today = new Date();
              return attDate.toDateString() === today.toDateString();
            }).length
          : 0;

        const attendanceRate =
          totalEmployees > 0
            ? Math.round((todayAttendance / totalEmployees) * 100)
            : 0;

        setStats({
          totalEmployees,
          activeEmployees,
          departmentsCount,
          newHires,
          upcomingReviews: 0, // This would need a separate API
          trainingCompletionRate: kycCompletionRate,
          employeeSatisfactionRate: attendanceRate,
        });

        // Generate activity data from recent attendance
        const recentActivity = Array.isArray(attendanceResult)
          ? attendanceResult
              .filter((att) => att.date) // Filter out invalid records
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 10)
              .map((att) => ({
                id: att.id,
                user:
                  att.name || (att.email ? att.email.split("@")[0] : "Unknown"),
                action: att.checkOut ? "Checked out" : "Checked in",
                timestamp: att.checkOut || att.checkIn,
                type: "attendance",
              }))
          : [];

        setActivity(recentActivity);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch team activity data based on time range
  useEffect(() => {
    const fetchTeamActivity = async () => {
      try {
        const activityData = await apiService.getTeamActivity(timeRange);
        if (Array.isArray(activityData)) {
          setActivity(activityData);
        }
      } catch (error) {
        console.error("Error fetching team activity:", error);
        // Don't show error toast, just log it
      }
    };

    if (
      user?.role === "admin" ||
      user?.role === "hr" ||
      user?.role === "manager"
    ) {
      fetchTeamActivity();
    }
  }, [timeRange, user?.role]);

  // Fetch training metrics
  useEffect(() => {
    const fetchTrainingMetrics = async () => {
      try {
        const metrics = await apiService.getTrainingMetrics();
        if (metrics) {
          setTrainingMetrics(metrics);
        }
      } catch (error) {
        console.error("Error fetching training metrics:", error);
      }
    };

    if (
      user?.role === "admin" ||
      user?.role === "hr" ||
      user?.role === "manager"
    ) {
      fetchTrainingMetrics();
    }
  }, [user?.role]);

  // Fetch department statistics
  useEffect(() => {
    const fetchDepartmentStats = async () => {
      try {
        const stats = await apiService.getDepartmentStats();
        if (Array.isArray(stats)) {
          setDepartmentStats(stats);
        }
      } catch (error) {
        console.error("Error fetching department stats:", error);
      }
    };

    if (
      user?.role === "admin" ||
      user?.role === "hr" ||
      user?.role === "manager"
    ) {
      fetchDepartmentStats();
    }
  }, [user?.role]);

  // Handle Download Report
  const handleDownloadReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      stats: stats,
      totalEmployees: Array.isArray(employees) ? employees.length : 0,
      activeEmployees: Array.isArray(employees)
        ? employees.filter(
            (emp) => emp.status === "active" || emp.status === "Working"
          ).length
        : 0,
      departments: departmentData,
      recentEmployees:
        Array.isArray(employees) && employees.length > 0
          ? (employees || []).slice(0, 10).map((emp) => ({
              name: emp.name,
              email: emp.email,
              department: emp.department || emp.location,
              status: emp.status,
              hireDate: emp.hireDate,
            }))
          : [],
      attendance: {
        today: attendance.filter((att) => {
          const attDate = new Date(att.date);
          const today = new Date();
          return attDate.toDateString() === today.toDateString();
        }).length,
        total: attendance.length,
      },
      kyc: {
        total: kycData.length,
        approved: kycData.filter((k) => k.status === "approved").length,
        pending: kycData.filter((k) => k.status === "pending").length,
        rejected: kycData.filter((k) => k.status === "rejected").length,
      },
    };

    // Create CSV content
    const csvRows = [
      ["Dashboard Report", ""],
      ["Generated At", reportData.generatedAt],
      [""],
      ["Key Metrics", ""],
      ["Total Employees", reportData.stats?.totalEmployees || 0],
      ["Active Employees", reportData.stats?.activeEmployees || 0],
      ["Departments", reportData.stats?.departmentsCount || 0],
      ["New Hires (Last 30 Days)", reportData.stats?.newHires || 0],
      [
        "Training Completion Rate",
        `${reportData.stats?.trainingCompletionRate || 0}%`,
      ],
      [
        "Employee Satisfaction Rate",
        `${reportData.stats?.employeeSatisfactionRate || 0}%`,
      ],
      [""],
      ["Attendance Summary", ""],
      ["Today's Attendance", reportData.attendance.today],
      ["Total Attendance Records", reportData.attendance.total],
      [""],
      ["KYC Summary", ""],
      ["Total KYC Submissions", reportData.kyc.total],
      ["Approved", reportData.kyc.approved],
      ["Pending", reportData.kyc.pending],
      ["Rejected", reportData.kyc.rejected],
      [""],
      ["Department Distribution", ""],
      ...departmentData.map((dept) => [dept.name, dept.value]),
      [""],
      ["Recent Employees", ""],
      ["Name", "Email", "Department", "Status", "Hire Date"],
      ...reportData.recentEmployees.map((emp) => [
        emp.name,
        emp.email,
        emp.department || "N/A",
        emp.status || "N/A",
        emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : "N/A",
      ]),
    ];

    const csvContent = csvRows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `dashboard-report-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Dashboard report downloaded successfully!");
  };

  // Department distribution data for pie chart
  // Use API data if available, otherwise fallback to employee data
  const departmentData =
    departmentStats.length > 0
      ? departmentStats.map((dept) => ({
          name: dept.name,
          value: dept.value || dept.total || 0,
        }))
      : employees.length > 0
      ? Object.entries(
          employees.reduce((acc, emp) => {
            const dept =
              emp.department || emp.location || emp.designation || "Unknown";
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
          }, {})
        ).map(([name, value]) => ({
          name,
          value,
        }))
      : [];

  // Colors for the pie chart
  // Brand colors: Green (primary) and Orange (accent) with variations
  const COLORS = ["#16763a", "#f97316", "#2d9f52", "#fb923c", "#0f5a28"];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
      </div>

      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Employees
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalEmployees}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeEmployees} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Departments
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.departmentsCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across organization
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">New Hires</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.newHires}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Upcoming Reviews
                </CardTitle>
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.upcomingReviews}
                </div>
                <p className="text-xs text-muted-foreground">Next 30 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="activity" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="activity">Team Activity</TabsTrigger>
                <TabsTrigger value="departments">Departments</TabsTrigger>
                <TabsTrigger value="training">Training</TabsTrigger>
              </TabsList>
              <div className="space-x-2">
                <Button
                  variant={timeRange === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("week")}>
                  Week
                </Button>
                <Button
                  variant={timeRange === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("month")}>
                  Month
                </Button>
                <Button
                  variant={timeRange === "year" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("year")}>
                  Year
                </Button>
              </div>
            </div>
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Activity</CardTitle>
                  <CardDescription>
                    Overview of team activity for the past {timeRange}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {activity.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <p className="text-sm">No activity data available</p>
                        <p className="text-xs mt-2">
                          Activity data will appear as employees use the system
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={activity}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => {
                            try {
                              return format(new Date(value), "MMM dd");
                            } catch {
                              return value;
                            }
                          }}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => {
                            try {
                              return format(new Date(value), "MMM dd, yyyy");
                            } catch {
                              return value;
                            }
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="activeUsers"
                          stroke="#16763a"
                          strokeWidth={2}
                          name="Active Users"
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="completedTasks"
                          stroke="#f97316"
                          strokeWidth={2}
                          name="Completed Tasks"
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="newDocuments"
                          stroke="#2d9f52"
                          strokeWidth={2}
                          name="New Events"
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="departments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Department Distribution</CardTitle>
                  <CardDescription>
                    Employee distribution across departments
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#16763a"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }>
                        {departmentData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="training" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Training Metrics</CardTitle>
                  <CardDescription>
                    Company-wide training completion rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trainingMetrics ? (
                    <div className="space-y-4">
                      {/* Overall completion rate */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">
                            Overall Completion Rate
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {trainingMetrics.overallCompletionRate}%
                          </div>
                        </div>
                        <Progress
                          value={trainingMetrics.overallCompletionRate}
                        />
                        <p className="text-xs text-muted-foreground">
                          {trainingMetrics.employeesWithKYC} of{" "}
                          {trainingMetrics.totalEmployees} employees completed
                        </p>
                      </div>

                      {/* Department-wise metrics */}
                      {trainingMetrics.byDepartment &&
                        trainingMetrics.byDepartment.length > 0 && (
                          <>
                            <div className="border-t pt-4 mt-4">
                              <h4 className="text-sm font-semibold mb-3">
                                By Department
                              </h4>
                              {trainingMetrics.byDepartment.map(
                                (dept, index) => (
                                  <div key={index} className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between">
                                      <div className="text-sm font-medium">
                                        {dept.name || "Unassigned"}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {dept.completionRate}%
                                      </div>
                                    </div>
                                    <Progress value={dept.completionRate} />
                                    <p className="text-xs text-muted-foreground">
                                      {dept.completed} of {dept.total} employees
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </>
                        )}
                    </div>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <p className="text-sm">Loading training metrics...</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Bottom row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Recent Employees */}
            <Card className="col-span-1 flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Employees</CardTitle>
                  <CardDescription>Latest team members</CardDescription>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/employees">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto max-h-[400px]">
                <div className="space-y-4">
                  {Array.isArray(employees) && employees.length > 0 ? (
                    (employees || []).slice(0, 5).map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              employee.name
                            )}&background=random`}
                          />
                          <AvatarFallback>
                            {employee.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium leading-none">
                            {employee.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {employee.role} • {employee.department}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                              employee.status === "active" ||
                              employee.status === "Working"
                                ? "bg-primary/20 text-primary"
                                : employee.status === "onLeave"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                            {employee.status === "Working"
                              ? "Active"
                              : employee.status === "Not Working"
                              ? "Inactive"
                              : employee.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {employee.department === "d1"
                              ? "Engineering"
                              : employee.department === "d2"
                              ? "HR"
                              : employee.department === "d3"
                              ? "Finance"
                              : employee.department === "d4"
                              ? "Marketing"
                              : "Other"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No employees found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="col-span-1 flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Next scheduled activities</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => refetchEvents()}
                    disabled={isRefetchingEvents}
                    title="Refresh events">
                    <RefreshCw
                      className={`h-4 w-4 ${
                        isRefetchingEvents ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/calendar">View calendar</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto max-h-[400px]">
                {eventsLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <RefreshCw className="h-8 w-8 text-muted-foreground mb-2 animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Loading events...
                    </p>
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No upcoming events
                    </p>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="mt-4">
                      <Link to="/calendar">Create Event</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => {
                      // Parse date once and handle errors
                      let eventDate = null;
                      let dateStr = "Date TBD";
                      let timeStr = "";

                      if (event.start) {
                        try {
                          eventDate = parseISO(event.start);
                          if (!isNaN(eventDate.getTime())) {
                            dateStr = format(eventDate, "MMM dd, yyyy");
                            timeStr = format(eventDate, "h:mm a");
                          }
                        } catch (error) {
                          console.error(
                            "Error formatting event date:",
                            error,
                            event
                          );
                        }
                      }

                      return (
                        <div key={event.id} className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            {event.type === "meeting" ? (
                              <Users className="h-5 w-5" />
                            ) : event.type === "training" ? (
                              <GraduationCap className="h-5 w-5" />
                            ) : event.type === "holiday" ? (
                              <Calendar className="h-5 w-5" />
                            ) : (
                              <Calendar className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium leading-none">
                              {event.title || "Untitled Event"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {dateStr} {timeStr && `at ${timeStr}`}
                            </p>
                            {event.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Performance Indicators */}
            <Card className="col-span-1 flex flex-col">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Company-wide indicators</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto max-h-[400px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>Training Completion</div>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      {stats?.trainingCompletionRate}%
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>Employee Satisfaction</div>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      {stats?.employeeSatisfactionRate}%
                      <ArrowUpRight className="h-4 w-4 text-accent" />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleDownloadReport}>
                    <Download className="h-4 w-4" />
                    Download Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
