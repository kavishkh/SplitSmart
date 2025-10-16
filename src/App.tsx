import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GroupsProvider } from "@/hooks/use-groups";
import { ExpensesProvider } from "@/hooks/use-expenses";
import { UserProvider } from "@/hooks/use-user";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Groups from "./pages/Groups";
import Expenses from "./pages/Expenses";
import Profile from "./pages/Profile";
import GroupDetail from "./pages/GroupDetail";
import AddExpense from "./pages/AddExpense";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import JoinGroup from "./pages/JoinGroup";
import Settlements from "./pages/Settlements";
import Payments from "./pages/Payments";

import GooglePayExpenses from "./pages/GooglePayExpenses";
import GooglePayTransactions from "./pages/GooglePayTransactions";
import { useEffect } from "react";

// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('ErrorBoundary caught an error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 bg-card rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              We're sorry, but something went wrong. Please try refreshing the page.
            </p>
            <button 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const queryClient = new QueryClient();

const App = () => {
  // Log when app starts
  useEffect(() => {
    console.log('App is starting...');
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <UserProvider>
                <GroupsProvider>
                  <ExpensesProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={
                          <ProtectedRoute>
                            <Index />
                          </ProtectedRoute>
                        } />
                        <Route path="/groups" element={
                          <ProtectedRoute>
                            <Groups />
                          </ProtectedRoute>
                        } />
                        <Route path="/groups/:id" element={
                          <ProtectedRoute>
                            <GroupDetail />
                          </ProtectedRoute>
                        } />
                        <Route path="/groups/:id/join" element={<JoinGroup />} />
                        <Route path="/expenses" element={
                          <ProtectedRoute>
                            <Expenses />
                          </ProtectedRoute>
                        } />
                        <Route path="/expenses/google-pay" element={
                          <ProtectedRoute>
                            <GooglePayExpenses />
                          </ProtectedRoute>
                        } />
                        <Route path="/google-pay/transactions" element={
                          <ProtectedRoute>
                            <GooglePayTransactions />
                          </ProtectedRoute>
                        } />
                        <Route path="/settlements" element={
                          <ProtectedRoute>
                            <Settlements />
                          </ProtectedRoute>
                        } />
                        <Route path="/payments" element={
                          <ProtectedRoute>
                            <Payments />
                          </ProtectedRoute>
                        } />
                        <Route path="/add-expense" element={
                          <ProtectedRoute>
                            <AddExpense />
                          </ProtectedRoute>
                        } />
                        <Route path="/add-expense/:groupId" element={
                          <ProtectedRoute>
                            <AddExpense />
                          </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        } />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </TooltipProvider>
                  </ExpensesProvider>
                </GroupsProvider>
              </UserProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;