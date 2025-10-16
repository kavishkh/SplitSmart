import { useState } from "react";
import { ArrowLeft, Search, Filter, Calendar, CreditCard, User, IndianRupee, Clock, X, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
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

const Settlements = () => {
  const { settlements, refreshExpenses } = useExpenses();
  const { groups } = useGroups();
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: "recent",
    status: "all",
    group: "all",
    dateRange: "all"
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshExpenses();
      console.log('🔄 Settlements refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing settlements:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewGooglePayTransactions = () => {
    navigate("/google-pay/transactions");
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
      status: "all",
      group: "all",
      dateRange: "all"
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== "all" && value !== "recent").length;

  const getFilterSummary = () => {
    const parts = [];
    if (filters.sortBy !== "recent") parts.push(`Sort: ${filters.sortBy}`);
    if (filters.status !== "all") parts.push(`Status: ${filters.status}`);
    if (filters.group !== "all") {
      const groupName = getGroupById(filters.group)?.name || "Unknown";
      parts.push(`Group: ${groupName}`);
    }
    if (filters.dateRange !== "all") parts.push(`Date: ${filters.dateRange}`);
    return parts.join(", ");
  };

  // Filter and sort settlements based on search and filters
  const filteredSettlements = settlements
    .filter(settlement => {
      // Search filter
      const fromMember = getMemberById(settlement.groupId, settlement.fromMember);
      const toMember = getMemberById(settlement.groupId, settlement.toMember);
      const groupName = getGroupById(settlement.groupId)?.name || "";
      
      const matchesSearch = 
        settlement.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fromMember?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        toMember?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        groupName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = filters.status === "all" || 
        (filters.status === "confirmed" && settlement.confirmed) || 
        (filters.status === "pending" && !settlement.confirmed);
      
      // Group filter
      const matchesGroup = filters.group === "all" || settlement.groupId === filters.group;
      
      // Date range filter
      let matchesDate = true;
      const settlementDate = new Date(settlement.date);
      const now = new Date();
      
      if (filters.dateRange === "today") {
        matchesDate = settlementDate.toDateString() === now.toDateString();
      } else if (filters.dateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = settlementDate >= weekAgo;
      } else if (filters.dateRange === "month") {
        matchesDate = settlementDate.getMonth() === now.getMonth() && settlementDate.getFullYear() === now.getFullYear();
      }
      
      return matchesSearch && matchesStatus && matchesGroup && matchesDate;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "amount-high":
          return b.amount - a.amount;
        case "amount-low":
          return a.amount - b.amount;
        case "name":
          const fromMemberA = getMemberById(a.groupId, a.fromMember)?.name || "";
          const fromMemberB = getMemberById(b.groupId, b.fromMember)?.name || "";
          return fromMemberA.localeCompare(fromMemberB);
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
            <h1 className="text-3xl font-bold text-foreground mb-2">All Settlements</h1>
            <p className="text-muted-foreground">Track and manage all your payments and settlements</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-foreground">
                  ₹{settlements.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
                </span>
                <Badge variant="default" className="bg-gradient-success">
                  {settlements.length} payments
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
                <span className="text-2xl font-bold text-foreground">
                  ₹{settlements.filter(s => s.confirmed).reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
                </span>
                <Badge variant="secondary">
                  {settlements.filter(s => s.confirmed).length} confirmed
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
                <span className="text-2xl font-bold text-foreground">
                  ₹{settlements.filter(s => !s.confirmed).reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
                </span>
                <Badge variant="outline">
                  {settlements.filter(s => !s.confirmed).length} pending
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search settlements..." 
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

        {/* Settlements List */}
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          {filteredSettlements.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No settlements found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || activeFiltersCount > 0 
                    ? "Try adjusting your search or filters" 
                    : "All settlements will appear here"}
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
              {filteredSettlements.map((settlement) => {
                const fromMember = getMemberById(settlement.groupId, settlement.fromMember);
                const toMember = getMemberById(settlement.groupId, settlement.toMember);
                const group = getGroupById(settlement.groupId);
                const isCurrentUserInvolved = 
                  settlement.fromMember === currentUser?.id || 
                  settlement.toMember === currentUser?.id;
                
                return (
                  <Card key={settlement.id} className="card-interactive group">
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
                            <p className="font-semibold text-foreground">
                              {fromMember?.name || "Unknown"} → {toMember?.name || "Unknown"}
                            </p>
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                              <span>{formatDate(new Date(settlement.date))}</span>
                              <span>•</span>
                              <span>{group?.name || "Unknown Group"}</span>
                              {settlement.description && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-xs">{settlement.description}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <span className="text-lg font-bold text-foreground">₹{settlement.amount.toFixed(2)}</span>
                            <div className="flex justify-end">
                              <Badge 
                                variant={settlement.confirmed ? "default" : "secondary"}
                                className={`text-xs ${settlement.confirmed ? 'bg-gradient-success' : ''}`}
                              >
                                {settlement.confirmed ? (
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
              <span>Filter Settlements</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Customize how your settlements are displayed.
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

            {/* Status Filter */}
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

export default Settlements;