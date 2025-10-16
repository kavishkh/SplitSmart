import { Plus, Search, Filter, Calendar, TrendingUp, Receipt, Clock, X, RefreshCw, CreditCard, Award, Target, Zap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/Header";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useExpenses } from "@/hooks/use-expenses";
import { useGroups } from "@/hooks/use-groups";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const Expenses = () => {
  const { expenses, refreshExpenses } = useExpenses();
  const { groups } = useGroups();
  const navigate = useNavigate();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: "recent",
    category: "all",
    amountRange: "all",
    group: "all",
    dateRange: "all"
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshExpenses();
      console.log('🔄 Expenses refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing expenses:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewGooglePayTransactions = () => {
    navigate("/google-pay/transactions");
  };

  const handleGooglePayClick = () => {
    navigate("/expenses/google-pay");
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      food: "🍽️",
      transport: "🚗",
      entertainment: "🎬",
      utilities: "💡",
      shopping: "🛍️",
      other: "📄"
    };
    return icons[category] || "📄";
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  // Calculate stats
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  });
  const thisMonthAmount = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categories = [...new Set(expenses.map(expense => expense.category))];
  
  // Calculate top spending category
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(expense => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
  });
  
  const topCategory = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || "None";
  
  // Calculate expense count
  const expenseCount = expenses.length;
  
  // Achievement badges
  const achievements = [];
  if (expenseCount >= 5) achievements.push("Expense Tracker");
  if (thisMonthAmount > 1000) achievements.push("Big Spender");
  if (Object.keys(categoryTotals).length >= 3) achievements.push("Category Master");

  const resetFilters = () => {
    setFilters({
      sortBy: "recent",
      category: "all",
      amountRange: "all",
      group: "all",
      dateRange: "all"
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== "all" && value !== "recent").length;

  const getFilterSummary = () => {
    const parts = [];
    if (filters.sortBy !== "recent") parts.push(`Sort: ${filters.sortBy}`);
    if (filters.category !== "all") parts.push(`Category: ${filters.category}`);
    if (filters.amountRange !== "all") parts.push(`Amount: ${filters.amountRange}`);
    if (filters.group !== "all") {
      const groupName = groups.find(g => g.id === filters.group)?.name || "Unknown";
      parts.push(`Group: ${groupName}`);
    }
    if (filters.dateRange !== "all") parts.push(`Date: ${filters.dateRange}`);
    return parts.join(", ");
  };

  // Filter and sort expenses based on search and filters
  const filteredExpenses = expenses
    .filter(expense => {
      // Search filter
      const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = filters.category === "all" || expense.category === filters.category;
      
      // Group filter
      const matchesGroup = filters.group === "all" || expense.groupId === filters.group;
      
      // Amount range filter
      let matchesAmount = true;
      if (filters.amountRange === "low") matchesAmount = expense.amount <= 100;
      else if (filters.amountRange === "medium") matchesAmount = expense.amount > 100 && expense.amount <= 500;
      else if (filters.amountRange === "high") matchesAmount = expense.amount > 500;
      
      // Date range filter
      let matchesDate = true;
      const expenseDate = new Date(expense.date);
      const now = new Date();
      
      if (filters.dateRange === "today") {
        matchesDate = expenseDate.toDateString() === now.toDateString();
      } else if (filters.dateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = expenseDate >= weekAgo;
      } else if (filters.dateRange === "month") {
        matchesDate = expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
      }
      
      return matchesSearch && matchesCategory && matchesGroup && matchesAmount && matchesDate;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "amount-high":
          return b.amount - a.amount;
        case "amount-low":
          return a.amount - b.amount;
        case "name":
          return a.description.localeCompare(b.description);
        case "category":
          return a.category.localeCompare(b.category);
        case "recent":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">All Expenses</h1>
            <p className="text-muted-foreground">Track and manage all your shared expenses</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleViewGooglePayTransactions}
              className="bg-purple-500 hover:bg-purple-800 text-black hover:text-white shadow-md hover:shadow-lg px-4 py-2 h-9 hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 rounded-lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Pay Transactions
            </Button>
            <Link to="/settlements">
              <Button variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                View Settlements
              </Button>
            </Link>
            <Link to="/payments">
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                All Payments
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={handleGooglePayClick}
              className="bg-green-500 hover:bg-green-800 text-black hover:text-white shadow-md hover:shadow-lg px-4 py-2 h-9 hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 rounded-lg"
            >
              <CreditCard className="h-3 w-3 mr-1" />
              Google Pay
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-800 text-black hover:text-white shadow-md hover:shadow-lg px-4 py-2 h-9 hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 rounded-lg" onClick={() => setShowAddExpense(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-foreground">
                  ₹{thisMonthAmount.toFixed(2)}
                </span>
                <Badge variant="default" className="bg-gradient-success">
                  {thisMonthExpenses.length} expenses
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-foreground">
                  ₹{totalAmount.toFixed(2)}
                </span>
                <Badge variant="secondary">
                  {expenseCount} expenses
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-foreground">
                  {topCategory}
                </span>
                <Badge variant="outline">
                  ₹{categoryTotals[topCategory]?.toFixed(2) || "0.00"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Achievements Section */}
        {achievements.length > 0 && (
          <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Award className="h-6 w-6" />
                  <h3 className="text-lg font-semibold">Your Expense Achievements</h3>
                </div>
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

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search expenses..." 
              className="pl-9 h-8 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 px-3 relative" onClick={() => setShowFilterModal(true)}>
            <Filter className="h-3 w-3 mr-1" />
            Filter
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] h-4 w-4 flex items-center justify-center rounded-full p-0">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mb-4 animate-slide-up" style={{ animationDelay: "0.25s" }}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              <Badge variant="secondary" className="text-xs py-0.5">
                {getFilterSummary()}
              </Badge>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-5 px-1.5">
                <X className="h-2.5 w-2.5 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          {filteredExpenses.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || activeFiltersCount > 0 
                    ? "Try adjusting your search or filters" 
                    : "Add your first expense to get started"}
                </p>
                <Button onClick={() => setShowAddExpense(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <Card key={expense.id} className="card-interactive group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getCategoryIcon(expense.category)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{expense.description}</p>
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                            <span>{formatDate(new Date(expense.date))}</span>
                            <span>•</span>
                            <span className="capitalize">{expense.category}</span>
                            <span>•</span>
                            <span>{expense.splitBetween?.length || 1} people</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-foreground">₹{expense.amount.toFixed(2)}</span>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Clock className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Expense Modal */}
      <AddExpenseModal
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
      />

      {/* Filter Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center space-x-2 text-base">
              <Filter className="h-4 w-4" />
              <span>Filter Expenses</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Customize how your expenses are displayed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Sort By */}
            <div className="space-y-1.5">
              <Label htmlFor="sortBy" className="text-xs">Sort By</Label>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Sort option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent" className="text-sm">Most Recent</SelectItem>
                  <SelectItem value="amount-high" className="text-sm">Amount (High to Low)</SelectItem>
                  <SelectItem value="amount-low" className="text-sm">Amount (Low to High)</SelectItem>
                  <SelectItem value="name" className="text-sm">Name (A-Z)</SelectItem>
                  <SelectItem value="category" className="text-sm">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs">Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category} className="text-sm capitalize">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Range */}
            <div className="space-y-1.5">
              <Label htmlFor="amountRange" className="text-xs">Amount Range</Label>
              <Select value={filters.amountRange} onValueChange={(value) => setFilters(prev => ({ ...prev, amountRange: value }))}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Amount range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">All Amounts</SelectItem>
                  <SelectItem value="low" className="text-sm">Low (₹0 - ₹100)</SelectItem>
                  <SelectItem value="medium" className="text-sm">Medium (₹100 - ₹500)</SelectItem>
                  <SelectItem value="high" className="text-sm">High (₹500+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group Filter */}
            <div className="space-y-1.5">
              <Label htmlFor="group" className="text-xs">Group</Label>
              <Select value={filters.group} onValueChange={(value) => setFilters(prev => ({ ...prev, group: value }))}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">All Groups</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id} className="text-sm">
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-1.5">
              <Label htmlFor="dateRange" className="text-xs">Date Range</Label>
              <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">All Time</SelectItem>
                  <SelectItem value="today" className="text-sm">Today</SelectItem>
                  <SelectItem value="week" className="text-sm">This Week</SelectItem>
                  <SelectItem value="month" className="text-sm">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset
            </Button>
            <Button size="sm" onClick={() => setShowFilterModal(false)}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;