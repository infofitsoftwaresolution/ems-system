import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import AddEmployee from "./pages/AddEmployee";
import SiteAdmin from "./pages/SiteAdmin";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Attendance from "./pages/Attendance";
import LeaveApply from "./pages/LeaveApply";
import Payslips from "./pages/Payslips";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

// User Management
import UserPermissions from "./pages/UserPermissions";
import UserRoles from "./pages/UserRoles";

// Course Management
import Courses from "./pages/Courses";
import AddCourse from "./pages/AddCourse";
import NotificationSettings from "./pages/NotificationSettings";
import RegistrationSettings from "./pages/RegistrationSettings";
import SystemServices from "./pages/SystemServices";
import FeedbackSettings from "./pages/FeedbackSettings";
import AdvancedFeatures from "./pages/AdvancedFeatures";
import AdminPresets from "./pages/AdminPresets";
import SiteInformation from "./pages/SiteInformation";
import AnalyticsSettings from "./pages/AnalyticsSettings";
import AnalyticsModels from "./pages/AnalyticsModels";
import SetupPassword from "./pages/SetupPassword";

// Access Control
import SiteAdminAccess from "./pages/SiteAdminAccess";
import AccessLogs from "./pages/AccessLogs";
import KycSubmit from "./pages/KycSubmit";
import KycReview from "./pages/KycReview";
import NotificationsPage from "./pages/NotificationsPage";
import LeaveReview from "./pages/LeaveReview";
import AttendanceManagement from "./pages/AttendanceManagement";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState({
    messages: 2,
    notifications: 1,
  });

  const isAuthenticated = () => {
    return localStorage.getItem("token") !== null;
  };

  const PrivateRoute = ({ children }) => {
    if (!isAuthenticated()) return <Navigate to="/" />;
    // Enforce password setup before accessing protected routes
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const isOnSetupPage = window.location.pathname === "/setup-password";
      if (storedUser && storedUser.mustChangePassword && !isOnSetupPage) {
        return <Navigate to="/setup-password" />;
      }
    } catch (_) {}
    return children;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              style: {
                background: "#4CAF50",
                color: "#fff",
              },
            },
            error: {
              duration: 5000,
              style: {
                background: "#f44336",
                color: "#fff",
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/setup-password" element={<SetupPassword />} />
          <Route
            path="/attendance"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <Attendance />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/leave-apply"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <LeaveApply />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/payslips"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <Payslips />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/leave-review"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <LeaveReview />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <NotificationsPage />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/kyc-submit"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <KycSubmit />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/kyc-review"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <KycReview />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <Dashboard />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <Employees />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/add-employee"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <AddEmployee />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <Reports />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <SiteAdmin />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <Reports />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <Settings />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          {/* User Management Routes */}
          <Route
            path="/user-permissions"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <UserPermissions />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/user-roles"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <UserRoles />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          {/* Course Management Routes */}
          <Route
            path="/courses"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <Courses />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/add-course"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <AddCourse />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications-settings"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <NotificationSettings />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/registration-settings"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <RegistrationSettings />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/system-services"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <SystemServices />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/feedback-settings"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <FeedbackSettings />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/advanced-features"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <AdvancedFeatures />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin-presets"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <AdminPresets />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/site-information"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <SiteInformation />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics-settings"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <AnalyticsSettings />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics-models"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <AnalyticsModels />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/site-admin-access"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <SiteAdminAccess />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/access-logs"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <AccessLogs />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <Attendance />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/attendance-management"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <AttendanceManagement />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/payslips"
            element={
              <PrivateRoute>
                <div className="app-layout">
                  <Header
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={toggleSidebar}
                    notifications={notifications}
                  />
                  <div className="main-container">
                    <Sidebar isOpen={sidebarOpen} />
                    <main
                      className={`main-content ${
                        sidebarOpen ? "sidebar-open" : ""
                      }`}>
                      <Payslips />
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
