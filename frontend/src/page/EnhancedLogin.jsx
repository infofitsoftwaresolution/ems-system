import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AnimatedGradientBackground } from "@/components/ui/animated-gradient-background";
import { ParticleBackground } from "@/components/ui/particle-background";

export default function EnhancedLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [logoError, setLogoError] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Starting login process...");
      await login(email, password);
      console.log("Login function completed successfully");
      toast.success("Login successful!");

      // Wait a bit longer to ensure authentication state is updated
      setTimeout(() => {
        console.log("Navigating to dashboard...");
        navigate("/");
      }, 500);
    } catch (error) {
      console.error("Login error in component:", error);

      // Show specific error message based on error type
      if (
        error.message &&
        error.message.includes("Backend server is not running")
      ) {
        toast.error(
          "Backend server is not running. Please start the server on port 3001.",
          {
            duration: 5000,
          }
        );
      } else if (
        error.message &&
        error.message.includes("Invalid credentials")
      ) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.error(
          error.message ||
            "Login failed. Please check if the backend server is running."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Enhanced gradient background with green/earth tones */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />

      {/* Animated gradient overlay */}
      <AnimatedGradientBackground
        intensity="subtle"
        speed="slow"
        className="fixed inset-0 z-0 opacity-60"
      />

      {/* Particle background with green theme */}
      <div className="absolute inset-0 z-10">
        <ParticleBackground
          particleCount={40}
          particleSize={2}
          particleColor="rgba(16, 185, 129, 0.2)"
          connectParticles={true}
          interactive={true}
        />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <motion.div
        className="relative z-20 w-full max-w-md flex flex-col items-center justify-center px-1 py-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}>
        <motion.div variants={itemVariants} className="mb-6 text-center w-full">
          {/* Enhanced Logo with shadow and glow */}
          <motion.div
            className="mb-6 flex justify-start ml-[55px]"
            initial={{ scale: 0, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
              type: "spring",
              stiffness: 200,
            }}>
            <div className="relative">
              <div className="absolute inset-0 bg-green-400/30 rounded-full blur-xl animate-pulse" />
              {!logoError ? (
                <img
                  src="/rsamriddhi_logo.png"
                  alt="Rural Samridhi Logo"
                  className="relative h-24 w-auto object-contain drop-shadow-lg"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="relative h-24 flex items-center justify-center">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent drop-shadow-lg">
                    Rural Samridhi
                  </h1>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full">
          <Card className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 shadow-2xl border border-green-100/50 dark:border-gray-700/50">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Sign In
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <motion.div
                  className="space-y-2"
                  whileTap={{ scale: 0.995 }}
                  animate={{
                    boxShadow:
                      focusedField === "email"
                        ? "0 0 0 3px rgba(16, 185, 129, 0.1)"
                        : "none",
                  }}>
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className={`transition-all duration-300 ${
                        focusedField === "email"
                          ? "border-green-500 ring-2 ring-green-500/20 dark:border-green-400 dark:ring-green-400/20"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                </motion.div>

                <motion.div
                  className="space-y-2"
                  whileTap={{ scale: 0.995 }}
                  animate={{
                    boxShadow:
                      focusedField === "password"
                        ? "0 0 0 3px rgba(16, 185, 129, 0.1)"
                        : "none",
                  }}>
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </Label>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() =>
                        toast.info("Password reset functionality coming soon!")
                      }>
                      Forgot password?
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className={`transition-all duration-300 pr-10 ${
                        focusedField === "password"
                          ? "border-green-500 ring-2 ring-green-500/20 dark:border-green-400 dark:ring-green-400/20"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}>
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </motion.div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 border-t pt-4">
              <p className="text-xs text-center text-muted-foreground">
                By signing in, you agree to our{" "}
                <a href="#" className="underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline">
                  Privacy Policy
                </a>
              </p>

              <p className="text-xs text-center text-muted-foreground">
                Contact your administrator for login credentials
              </p>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
            &copy; {new Date().getFullYear()} Rural Samridhi
          </p>
          <p className="text-xs">
            Employee Management System. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
