import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Header } from "@/components/Header";
import { 
  Settings, 
  Bell, 
  CreditCard, 
  Shield, 
  Award, 
  Zap,
  ArrowLeft,
  LogOut
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useGroups } from "@/hooks/use-groups";
import { useExpenses } from "@/hooks/use-expenses";

export default function Profile() {
  const { currentUser, signOut } = useUser();
  const { groups } = useGroups();
  const { expenses, getMyOwedAmounts } = useExpenses();
  const navigate = useNavigate();
  
  const [displayUser] = useState({
    name: currentUser?.name || 'User',
    email: currentUser?.email || 'user@example.com',
    initials: currentUser?.initials || 'U',
    memberSince: currentUser?.memberSince || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  });
  
  // Calculate financial overview
  const activeGroups = groups.length;
  const totalExpenses = expenses
    .filter(expense => expense.paidBy === (currentUser?.id || "current-user"))
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const myOwedAmounts = getMyOwedAmounts();
  const totalOwed = myOwedAmounts.reduce((sum, debt) => sum + debt.amount, 0);
  
  // Calculate how much others owe me (simplified - in real app would be more complex)
  const owedToMe = expenses
    .filter(expense => expense.paidBy === (currentUser?.id || "current-user") && expense.splitBetween.length > 1)
    .reduce((sum, expense) => {
      const amountPerPerson = expense.amount / expense.splitBetween.length;
      return sum + (amountPerPerson * (expense.splitBetween.length - 1));
    }, 0);
  
  // Calculate this month's activity
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthExpenses = expenses.filter(expense => 
    expense.date.getMonth() === currentMonth && expense.date.getFullYear() === currentYear
  );
  
  const thisMonthOwed = myOwedAmounts
    .filter(debt => {
      const relatedExpense = expenses.find(e => e.paidBy === debt.owedTo);
      return relatedExpense && 
        relatedExpense.date.getMonth() === currentMonth && 
        relatedExpense.date.getFullYear() === currentYear;
    })
    .reduce((sum, debt) => sum + debt.amount, 0);
  
  const thisMonthOwedToMe = thisMonthExpenses
    .filter(expense => expense.paidBy === (currentUser?.id || "current-user") && expense.splitBetween.length > 1)
    .reduce((sum, expense) => {
      const amountPerPerson = expense.amount / expense.splitBetween.length;
      return sum + (amountPerPerson * (expense.splitBetween.length - 1));
    }, 0);
  
  // Calculate achievements
  const expenseCount = expenses.length;
  const groupCount = groups.length;
  
  const achievements = [];
  if (expenseCount >= 5) achievements.push("Expense Tracker");
  if (groupCount >= 2) achievements.push("Group Master");
  if (totalExpenses > 1000) achievements.push("Big Spender");
  if (owedToMe > totalOwed) achievements.push("In the Green");
  
  // Calculate login count
  const loginCount = localStorage.getItem("loginCount") || "1";
  
  const settingsItems = [
    {
      icon: <Bell className="h-5 w-5" />,
      title: "Notifications",
      description: "Get notified about new expenses and settlements",
      hasSwitch: true,
      enabled: true
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Payment Methods",
      description: "Manage your linked payment accounts",
      hasSwitch: false
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Privacy & Security",
      description: "Control your privacy settings and security options",
      hasSwitch: false
    }
  ];

  const handleLogout = async () => {
    await signOut();
    // Add a small delay to ensure the signOut process completes before navigation
    setTimeout(() => {
      navigate("/login");
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-6 animate-slide-up">
          <Link to="/">
            <Button variant="ghost" className="mb-4 px-4 py-2 h-9 hover:bg-gray-800 hover:text-white hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 rounded-lg">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile & Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="card-balance animate-slide-up">
              <CardContent className="p-6 text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-primary/20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-accent text-accent-foreground text-2xl font-bold">
                    {displayUser?.initials || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <h2 className="text-xl font-bold text-foreground mb-2">{displayUser?.name || 'User'}</h2>
                <p className="text-muted-foreground mb-4">{displayUser?.email || 'user@example.com'}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member since</span>
                    <Badge variant="secondary">
                      {displayUser?.memberSince || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Badge>
                  </div> 
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active groups</span>
                    <Badge variant="default" className="bg-gradient-primary">{activeGroups}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total expenses</span>
                    <Badge variant="outline">₹{totalExpenses.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Logins</span>
                    <Badge variant="default" className="bg-gradient-success">{loginCount}</Badge>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-6">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                
                <Button 
                  variant="destructive" 
                  className="w-full mt-3"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <h3 className="text-lg font-semibold text-foreground mb-4">Settings</h3>
              
              <div className="space-y-4">
                {settingsItems.map((item, index) => (
                  <Card key={index} className="card-interactive">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gradient-primary/20 rounded-xl">
                            {item.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{item.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          </div>
                        </div>
                        
                        {item.hasSwitch ? (
                          <Switch defaultChecked={item.enabled} />
                        ) : (
                          <Button variant="ghost" size="sm">
                            Configure
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
                <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="h-5 w-5" />
                      <span>Your Achievements</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {achievements.map((achievement, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="bg-white/20 text-white hover:bg-white/30 animate-fade-in-scale"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          {achievement}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Stats */}
            <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <h3 className="text-lg font-semibold text-foreground mb-4">Your Activity</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="card-balance">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">₹{thisMonthOwedToMe.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">You are owed</p>
                  </CardContent>
                </Card>
                
                <Card className="card-balance">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">₹{thisMonthOwed.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">You owe</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}