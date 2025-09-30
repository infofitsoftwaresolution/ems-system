import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context.jsx";
import { EnhancedDashboardLayout } from "./components/layout/enhanced-dashboard-layout.jsx";
import EnhancedCalendar from "./page/EnhancedCalendar.jsx";
import Dashboard from "./page/Dashboard.jsx";
import EmployeeDashboard from "./page/EmployeeDashboard.jsx";
import Employees from "./page/Employees.jsx";
import Training from "./page/Training.jsx";
import Calendar from "./page/Calendar.jsx";
import Tasks from "./page/Tasks.jsx";
import Communication from "./page/Communication.jsx";
import Settings from "./page/Settings.jsx";
import Administration from "./page/Administration.jsx";
import KycManagement from "./page/KycManagement.jsx";
import EmployeeProfile from "./page/EmployeeProfile.jsx";
import EmployeeAttendance from "./page/EmployeeAttendance.jsx";
import AdminAttendance from "./page/AdminAttendance.jsx";
import EmployeePayslip from "./page/EmployeePayslip.jsx";
import EmployeeLeave from "./page/EmployeeLeave.jsx";
import EnhancedLogin from "./page/EnhancedLogin.jsx";
import NotFound from "./page/NotFound.jsx";
import { useAuth } from "./hooks/use-auth";
import { RoleBasedDashboard } from "./components/RoleBasedDashboard.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            duration: 5000,
            className: "shadow-lg",
          }}
        />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}>
          <Routes>
            <Route path="/login" element={<EnhancedLogin />} />
            <Route element={<EnhancedDashboardLayout />}>
              <Route path="/" element={<RoleBasedDashboard />} />
              <Route path="/profile" element={<EmployeeProfile />} />
              <Route path="/attendance" element={<EmployeeAttendance />} />
              <Route path="/admin-attendance" element={<AdminAttendance />} />
              <Route path="/payslip" element={<EmployeePayslip />} />
              <Route path="/leave" element={<EmployeeLeave />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/training" element={<Training />} />
              <Route path="/calendar" element={<EnhancedCalendar />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/messages" element={<Communication />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/kyc-management" element={<KycManagement />} />
              <Route path="/admin" element={<Administration />} />
              {/* Placeholder routes with better temporary components */}
              <Route
                path="/departments"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">Departments</h1>
                    <p className="text-muted-foreground">
                      Department management coming soon...
                    </p>
                  </div>
                }
              />
              <Route
                path="/performance"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">
                      Performance Reviews
                    </h1>
                    <p className="text-muted-foreground">
                      Performance review system coming soon...
                    </p>
                  </div>
                }
              />
              <Route
                path="/profile"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">User Profile</h1>
                    <p className="text-muted-foreground">
                      Profile management coming soon...
                    </p>
                  </div>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
