import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api.js';

interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Fetch users from database
      const users = await userAPI.getAll();
      console.log('Fetched users:', users);
      
      // Find user by email
      const user = users.find((u: any) => u.email === email);
      console.log('Found user:', user);
      
      if (user) {
        // For demo purposes, we'll accept any non-empty password
        // In a real app, this would be done securely on the server
        if (password) {
          const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            initials: user.initials || user.name.substring(0, 2).toUpperCase()
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
          
          return true;
        }
      }
      
      // If no user found, return false
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Check if user already exists
      const users = await userAPI.getAll();
      const existingUser = users.find((u: any) => u.email === email);
      
      if (existingUser) {
        console.error('User already exists with this email');
        return false;
      }
      
      // Create initials from name
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      
      // Create user in database
      const newUser = await userAPI.create({
        id: `user-${Date.now()}`,
        name,
        email,
        password, // In a real app, this should be hashed
        initials,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      if (newUser) {
        const userData = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          initials: newUser.initials || initials
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
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
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