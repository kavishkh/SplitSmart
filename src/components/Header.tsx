import { Plus, Menu, Home, Users, Receipt, Settings, Bell, TrendingUp, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "react-router-dom";
import { useGroups } from "@/hooks/use-groups";
import { useExpenses } from "@/hooks/use-expenses";
import { useUser } from "@/hooks/use-user";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export const Header = () => {
  const location = useLocation();
  const { getMyOwedAmounts } = useExpenses();
  const { currentUser } = useUser();
  const { createGroup, groups } = useGroups();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState("");
  
  // Add safety check for currentUser
  const safeCurrentUser = currentUser || {
    name: "User",
    initials: "U",
    email: ""
  };
  
  const myOwedAmounts = getMyOwedAmounts();
  const hasNotifications = myOwedAmounts.length > 0;
  const totalOwed = myOwedAmounts.reduce((sum, debt) => sum + (debt.amount || 0), 0);
  
  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setTimeOfDay("Morning");
    } else if (hour < 18) {
      setTimeOfDay("Afternoon");
    } else {
      setTimeOfDay("Evening");
    }
  }, []);
  
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/groups", label: "Groups", icon: Users },
    { path: "/expenses", label: "Expenses", icon: Receipt },
    { path: "/profile", label: "Profile", icon: Settings },
  ];

  // Updated class names with proper hover effects
  const activeButtonClass = "bg-blue-500 hover:bg-blue-800 text-black hover:text-white shadow-lg hover:shadow-xl animate-fade-in-scale";
  const inactiveButtonClass = "bg-amber-50 hover:bg-gray-800 text-gray-700 hover:text-white border border-amber-200 hover:border-gray-800 transition-all duration-300";
  const mobileMenuClass = "md:hidden bg-amber-50 hover:bg-gray-800 text-gray-700 hover:text-white border border-amber-200 hover:border-gray-800 transition-all duration-300";
  const createGroupClass = "bg-orange-500 hover:bg-orange-800 text-black hover:text-white shadow-lg hover:shadow-xl hidden md:flex animate-bounce-in hover:-translate-y-1 hover:scale-105 transition-all duration-300";

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50 theme-transition">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className={mobileMenuClass}>
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center animate-glow-pulse">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-gradient-shift">
                SplitSmart
              </h1>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const buttonClass = isActive(item.path) ? activeButtonClass : inactiveButtonClass;
              
              return (
                <Link key={item.path} to={item.path}>
                  <Button 
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className={`${buttonClass} transition-all duration-300 animate-slide-down hover:-translate-y-0.5 hover:scale-105`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="ml-2">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Quick Stats Badge */}
            {totalOwed > 0 && (
              <Badge variant="destructive" className="hidden sm:flex items-center">
                <IndianRupee className="h-3 w-3 mr-1" />
                {totalOwed.toFixed(0)}
              </Badge>
            )}
            
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {hasNotifications && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Button>

            <Button className={createGroupClass} onClick={() => setShowCreateModal(true)}>
              <Users className="h-4 w-4 mr-2" />
              Create Group
            </Button>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 cursor-pointer">
                  <Avatar className="w-9 h-9 ring-2 ring-primary/20 hover:ring-primary/50 transition-all duration-300 cursor-pointer hover:scale-110 animate-fade-in-scale">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-accent text-accent-foreground font-semibold">
                      {safeCurrentUser.initials || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{safeCurrentUser.name || "User"}</p>
                    <p className="text-xs text-muted-foreground">Good {timeOfDay}</p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/expenses" className="flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span>My Expenses</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Create Group Modal */}
      <CreateGroupModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateGroup={(groupData) => {
          createGroup(groupData);
          setShowCreateModal(false);
        }}
      />
    </header>
  );
};