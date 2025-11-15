import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Search, Menu, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { notifications } from "@/lib/data";
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

  // Filter unread notifications
  const unreadNotifications = notifications.filter(
    (notification) => !notification.isRead
  );

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

  // Update search results visibility
  useEffect(() => {
    if (searchQuery.length > 1) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="border-b bg-background/95 backdrop-blur-sm h-16 flex items-center gap-4 px-6 fixed top-0 left-0 right-0 z-30 shadow-sm">
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

      <Link to="/" className="flex items-center gap-2 font-semibold">
        <motion.img
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          src="/rsamriddhi_logo.png"
          alt="Rural samriddhi EMS"
          className="h-8 w-auto"
        />
        <motion.span
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="hidden md:inline font-medium">
          Rural samriddhi EMS
        </motion.span>
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

          <Search
            className={cn(
              "absolute left-2.5 h-4 w-4 transition-all duration-300",
              searchFocused ? "text-primary" : "text-muted-foreground"
            )}
          />

          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="relative">
            <Input
              type="search"
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
                  className="absolute mt-1 w-full bg-background rounded-md shadow-lg border z-10">
                  <div className="p-2 text-sm text-muted-foreground">
                    No results found for "{searchQuery}"
                  </div>
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
                  {unreadNotifications.length > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1">
                      <Badge
                        variant="destructive"
                        className="h-5 w-5 p-0 flex items-center justify-center shadow-sm">
                        {unreadNotifications.length}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[350px]">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  Mark all as read
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {unreadNotifications.length === 0 ? (
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
                  unreadNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
                      <DropdownMenuItem className="cursor-pointer p-3 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {notification.title}
                          </span>
                          <Badge
                            variant={notification.type}
                            className="ml-auto">
                            {notification.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <span className="text-xs text-muted-foreground/70 mt-1">
                          {notification.time}
                        </span>
                      </DropdownMenuItem>
                    </motion.div>
                  ))
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
                  <AvatarImage src={user?.avatar} alt={user?.name} />
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
                  <AvatarImage src={user?.avatar} alt={user?.name} />
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
