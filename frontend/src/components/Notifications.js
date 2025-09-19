import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Notifications.css";

const Notifications = ({ isOpen, onClose, onNotificationRead }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "info",
      title: "System Update",
      message: "System maintenance scheduled for tomorrow at 2 AM",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      type: "warning",
      title: "Password Expiry",
      message: "Your password will expire in 5 days",
      time: "1 day ago",
      read: false,
    },
    {
      id: 3,
      type: "success",
      title: "New Employee Added",
      message: "John Doe has been added to the IT department",
      time: "2 days ago",
      read: true,
    },
  ]);

  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("notifications");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setNotifications(parsed);
      }
    } catch {}
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem("notifications", JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    // Notify parent component to refresh notification count
    if (onNotificationRead) {
      setTimeout(() => onNotificationRead(), 100);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
    // Notify parent component to refresh notification count
    if (onNotificationRead) {
      setTimeout(() => onNotificationRead(), 100);
    }
  };

  const handleViewAll = () => {
    navigate("/notifications");
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "info":
        return "ℹ️";
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
      case "error":
        return "❌";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "info":
        return "#3b82f6";
      case "warning":
        return "#f59e0b";
      case "success":
        return "#10b981";
      case "error":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="notifications-dropdown" ref={notificationRef}>
      <div className="notifications-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <button className="mark-all-read" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${
                !notification.read ? "unread" : ""
              }`}
              onClick={() => markAsRead(notification.id)}>
              <div
                className="notification-icon"
                style={{
                  backgroundColor: getNotificationColor(notification.type),
                }}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">
                  {notification.message}
                </div>
                <div className="notification-time">{notification.time}</div>
              </div>
              {!notification.read && <div className="unread-indicator"></div>}
            </div>
          ))
        )}
      </div>

      <div className="notifications-footer">
        <button className="view-all-btn" onClick={handleViewAll}>
          View All Notifications
        </button>
      </div>
    </div>
  );
};

export default Notifications;
