import { Plus, Users, Search, Filter, X, RefreshCw, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { GroupsGrid } from "@/components/GroupsGrid";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useGroups } from "@/hooks/use-groups";
import { Link } from "react-router-dom";
import { useState } from "react";

const Groups = () => {
  const { createGroup, refreshGroups, groups } = useGroups();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: "recent",
    balanceFilter: "all",
    memberCount: "all"
  });
  
  // Calculate group statistics
  const groupCount = groups ? groups.length : 0;
  const totalMembers = groups ? groups.reduce((sum, group) => sum + (group.members ? group.members.length : 0), 0) : 0;
  const avgMembersPerGroup = groupCount > 0 ? (totalMembers / groupCount).toFixed(1) : "0";
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshGroups();
      console.log('🔄 Groups refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing groups:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Style constants
  const heroButtonClass = "bg-blue-500 hover:bg-blue-600 text-black shadow-lg hover:shadow-xl text-lg px-8 py-6 h-auto hover:-translate-y-1 hover:scale-105 transition-all duration-300";
  const accentButtonClass = "bg-orange-500 hover:bg-orange-600 text-black shadow-lg hover:shadow-xl text-lg px-8 py-6 h-auto hover:-translate-y-1 hover:scale-105 transition-all duration-300";

  const handleCreateGroup = (groupData: {
    name: string;
    description: string;
    members: Array<{ id: string; name: string; email: string }>;
    color: string;
  }) => {
    createGroup(groupData);
  };

  const resetFilters = () => {
    setFilters({
      sortBy: "recent",
      balanceFilter: "all",
      memberCount: "all"
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== "all" && value !== "recent").length;

  const getFilterSummary = () => {
    const parts = [];
    if (filters.sortBy !== "recent") parts.push(`Sort: ${filters.sortBy}`);
    if (filters.balanceFilter !== "all") parts.push(`Balance: ${filters.balanceFilter}`);
    if (filters.memberCount !== "all") parts.push(`Members: ${filters.memberCount}`);
    return parts.join(", ");
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Your Groups</h1>
            <p className="text-muted-foreground text-sm">Manage your expense groups and members</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/add-expense">
              <Button variant="outline" size="sm" className="h-8 px-3">
                <Plus className="h-3 w-3 mr-1" />
                Expense
              </Button>
            </Link>
            <Button size="sm" className="h-8 px-3" onClick={() => setShowCreateModal(true)}>
              <Users className="h-3 w-3 mr-1" />
              Create
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <Card className="card-balance">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-primary/20 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Groups</p>
                  <p className="text-xl font-bold">{groupCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-balance">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-accent/20 rounded-lg">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Members</p>
                  <p className="text-xl font-bold">{totalMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-balance">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-success/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Members/Group</p>
                  <p className="text-xl font-bold">{avgMembersPerGroup}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search groups..." 
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
          <div className="mb-4 animate-slide-up" style={{ animationDelay: "0.15s" }}>
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

        {/* Groups Grid */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <GroupsGrid onCreateGroup={() => setShowCreateModal(true)} searchQuery={searchQuery} filters={filters} />
        </div>
      </main>

      {/* Floating Elements */}
      <div className="fixed top-20 right-10 w-32 h-32 bg-gradient-primary/10 rounded-full blur-3xl animate-float -z-10" />
      <div className="fixed bottom-20 left-10 w-24 h-24 bg-gradient-accent/10 rounded-full blur-2xl animate-float -z-10" style={{ animationDelay: "1s" }} />
      
      {/* Create Group Modal */}
      <CreateGroupModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateGroup={handleCreateGroup}
      />

      {/* Filter Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center space-x-2 text-base">
              <Filter className="h-4 w-4" />
              <span>Filter Groups</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Customize how your groups are displayed.
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
                  <SelectItem value="recent" className="text-sm">Recently Created</SelectItem>
                  <SelectItem value="name" className="text-sm">Name (A-Z)</SelectItem>
                  <SelectItem value="amount" className="text-sm">Total Spent</SelectItem>
                  <SelectItem value="balance" className="text-sm">Balance Amount</SelectItem>
                  <SelectItem value="members" className="text-sm">Member Count</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Balance Filter */}
            <div className="space-y-1.5">
              <Label htmlFor="balanceFilter" className="text-xs">Balance Status</Label>
              <Select value={filters.balanceFilter} onValueChange={(value) => setFilters(prev => ({ ...prev, balanceFilter: value }))}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Balance filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">All Groups</SelectItem>
                  <SelectItem value="owed" className="text-sm">You Are Owed Money</SelectItem>
                  <SelectItem value="owes" className="text-sm">You Owe Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Member Count */}
            <div className="space-y-1.5">
              <Label htmlFor="memberCount" className="text-xs">Member Count</Label>
              <Select value={filters.memberCount} onValueChange={(value) => setFilters(prev => ({ ...prev, memberCount: value }))}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Member count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">All Groups</SelectItem>
                  <SelectItem value="small" className="text-sm">Small (2-3 members)</SelectItem>
                  <SelectItem value="medium" className="text-sm">Medium (4-6 members)</SelectItem>
                  <SelectItem value="large" className="text-sm">Large (7+ members)</SelectItem>
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

export default Groups;