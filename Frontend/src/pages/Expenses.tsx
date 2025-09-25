import { Plus, Search, Filter, Calendar, TrendingUp, Receipt, Clock, X, RefreshCw } from "lucide-react";
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
import { Link } from "react-router-dom";
import { useState } from "react";

const Expenses = () => {
  const { expenses, refreshExpenses } = useExpenses();
  const { groups } = useGroups();
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
                <span className="text-2xl font-bold text-foreground">₹{thisMonthAmount.toFixed(2)}</span>
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
                <span className="text-2xl font-bold text-foreground">₹{totalAmount.toFixed(2)}</span>
                <Badge variant="secondary">{expenses.length} total</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-foreground">{categories.length}</span>
                <Badge variant="outline">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search expenses..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" className="bg-orange-500 hover:bg-orange-800 text-black hover:text-white shadow-md hover:shadow-lg px-4 py-2 h-9 hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 rounded-lg" onClick={() => setShowDateRangeModal(true)}>
              <Calendar className="h-3 w-3 mr-1" />
              Date Range
            </Button>
            <Button variant="outline" className="bg-orange-500 hover:bg-orange-800 text-black hover:text-white shadow-md hover:shadow-lg px-4 py-2 h-9 hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 rounded-lg relative" onClick={() => setShowFilterModal(true)}>
              <Filter className="h-3 w-3 mr-1" />
              Filter
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mb-4 animate-slide-up" style={{ animationDelay: "0.25s" }}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              <Badge variant="secondary" className="text-sm">
                {getFilterSummary()}
              </Badge>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-6 px-2">
                <X className="h-3 w-3 mr-1" />
                Clear all
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
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? "No expenses found" : "No expenses yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? "Try adjusting your search terms" 
                    : "Start tracking expenses with your groups"
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowAddExpense(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Expense
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense, index) => {
                const group = groups.find(g => g.id === expense.groupId);
                const paidByMember = group?.members.find(m => m.id === expense.paidBy);
                
                return (
                  <Card key={expense.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-primary/20 rounded-lg flex items-center justify-center">
                            <span className="text-xl">{getCategoryIcon(expense.category)}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground text-lg">{expense.description}</h4>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>Paid by {paidByMember?.name || "Unknown"}</span>
                              <span>•</span>
                              <Link to={`/groups/${expense.groupId}`} className="text-primary hover:underline">
                                {group?.name || "Unknown Group"}
                              </Link>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(expense.date)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-semibold text-foreground">
                            ₹{expense.amount.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Split {expense.splitBetween.length} ways
                          </div>
                          <Badge variant="outline" className="mt-1">
                            ₹{(expense.amount / expense.splitBetween.length).toFixed(2)} each
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Expense Modal */}
        <AddExpenseModal 
          open={showAddExpense}
          onOpenChange={setShowAddExpense}
        />

        {/* Filter Modal */}
        <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filter Expenses</span>
              </DialogTitle>
              <DialogDescription>
                Customize how your expenses are displayed and sorted.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Sort By */}
              <div className="space-y-2">
                <Label htmlFor="sortBy">Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sorting option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recently Added</SelectItem>
                    <SelectItem value="amount-high">Amount (High to Low)</SelectItem>
                    <SelectItem value="amount-low">Amount (Low to High)</SelectItem>
                    <SelectItem value="name">Description (A-Z)</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range Filter */}
              <div className="space-y-2">
                <Label htmlFor="amountRange">Amount Range</Label>
                <Select value={filters.amountRange} onValueChange={(value) => setFilters(prev => ({ ...prev, amountRange: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select amount range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Amounts</SelectItem>
                    <SelectItem value="low">Low (≤ ₹100)</SelectItem>
                    <SelectItem value="medium">Medium (₹100 - ₹500)</SelectItem>
                    <SelectItem value="high">High ({'>'}₹500)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Group Filter */}
              <div className="space-y-2">
                <Label htmlFor="group">Group</Label>
                <Select value={filters.group} onValueChange={(value) => setFilters(prev => ({ ...prev, group: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex space-x-2">
              <Button variant="outline" onClick={resetFilters} className="flex-1">
                Reset Filters
              </Button>
              <Button onClick={() => setShowFilterModal(false)} className="flex-1">
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Date Range Modal */}
        <Dialog open={showDateRangeModal} onOpenChange={setShowDateRangeModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Date Range Filter</span>
              </DialogTitle>
              <DialogDescription>
                Filter expenses by date range.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dateRange">Select Date Range</Label>
                <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex space-x-2">
              <Button variant="outline" onClick={() => setFilters(prev => ({ ...prev, dateRange: "all" }))} className="flex-1">
                Clear Date Filter
              </Button>
              <Button onClick={() => setShowDateRangeModal(false)} className="flex-1">
                Apply Date Filter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      {/* Floating Elements */}
      <div className="fixed top-20 right-10 w-32 h-32 bg-gradient-primary/10 rounded-full blur-3xl animate-float -z-10" />
      <div className="fixed bottom-20 left-10 w-24 h-24 bg-gradient-accent/10 rounded-full blur-2xl animate-float -z-10" style={{ animationDelay: "1s" }} />
    </div>
  );
};

export default Expenses;