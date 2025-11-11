import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BalanceOverview } from "@/components/BalanceOverview";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Receipt, Plus, TrendingUp, Calendar, ArrowRight, AlertCircle, IndianRupee, RefreshCw, Award, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useGroups } from "@/hooks/use-groups";
import { useExpenses } from "@/hooks/use-expenses";
import { useUser } from "@/hooks/use-user";

const Index = () => {
  const { groups, createGroup, refreshGroups } = useGroups();
  const { getExpensesWhereIOwe, getMyOwedAmounts, refreshExpenses, settlements } = useExpenses();
  const { currentUser } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loginCount, setLoginCount] = useState(0);
  
  // Add safety check for currentUser
  const safeCurrentUser = currentUser || {
    id: "user-tusha",
    name: "tusha",
    email: "tusha@splitsmart.com",
    initials: "TU",
    memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    avatar: ""
  };
  
  // Track login count
  useEffect(() => {
    const count = localStorage.getItem("loginCount");
    if (count) {
      setLoginCount(parseInt(count, 10));
    } else {
      // First login
      localStorage.setItem("loginCount", "1");
      setLoginCount(1);
    }
  }, []);
  
  // Refresh data when component mounts
  useEffect(() => {
    console.log('Index component mounted');
    handleRefresh();
  }, []);
  
  const handleRefresh = async () => {
    console.log('Refreshing data...');
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshGroups(),
        refreshExpenses()
      ]);
      console.log('🔄 Data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      // Continue even if there's an error
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Add error boundaries for data calculations
  let expensesWhereIOwe = [];
  let myOwedAmounts = [];
  let totalOwed = 0;
  
  try {
    console.log('Calculating owed amounts...');
    expensesWhereIOwe = getExpensesWhereIOwe();
    myOwedAmounts = getMyOwedAmounts();
    totalOwed = myOwedAmounts.reduce((sum, debt) => sum + (debt.amount || 0), 0);
    console.log('Owed amounts calculated:', { expensesWhereIOwe, myOwedAmounts, totalOwed });
  } catch (error) {
    console.error('Error calculating owed amounts:', error);
  }
  
  const quickStats = [
    {
      title: "You Owe",
      value: groups && groups.length > 0 ? `₹${totalOwed.toFixed(2)}` : "₹0.00",
      subtitle: groups && groups.length > 0 ? (totalOwed > 0 ? "Needs settlement" : "All settled up!") : "No groups yet",
      icon: <IndianRupee className="h-5 w-5" />,
      link: "/expenses"
    },
    {
      title: "Active Groups",
      value: groups ? groups.length.toString() : "0",
      subtitle: groups && groups.length === 0 ? "Create your first group" : "Need settlement",
      icon: <Users className="h-5 w-5" />,
      link: "/groups"
    }
  ];

  // Safely calculate recent activity
  let recentActivity = [];
  try {
    console.log('Calculating recent activity...');
    
    // Get recent expenses where user owes money
    const expensesActivity = groups && groups.length > 0 && expensesWhereIOwe && expensesWhereIOwe.length > 0 ? 
      expensesWhereIOwe.slice(0, 3).map(expense => ({
        id: expense.id,
        type: 'expense',
        action: `You owe for: ${expense.description || 'Unknown expense'}`,
        group: groups.find(g => g.id === expense.groupId)?.name || "Unknown Group",
        amount: `₹${(expense.amount ? expense.amount / (expense.splitBetween ? expense.splitBetween.length : 1) : 0).toFixed(2)}`,
        time: expense.date ? new Date(expense.date).toLocaleDateString() : new Date().toLocaleDateString(),
        timestamp: expense.date ? new Date(expense.date).getTime() : Date.now()
      })) : [];
    
    // Get recent settlements
    const settlementsActivity = settlements && settlements.length > 0 ? 
      settlements.slice(0, 3).map(settlement => ({
        id: settlement.id,
        type: 'settlement',
        action: settlement.confirmed ? 
          `Settlement confirmed with ${settlement.toMemberName || 'Unknown'}` : 
          `Pending settlement with ${settlement.toMemberName || 'Unknown'}`,
        group: settlement.groupName || "Unknown Group",
        amount: `₹${settlement.amount ? settlement.amount.toFixed(2) : '0.00'}`,
        time: settlement.date ? new Date(settlement.date).toLocaleDateString() : new Date().toLocaleDateString(),
        timestamp: settlement.date ? new Date(settlement.date).getTime() : Date.now()
      })) : [];
    
    // Combine all activities and sort by timestamp (most recent first)
    const allActivities = [...expensesActivity, ...settlementsActivity]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5); // Show up to 5 most recent activities
    
    recentActivity = allActivities;
    console.log('Recent activity calculated:', recentActivity);
  } catch (error) {
    console.error('Error calculating recent activity:', error);
  }

  // Fun facts and tips
  const funFacts = [
    "Splitting expenses helps maintain friendships!",
    "The average person saves ₹2,000 monthly by tracking shared costs.",
    "Did you know? 73% of people who track expenses save more!",
    "Regular expense tracking can reduce financial stress by 40%.",
    "Groups with 3-5 members tend to have the most balanced expenses."
  ];
  
  const getRandomFact = () => {
    return funFacts[Math.floor(Math.random() * funFacts.length)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Welcome Section - Only show after first login */}
        {loginCount > 1 && (
          <section className="text-center animate-slide-up">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-4xl font-bold text-foreground">Welcome back, {safeCurrentUser.name}! 👋</h1>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-xl text-muted-foreground mb-8">Here's your expense overview</p>
          </section>
        )}

        {/* Balance Overview */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <BalanceOverview />
        </section>

        {/* Quick Actions */}
        <section className="flex items-center justify-center animate-fade-in-scale" style={{ animationDelay: "0.2s" }}>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/add-expense">
              <Button className="bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl text-lg px-8 py-6 h-auto hover:-translate-y-1 hover:scale-105 transition-all duration-300">
                <Plus className="h-5 w-5 mr-3" />
                Add New Expense
              </Button>
            </Link>
            {(!groups || groups.length === 0) ? (
              <Button 
                onClick={() => setShowCreateModal(true)}
                variant="outline" 
                className="bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500 hover:border-cyan-600 shadow-lg hover:shadow-xl text-lg px-8 py-6 h-auto hover:-translate-y-1 hover:scale-105 transition-all duration-300"
              >
                <Users className="h-5 w-5 mr-3" />
                Create Group
              </Button>
            ) : groups.length >= 2 ? (
              <Link to="/groups">
                <Button variant="outline" className="bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500 hover:border-cyan-600 shadow-lg hover:shadow-xl text-lg px-8 py-6 h-auto hover:-translate-y-1 hover:scale-105 transition-all duration-300">
                  <Users className="h-5 w-5 mr-3" />
                  Manage Groups
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={() => setShowCreateModal(true)}
                variant="outline" 
                className="bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500 hover:border-cyan-600 shadow-lg hover:shadow-xl text-lg px-8 py-6 h-auto hover:-translate-y-1 hover:scale-105 transition-all duration-300"
              >
                <Users className="h-5 w-5 mr-3" />
                Create Group
              </Button>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Stats */}
          <div className="lg:col-span-2 space-y-8">
            <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Quick Overview</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickStats.map((stat, index) => (
                  <Link key={stat.title} to={stat.link}>
                    <Card className="card-interactive group">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-primary/20 rounded-xl group-hover:bg-gradient-primary/30 transition-colors">
                              {stat.icon}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-3xl font-bold text-foreground counter-up">
                                  {stat.value}
                                </span>
                                <Badge variant="secondary">{stat.subtitle}</Badge>
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Your Groups Section */}
            {groups && groups.length > 0 && (
              <div className="animate-slide-up" style={{ animationDelay: "0.35s" }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Your Groups ({groups.length})</h2>
                  <Link to="/groups">
                    <Button variant="outline" size="sm">
                      View All
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.slice(0, 4).map((group) => (
                    <Link key={group.id} to={`/groups/${group.id}`}>
                      <Card className="card-interactive group">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                                style={{ backgroundColor: group.color || '#3b82f6' }}
                              >
                                {group.name ? group.name.charAt(0).toUpperCase() : 'G'}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{group.name || 'Unnamed Group'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {group.members ? group.members.length : 0} member{group.members && group.members.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Fun Facts Section */}
            <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Did you know?</h3>
                      <p className="text-white/90">{getRandomFact()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity and Stats */}
          <div className="space-y-8">
            {/* Recent Activity */}
            <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Recent Activity</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              <Card className="card-balance">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Latest Updates
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {recentActivity.length} {recentActivity.length === 1 ? 'update' : 'updates'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity && recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="mt-1 p-2 bg-primary/10 rounded-full">
                            {activity.type === 'expense' ? (
                              <Receipt className="h-4 w-4 text-primary" />
                            ) : (
                              <IndianRupee className="h-4 w-4 text-success" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.group}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground">{activity.time}</span>
                              <span className={`text-sm font-semibold ${activity.type === 'expense' ? 'text-destructive' : 'text-success'}`}>
                                {activity.amount}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No recent activity</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {groups && groups.length > 0 
                          ? "Add expenses or make settlements to see updates here" 
                          : "Create a group and add expenses to see updates here"}
                      </p>
                      <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                        {(!groups || groups.length === 0) && (
                          <Button 
                            onClick={() => setShowCreateModal(true)}
                            variant="outline" 
                            size="sm"
                            className="bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500 hover:border-cyan-600"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Create Group
                          </Button>
                        )}
                        <Link to="/add-expense">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-purple-500 hover:bg-purple-600 text-white border-purple-500 hover:border-purple-600"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Expense
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Achievement Section */}
            <div className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
              <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Your Achievements</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Target className="h-4 w-4 mr-2" />
                          <span className="text-sm">Track your first expense</span>
                        </div>
                        {groups && groups.length > 0 && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span className="text-sm">Create your first group</span>
                          </div>
                        )}
                        {totalOwed > 0 && (
                          <div className="flex items-center">
                            <IndianRupee className="h-4 w-4 mr-2" />
                            <span className="text-sm">Settle your first debt</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      {/* Create Group Modal */}
      <CreateGroupModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateGroup={(groupData) => {
          createGroup(groupData);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
};

export default Index;