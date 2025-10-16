import { useState } from "react";
import { ArrowLeft, Search, Filter, Calendar, CreditCard, Receipt, User, IndianRupee, Clock, X, RefreshCw, CheckCircle, AlertCircle, TrendingUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/Header";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useExpenses } from "@/hooks/use-expenses";
import { useGroups } from "@/hooks/use-groups";
import { useUser } from "@/hooks/use-user";
import { Link, useNavigate } from "react-router-dom";

const Payments = () => {
  const { expenses, settlements, refreshExpenses } = useExpenses();
  const { groups } = useGroups();
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // all, expenses, settlements
  const [filters, setFilters] = useState({
    sortBy: "recent",
    category: "all",
    status: "all",
    amountRange: "all",
    group: "all",
    dateRange: "all"
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshExpenses();
      console.log('🔄 Payments refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing payments:', error);
    } finally {
      setIsRefreshing(false);
    }
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

  const getGroupById = (groupId: string) => {
    return groups.find(g => g.id === groupId);
  };

  const getMemberById = (groupId: string, memberId: string) => {
    const group = getGroupById(groupId);
    return group?.members.find(m => m.id === memberId);
  };

  const resetFilters = () => {
    setFilters({
      sortBy: "recent",
      category: "all",
      status: "all",
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
    if (filters.status !== "all") parts.push(`Status: ${filters.status}`);
    if (filters.amountRange !== "all") parts.push(`Amount: ${filters.amountRange}`);
    if (filters.group !== "all") {
      const groupName = getGroupById(filters.group)?.name || "Unknown";
      parts.push(`Group: ${groupName}`);
    }
    if (filters.dateRange !== "all") parts.push(`Date: ${filters.dateRange}`);
    return parts.join(", ");
  };

  // Combine expenses and settlements into a single list
  const getAllPayments = () => {
    const expensePayments = expenses.map(expense => ({
      id: expense.id,
      type: "expense" as const,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      groupId: expense.groupId,
      paidBy: expense.paidBy,
      splitBetween: expense.splitBetween,
      date: expense.date,
      createdBy: expense.createdBy
    }));

    const settlementPayments = settlements.map(settlement => ({
      id: settlement.id,
      type: "settlement" as const,
      description: settlement.description,
      amount: settlement.amount,
      confirmed: settlement.confirmed,
      fromMember: settlement.fromMember,
      toMember: settlement.toMember,
      groupId: settlement.groupId,
      date: settlement.date
    }));

    return [...expensePayments, ...settlementPayments];
  };

  // Filter and sort payments based on search, filters, and active tab
  const filteredPayments = getAllPayments()
    .filter(payment => {
      // Tab filter
      if (activeTab === "expenses" && payment.type !== "expense") return false;
      if (activeTab === "settlements" && payment.type !== "settlement") return false;
      
      // Search filter
      let matchesSearch = false;
      if (payment.type === "expense" && 'category' in payment) {
        const group = getGroupById(payment.groupId);
        const paidByMember = getMemberById(payment.groupId, payment.paidBy);
        matchesSearch = 
          payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paidByMember?.name.toLowerCase().includes(searchQuery.toLowerCase());
      } else if (payment.type === "settlement" && 'fromMember' in payment) {
        const fromMember = getMemberById(payment.groupId, payment.fromMember);
        const toMember = getMemberById(payment.groupId, payment.toMember);
        const group = getGroupById(payment.groupId);
        matchesSearch = 
          payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fromMember?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          toMember?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group?.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      
      // Category filter (only for expenses)
      let matchesCategory = true;
      if (payment.type === "expense" && filters.category !== "all" && 'category' in payment) {
        matchesCategory = payment.category === filters.category;
      }
      
      // Status filter (only for settlements)
      let matchesStatus = true;
      if (payment.type === "settlement" && filters.status !== "all" && 'confirmed' in payment) {
        matchesStatus = 
          (filters.status === "confirmed" && payment.confirmed) || 
          (filters.status === "pending" && !payment.confirmed);
      }
      
      // Amount range filter
      let matchesAmount = true;
      if (filters.amountRange === "low") matchesAmount = payment.amount <= 100;
      else if (filters.amountRange === "medium") matchesAmount = payment.amount > 100 && payment.amount <= 500;
      else if (filters.amountRange === "high") matchesAmount = payment.amount > 500;
      
      // Group filter
      const matchesGroup = filters.group === "all" || payment.groupId === filters.group;
      
      // Date range filter
      let matchesDate = true;
      const paymentDate = new Date(payment.date);
      const now = new Date();
      
      if (filters.dateRange === "today") {
        matchesDate = paymentDate.toDateString() === now.toDateString();
      } else if (filters.dateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = paymentDate >= weekAgo;
      } else if (filters.dateRange === "month") {
        matchesDate = paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
      }
      
      return matchesSearch && matchesCategory && matchesStatus && matchesAmount && matchesGroup && matchesDate;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "amount-high":
          return b.amount - a.amount;
        case "amount-low":
          return a.amount - b.amount;
        case "name":
          if (a.type === "expense" && b.type === "expense") {
            return a.description.localeCompare(b.description);
          } else if (a.type === "settlement" && b.type === "settlement" && 'fromMember' in a && 'fromMember' in b) {
            const fromMemberA = getMemberById(a.groupId, a.fromMember)?.name || "";
            const fromMemberB = getMemberById(b.groupId, b.fromMember)?.name || "";
            return fromMemberA.localeCompare(fromMemberB);
          }
          return 0;
        case "recent":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  // Calculate stats
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalSettlements = settlements.reduce((sum, settlement) => sum + settlement.amount, 0);
  const confirmedSettlements = settlements.filter(s => s.confirmed).reduce((sum, s) => sum + s.amount, 0);
  const pendingSettlements = settlements.filter(s => !s.confirmed).reduce((sum, s) => sum + s.amount, 0);

  const handleViewGooglePayTransactions = () => {
    navigate("/google-pay/transactions");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">All Payments</h1>
            <p className="text-muted-foreground">Track and manage all your expenses and settlements</p>
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
            <Link to="/expenses">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Expenses
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-foreground">
                  ₹{totalExpenses.toFixed(2)}
                </span>
                <Badge variant="default" className="bg-gradient-primary">
                  {expenses.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-foreground">
                  ₹{totalSettlements.toFixed(2)}
                </span>
                <Badge variant="secondary">
                  {settlements.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-foreground">
                  ₹{confirmedSettlements.toFixed(2)}
                </span>
                <Badge variant="default" className="bg-gradient-success">
                  {settlements.filter(s => s.confirmed).length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-foreground">
                  ₹{pendingSettlements.toFixed(2)}
                </span>
                <Badge variant="outline">
                  {settlements.filter(s => !s.confirmed).length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            className={activeTab === "all" ? "bg-gradient-primary text-primary-foreground" : ""}
            onClick={() => setActiveTab("all")}
          >
            All Payments
          </Button>
          <Button
            variant={activeTab === "expenses" ? "default" : "outline"}
            size="sm"
            className={activeTab === "expenses" ? "bg-gradient-primary text-primary-foreground" : ""}
            onClick={() => setActiveTab("expenses")}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Expenses
          </Button>
          <Button
            variant={activeTab === "settlements" ? "default" : "outline"}
            size="sm"
            className={activeTab === "settlements" ? "bg-gradient-primary text-primary-foreground" : ""}
            onClick={() => setActiveTab("settlements")}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Settlements
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search payments..." 
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

        {/* Payments List */}
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          {filteredPayments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No payments found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || activeFiltersCount > 0 
                    ? "Try adjusting your search or filters" 
                    : "All payments will appear here"}
                </p>
                <Link to="/expenses">
                  <Button>
                    <IndianRupee className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => {
                if (payment.type === "expense" && 'category' in payment) {
                  const group = getGroupById(payment.groupId);
                  const paidByMember = getMemberById(payment.groupId, payment.paidBy);
                  
                  return (
                    <Card key={payment.id} className="card-interactive group">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">
                              {getCategoryIcon(payment.category)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-semibold text-foreground">{payment.description}</p>
                                <Badge variant="secondary" className="text-xs">
                                  Expense
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                <span>{formatDate(new Date(payment.date))}</span>
                                <span>•</span>
                                <span className="capitalize">{payment.category}</span>
                                <span>•</span>
                                <span>by {paidByMember?.name || "Unknown"}</span>
                                <span>•</span>
                                <span>{group?.name || "Unknown Group"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-bold text-foreground">₹{payment.amount.toFixed(2)}</span>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Clock className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                } else if (payment.type === "settlement" && 'fromMember' in payment) {
                  const fromMember = getMemberById(payment.groupId, payment.fromMember);
                  const toMember = getMemberById(payment.groupId, payment.toMember);
                  const group = getGroupById(payment.groupId);
                  const isCurrentUserInvolved = 
                    payment.fromMember === currentUser?.id || 
                    payment.toMember === currentUser?.id;
                  
                  return (
                    <Card key={payment.id} className="card-interactive group">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-8 h-8 border-2 border-background">
                                <AvatarImage src={fromMember?.avatar} />
                                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                                  {fromMember?.name.charAt(0) || "F"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-muted-foreground">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                              </div>
                              <Avatar className="w-8 h-8 border-2 border-background">
                                <AvatarImage src={toMember?.avatar} />
                                <AvatarFallback className="bg-gradient-accent text-accent-foreground text-xs">
                                  {toMember?.name.charAt(0) || "T"}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-semibold text-foreground">
                                  {fromMember?.name || "Unknown"} → {toMember?.name || "Unknown"}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  Settlement
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                <span>{formatDate(new Date(payment.date))}</span>
                                <span>•</span>
                                <span>{group?.name || "Unknown Group"}</span>
                                {payment.description && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-xs">{payment.description}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <span className="text-lg font-bold text-foreground">₹{payment.amount.toFixed(2)}</span>
                              <div className="flex justify-end">
                                <Badge 
                                  variant={payment.confirmed ? "default" : "secondary"}
                                  className={`text-xs ${payment.confirmed ? 'bg-gradient-success' : ''}`}
                                >
                                  {payment.confirmed ? (
                                    <div className="flex items-center">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Confirmed
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Pending
                                    </div>
                                  )}
                                </Badge>
                              </div>
                            </div>
                            {isCurrentUserInvolved && (
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Clock className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </main>

      {/* Filter Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center space-x-2 text-base">
              <Filter className="h-4 w-4" />
              <span>Filter Payments</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Customize how your payments are displayed.
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
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter (only for expenses) */}
            {activeTab !== "settlements" && (
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs">Category</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-sm">All Categories</SelectItem>
                    <SelectItem value="food" className="text-sm">Food & Dining</SelectItem>
                    <SelectItem value="transport" className="text-sm">Transportation</SelectItem>
                    <SelectItem value="entertainment" className="text-sm">Entertainment</SelectItem>
                    <SelectItem value="utilities" className="text-sm">Utilities</SelectItem>
                    <SelectItem value="shopping" className="text-sm">Shopping</SelectItem>
                    <SelectItem value="other" className="text-sm">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status Filter (only for settlements) */}
            {activeTab !== "expenses" && (
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-sm">All Statuses</SelectItem>
                    <SelectItem value="confirmed" className="text-sm">Confirmed</SelectItem>
                    <SelectItem value="pending" className="text-sm">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

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

export default Payments;