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

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting login process...');
      await login(email, password);
      console.log('Login function completed successfully');
      toast.success("Login successful!");
      
      // Wait a bit longer to ensure authentication state is updated
      setTimeout(() => {
        console.log('Navigating to dashboard...');
        navigate("/");
      }, 500);
    } catch (error) {
      console.error("Login error in component:", error);
      toast.error("Invalid credentials. Please try again.");
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
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <AnimatedGradientBackground
        intensity="subtle"
        speed="slow"
        className="fixed inset-0 z-0"
      />

      <div className="absolute inset-0 z-10">
        <ParticleBackground
          particleCount={30}
          particleSize={2}
          particleColor="rgba(59, 130, 246, 0.3)"
          connectParticles={true}
          interactive={true}
        />
      </div>

      <motion.div
        className="container relative z-20 flex max-w-md flex-col items-center justify-center px-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}>
        <motion.div variants={itemVariants} className="mb-8 text-center">
          <motion.div
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Employee Management System
            </h1>
          </motion.div>
          <motion.p
            className="mt-2 text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}>
            Welcome back! Please sign in to continue.
          </motion.p>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full">
          <Card className="backdrop-blur-md bg-white/80 dark:bg-background/80 shadow-lg border-opacity-50">
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
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
                        ? "0 0 0 2px rgba(37, 99, 235, 0.1)"
                        : "none",
                  }}>
                  <Label htmlFor="email">Email</Label>
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
                          ? "border-primary ring-2 ring-primary/10"
                          : "border-input"
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
                        ? "0 0 0 2px rgba(37, 99, 235, 0.1)"
                        : "none",
                  }}>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
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
                          ? "border-primary ring-2 ring-primary/10"
                          : "border-input"
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please
                      wait
                    </>
                  ) : (
                    "Sign in"
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
          className="mt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Employee Management System. All
          rights reserved.
        </motion.div>
      </motion.div>
    </div>
  );
}
