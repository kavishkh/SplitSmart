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
    }
    
    // Set loading to false after checking
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      // Call the backend login API
      const response = await fetch('http://localhost:40001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
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
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      // Create user through the API
      const response = await fetch('http://localhost:40001/api/users', {
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

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    // Don't remove loginCount on logout
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated, isLoading }}>
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