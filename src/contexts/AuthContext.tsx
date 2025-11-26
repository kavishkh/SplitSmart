import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated (check token in localStorage)
    const storedUser = localStorage.getItem("user");
    const storedAuth = localStorage.getItem("isAuthenticated");
    
    if (storedUser && storedAuth === "true") {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
    } else {
      // Check if user is authenticated via session (Google OAuth)
      fetch('/api/auth/session')
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('No session found');
        })
        .then(data => {
          if (data.user) {
            const userData = {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              initials: data.user.initials || data.user.name.substring(0, 2).toUpperCase()
            };
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("isAuthenticated", "true");
            // Redirect to home page if on login page
            if (window.location.pathname === '/login') {
              navigate("/");
            }
          }
        })
        .catch(error => {
          console.log('No session found, user is not authenticated');
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }
    
    // Set loading to false after checking
    setIsLoading(false);
  }, [navigate]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      // Call the backend login API
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      // Check if response is ok and has content
      if (!response.ok) {
        // Try to parse error response, but handle case where there's no body
        let errorData;
        try {
          const errorText = await response.text();
          errorData = errorText ? JSON.parse(errorText) : { error: `HTTP error! status: ${response.status}` };
        } catch {
          errorData = { error: `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Check if response has content before trying to parse JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Server returned empty response');
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', text);
        throw new Error('Invalid JSON response from server');
      }
      
      if (data.success) {
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          initials: data.user.initials || data.user.name.substring(0, 2).toUpperCase()
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("isAuthenticated", "true");
        
        // Increment login count
        const currentCount = localStorage.getItem("loginCount");
        const newCount = currentCount ? parseInt(currentCount, 10) + 1 : 1;
        localStorage.setItem("loginCount", newCount.toString());
        
        // Navigate to home page on successful login
        setTimeout(() => {
          navigate("/");
        }, 100);
        
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Provide more specific error messages based on the error type
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { success: false, message: 'Unable to connect to the server. Please check your internet connection and try again.' };
      } else if (error.message) {
        return { success: false, message: error.message };
      } else {
        return { success: false, message: 'An error occurred during login. Please try again.' };
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      // Create user through the API
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data) {
        const userData = {
          id: data.id,
          name: data.name,
          email: data.email,
          initials: data.initials || name.substring(0, 2).toUpperCase()
        };
        
        // Authenticate the user
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("isAuthenticated", "true");
        
        // Set login count to 1 for new users
        localStorage.setItem("loginCount", "1");
        
        // Navigate to home page
        setTimeout(() => {
          navigate("/");
        }, 100);
        
        return { success: true, message: 'Account created successfully!' };
      } else {
        return { success: false, message: data.error || 'Failed to create account. Please try again.' };
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.message && error.message.includes('409')) {
        return { success: false, message: 'User already exists with this email.' };
      }
      return { success: false, message: 'An error occurred during signup. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call the backend logout endpoint to destroy the session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Include cookies in the request
      });
    } catch (error) {
      console.error('Error logging out from server:', error);
    } finally {
      // Clear local state regardless of backend response
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
      localStorage.removeItem("isAuthenticated");
      // Don't remove loginCount on logout
      // Navigation is handled by the calling component
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to send password reset email' };
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: 'An error occurred. Please try again.' };
    }
  };
  
  const verifyOTP = async (email: string, otp: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to verify OTP' };
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, message: 'An error occurred. Please try again.' };
    }
  };
  
  const resetPassword = async (email: string, otp: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log('Sending reset password request to backend');
      console.log('Email:', email);
      console.log('OTP length:', otp.length);
      console.log('New password length:', newPassword.length);
      
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      
      console.log('Received response from backend:', response.status, response.statusText);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        console.log('✅ Password reset successful on backend');
        return { success: true, message: data.message };
      } else {
        console.log('❌ Password reset failed on backend:', data.error);
        // If it's an error response, include the specific error message
        return { success: false, message: data.error || 'Failed to reset password' };
      }
    } catch (error) {
      console.error('💥 Password reset error:', error);
      if (error instanceof Error) {
        return { success: false, message: error.message || 'An error occurred. Please try again.' };
      }
      return { success: false, message: 'An error occurred. Please try again.' };
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated, isLoading, forgotPassword, verifyOTP, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}