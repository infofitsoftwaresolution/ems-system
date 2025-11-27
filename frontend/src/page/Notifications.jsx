import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import {
  format,
  isToday,
  isYesterday,
  parseISO,
  formatDistanceToNow,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" or "unread"
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const allNotifications = await apiService.getNotifications(
        100,
        0,
        filter === "unread"
      );

      const notificationsList = Array.isArray(allNotifications)
        ? allNotifications
        : allNotifications?.data || allNotifications?.notifications || [];

      // Filter out dummy/test notifications - comprehensive patterns
      const dummyPatterns = [
        /^test\s+/i,
        /^dummy\s+/i,
        /test\./i,
        /complete\s+safety\s+training\s+module/i,
        /review\s+company\s+policy\s+updates/i,
        /department\s+review\s+meeting/i,
        /monthly\s+all-hands\s+meeting/i,
        /new\s+task\s+assigned.*complete\s+safety/i,
        /new\s+task\s+assigned.*review\s+company/i,
        /new\s+event\s+assigned.*department\s+review/i,
        /new\s+event\s+assigned.*monthly\s+all-hands/i,
      ];

      // Specific dummy notification messages to filter (case-insensitive matching)
      const dummyMessages = [
        "complete safety training module",
        "review company policy updates",
        "new task assigned: complete safety training module",
        "new task assigned: review company policy updates",
        "new event assigned: department review meeting",
        "new event assigned: monthly all-hands meeting",
        "test task",
        "today task",
        "compelte this task",
        "department review meeting",
        "monthly all-hands meeting",
      ];

      const filteredNotifications = notificationsList.filter((notif) => {
        const title = (notif.title || "").toLowerCase().trim();
        const message = (notif.message || notif.text || "")
          .toLowerCase()
          .trim();
        const fullText = `${title} ${message}`.trim();

        // Skip if title or message is empty
        if (!title && !message) {
          return false;
        }

        // Filter out notifications matching dummy patterns in title or message
        if (
          dummyPatterns.some(
            (pattern) =>
              pattern.test(title) ||
              pattern.test(message) ||
              pattern.test(fullText)
          )
        ) {
          return false;
        }

        // Filter out notifications containing dummy messages (more aggressive matching)
        if (
          dummyMessages.some(
            (dummyMsg) =>
              title.includes(dummyMsg) ||
              message.includes(dummyMsg) ||
              fullText.includes(dummyMsg)
          )
        ) {
          return false;
        }

        // Additional check: filter if message contains "Due:" with dates (common in dummy task notifications)
        // But only if it also contains our dummy keywords
        if (
          (message.includes("due:") || message.includes("(due:")) &&
          (message.includes("complete safety") ||
            message.includes("review company") ||
            message.includes("department review") ||
            message.includes("monthly all-hands"))
        ) {
          return false;
        }

        return true;
      });

      // Remove duplicates by id (keep the most recent one)
      const uniqueById = new Map();
      filteredNotifications.forEach((notif) => {
        if (!uniqueById.has(notif.id)) {
          uniqueById.set(notif.id, notif);
        } else {
          // If duplicate id exists, keep the one with later createdAt
          const existing = uniqueById.get(notif.id);
          const existingDate = existing.createdAt
            ? new Date(existing.createdAt)
            : new Date(0);
          const currentDate = notif.createdAt
            ? new Date(notif.createdAt)
            : new Date(0);
          if (currentDate > existingDate) {
            uniqueById.set(notif.id, notif);
          }
        }
      });

      // Also remove duplicates by message+title combination (for notifications with same content)
      const uniqueByContent = new Map();
      Array.from(uniqueById.values()).forEach((notif) => {
        const contentKey = `${(notif.title || "").trim()}_${(
          notif.message ||
          notif.text ||
          ""
        ).trim()}`;
        if (!uniqueByContent.has(contentKey)) {
          uniqueByContent.set(contentKey, notif);
        } else {
          // If duplicate content exists, keep the one with later createdAt
          const existing = uniqueByContent.get(contentKey);
          const existingDate = existing.createdAt
            ? new Date(existing.createdAt)
            : new Date(0);
          const currentDate = notif.createdAt
            ? new Date(notif.createdAt)
            : new Date(0);
          if (currentDate > existingDate) {
            uniqueByContent.set(contentKey, notif);
          }
        }
      });

      // Sort by createdAt (newest first) and set notifications
      const finalNotifications = Array.from(uniqueByContent.values()).sort(
        (a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        }
      );

      // Calculate unread count from filtered notifications
      const filteredUnreadCount = finalNotifications.filter(
        (n) => !n.isRead
      ).length;

      setNotifications(finalNotifications);
      setUnreadCount(filteredUnreadCount);
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Failed to load notifications");
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, filter]);

  // Handle new notification from socket
  const handleNewNotification = useCallback(
    (data) => {
      if (data.userId === user?.id) {
        console.log("New notification received via socket:", data);
        loadNotifications();
      }
    },
    [user?.id, loadNotifications]
  );

  // Use socket for real-time notifications
  useSocket(null, null, handleNewNotification);

  // Load notifications on mount and when filter changes
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Listen for notification updates from other components (header dropdown)
  useEffect(() => {
    const handleNotificationUpdate = () => {
      // Reload notifications when updated from header dropdown
      loadNotifications();
    };

    window.addEventListener("notification-updated", handleNotificationUpdate);
    return () => {
      window.removeEventListener(
        "notification-updated",
        handleNotificationUpdate
      );
    };
  }, [loadNotifications]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Dispatch event to notify other components (header dropdown)
      window.dispatchEvent(
        new CustomEvent("notification-updated", {
          detail: { type: "marked-read", notificationId },
        })
      );

      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAllRead(true);
      await apiService.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);

      // Dispatch event to notify other components (header dropdown)
      window.dispatchEvent(
        new CustomEvent("notification-updated", {
          detail: { type: "marked-all-read" },
        })
      );

      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await apiService.markNotificationAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notification.id
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Dispatch event to notify other components (header dropdown)
        window.dispatchEvent(
          new CustomEvent("notification-updated", {
            detail: { type: "marked-read", notificationId: notification.id },
          })
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate to link if available
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Handle notification deletion
  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation(); // Prevent triggering the card click
    try {
      await apiService.deleteNotification(notificationId);
      setNotifications((prev) => {
        const deleted = prev.find((n) => n.id === notificationId);
        const updated = prev.filter((n) => n.id !== notificationId);
        // Update unread count if deleted notification was unread
        if (deleted && !deleted.isRead) {
          setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
        }
        return updated;
      });

      // Dispatch event to notify other components (header dropdown)
      window.dispatchEvent(
        new CustomEvent("notification-updated", {
          detail: { type: "deleted", notificationId },
        })
      );

      toast.success("Notification deleted successfully");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  // Format notification time
  const formatNotificationTime = (dateString) => {
    if (!dateString) return "Just now";
    try {
      const date = parseISO(dateString);
      if (isToday(date)) {
        return format(date, "h:mm a");
      } else if (isYesterday(date)) {
        return "Yesterday";
      } else {
        return formatDistanceToNow(date, { addSuffix: true });
      }
    } catch {
      return "Just now";
    }
  };

  // Get notification type color
  const getTypeColor = (type) => {
    switch (type) {
      case "success":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "warning":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "error":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllRead}>
              {isMarkingAllRead ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-2" />
              )}
              Mark all as read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadNotifications}
            disabled={isLoading}>
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            All Notifications
            {filter === "all" && notifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {filter === "unread" && unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Loading notifications...
                </p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {filter === "unread"
                    ? "You have no unread notifications"
                    : "You don't have any notifications yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    !notification.isRead && "border-primary/50 bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-1">
                            <h3
                              className={cn(
                                "font-semibold text-sm",
                                !notification.isRead && "font-bold"
                              )}>
                              {notification.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                getTypeColor(notification.type)
                              )}>
                              {notification.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) =>
                                  handleMarkAsRead(notification.id, e)
                                }
                                title="Mark as read">
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) =>
                                handleDeleteNotification(notification.id, e)
                              }
                              title="Delete notification">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                          {notification.link && (
                            <>
                              <span>•</span>
                              <span className="text-primary hover:underline">
                                View details
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
