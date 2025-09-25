import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  
  useEffect(() => {
    console.log("ProtectedRoute check - isAuthenticated:", isAuthenticated, "user:", user);
  }, [isAuthenticated, user]);

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log("ProtectedRoute: User not authenticated, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  console.log("ProtectedRoute: User authenticated, rendering children");
  return children;
};

export default ProtectedRoute;