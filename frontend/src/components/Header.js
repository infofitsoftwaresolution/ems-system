import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Notifications from "./Notifications";
import Messages from "./Messages";
import Email from "./Email";
import "./Header.css";

const Header = ({ sidebarOpen, toggleSidebar, notifications }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Count unread notifications
  useEffect(() => {
    const countUnreadNotifications = () => {
      try {
        const stored = localStorage.getItem("notifications");
        if (stored) {
          const notifications = JSON.parse(stored);
          if (Array.isArray(notifications)) {
            const unreadCount = notifications.filter(
              (notification) => !notification.read
            ).length;
            setNotificationCount(unreadCount);
          }
        }
      } catch (error) {
        console.error("Error counting notifications:", error);
      }
    };

    // Count on mount
    countUnreadNotifications();

    // Listen for storage changes (when notifications are updated)
    const handleStorageChange = (e) => {
      if (e.key === "notifications") {
        countUnreadNotifications();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check periodically for changes
    const interval = setInterval(countUnreadNotifications, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getInitials = (fullName) => {
    if (!fullName) return "U";
    const parts = String(fullName).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowMessages(false);
    setShowEmail(false);
  };

  // Function to refresh notification count (can be called from Notifications component)
  const refreshNotificationCount = () => {
    try {
      const stored = localStorage.getItem("notifications");
      if (stored) {
        const notifications = JSON.parse(stored);
        if (Array.isArray(notifications)) {
          const unreadCount = notifications.filter(
            (notification) => !notification.read
          ).length;
          setNotificationCount(unreadCount);
        }
      }
    } catch (error) {
      console.error("Error refreshing notification count:", error);
    }
  };

  const handleMessageClick = () => {
    setShowMessages(!showMessages);
    setShowNotifications(false);
    setShowEmail(false);
  };

  const handleEmailClick = () => {
    setShowEmail(!showEmail);
    setShowNotifications(false);
    setShowMessages(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <button
            className="hamburger-menu"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="brand">
            <div className="brand-logo">
              <div className="logo-icon">
                <div className="logo-circle">
                  <div className="logo-arrow">^</div>
                </div>
              </div>
              <div className="brand-text">
                <span className="brand-title">RURAL</span>
                <span className="brand-subtitle">SAMRIDDHI</span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="search-wrap">
            <input
              type="text"
              className="search-input"
              placeholder="Search employees"
            />
          </div>
        </div>

        <div className="header-right">
          <div className="notifications">
            <div className="notification-container">
              <button
                className="notification-btn"
                title="Notifications"
                onClick={handleNotificationClick}>
                <span className="icon">🔔</span>
              </button>
              <Notifications
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onNotificationRead={refreshNotificationCount}
              />
            </div>
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </div>

          <div className="user-section">
            <div
              className="user-avatar"
              title={user.name?.toUpperCase() || "User"}>
              {getInitials(user.name?.toUpperCase() || user.email)}
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
