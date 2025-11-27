import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bell, Search, Menu, X, User, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/lib/api";
import { getAvatarUrl } from "@/lib/imageUtils";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { hover } from "@/components/ui/motion";

/**
 * @typedef {Object} HeaderProps
 * @property {() => void} toggleSidebar
 */

export function EnhancedHeader({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState({ employees: [], courses: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Fetch notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoadingNotifications(true);
      const [allNotifications, countData] = await Promise.all([
        apiService.getNotifications(50, 0, true), // Get unread only for dropdown
        apiService.getUnreadNotificationCount(),
      ]);

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
        const message = (notif.message || notif.text || "").toLowerCase().trim();
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
        const contentKey = `${(notif.title || "").trim()}_${
          notif.message || notif.text || ""
        }`.trim();
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

      // Sort by createdAt (newest first)
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
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user?.id]);

  // Load notifications on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id, loadNotifications]);

  // Listen for notification updates from other components (notifications page)
  useEffect(() => {
    const handleNotificationUpdate = () => {
      // Reload notifications when updated from notifications page
      loadNotifications();
    };

    window.addEventListener('notification-updated', handleNotificationUpdate);
    return () => {
      window.removeEventListener('notification-updated', handleNotificationUpdate);
    };
  }, [loadNotifications]);

  // Handle real-time notifications via Socket.io
  const handleNewNotification = useCallback(
    (data) => {
      // Only reload if notification is for current user
      if (data.userId === user?.id) {
        console.log("New notification received:", data);
        loadNotifications();
      }
    },
    [user?.id, loadNotifications]
  );

  // Use the existing socket hook to listen for notifications
  // Pass null for message handlers since we only need notifications here
  useSocket(null, null, handleNewNotification);

  // Filter unread notifications
  const unreadNotifications = notifications.filter(
    (notification) => !notification.isRead
  );

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      await loadNotifications(); // Refresh notifications
      
      // Dispatch event to notify other components (notifications page)
      window.dispatchEvent(new CustomEvent('notification-updated', { 
        detail: { type: 'marked-all-read' } 
      }));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Handle search focus
  const handleSearchFocus = () => {
    setSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setSearchFocused(false);
      setShowSearchResults(false);
    }, 200);
  };

  // Perform search
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults({ employees: [], courses: [] });
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const searchTerm = query.toLowerCase().trim();
      const [employeesData, coursesData] = await Promise.all([
        apiService.getEmployees().catch(() => []),
        apiService.getCourses().catch(() => []),
      ]);

      const employees = Array.isArray(employeesData)
        ? employeesData
        : employeesData?.data || [];
      const courses = Array.isArray(coursesData) ? coursesData : [];

      // Filter employees
      const filteredEmployees = employees
        .filter((emp) => {
          const name = (emp.name || "").toLowerCase();
          const email = (emp.email || "").toLowerCase();
          const empId = (emp.emp_id || emp.employeeId || "").toLowerCase();
          return (
            name.includes(searchTerm) ||
            email.includes(searchTerm) ||
            empId.includes(searchTerm)
          );
        })
        .slice(0, 5); // Limit to 5 results

      // Filter courses
      const filteredCourses = courses
        .filter((course) => {
          const title = (course.title || "").toLowerCase();
          const description = (course.description || "").toLowerCase();
          const category = (course.category || "").toLowerCase();
          return (
            title.includes(searchTerm) ||
            description.includes(searchTerm) ||
            category.includes(searchTerm)
          );
        })
        .slice(0, 5); // Limit to 5 results

      setSearchResults({
        employees: filteredEmployees,
        courses: filteredCourses,
      });
      setShowSearchResults(
        filteredEmployees.length > 0 || filteredCourses.length > 0
      );
    } catch (error) {
      console.error("Error performing search:", error);
      setSearchResults({ employees: [], courses: [] });
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults({ employees: [], courses: [] });
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="border-b border-border/50 bg-background/95 backdrop-blur-md h-16 flex items-center gap-4 px-6 fixed top-0 left-0 right-0 z-30 shadow-md">
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </motion.div>

      <Link
        to="/"
        className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity"
        aria-label="Rural Samriddhi EMS Home">
        <motion.img
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          src="/rsamriddhi_logo.svg"
          alt="Rural Samriddhi EMS Logo"
          className="h-10 md:h-12 w-auto object-contain"
          style={{ maxWidth: "280px" }}
          onError={(e) => {
            console.error("Logo failed to load:", e.target.src);
            // Fallback if logo doesn't load
            e.target.style.display = "none";
          }}
        />
        {/* <motion.span
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="hidden md:inline font-medium text-foreground">
          Rural Samriddhi EMS
        </motion.span> */}
      </Link>

      <div className="ml-auto flex items-center gap-4">
        <div className="relative hidden md:flex items-center">
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-2 z-10 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setSearchQuery("")}>
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="relative">
            <Search
              className={cn(
                "absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-all duration-300 z-10",
                searchFocused ? "text-primary" : "text-muted-foreground"
              )}
            />
            <Input
              type="text"
              placeholder="Search employees, courses..."
              className={cn(
                "w-[200px] lg:w-[300px] pl-8 pr-8 transition-all duration-300",
                searchFocused
                  ? "border-primary shadow-sm ring-1 ring-primary/20"
                  : "border-input"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />

            <AnimatePresence>
              {showSearchResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute mt-1 w-full bg-background rounded-md shadow-lg border z-50 max-h-[400px] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2">Searching...</p>
                    </div>
                  ) : searchResults.employees.length === 0 &&
                    searchResults.courses.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No results found for "{searchQuery}"
                    </div>
                  ) : (
                    <div className="py-2">
                      {searchResults.employees.length > 0 && (
                        <div className="px-3 py-2">
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            Employees
                          </div>
                          {searchResults.employees.map((employee) => (
                            <Link
                              key={employee.id || employee.email}
                              to={`/employees${
                                employee.id ? `?id=${employee.id}` : ""
                              }`}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-md transition-colors cursor-pointer"
                              onClick={() => {
                                setSearchQuery("");
                                setShowSearchResults(false);
                              }}>
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {employee.name || employee.email}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {employee.email}
                                  {employee.emp_id
                                    ? ` • ${employee.emp_id}`
                                    : employee.employeeId
                                    ? ` • ${employee.employeeId}`
                                    : ""}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.courses.length > 0 && (
                        <div className="px-3 py-2 border-t">
                          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            Courses
                          </div>
                          {searchResults.courses.map((course) => (
                            <Link
                              key={course.id}
                              to="/training"
                              className="flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-md transition-colors cursor-pointer"
                              onClick={() => {
                                setSearchQuery("");
                                setShowSearchResults(false);
                              }}>
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {course.title}
                                </p>
                                {course.category && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {course.category}
                                  </p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.div whileHover="hover" whileTap="tap" variants={hover}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1">
                      <Badge
                        variant="destructive"
                        className="h-5 w-5 p-0 flex items-center justify-center shadow-sm">
                        {unreadCount}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[350px]">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleMarkAllAsRead}
                    disabled={isLoadingNotifications}>
                    Mark all as read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {isLoadingNotifications ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <p>Loading notifications...</p>
                    </div>
                  </div>
                ) : unreadNotifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}>
                      <div className="flex flex-col items-center gap-2">
                        <Bell className="h-12 w-12 text-muted-foreground/30" />
                        <p>No new notifications</p>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  unreadNotifications.map((notification, index) => {
                    // Format date
                    const formatTime = (dateString) => {
                      if (!dateString) return "";
                      const date = new Date(dateString);
                      const now = new Date();
                      const diffMs = now - date;
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMs / 3600000);
                      const diffDays = Math.floor(diffMs / 86400000);

                      if (diffMins < 1) return "Just now";
                      if (diffMins < 60) return `${diffMins}m ago`;
                      if (diffHours < 24) return `${diffHours}h ago`;
                      if (diffDays < 7) return `${diffDays}d ago`;
                      return date.toLocaleDateString();
                    };

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
                        <DropdownMenuItem
                          className="cursor-pointer p-3 flex flex-col gap-1"
                          onClick={async () => {
                            if (!notification.isRead) {
                              try {
                                await apiService.markNotificationAsRead(
                                  notification.id
                                );
                                await loadNotifications();
                                
                                // Dispatch event to notify other components (notifications page)
                                window.dispatchEvent(new CustomEvent('notification-updated', { 
                                  detail: { type: 'marked-read', notificationId: notification.id } 
                                }));
                              } catch (error) {
                                console.error(
                                  "Error marking notification as read:",
                                  error
                                );
                              }
                            }
                            if (notification.link) {
                              window.location.href = notification.link;
                            }
                          }}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {notification.title}
                            </span>
                            <Badge
                              variant={
                                notification.type === "error"
                                  ? "destructive"
                                  : notification.type === "success"
                                  ? "default"
                                  : "secondary"
                              }
                              className="ml-auto">
                              {notification.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          <span className="text-xs text-muted-foreground/70 mt-1">
                            {formatTime(notification.createdAt)}
                          </span>
                        </DropdownMenuItem>
                      </motion.div>
                    );
                  })
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  to="/notifications"
                  className="w-full text-center cursor-pointer">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        <motion.div whileHover="hover" whileTap="tap" variants={hover}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full">
                <Avatar className="h-9 w-9 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
                  <AvatarImage 
                    key={user?.avatar || 'no-avatar'}
                    src={getAvatarUrl(user?.avatar)} 
                    alt={user?.name} 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error("Header avatar failed to load:", getAvatarUrl(user?.avatar));
                      e.target.style.display = 'none';
                    }}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    {user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col items-center p-4 border-b">
                <Avatar className="h-16 w-16 mb-2">
                  <AvatarImage 
                    key={user?.avatar || 'no-avatar'}
                    src={getAvatarUrl(user?.avatar)} 
                    alt={user?.name} 
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error("Profile card avatar failed to load:", getAvatarUrl(user?.avatar));
                      e.target.style.display = 'none';
                    }}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg">
                    {user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuItem asChild>
                <Link
                  to="/profile"
                  className="cursor-pointer h-10 flex items-center">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/settings"
                  className="cursor-pointer h-10 flex items-center">
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer h-10 flex items-center text-red-500 focus:text-red-500">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </div>
    </motion.header>
  );
}
