import { cn } from "@/lib/utils";
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
  ShieldCheck,
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
    if (user?.role === "employee") {
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

    // Add admin/manager/hr specific items
    if (
      user?.role === "admin" ||
      user?.role === "manager" ||
      user?.role === "hr"
    ) {
      baseItems.splice(
        1,
        0,
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
        },
        {
          title: "Payslip Management",
          href: "/payslip-management",
          icon: FileText,
        },
        {
          title: "Leave Management",
          href: "/admin-leave-management",
          icon: Calendar,
        }
      );
    }

    // Add admin/manager/hr items (before common items for better visibility)
    if (
      user?.role === "admin" ||
      user?.role === "manager" ||
      user?.role === "hr"
    ) {
      baseItems.push({
        title: "KYC Management",
        href: "/kyc-management",
        icon: ShieldCheck,
      });
    }

    // Add admin-only items
    if (user?.role === "admin") {
      baseItems.push({
        title: "Administration",
        href: "/admin",
        icon: ServerCog,
      });
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

    return baseItems;
  };

  const items = getNavigationItems();

  return (
    <nav className={cn("flex flex-col gap-1", className)} {...props}>
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 h-10",
              "hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-accent text-accent-foreground font-medium",
              isCollapsed && "justify-center px-0 w-10"
            )}
            role="menuitem"
            tabIndex={-1}>
            <item.icon
              className={cn("h-5 w-5 flex-shrink-0", !isCollapsed && "mr-2")}
            />
            {!isCollapsed && <span>{item.title}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
