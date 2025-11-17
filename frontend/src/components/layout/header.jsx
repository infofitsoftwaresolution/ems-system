import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Search, Menu } from "lucide-react";
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

/**
 * @typedef {Object} HeaderProps
 * @property {function} toggleSidebar - Function to toggle sidebar
 */

export function Header({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter unread notifications
  const unreadNotifications = notifications.filter(
    (notification) => !notification.isRead
  );

  return (
    <header className="border-b bg-background h-14 flex items-center gap-4 px-6 fixed top-0 left-0 right-0 z-30">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="md:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <Link
        to="/"
        className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity"
        aria-label="Rural Samriddhi EMS Home">
        <img
          src="/rsamriddhi_logo.png"
          alt=""
          className="h-8 w-auto"
          onError={(e) => {
            // Fallback if logo doesn't load
            e.target.style.display = "none";
          }}
        />
        <span className="hidden md:inline text-foreground">
          Rural Samriddhi EMS
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-4">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-[200px] lg:w-[300px] pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotifications.length > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 w-5 p-0 flex items-center justify-center absolute -top-1 -right-1">
                  {unreadNotifications.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px]">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {unreadNotifications.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              unreadNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="cursor-pointer">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{notification.title}</span>
                      <Badge variant={notification.type}>
                        {notification.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                to="/notifications"
                className="w-full text-center cursor-pointer">
                View all
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>
                  {user?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
