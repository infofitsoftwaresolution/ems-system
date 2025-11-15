import { useState, useEffect } from "react";
import { apiService } from "@/lib/api";
import { AuthContext } from "./auth-context-constants";

/**
 * @typedef {Object} AuthContextType
 * @property {Object|null} user
 * @property {boolean} isLoading
 * @property {string|null} error
 * @property {function} login
 * @property {function} logout
 * @property {boolean} isAuthenticated
 */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const storedUserId = localStorage.getItem("currentUserId");

        console.log('Checking auth on mount:', { token: !!token, storedUserId });

        if (token && storedUserId) {
          // Verify token with backend
          const userData = await apiService.verifyToken();
          console.log('Token verification successful:', userData);
          setUser(userData);
        } else {
          console.log('No valid session found');
        }
      } catch (err) {
        setError("Authentication error");
        console.error('Auth check error:', err);
        // Clear invalid session on error
        localStorage.removeItem("currentUserId");
        localStorage.removeItem("authToken");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function - now connects to real backend API
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting login with:', { email, password: '***' });
      
      // Make actual API call to backend
      const data = await apiService.login(email, password);
      
      console.log('Login response:', data);
      
      if (data.token && data.user) {
        console.log('Setting user data:', data.user);
        
        // Set user state immediately
        setUser(data.user);
        
        // Check if password change is required
        if (data.user.mustChangePassword || data.requirePasswordSetup) {
          setRequiresPasswordChange(true);
          console.log('Password change required for user');
        }
        
        // Check KYC status on login
        console.log('User KYC status on login:', data.user.kycStatus);
        // KYC is now handled in the profile page, not as a popup
        
        // Store in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUserId', data.user.id);
        localStorage.setItem('currentUserEmail', data.user.email);
        localStorage.setItem('userContext', JSON.stringify(data.user));
        
        console.log('User set successfully, auth state should be updated');
        
        // Verify the state was set correctly
        setTimeout(() => {
          console.log('Auth state after login:', { 
            user: data.user, 
            isAuthenticated: true,
            requiresPasswordChange: data.user.mustChangePassword,
            storedToken: localStorage.getItem('authToken'),
            storedUserId: localStorage.getItem('currentUserId')
          });
        }, 100);
      } else {
        console.error('Invalid response from server:', data);
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error details:', err);
      setError(err instanceof Error ? err.message : "Login failed");
      throw err; // Re-throw to let the login component handle it
    } finally {
      setIsLoading(false);
    }
  };

  // Update password function (for forced password changes)
  const updatePassword = async (newPassword) => {
    try {
      console.log('Updating password for user:', user?.email);
      await apiService.forcePasswordChange(newPassword);
      setRequiresPasswordChange(false);
      
      // Update user state to reflect password change
      const userData = await apiService.verifyToken();
      console.log('User data after password change:', userData);
      setUser(userData);
      
      // KYC is now handled in the profile page, not as a popup
      console.log('KYC status after password change:', userData.kycStatus);
      return true;
    } catch (err) {
      console.error('Password update error:', err);
      setError(err.message);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setRequiresPasswordChange(false);
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUserEmail");
    localStorage.removeItem("userContext");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        updatePassword,
        requiresPasswordChange,
        isAuthenticated: !!user,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth hook has been moved to src/hooks/use-auth.js to avoid React Fast Refresh issues
