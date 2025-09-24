import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BalanceOverview } from "@/components/BalanceOverview";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Receipt, Plus, TrendingUp, Calendar, ArrowRight, AlertCircle, IndianRupee, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useGroups } from "@/hooks/use-groups";
import { useExpenses } from "@/hooks/use-expenses";

const Index = () => {
  const { groups, createGroup, refreshGroups } = useGroups();
  const { getExpensesWhereIOwe, getMyOwedAmounts, refreshExpenses } = useExpenses();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
    recentActivity = groups && groups.length > 0 && expensesWhereIOwe && expensesWhereIOwe.length > 0 ? 
      expensesWhereIOwe.slice(0, 3).map(expense => ({
        action: `You owe for: ${expense.description || 'Unknown expense'}`,
        group: groups.find(g => g.id === expense.groupId)?.name || "Unknown Group",
        amount: `₹${(expense.amount ? expense.amount / (expense.splitBetween ? expense.splitBetween.length : 1) : 0).toFixed(2)}`,
        time: expense.date ? expense.date.toLocaleDateString() : new Date().toLocaleDateString()
      })) : [];
    console.log('Recent activity calculated:', recentActivity);
  } catch (error) {
    console.error('Error calculating recent activity:', error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Welcome Section */}
        <section className="text-center animate-slide-up">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-foreground">Welcome back! 👋</h1>
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
          </div>

          {/* Recent Activity */}
          <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Recent Activity</h2>
            </div>
            
            <Card className="card-balance">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Latest Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="mt-1 p-2 bg-primary/10 rounded-full">
                          <Receipt className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.group}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                            <span className="text-sm font-semibold text-destructive">{activity.amount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No recent activity</p>
                    <p className="text-sm text-muted-foreground mt-1">Add expenses to see updates here</p>
                  </div>
                )}
              </CardContent>
            </Card>
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