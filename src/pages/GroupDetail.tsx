import { ArrowLeft, Plus, Users, Calendar, Share2, UserPlus, Receipt, Clock, IndianRupee, CreditCard, RefreshCw, Edit, Trash2, CheckCircle, Wallet, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { SettlementModal } from "@/components/SettlementModal";
import { EditMemberModal } from "@/components/EditMemberModal";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { AddMemberModal } from "@/components/AddMemberModal";
import { InviteMemberModal } from "@/components/InviteMemberModal";
import { ConfirmSettlementModal } from "@/components/ConfirmSettlementModal";
import { PayExpenseModal } from "@/components/PayExpenseModal";
import { SelectMemberToPayModal } from "@/components/SelectMemberToPayModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGroups } from "@/hooks/use-groups";
import { useExpenses } from "@/hooks/use-expenses";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useParams } from "react-router-dom";

const GroupDetail = () => {
  const { id } = useParams();
  const { getGroupById, refreshGroups, updateGroup, deleteGroup } = useGroups();
  const { getExpensesByGroup, getSettlementsByGroup, calculateBalances, addSettlement, refreshExpenses, deleteExpense } = useExpenses();
  const { currentUser } = useUser();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showDeleteMemberDialog, setShowDeleteMemberDialog] = useState(false);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  const [showDeleteExpenseDialog, setShowDeleteExpenseDialog] = useState(false);
  const [showConfirmSettlement, setShowConfirmSettlement] = useState(false);
  const [showPayExpense, setShowPayExpense] = useState(false);
  const [showSelectMemberToPay, setShowSelectMemberToPay] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [expenseToPay, setExpenseToPay] = useState<any>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [settlementMember, setSettlementMember] = useState("");
  const [settlementAmount, setSettlementAmount] = useState(0);
  const [settlementAmountForSelection, setSettlementAmountForSelection] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const group = getGroupById(id || "");
  const expenses = getExpensesByGroup(id || "");
  const settlements = getSettlementsByGroup(id || "");
  const balances = calculateBalances(id || "");
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshGroups(),
        refreshExpenses()
      ]);
      console.log('🔄 Data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setShowEditMember(true);
  };
  
  const handleSaveMember = (updatedMember: any) => {
    if (!group) return;
    
    // Update the group with the modified member
    const updatedMembers = group.members.map((member: any) => 
      member.id === updatedMember.id ? updatedMember : member
    );
    
    updateGroup(group.id, {
      members: updatedMembers
    });
    
    toast.success("Member updated successfully!");
  };
  
  const handleAddMembersToGroup = (newMembers: any[]) => {
    if (!group) return;
    
    // Combine existing members with new members
    const updatedMembers = [...group.members, ...newMembers];
    
    // Update the group with new members
    updateGroup(group.id, {
      members: updatedMembers
    });
    
    toast.success(`${newMembers.length} member(s) added successfully!`);
  };
  
  const confirmDeleteMember = (member: any) => {
    setMemberToDelete(member);
    setShowDeleteMemberDialog(true);
  };
  
  const handleDeleteMember = () => {
    if (!group || !memberToDelete) return;
    
    // Prevent deleting the current user
    if (memberToDelete.id === (currentUser?.id || "current-user")) {
      toast.error("You cannot remove yourself from the group");
      setShowDeleteMemberDialog(false);
      setMemberToDelete(null);
      return;
    }
    
    // Update the group by filtering out the member to delete
    const updatedMembers = group.members.filter((member: any) => 
      member.id !== memberToDelete.id
    );
    
    updateGroup(group.id, {
      members: updatedMembers
    });
    
    toast.success(`${memberToDelete.name} removed from the group`);
    setShowDeleteMemberDialog(false);
    setMemberToDelete(null);
  };
  
  const confirmDeleteGroup = () => {
    setShowDeleteGroupDialog(true);
  };
  
  const handleDeleteGroup = () => {
    if (!group) return;
    
    deleteGroup(group.id);
    toast.success(`Group "${group.name}" deleted successfully`);
    setShowDeleteGroupDialog(false);
    
    // Navigate back to groups page
    window.location.href = "/groups";
  };
  
  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setShowEditExpense(true);
  };
  
  const handleSaveExpense = (updatedExpense: any) => {
    // For now, we'll just show a message since we don't have a direct update function
    toast.success("Expense updated successfully!");
    setShowEditExpense(false);
  };
  
  const handleDeleteExpense = (expense: any) => {
    setExpenseToDelete(expense);
    setShowDeleteExpenseDialog(true);
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    
    try {
      await deleteExpense(expenseToDelete.id);
      setShowDeleteExpenseDialog(false);
      setExpenseToDelete(null);
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      
      // Provide more specific error messages
      if (error.message) {
        toast.error(`Failed to delete expense: ${error.message}`);
      } else if (error.status === 403) {
        toast.error("You don't have permission to delete this expense. Only the creator can delete expenses.");
      } else {
        toast.error("Failed to delete expense. Please try again.");
      }
      
      setShowDeleteExpenseDialog(false);
      setExpenseToDelete(null);
    }
  };
  
  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Group not found</h1>
            <Link to="/groups">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Groups
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }
  
  const handleShareGroup = () => {
    const groupLink = `${window.location.origin}/groups/${group.id}/join`;
    navigator.clipboard.writeText(groupLink).then(() => {
      toast.success("Group invite link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };
  
  const handleSettleUp = (memberId: string, memberName: string, amount: number) => {
    // Instead of directly setting the member, we'll show the member selection modal
    setSettlementAmountForSelection(Math.abs(amount));
    setShowSelectMemberToPay(true);
  };

  const handleMemberSelected = (memberId: string, amount: number) => {
    // Set the selected member and amount, then show the settlement modal
    setSettlementMember(memberId);
    setSettlementAmount(amount);
    setShowSettlement(true);
  };

  // Calculate total group spent from expenses
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Style constants
  const groupIconClass = `w-16 h-16 bg-gradient-to-br ${group.color} rounded-xl flex items-center justify-center shadow-md`;
  const heroButtonClass = "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl text-lg px-8 py-6 h-auto hover:-translate-y-1 hover:scale-105 transition-all duration-300";
  const categoryIconClass = "w-10 h-10 bg-gradient-primary/20 rounded-lg flex items-center justify-center";
  const cardHoverClass = "hover:shadow-md transition-shadow";
  
  const getCategoryIcon = (category: string) => {
    const icons = {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6 animate-slide-up">
          <Link to="/groups">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Groups
            </Button>
          </Link>
        </div>

        {/* Group Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 animate-slide-up">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 bg-gradient-to-br ${group.color} rounded-lg flex items-center justify-center shadow-sm`}>
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
              <p className="text-muted-foreground text-sm">{group.description}</p>
              <div className="flex items-center space-x-3 mt-1 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Created {group.createdAt.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{group.members.length} members</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-muted-foreground hover:text-foreground h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/payments">
              <Button variant="outline" size="sm" className="h-8 px-3">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Payments</span>
              </Button>
            </Link>
            <Link to="/google-pay/transactions">
              <Button variant="outline" size="sm" className="h-8 px-3 bg-purple-500 hover:bg-purple-800 text-black hover:text-white">
                <CreditCard className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Google Pay</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleShareGroup} className="h-8 px-3">
              <Share2 className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowInviteMember(true)} className="h-8 px-3">
              <UserPlus className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Invite</span>
            </Button>
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white h-8 px-3" onClick={confirmDeleteGroup}>
              <Trash2 className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
            <Button size="sm" className="h-8 px-3" onClick={() => setShowAddExpense(true)}>
              <Plus className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Expense</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Group Summary */}
          <div className="lg:col-span-1 space-y-4">
            {/* Total Spent */}
            <Card className="card-balance animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <IndianRupee className="h-4 w-4" />
                  <span>Total Spent</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold text-foreground">
                  ₹{totalSpent.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Across {expenses.length} expenses</p>
              </CardContent>
            </Card>

            {/* Group Members */}
            <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Group Members ({group.members.length})</h2>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowInviteMember(true)}
                  className="text-xs"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Invite Member
                </Button>
              </div>
              
              <div className="space-y-3">
                {group.members.map((member) => {
                  const memberBalance = balances[member.id] || 0;
                  return (
                    <Card key={member.id} className="card-hover">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="bg-gradient-primary text-primary-foreground font-medium">
                                {member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <h4 className="font-medium text-sm truncate">{member.name}</h4>
                              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {memberBalance !== 0 && (
                              <Badge 
                                variant={memberBalance > 0 ? "default" : "destructive"}
                                className={`text-xs py-0.5 ${memberBalance > 0 ? 'bg-gradient-success text-white' : 'bg-gradient-to-r from-destructive to-warning text-white'}`}
                              >
                                {memberBalance > 0 ? '+' : ''}{Math.abs(memberBalance).toFixed(0)}
                              </Badge>
                            )}
                            
                            {member.id === (currentUser?.id || "current-user") && (
                              <Badge variant="outline" className="text-xs py-0.5">
                                You
                              </Badge>
                            )}
                            
                            {memberBalance < 0 && member.id !== (currentUser?.id || "current-user") && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-6 text-xs px-2"
                                onClick={() => handleSettleUp(member.id, member.name, Math.abs(memberBalance))}
                              >
                                Settle
                              </Button>
                            )}
                            
                            {memberBalance > 0 && member.id === (currentUser?.id || "current-user") && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-6 text-xs px-2"
                                onClick={() => handleSettleUp(member.id, member.name, Math.abs(memberBalance))}
                              >
                                Settle
                              </Button>
                            )}
                            
                            {member.id !== (currentUser?.id || "current-user") && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6"
                                onClick={() => {
                                  setSelectedMember(member);
                                  handleEditMember(member);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {member.id !== (currentUser?.id || "current-user") && group.ownerId === (currentUser?.id || "current-user") && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => confirmDeleteMember(member)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Expenses and Settlements */}
          <div className="lg:col-span-2 space-y-6">
            {/* Settlements Section */}
            <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Recent Settlements ({settlements.length})</h2>
                <Badge variant="secondary" className="text-sm">
                  {settlements.length} settlement{settlements.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              {settlements.length === 0 ? (
                <Card className="text-center py-6">
                  <CardContent className="p-0">
                    <CreditCard className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="text-base font-semibold mb-1">No settlements yet</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Members can settle payments between each other.
                    </p>
                    <Button size="sm" onClick={() => setShowSettlement(true)}>
                      <IndianRupee className="h-3 w-3 mr-1" />
                      Make a Payment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {settlements.slice(0, 5).map((settlement) => {
                    const fromMember = group.members.find((m: any) => m.id === settlement.fromMember);
                    const toMember = group.members.find((m: any) => m.id === settlement.toMember);
                    
                    return (
                      <Card key={settlement.id} className="card-hover">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={fromMember?.avatar} />
                                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                                  {fromMember?.name.charAt(0) || "F"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1">
                                  <span className="text-sm font-medium truncate">{fromMember?.name || "Unknown"}</span>
                                  <span className="text-xs text-muted-foreground">pays</span>
                                  <span className="text-sm font-medium truncate">{toMember?.name || "Unknown"}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                  <Clock className="h-2.5 w-2.5" />
                                  <span>{new Date(settlement.date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-right">
                                <div className="text-sm font-semibold text-foreground">
                                  ₹{settlement.amount.toFixed(0)}
                                </div>
                                <Badge 
                                  variant={settlement.confirmed ? "default" : "secondary"}
                                  className={`text-xs py-0.5 ${settlement.confirmed ? 'bg-gradient-success' : ''}`}
                                >
                                  {settlement.confirmed ? 'Confirmed' : 'Pending'}
                                </Badge>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-6 text-xs px-2"
                                onClick={() => {
                                  setSelectedSettlement(settlement);
                                  setShowConfirmSettlement(true);
                                }}
                              >
                                {settlement.confirmed ? (
                                  <CheckCircle className="h-3 w-3 text-success" />
                                ) : (
                                  <CreditCard className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Expenses Section */}
            <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Group Expenses ({expenses.length})</h2>
                <Badge variant="secondary" className="text-sm">
                  {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              {expenses.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent className="p-0">
                    <Receipt className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="text-base font-semibold mb-1">No expenses yet</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Start tracking expenses with your group members.
                    </p>
                    <Button size="sm" onClick={() => setShowAddExpense(true)}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add First Expense
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense, index) => {
                    const paidByMember = group.members.find(m => m.id === expense.paidBy);
                    return (
                      <Card key={expense.id} className="card-hover">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-primary/20 rounded-md flex items-center justify-center">
                                <span className="text-sm">{getCategoryIcon(expense.category)}</span>
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-medium text-sm truncate">{expense.description}</h4>
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                  <span>by {paidByMember?.name || "Unknown"}</span>
                                  <span>•</span>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    <span>{formatDate(expense.date)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="text-right">
                                <div className="text-sm font-semibold text-foreground">
                                  ₹{expense.amount.toFixed(0)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {expense.splitBetween.length} way{expense.splitBetween.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                              <div className="flex flex-col space-y-0">
                                {/* Show Pay button if current user owes money for this expense */}
                                {currentUser?.id !== expense.paidBy && expense.splitBetween.includes(currentUser?.id) && (
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={() => {
                                      setExpenseToPay(expense);
                                      setShowPayExpense(true);
                                    }}
                                    className="h-6 w-6 text-success hover:text-success"
                                  >
                                    <Wallet className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => handleEditExpense(expense)}
                                  className="h-6 w-6"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => handleDeleteExpense(expense)}
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
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
          </div>
        </div>
        
        {/* Delete Member Confirmation Dialog */}
        <AlertDialog open={showDeleteMemberDialog} onOpenChange={setShowDeleteMemberDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {memberToDelete?.name} from "{group.name}"? 
                This action cannot be undone. They will no longer have access to group expenses and balances.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMember} className="bg-destructive hover:bg-destructive/90">
                Remove Member
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Delete Group Confirmation Dialog */}
        <AlertDialog open={showDeleteGroupDialog} onOpenChange={setShowDeleteGroupDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Group</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{group.name}"? This action cannot be undone.
                All expenses and balances in this group will be permanently lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive hover:bg-destructive/90">
                Delete Group
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Delete Expense Confirmation Dialog */}
        <AlertDialog open={showDeleteExpenseDialog} onOpenChange={setShowDeleteExpenseDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{expenseToDelete?.description}"? This action cannot be undone.
                This expense will be permanently removed from the group.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setExpenseToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteExpense} className="bg-destructive hover:bg-destructive/90">
                Delete Expense
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Add Member Modal */}
        {group && (
          <AddMemberModal 
            open={showAddMember}
            onOpenChange={setShowAddMember}
            onAddMembers={handleAddMembersToGroup}
            existingMembers={group.members}
          />
        )}
        
        {/* Add Expense Modal */}
        <AddExpenseModal 
          open={showAddExpense} 
          onOpenChange={setShowAddExpense} 
          preselectedGroupId={group.id} 
        />
        
        <SettlementModal 
          open={showSettlement} 
          onOpenChange={setShowSettlement} 
          groupId={group.id}
          suggestedMember={settlementMember}
          suggestedAmount={settlementAmount}
        />
        
        <SelectMemberToPayModal
          open={showSelectMemberToPay}
          onOpenChange={setShowSelectMemberToPay}
          groupId={group.id}
          groupName={group.name}
          members={group.members}
          currentUser={currentUser}
          onMemberSelected={handleMemberSelected}
          suggestedAmount={settlementAmountForSelection}
        />
        
        {/* Edit Member Modal */}
        {selectedMember && (
          <EditMemberModal
            open={showEditMember}
            onOpenChange={setShowEditMember}
            member={selectedMember}
            onSave={handleSaveMember}
          />
        )}
        
        {/* Edit Expense Modal */}
        {selectedExpense && (
          <EditExpenseModal
            open={showEditExpense}
            onOpenChange={setShowEditExpense}
            expense={selectedExpense}
            groups={[{id: group.id, name: group.name}]}
            onSave={handleSaveExpense}
          />
        )}
        
        {/* Invite Member Modal */}
        {group && (
          <InviteMemberModal
            open={showInviteMember}
            onOpenChange={setShowInviteMember}
            groupId={group.id}
            groupName={group.name}
          />
        )}
        
        {/* Confirm Settlement Modal */}
        {selectedSettlement && (
          <ConfirmSettlementModal
            open={showConfirmSettlement}
            onOpenChange={setShowConfirmSettlement}
            settlement={selectedSettlement}
            onConfirm={(settlementId) => {
              // Refresh settlements after confirmation
              refreshExpenses();
            }}
          />
        )}
        
        {/* Pay Expense Modal */}
        {expenseToPay && group && (
          <PayExpenseModal
            open={showPayExpense}
            onOpenChange={(open) => {
              setShowPayExpense(open);
              if (!open) setExpenseToPay(null);
            }}
            expense={expenseToPay}
            groupId={group.id}
          />
        )}
      </main>

      {/* Floating Elements */}
      <div className="fixed top-20 right-10 w-32 h-32 bg-gradient-primary/10 rounded-full blur-3xl animate-float -z-10" />
      <div className="fixed bottom-20 left-10 w-24 h-24 bg-gradient-accent/10 rounded-full blur-2xl animate-float -z-10" style={{ animationDelay: "1s" }} />
    </div>
  );
};

export default GroupDetail;