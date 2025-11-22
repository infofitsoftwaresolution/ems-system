import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { EnhancedHeader } from "./enhanced-header";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { ParticleBackground } from "@/components/ui/particle-background";
import { AnimatedGradientBackground } from "@/components/ui/animated-gradient-background";
import { PasswordChangeModal } from "@/components/ui/password-change-modal";

export function EnhancedDashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const {
    isAuthenticated,
    isLoading,
    user: _user,
    requiresPasswordChange,
    updatePassword,
  } = useAuth();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // If still loading auth state, show loading indicator with animated background
  if (isLoading) {
    return (
      <AnimatedGradientBackground
        intensity="subtle"
        speed="slow"
        className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}>
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-md font-medium text-primary">
            Loading your workspace...
          </motion.p>
        </div>
      </AnimatedGradientBackground>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated && mounted) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background/90 overflow-x-hidden">
      <EnhancedHeader toggleSidebar={() => setIsCollapsed(!isCollapsed)} />

      <div className="flex flex-1 relative pt-16">
        <AnimatePresence>
          <motion.aside
            initial={false}
            animate={{
              width: isCollapsed ? 70 : 256,
              transition: {
                duration: 0.3,
                ease: [0.2, 0.0, 0.0, 1.0],
              },
            }}
            className={cn(
              "fixed left-0 top-16 z-20 h-[calc(100vh-4rem)] border-r bg-background/95 backdrop-blur-sm shadow-sm overflow-hidden"
            )}>
            <div className="flex h-full flex-col justify-between p-2 overflow-x-hidden">
              <motion.div
                initial={false}
                animate={{ opacity: 1 }}
                className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2">
                <SidebarNav isCollapsed={isCollapsed} className="gap-1" />
              </motion.div>

              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex justify-end p-2 shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="shadow-sm hover:bg-accent hover:text-accent-foreground">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.aside>
        </AnimatePresence>

        <motion.main
          initial={false}
          animate={{
            marginLeft: isCollapsed ? 70 : 256,
            transition: {
              duration: 0.3,
              ease: [0.2, 0.0, 0.0, 1.0],
            },
          }}
          className="flex-1 relative">
          <div className="absolute inset-0 -z-10 opacity-50">
            <ParticleBackground
              particleCount={30}
              particleSize={1.5}
              particleColor="rgba(37, 99, 235, 0.2)"
              connectParticles={true}
              interactive={true}
            />
          </div>

          <div className="container py-6 px-6 relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={window.location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="h-full">
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.main>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={requiresPasswordChange}
        onClose={() => {}} // Prevent closing until password is changed
        onPasswordChange={updatePassword}
      />
    </div>
  );
}
