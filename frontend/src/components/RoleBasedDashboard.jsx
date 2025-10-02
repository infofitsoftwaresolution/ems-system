import { useAuth } from "@/hooks/use-auth";
import Dashboard from "@/page/Dashboard.jsx";
import EmployeeDashboard from "@/page/EmployeeDashboard.jsx";

export function RoleBasedDashboard() {
  const { user } = useAuth();
  
  // Show employee dashboard for employees, admin dashboard for admins/managers
  if (user?.role === 'employee') {
    return <EmployeeDashboard />;
  }
  
  // Show admin dashboard for admins and managers
  return <Dashboard />;
}
