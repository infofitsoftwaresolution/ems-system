import { useState } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { Header } from "./header";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";

export function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  // If still loading auth state, show loading indicator
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header toggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      <div className="flex flex-1 pt-14">
        <aside
          className={cn(
            "fixed left-0 top-14 z-20 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-all duration-300 ease-in-out overflow-hidden",
            isCollapsed && "w-[70px]"
          )}>
          <div className="flex h-full flex-col justify-between p-4 overflow-x-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <SidebarNav isCollapsed={isCollapsed} className="gap-1" />
            </div>
            <div className="flex justify-end shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
              </Button>
            </div>
          </div>
        </aside>
        <main
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            isCollapsed ? "ml-[70px]" : "ml-64"
          )}>
          <div className="container py-6 px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
