import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Calendar from "../components/Calendar";
import KycReminder from "../components/KycReminder";
import StatCard from "../components/StatCard";
import TeamActivityChart from "../components/TeamActivityChart";
import DepartmentDistribution from "../components/DepartmentDistribution";
import TrainingMetrics from "../components/TrainingMetrics";
import PayslipsList from "../components/PayslipsList";
import {
  attendanceService,
  employeeService,
  kycService,
} from "../services/api";
import "./Dashboard.css";

const Dashboard = () => {
  const location = useLocation();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    newHires: 0,
    upcomingReviews: 0,
  });
  const [selectedStat, setSelectedStat] = useState(null);
  const [showStatModal, setShowStatModal] = useState(false);
  const [activityData, setActivityData] = useState([]);
  const [timeFilter, setTimeFilter] = useState("month");
  const [attendanceStatus, setAttendanceStatus] = useState("not-checked");
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [user, setUser] = useState(null);
  const [kycStatus, setKycStatus] = useState("pending");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [activeScheduleTab, setActiveScheduleTab] = useState("today");
  const [tasks, setTasks] = useState([
    {
      id: 1,
      time: "09:00",
      title: "Team Standup Meeting",
      completed: false,
    },
    {
      id: 2,
      time: "10:30",
      title: "Review Project Documentation",
      completed: false,
    },
    {
      id: 3,
      time: "14:00",
      title: "Client Presentation",
      completed: false,
    },
    {
      id: 4,
      time: "16:00",
      title: "Code Review Session",
      completed: false,
    },
    {
      id: 5,
      time: "08:30",
      title: "Check Emails",
      completed: true,
    },
  ]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ time: "", title: "" });

  useEffect(() => {
    const initializeDashboard = async () => {
      // Get user from localStorage
      const userData = JSON.parse(localStorage.getItem("user"));
      setUser(userData);

      // Check KYC status from backend
      if (userData?.email && userData?.role !== "admin") {
        try {
          console.log("Checking KYC status for:", userData.email);
          const kycStatusData = await kycService.checkStatus(userData.email);
          console.log("KYC status response:", kycStatusData);

          if (kycStatusData.status === "approved") {
            console.log("KYC is approved, setting status to approved");
            setKycStatus("approved");
            localStorage.setItem(`kyc_completed_${userData.email}`, "true");
          } else {
            console.log("KYC is pending, setting status to pending");
            setKycStatus("pending");
            localStorage.removeItem(`kyc_completed_${userData.email}`);
          }
        } catch (error) {
          console.error("Error checking KYC status:", error);
          // Fallback to localStorage - but default to pending for safety
          const kycCompleted = localStorage.getItem(
            `kyc_completed_${userData?.email}`
          );
          console.log("Fallback KYC status from localStorage:", kycCompleted);
          // Only use localStorage if it's explicitly set to 'true'
          setKycStatus(kycCompleted === "true" ? "approved" : "pending");
        }
      } else {
        console.log("User is admin or no email, setting KYC to approved");
        setKycStatus("approved"); // Admin users don't need KYC
      }

      // Load stats (only for admin/manager)
      if (userData?.role === "admin" || userData?.role === "manager") {
        console.log("Loading stats for admin/manager role");
        await loadStats();
      } else {
        console.log("User role is:", userData?.role, "- not loading stats");
      }
      generateActivityData();

      // Load today's attendance status
      if (userData?.email) {
        loadTodayAttendance(userData.email);
      }
    };

    initializeDashboard();

    // Set up periodic KYC status refresh for non-admin users
    let kycRefreshInterval;
    if (user?.email && user?.role !== "admin") {
      kycRefreshInterval = setInterval(async () => {
        try {
          const kycStatusData = await kycService.checkStatus(user.email);
          if (kycStatusData.status === "approved") {
            setKycStatus("approved");
            localStorage.setItem(`kyc_completed_${user.email}`, "true");
          } else {
            setKycStatus("pending");
            localStorage.removeItem(`kyc_completed_${user.email}`);
          }
        } catch (error) {
          console.error("Error during periodic KYC check:", error);
        }
      }, 30000); // Check every 30 seconds
    }

    // Cleanup interval on component unmount
    return () => {
      if (kycRefreshInterval) {
        clearInterval(kycRefreshInterval);
      }
    };
  }, [location.pathname]);

  const loadTodayAttendance = async (email) => {
    try {
      const attendance = await attendanceService.getToday(email);
      if (attendance) {
        setTodayAttendance(attendance);
        if (attendance.checkIn && !attendance.checkOut) {
          setAttendanceStatus("checked-in");
        } else if (attendance.checkIn && attendance.checkOut) {
          setAttendanceStatus("checked-out");
        } else {
          setAttendanceStatus("not-checked");
        }
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
    }
  };

  const loadStats = async () => {
    // Only load stats for admin and manager roles
    if (user?.role !== "admin" && user?.role !== "manager") {
      console.log("Not loading stats - user role is:", user?.role);
      return;
    }

    try {
      console.log("Fetching employees from API...");
      // Fetch real employee data from API
      const employees = await employeeService.getEmployees();
      console.log("Employees fetched:", employees);

      // Calculate real statistics
      const totalEmployees = employees.length;
      const activeEmployees = employees.filter(
        (emp) => emp.status === "active"
      ).length;

      // Calculate new hires (employees hired in the last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const newHires = employees.filter((emp) => {
        const hireDate = new Date(emp.hireDate);
        return hireDate >= threeMonthsAgo;
      }).length;

      // Mock upcoming reviews (in real app, this would come from a reviews system)
      const upcomingReviews = Math.floor(totalEmployees * 0.1); // 10% of employees

      const newStats = {
        totalEmployees,
        activeEmployees,
        newHires,
        upcomingReviews,
      };

      console.log("Setting stats:", newStats);
      setStats(newStats);
    } catch (error) {
      console.error("Error loading stats:", error);
      // Fallback to default values
      setStats({
        totalEmployees: 0,
        activeEmployees: 0,
        newHires: 0,
        upcomingReviews: 0,
      });
    }
  };

  const generateActivityData = () => {
    const activities = [
      {
        type: "team",
        title: "Team Meeting",
        time: "2 hours ago",
        user: "John Doe",
      },
      {
        type: "department",
        title: "HR Policy Update",
        time: "4 hours ago",
        user: "HR Team",
      },
      {
        type: "training",
        title: "New Software Training",
        time: "1 day ago",
        user: "IT Department",
      },
    ];
    setActivityData(activities);
  };

  const handleStatCardClick = (statType) => {
    setSelectedStat(statType);
    setShowStatModal(true);
  };

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
    // In real app, this would filter activity data
  };

  // Function to get current location with improved accuracy
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(
            `📍 Location found: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`
          );

          // Try multiple geocoding services for better accuracy
          let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          try {
            // Try Google Geocoding API first (if available)
            const googleResponse = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=YOUR_API_KEY`
            );
            if (googleResponse.ok) {
              const googleData = await googleResponse.json();
              if (googleData.results && googleData.results.length > 0) {
                address = googleData.results[0].formatted_address;
                console.log("📍 Google geocoding result:", address);
              }
            }
          } catch (googleError) {
            console.log(
              "Google geocoding not available, trying alternatives..."
            );
          }

          // Fallback to OpenStreetMap with better parameters
          if (address === `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`) {
            try {
              const osmResponse = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&extratags=1&namedetails=1`
              );
              const osmData = await osmResponse.json();

              if (osmData.display_name) {
                // Format the address better
                const parts = [];
                if (osmData.address?.house_number && osmData.address?.road) {
                  parts.push(
                    `${osmData.address.house_number} ${osmData.address.road}`
                  );
                } else if (osmData.address?.road) {
                  parts.push(osmData.address.road);
                }
                if (osmData.address?.suburb || osmData.address?.neighbourhood) {
                  parts.push(
                    osmData.address.suburb || osmData.address.neighbourhood
                  );
                }
                if (osmData.address?.city || osmData.address?.town) {
                  parts.push(osmData.address.city || osmData.address.town);
                }
                if (osmData.address?.state) {
                  parts.push(osmData.address.state);
                }
                if (osmData.address?.country) {
                  parts.push(osmData.address.country);
                }

                address =
                  parts.length > 0 ? parts.join(", ") : osmData.display_name;
                console.log("📍 OpenStreetMap geocoding result:", address);
              }
            } catch (osmError) {
              console.log("OpenStreetMap geocoding failed:", osmError);
            }
          }

          // Final fallback to coordinates with accuracy info
          if (address === `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`) {
            address = `${latitude.toFixed(6)}, ${longitude.toFixed(
              6
            )} (accuracy: ${Math.round(accuracy)}m)`;
          }

          resolve({ latitude, longitude, address, accuracy });
        },
        (error) => {
          console.error("Geolocation error:", error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 60000, // Reduced cache time for better accuracy
        }
      );
    });
  };

  const handleCheckIn = async () => {
    try {
      let location;

      // Try to get current location, but provide fallback
      try {
        location = await getCurrentLocation();
      } catch (locationError) {
        console.warn("Location access denied or unavailable:", locationError);

        // Ask user if they want to proceed without location
        const proceedWithoutLocation = window.confirm(
          "📍 Location access is not available. Would you like to check in without location data?\n\n" +
            "Click OK to proceed, or Cancel to enable location services and try again."
        );

        if (!proceedWithoutLocation) {
          return; // User cancelled
        }

        // Use fallback location data
        location = {
          latitude: null,
          longitude: null,
          address: "Location not available",
        };
      }

      // Call attendance API with location data
      await attendanceService.checkIn({
        email: user.email,
        name: user.name,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      });

      setAttendanceStatus("checked-in");
      const locationMessage =
        location.address !== "Location not available"
          ? `Successfully checked in from ${location.address}!`
          : "Successfully checked in! (Location not available)";
      alert(locationMessage);
    } catch (error) {
      console.error("Error checking in:", error);
      alert("Error checking in. Please try again.");
    }
  };

  const handleCheckOut = async () => {
    try {
      let location;

      // Try to get current location, but provide fallback
      try {
        location = await getCurrentLocation();
      } catch (locationError) {
        console.warn("Location access denied or unavailable:", locationError);

        // Ask user if they want to proceed without location
        const proceedWithoutLocation = window.confirm(
          "📍 Location access is not available. Would you like to check out without location data?\n\n" +
            "Click OK to proceed, or Cancel to enable location services and try again."
        );

        if (!proceedWithoutLocation) {
          return; // User cancelled
        }

        // Use fallback location data
        location = {
          latitude: null,
          longitude: null,
          address: "Location not available",
        };
      }

      // Call attendance API with location data
      await attendanceService.checkOut({
        email: user.email,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      });

      setAttendanceStatus("checked-out");
      const locationMessage =
        location.address !== "Location not available"
          ? `Successfully checked out from ${location.address}!`
          : "Successfully checked out! (Location not available)";
      alert(locationMessage);
    } catch (error) {
      console.error("Error checking out:", error);
      alert("Error checking out. Please try again.");
    }
  };

  const handleKycProceed = () => {
    // Navigate to KYC page
    window.location.href = "/kyc-submit";
  };

  const handleManualLocationSubmit = () => {
    if (manualLocation.trim()) {
      // Use manual location for check-in/check-out
      const location = {
        latitude: null,
        longitude: null,
        address: manualLocation.trim(),
        accuracy: null,
      };

      if (attendanceStatus === "not-checked") {
        handleCheckInWithLocation(location);
      } else if (attendanceStatus === "checked-in") {
        handleCheckOutWithLocation(location);
      }

      setShowLocationInput(false);
      setManualLocation("");
    }
  };

  const handleCheckInWithLocation = async (location) => {
    try {
      await attendanceService.checkIn({
        email: user.email,
        name: user.name,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      });

      setAttendanceStatus("checked-in");
      const locationMessage =
        location.address !== "Location not available"
          ? `Successfully checked in from ${location.address}!`
          : "Successfully checked in! (Location not available)";
      alert(locationMessage);
    } catch (error) {
      console.error("Error checking in:", error);
      alert("Error checking in. Please try again.");
    }
  };

  const handleCheckOutWithLocation = async (location) => {
    try {
      await attendanceService.checkOut({
        email: user.email,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      });

      setAttendanceStatus("checked-out");
      const locationMessage =
        location.address !== "Location not available"
          ? `Successfully checked out from ${location.address}!`
          : "Successfully checked out! (Location not available)";
      alert(locationMessage);
    } catch (error) {
      console.error("Error checking out:", error);
      alert("Error checking out. Please try again.");
    }
  };

  // Task management functions
  const toggleTaskCompletion = (taskId) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const addNewTask = () => {
    if (newTask.time.trim() && newTask.title.trim()) {
      const task = {
        id: Date.now(), // Simple ID generation
        time: newTask.time.trim(),
        title: newTask.title.trim(),
        completed: false,
      };
      setTasks([...tasks, task]);
      setNewTask({ time: "", title: "" });
      setShowAddTask(false);
    }
  };

  const handleNewTaskChange = (field, value) => {
    setNewTask((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="dashboard-container">
      <KycReminder user={user} onProceed={handleKycProceed} />

      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name?.toUpperCase() || "User"}!</p>
      </div>

      {/* Sub Navigation */}
      <div className="dashboard-nav">
        <button
          className={`nav-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}>
          📊 Overview
        </button>
        {(user?.role === "admin" || user?.role === "manager") && (
          <button
            className={`nav-btn ${activeTab === "statistics" ? "active" : ""}`}
            onClick={() => setActiveTab("statistics")}>
            📈 Statistics
          </button>
        )}
        <button
          className={`nav-btn ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => setActiveTab("calendar")}>
          📅 Calendar
        </button>
        <button
          className={`nav-btn ${
            activeTab === "todays-schedule" ? "active" : ""
          }`}
          onClick={() => setActiveTab("todays-schedule")}>
          📋 Today's Schedule
        </button>
        {(user?.role === "admin" || user?.role === "manager") && (
          <button
            className={`nav-btn ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}>
            📊 Analytics
          </button>
        )}
        {user && user.role !== "admin" && kycStatus === "approved" && (
          <button
            className={`nav-btn ${activeTab === "attendance" ? "active" : ""}`}
            onClick={() => setActiveTab("attendance")}>
            ⏰ Attendance
          </button>
        )}
        {user && user.role !== "admin" && kycStatus === "approved" && (
          <button
            className={`nav-btn ${activeTab === "payslips" ? "active" : ""}`}
            onClick={() => setActiveTab("payslips")}>
            💰 Payslips
          </button>
        )}
        {user && user.role !== "admin" && kycStatus === "pending" && (
          <button
            className={`nav-btn ${activeTab === "kyc" ? "active" : ""}`}
            onClick={() => setActiveTab("kyc")}>
            ✅ KYC
          </button>
        )}
      </div>

      {/* Statistics Cards - Only show for admin and manager roles */}
      {(user?.role === "admin" || user?.role === "manager") &&
        activeTab === "statistics" && (
          <div className="stats-section">
            <div className="stats-header">
              <h2>Statistics</h2>
              <button className="refresh-stats-btn" onClick={loadStats}>
                <span>🔄</span> Refresh Stats
              </button>
            </div>
            <div className="stats-grid">
              <StatCard
                title="Total Employees"
                value={stats.totalEmployees}
                subtitle={`${stats.activeEmployees} active`}
                icon="👥"
              />
              <StatCard
                title="Departments"
                value="8"
                subtitle="Across organization"
                icon="🏢"
              />
              <StatCard
                title="New Hires"
                value={stats.newHires}
                subtitle="This month"
                icon="👤"
              />
              <StatCard
                title="Upcoming Reviews"
                value={stats.upcomingReviews}
                subtitle="Next 30 days"
                icon="📋"
              />
            </div>
          </div>
        )}

      {/* Overview Section - Default view */}
      {activeTab === "overview" && (
        <div className="overview-section">
          <div className="overview-grid">
            {(user?.role === "admin" || user?.role === "manager") && (
              <div className="overview-card">
                <h3>📊 Quick Stats</h3>
                <div className="quick-stats">
                  <div className="quick-stat">
                    <span className="stat-number">{stats.totalEmployees}</span>
                    <span className="stat-label">Total Employees</span>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-number">{stats.activeEmployees}</span>
                    <span className="stat-label">Active</span>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-number">{stats.newHires}</span>
                    <span className="stat-label">New Hires</span>
                  </div>
                </div>
              </div>
            )}

            <div className="overview-card">
              <div className="task-header">
                <h3>📋 Today's Tasks</h3>
                <button
                  className="add-task-btn"
                  onClick={() => setShowAddTask(!showAddTask)}
                  title="Add new task">
                  ➕
                </button>
              </div>
              <div className="tasks-preview">
                <div className="task-list">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`task-item ${
                        task.completed ? "completed" : ""
                      }`}>
                      <span className="task-time">{task.time}</span>
                      <span className="task-title">{task.title}</span>
                      <div className="task-actions">
                        <button
                          className="task-toggle-btn"
                          onClick={() => toggleTaskCompletion(task.id)}
                          title={
                            task.completed
                              ? "Mark as incomplete"
                              : "Mark as complete"
                          }>
                          {task.completed ? "✅" : "⏰"}
                        </button>
                        <button
                          className="task-delete-btn"
                          onClick={() => deleteTask(task.id)}
                          title="Delete task">
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}

                  {showAddTask && (
                    <div className="add-task-form">
                      <div className="form-row">
                        <input
                          type="text"
                          placeholder="Time (e.g., 09:00)"
                          value={newTask.time}
                          onChange={(e) =>
                            handleNewTaskChange("time", e.target.value)
                          }
                          className="task-time-input"
                        />
                        <input
                          type="text"
                          placeholder="Task title"
                          value={newTask.title}
                          onChange={(e) =>
                            handleNewTaskChange("title", e.target.value)
                          }
                          className="task-title-input"
                        />
                      </div>
                      <div className="form-actions">
                        <button className="save-task-btn" onClick={addNewTask}>
                          Save Task
                        </button>
                        <button
                          className="cancel-task-btn"
                          onClick={() => {
                            setShowAddTask(false);
                            setNewTask({ time: "", title: "" });
                          }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="task-summary">
                  <span className="completed-count">
                    {tasks.filter((task) => task.completed).length} completed
                  </span>
                  <span className="pending-count">
                    {tasks.filter((task) => !task.completed).length} pending
                  </span>
                </div>
              </div>
            </div>

            {user && user.role !== "admin" && kycStatus === "approved" && (
              <div className="overview-card">
                <h3>⏰ Attendance Status</h3>
                <div className="attendance-preview">
                  {attendanceStatus === "not-checked" && (
                    <div className="status-not-checked">
                      <span className="status-icon">⏰</span>
                      <span className="status-text">Ready to check in</span>
                    </div>
                  )}
                  {attendanceStatus === "checked-in" && (
                    <div className="status-checked-in">
                      <span className="status-icon">✅</span>
                      <span className="status-text">Checked in</span>
                    </div>
                  )}
                  {attendanceStatus === "checked-out" && (
                    <div className="status-checked-out">
                      <span className="status-icon">🏁</span>
                      <span className="status-text">Checked out</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="dashboard-content">
        {activeTab === "calendar" && (
          <div className="calendar-section">
            <div className="section-header">
              <div className="section-title">
                <h2>Calendar</h2>
                <p>Upcoming events and schedules</p>
              </div>
              <a href="#" className="view-all-link">
                View calendar
              </a>
            </div>
            <div className="calendar-content">
              <Calendar />
            </div>
          </div>
        )}

        {/* Today's Schedule Section */}
        {activeTab === "todays-schedule" && (
          <div className="todays-schedule-section">
            <div className="section-header">
              <div className="section-title">
                <h2>Today's Schedule</h2>
                <p>Your daily schedule and upcoming events</p>
              </div>
            </div>

            {/* Schedule Sub-Navigation */}
            <div className="schedule-nav">
              <button
                className={`schedule-nav-btn ${
                  activeScheduleTab === "today" ? "active" : ""
                }`}
                onClick={() => setActiveScheduleTab("today")}>
                📅 Today
              </button>
              <button
                className={`schedule-nav-btn ${
                  activeScheduleTab === "week" ? "active" : ""
                }`}
                onClick={() => setActiveScheduleTab("week")}>
                📊 This Week
              </button>
              <button
                className={`schedule-nav-btn ${
                  activeScheduleTab === "month" ? "active" : ""
                }`}
                onClick={() => setActiveScheduleTab("month")}>
                📈 This Month
              </button>
              <button
                className={`schedule-nav-btn ${
                  activeScheduleTab === "upcoming" ? "active" : ""
                }`}
                onClick={() => setActiveScheduleTab("upcoming")}>
                ⏰ Upcoming
              </button>
            </div>

            <div className="schedule-content-container">
              {activeScheduleTab === "today" && (
                <div className="schedule-content">
                  <Calendar />
                </div>
              )}

              {activeScheduleTab === "week" && (
                <div className="schedule-content">
                  <div className="week-schedule">
                    <h4>This Week's Schedule</h4>
                    <div className="week-events">
                      <div className="event-item">
                        <span className="event-time">09:00</span>
                        <span className="event-title">Team Meeting</span>
                        <span className="event-date">Mon</span>
                      </div>
                      <div className="event-item">
                        <span className="event-time">14:00</span>
                        <span className="event-title">Project Review</span>
                        <span className="event-date">Wed</span>
                      </div>
                      <div className="event-item">
                        <span className="event-time">10:00</span>
                        <span className="event-title">Client Call</span>
                        <span className="event-date">Fri</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeScheduleTab === "month" && (
                <div className="schedule-content">
                  <div className="month-schedule">
                    <h4>This Month's Overview</h4>
                    <div className="month-stats">
                      <div className="month-stat">
                        <span className="stat-value">12</span>
                        <span className="stat-label">Meetings</span>
                      </div>
                      <div className="month-stat">
                        <span className="stat-value">5</span>
                        <span className="stat-label">Deadlines</span>
                      </div>
                      <div className="month-stat">
                        <span className="stat-value">3</span>
                        <span className="stat-label">Events</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeScheduleTab === "upcoming" && (
                <div className="schedule-content">
                  <div className="upcoming-schedule">
                    <h4>Upcoming Events</h4>
                    <div className="upcoming-events">
                      <div className="upcoming-item">
                        <div className="upcoming-date">
                          <span className="day">15</span>
                          <span className="month">Dec</span>
                        </div>
                        <div className="upcoming-details">
                          <span className="upcoming-title">Annual Review</span>
                          <span className="upcoming-time">2:00 PM</span>
                        </div>
                      </div>
                      <div className="upcoming-item">
                        <div className="upcoming-date">
                          <span className="day">20</span>
                          <span className="month">Dec</span>
                        </div>
                        <div className="upcoming-details">
                          <span className="upcoming-title">Holiday Party</span>
                          <span className="upcoming-time">6:00 PM</span>
                        </div>
                      </div>
                      <div className="upcoming-item">
                        <div className="upcoming-date">
                          <span className="day">25</span>
                          <span className="month">Dec</span>
                        </div>
                        <div className="upcoming-details">
                          <span className="upcoming-title">Christmas Day</span>
                          <span className="upcoming-time">All Day</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Charts Section - Only show for admin and manager roles */}
        {(user?.role === "admin" || user?.role === "manager") &&
          activeTab === "analytics" && (
            <div className="charts-container">
              <TeamActivityChart />
              <DepartmentDistribution />
              <TrainingMetrics />
            </div>
          )}

        {/* Attendance Widget - Only show for non-admin users with approved KYC */}
        {console.log("Attendance widget condition check:", {
          user: user?.role,
          kycStatus,
        })}
        {user &&
          user.role !== "admin" &&
          kycStatus === "approved" &&
          activeTab === "attendance" && (
            <div className="attendance-widget">
              <h3>Attendance</h3>
              <div className="attendance-status">
                {attendanceStatus === "not-checked" && (
                  <div className="attendance-actions">
                    <button className="check-in-btn" onClick={handleCheckIn}>
                      Check In
                    </button>
                    <p>Welcome! Please check in to start your day.</p>
                    <p className="location-note">
                      📍 Your location will be recorded when you check in. If
                      location access is denied, you can still check in without
                      location data.
                    </p>
                    <button
                      className="manual-location-btn"
                      onClick={() => setShowLocationInput(!showLocationInput)}
                      style={{
                        marginTop: "10px",
                        padding: "8px 16px",
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        color: "white",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}>
                      📝 Enter Location Manually
                    </button>
                    {showLocationInput && (
                      <div
                        style={{
                          marginTop: "10px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}>
                        <input
                          type="text"
                          placeholder="Enter your location (e.g., Office Building, Home, etc.)"
                          value={manualLocation}
                          onChange={(e) => setManualLocation(e.target.value)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid rgba(255, 255, 255, 0.3)",
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            color: "white",
                            fontSize: "14px",
                          }}
                        />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={handleManualLocationSubmit}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#28a745",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}>
                            Check In
                          </button>
                          <button
                            onClick={() => {
                              setShowLocationInput(false);
                              setManualLocation("");
                            }}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#6c757d",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {attendanceStatus === "checked-in" && (
                  <div className="attendance-actions">
                    <button className="check-out-btn" onClick={handleCheckOut}>
                      Check Out
                    </button>
                    <p>You're checked in. Have a productive day!</p>
                    {todayAttendance?.checkInAddress && (
                      <div className="location-info">
                        <p>
                          📍 Checked in from: {todayAttendance.checkInAddress}
                        </p>
                        <p>
                          🕐 Time:{" "}
                          {new Date(
                            todayAttendance.checkIn
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {attendanceStatus === "checked-out" && (
                  <div className="attendance-actions">
                    <p>You've checked out for the day. See you tomorrow!</p>
                    {todayAttendance?.checkInAddress && (
                      <div className="location-info">
                        <p>
                          📍 Checked in from: {todayAttendance.checkInAddress}
                        </p>
                        <p>
                          🕐 In:{" "}
                          {new Date(
                            todayAttendance.checkIn
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                    )}
                    {todayAttendance?.checkOutAddress && (
                      <div className="location-info">
                        <p>
                          📍 Checked out from: {todayAttendance.checkOutAddress}
                        </p>
                        <p>
                          🕐 Out:{" "}
                          {new Date(
                            todayAttendance.checkOut
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Payslips Widget - Only show for non-admin users with approved KYC */}
        {user &&
          user.role !== "admin" &&
          kycStatus === "approved" &&
          activeTab === "payslips" && (
            <div className="payslips-widget">
              <h3>My Payslips</h3>
              <div className="payslips-content">
                <div className="payslips-header">
                  <p>View and download your payslips</p>
                  <button
                    className="view-payslips-btn"
                    onClick={() => (window.location.href = "/payslips")}>
                    View All Payslips
                  </button>
                </div>
                <div className="recent-payslips">
                  <PayslipsList userEmail={user.email} />
                </div>
              </div>
            </div>
          )}

        {/* KYC Status Widget - Show for non-admin users with pending KYC */}
        {user &&
          user.role !== "admin" &&
          kycStatus === "pending" &&
          activeTab === "kyc" && (
            <div className="kyc-status-widget">
              <h3>KYC Status</h3>
              <div className="kyc-status-content">
                <div className="kyc-status-icon">⏳</div>
                <div className="kyc-status-details">
                  <h4>KYC Verification Pending</h4>
                  <p>
                    Complete your KYC verification to access attendance and
                    other features.
                  </p>
                  <button className="kyc-submit-btn" onClick={handleKycProceed}>
                    Complete KYC
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Stat Modal */}
      {showStatModal && selectedStat && (
        <div
          className="stat-modal-overlay"
          onClick={() => setShowStatModal(false)}>
          <div className="stat-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedStat} Details</h2>
            <p>
              Detailed information about {selectedStat} will be displayed here.
            </p>
            <button onClick={() => setShowStatModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
