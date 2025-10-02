import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  Building2,
  GraduationCap,
  BarChart4,
  Calendar,
  Settings,
  ClipboardList,
  MessageSquare,
  Home,
  ServerCog,
  Clock,
  FileText,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/**
 * @typedef {Object} SidebarNavProps
 * @property {boolean} isCollapsed - Whether the sidebar is collapsed
 * @property {string} [className] - Additional CSS classes
 * @property {Object} [props] - Additional HTML attributes
 */

export function SidebarNav({ className, isCollapsed, ...props }) {
  const location = useLocation();
  const { user } = useAuth();

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        title: "Dashboard",
        href: "/",
        icon: Home,
      },
      {
        title: "My Profile",
        href: "/profile",
        icon: UserIcon,
      },
    ];

    // Add employee-specific items
    if (user?.role === 'employee') {
      baseItems.push(
        {
          title: "Attendance",
          href: "/attendance",
          icon: Clock,
        },
        {
          title: "Payslip",
          href: "/payslip",
          icon: FileText,
        },
        {
          title: "Leave Application",
          href: "/leave",
          icon: Calendar,
        }
      );
    }

    // Add common items for all users
    baseItems.push(
      {
        title: "Tasks",
        href: "/tasks",
        icon: ClipboardList,
      },
      {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
      },
      {
        title: "Messages",
        href: "/messages",
        icon: MessageSquare,
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      }
    );

    // Add admin/manager specific items
    if (user?.role === 'admin' || user?.role === 'manager') {
      baseItems.splice(1, 0, 
        {
          title: "Employees",
          href: "/employees",
          icon: Users,
        },
        {
          title: "Attendance",
          href: "/admin-attendance",
          icon: Clock,
        },
        {
          title: "Departments",
          href: "/departments",
          icon: Building2,
        },
        {
          title: "Training",
          href: "/training",
          icon: GraduationCap,
        },
        {
          title: "Performance",
          href: "/performance",
          icon: BarChart4,
        }
      );
    }

    // Add admin-only items
    if (user?.role === 'admin') {
      baseItems.push(
        {
          title: "KYC Management",
          href: "/kyc-management",
          icon: FileText,
        },
        {
          title: "Administration",
          href: "/admin",
          icon: ServerCog,
        }
      );
    }

    return baseItems;
  };

  const items = getNavigationItems();

  return (
    <nav className={cn("flex flex-col gap-2", className)} {...props}>
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Button
            key={item.href}
            variant={isActive ? "secondary" : "ghost"}
            size={isCollapsed ? "icon" : "default"}
            className={cn("justify-start", isCollapsed && "h-10 w-10 p-0")}
            asChild>
            <Link to={item.href}>
              <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
