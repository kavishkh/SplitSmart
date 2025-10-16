import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/Header";
import { useExpenses } from "@/hooks/use-expenses";
import { useGroups } from "@/hooks/use-groups";
import { useUser } from "@/hooks/use-user";
import { IndianRupee, Calendar, Users, CreditCard, CheckCircle, ExternalLink, Filter, Search } from "lucide-react";
import { toast } from "sonner";

const GooglePayTransactions = () => {
  const { expenses, settlements, getExpensesWhereIOwe, getSettlementsByGroup } = useExpenses();
  const { groups } = useGroups();
  const { currentUser } = useUser();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "sent" | "received">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "week" | "month" | "year">("all");

  // Get all Google Pay transactions (expenses and settlements)
  const allTransactions = [
    ...expenses.map(expense => {
      // Calculate amount owed by current user for this expense
      const splitAmount = expense.amount / (expense.splitBetween.length || 1);
      return {
        id: expense.id,
        type: "expense" as const,
        amount: splitAmount,
        description: expense.description,
        date: expense.date,
        groupId: expense.groupId,
        paidBy: expense.paidBy,
        splitBetween: expense.splitBetween,
        groupName: groups.find(g => g.id === expense.groupId)?.name || "Unknown Group",
        transactionType: expense.paidBy === currentUser?.id ? "received" : "sent",
        // If current user paid, it's money they're owed (received)
        // If current user owes, it's money they need to send (sent)
        direction: expense.paidBy === currentUser?.id ? "received" : "sent"
      };
    }),
    ...settlements.map(settlement => ({
      id: settlement.id,
      type: "settlement" as const,
      amount: settlement.amount,
      description: settlement.description || `Payment for group expenses`,
      date: settlement.date,
      groupId: settlement.groupId,
      fromMember: settlement.fromMember,
      toMember: settlement.toMember,
      groupName: settlement.groupName,
      transactionType: settlement.fromMember === currentUser?.id ? "sent" : "received",
      direction: settlement.fromMember === currentUser?.id ? "sent" : "received"
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter transactions based on search, type, and time
  const filteredTransactions = allTransactions.filter(transaction => {
    // Search filter
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.groupName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    const matchesType = filterType === "all" || 
                       (filterType === "sent" && transaction.direction === "sent") ||
                       (filterType === "received" && transaction.direction === "received");
    
    // Time filter
    const now = new Date();
    const transactionDate = new Date(transaction.date);
    let matchesTime = true;
    
    if (timeFilter === "week") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesTime = transactionDate >= oneWeekAgo;
    } else if (timeFilter === "month") {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      matchesTime = transactionDate >= oneMonthAgo;
    } else if (timeFilter === "year") {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      matchesTime = transactionDate >= oneYearAgo;
    }
    
    return matchesSearch && matchesType && matchesTime;
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeBadge = (type: "expense" | "settlement") => {
    if (type === "expense") {
      return <Badge variant="secondary">Expense</Badge>;
    } else {
      return <Badge variant="default">Payment</Badge>;
    }
  };

  const getTransactionDirectionBadge = (direction: "sent" | "received") => {
    if (direction === "sent") {
      return <Badge variant="destructive">Sent</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-500">Received</Badge>;
    }
  };

  const handleBackToPayments = () => {
    navigate("/payments");
  };

  // Calculate totals
  const totalSent = allTransactions
    .filter(t => t.direction === "sent")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalReceived = allTransactions
    .filter(t => t.direction === "received")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Google Pay Transactions</h1>
            <p className="text-muted-foreground">View all your Google Pay transactions</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleBackToPayments}
            className="bg-blue-500 hover:bg-blue-800 text-black hover:text-white shadow-md hover:shadow-lg px-4 py-2 h-9 hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 rounded-lg"
          >
            Back to Payments
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-foreground">
                  {filteredTransactions.length}
                </span>
                <Badge variant="default" className="bg-gradient-success">
                  of {allTransactions.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-foreground text-red-500">
                  ₹{totalSent.toFixed(2)}
                </span>
                <Badge variant="destructive">
                  Sent
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-foreground text-green-500">
                  ₹{totalReceived.toFixed(2)}
                </span>
                <Badge variant="default" className="bg-green-500">
                  Received
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => setFilterType("all")}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  All
                </Button>
                <Button 
                  variant={filterType === "sent" ? "destructive" : "outline"}
                  onClick={() => setFilterType("sent")}
                >
                  Sent
                </Button>
                <Button 
                  variant={filterType === "received" ? "default" : "outline"}
                  onClick={() => setFilterType("received")}
                  className={filterType === "received" ? "bg-green-500 hover:bg-green-800" : ""}
                >
                  Received
                </Button>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as any)}
                  className="border border-input rounded-md bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          {filteredTransactions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms.
                </p>
                <Button onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                  setTimeFilter("all");
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => {
                const group = groups.find(g => g.id === transaction.groupId);
                let otherPartyName = "Unknown";
                
                if (transaction.type === "expense") {
                  const paidByMember = group?.members.find(m => m.id === transaction.paidBy);
                  otherPartyName = paidByMember?.name || "Unknown";
                } else {
                  const otherPartyId = transaction.direction === "sent" ? transaction.toMember : transaction.fromMember;
                  const otherPartyMember = group?.members.find(m => m.id === otherPartyId);
                  otherPartyName = otherPartyMember?.name || "Unknown";
                }
                
                return (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-primary/20 rounded-lg flex items-center justify-center">
                            <IndianRupee className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-foreground">{transaction.description}</h4>
                              {getTransactionTypeBadge(transaction.type)}
                              {getTransactionDirectionBadge(transaction.direction as "sent" | "received")}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                              <span>
                                {transaction.direction === "sent" ? "To" : "From"} {otherPartyName}
                              </span>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{transaction.groupName}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(transaction.date)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-semibold ${
                            transaction.direction === "sent" 
                              ? "text-red-500" 
                              : "text-green-500"
                          }`}>
                            {transaction.direction === "sent" ? "-" : "+"}₹{transaction.amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatTime(transaction.date)}
                          </div>
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

      {/* Floating Elements */}
      <div className="fixed top-20 right-10 w-32 h-32 bg-gradient-primary/10 rounded-full blur-3xl animate-float -z-10" />
      <div className="fixed bottom-20 left-10 w-24 h-24 bg-gradient-accent/10 rounded-full blur-2xl animate-float -z-10" style={{ animationDelay: "1s" }} />
    </div>
  );
};

export default GooglePayTransactions;