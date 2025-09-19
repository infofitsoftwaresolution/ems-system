import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authService } from "../services/api";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  // Carousel data
  const carouselSlides = [
    {
      id: 1,
      title: "Rural Samriddhi",
      subtitle: "Demand more from your employee management system.",
      background:
        "linear-gradient(135deg, rgba(30, 58, 138, 0.7) 0%, rgba(45, 90, 39, 0.6) 50%, rgba(255, 107, 53, 0.7) 100%), url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')",
    },
    {
      id: 2,
      title: "Professional",
      subtitle: "Streamline your workforce with advanced management tools.",
      background:
        "linear-gradient(135deg, rgba(45, 90, 39, 0.7) 0%, rgba(255, 107, 53, 0.6) 50%, rgba(30, 58, 138, 0.7) 100%), url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')",
    },
    {
      id: 3,
      title: "Efficient",
      subtitle: "Transform your organization with smart solutions.",
      background:
        "linear-gradient(135deg, rgba(255, 107, 53, 0.7) 0%, rgba(30, 58, 138, 0.6) 50%, rgba(45, 90, 39, 0.7) 100%), url('https://images.unsplash.com/photo-1497366412874-3415097a27e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')",
    },
    {
      id: 4,
      title: "Secure",
      subtitle: "Your data is protected with enterprise-grade security.",
      background:
        "linear-gradient(135deg, rgba(30, 58, 138, 0.7) 0%, rgba(255, 107, 53, 0.6) 50%, rgba(45, 90, 39, 0.7) 100%), url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')",
    },
    {
      id: 5,
      title: "Innovative",
      subtitle: "Leading the future of employee management technology.",
      background:
        "linear-gradient(135deg, rgba(45, 90, 39, 0.7) 0%, rgba(30, 58, 138, 0.6) 50%, rgba(255, 107, 53, 0.7) 100%), url('https://images.unsplash.com/photo-1518186285589-2f7649de83e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')",
    },
  ];

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % carouselSlides.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [carouselSlides.length]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) {
      setError("");
      toast.dismiss(); // Dismiss any existing error toasts
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    // Show loading toast
    const loadingToast = toast.loading("Signing in...");

    try {
      const response = await authService.login(
        formData.email,
        formData.password
      );

      // Save token and user info to localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      setSuccess(true);

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Login successful! Redirecting...");

      // Redirect based on whether password setup is required
      setTimeout(() => {
        if (response.requirePasswordSetup) {
          navigate("/setup-password");
        } else {
          navigate("/dashboard");
        }
      }, 800);
    } catch (err) {
      const errorMessage = err.message || "Login failed. Please try again.";
      setError(errorMessage);

      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel - Login Form */}
      <div className="login-form-panel">
        {/* Main Content */}
        <div className="main-content">
          {/* Logo Section */}
          <div className="logo-section">
            <div className="logo-container">
              <div className="brand-logo">
                <div className="logo-icon">
                  <div className="logo-circle">
                    <div className="logo-arrow">^</div>
                  </div>
                </div>
                <div className="brand-text">
                  <span className="brand-title">RURAL</span>
                  <span className="brand-subtitle">SAMRIDDHI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="welcome-section">
            <h2 className="welcome-title">Hello!</h2>
            <p className="welcome-subtitle">
              Welcome back! Sign into your account below.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}
            {success && (
              <div className="success-message">
                Login successful! Redirecting...
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                disabled={loading || success}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  disabled={loading || success}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || success}
                  tabIndex="-1">
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Form Options */}
            <div className="form-options">
              <div className="remember-me">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember Me</label>
              </div>
              <a
                href="#"
                className="forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  toast("Forgot password feature coming soon!", {
                    icon: "🔒",
                    duration: 3000,
                  });
                }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading || success}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>

        {/* Footer Content */}
        <div className="footer-content">
          {/* Sign Up Section */}
          <div className="signup-section">
            <p className="signup-text">
              Don't have an account?{" "}
              <a
                href="#"
                className="signup-link"
                onClick={(e) => {
                  e.preventDefault();
                  toast("Sign up feature coming soon!", {
                    icon: "👤",
                    duration: 3000,
                  });
                }}>
                Sign Up
              </a>
            </p>
          </div>

          {/* Terms Section */}
          <div className="terms-section">
            <p className="terms-text">
              As a user of Rural Samriddhi EMS you agree to our{" "}
              <a
                href="#"
                className="terms-link"
                onClick={(e) => {
                  e.preventDefault();
                  toast("Terms of Use - Contact administrator for details", {
                    icon: "📋",
                    duration: 4000,
                  });
                }}>
                Terms of Use
              </a>
            </p>
          </div>

          {/* Chat Support */}
          <div
            className="chat-support"
            title="Chat Support"
            onClick={() => {
              toast(
                "Chat support coming soon! Contact administrator for help.",
                {
                  icon: "💬",
                  duration: 4000,
                }
              );
            }}>
            💬
          </div>
        </div>
      </div>

      {/* Right Panel - Background Carousel */}
      <div className="login-background-panel">
        <div className="carousel-container">
          {carouselSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`carousel-slide ${
                index === currentSlide ? "active" : ""
              }`}
              style={{
                background: slide.background,
                backgroundSize: "cover, cover",
                backgroundPosition: "center, center",
                backgroundRepeat: "no-repeat, no-repeat",
              }}>
              <div className="background-content">
                <h1>{slide.title}</h1>
                <p>{slide.subtitle}</p>
                <a href="#" className="read-more-link">
                  Read More →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Navigation Dots */}
        <div className="carousel-dots">
          {carouselSlides.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${
                index === currentSlide ? "active" : ""
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
