import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Users, Calculator, Shield, LogIn, UserPlus, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Attempt to login with the provided credentials
      const result = await login(email, password);
      
      if (!result.success) {
        setError(result.message || "Invalid email or password");
      } else {
        setSuccess(result.message || "Login successful! Redirecting...");
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Simple validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!name || !email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      // Use our new signup function that works in demo mode
      const result = await signup(name, email, password);
      
      if (result.success) {
        setSuccess(result.message || "Account created successfully! Redirecting to dashboard...");
      } else {
        setError(result.message || "Failed to create account. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during signup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements matching website vibe */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Floating elements matching website style */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-primary/20 backdrop-blur-sm rounded-lg flex items-center justify-center animate-float">
        <Calculator className="w-8 h-8 text-primary" />
      </div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-gradient-accent/20 backdrop-blur-sm rounded-lg flex items-center justify-center animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-20 w-12 h-12 bg-primary/20 backdrop-blur-sm rounded-lg flex items-center justify-center animate-bounce-subtle" style={{ animationDelay: '2s' }}>
        <Shield className="w-6 h-6 text-primary" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand section matching website style */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow animate-glow-pulse">
              <span className="text-primary-foreground font-bold text-2xl">S</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-gradient-shift">
            SplitSmart
          </h1>
          <p className="text-muted-foreground mt-2">Split expenses with friends and family</p>
        </div>

        <Card className="card-balance animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger 
                  value="login" 
                  data-tab="login"
                  className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  data-tab="signup"
                  className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 animate-fade-in">
                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm animate-shake flex items-center">
                    <XCircle className="w-4 h-4 mr-2" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-success/10 text-success p-3 rounded-md text-sm animate-pulse flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {success}
                  </div>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 transition-all duration-300 focus:scale-[1.02] focus:shadow-md"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 transition-all duration-300 focus:scale-[1.02] focus:shadow-md"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        <Shield className="h-4 w-4" />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground group transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </span>
                    )}
                  </Button>
                  <div className="text-center">
                    <Button variant="link" className="text-sm text-muted-foreground hover:text-primary">
                      Forgot your password?
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 animate-fade-in">
                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm animate-shake flex items-center">
                    <XCircle className="w-4 h-4 mr-2" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-success/10 text-success p-3 rounded-md text-sm animate-pulse flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {success}
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-blue-800 mb-2">Create Your Account</h3>
                  <p className="text-sm text-blue-700">Enter your details below to create a new account. All information will be securely stored.</p>
                </div>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="pl-10 transition-all duration-300 focus:scale-[1.02] focus:shadow-md"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 transition-all duration-300 focus:scale-[1.02] focus:shadow-md"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 transition-all duration-300 focus:scale-[1.02] focus:shadow-md"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        <Shield className="h-4 w-4" />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 transition-all duration-300 focus:scale-[1.02] focus:shadow-md"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        <Shield className="h-4 w-4" />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground group transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Account
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features section matching website style */}
        <div className="grid grid-cols-3 gap-4 mt-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-gradient-primary/30 transition-all duration-300">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Split with Groups</p>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-accent/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-gradient-accent/30 transition-all duration-300">
              <Calculator className="w-8 h-8 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">Smart Calculations</p>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-success/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-gradient-success/30 transition-all duration-300">
              <Shield className="w-8 h-8 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">Secure & Private</p>
          </div>
        </div>
        
        {/* Footer note */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>© 2023 SplitSmart. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;