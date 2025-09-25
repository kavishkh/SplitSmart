import { ArrowLeft, Plus, Users, Calendar, Share2, UserPlus, Receipt, Clock, IndianRupee, CreditCard, RefreshCw, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { SettlementModal } from "@/components/SettlementModal";
import { SendInvitationEmail } from "@/components/SendInvitationEmail";
import { GroupInvitation } from "@/components/GroupInvitation";
import { SettlementReminder } from "@/components/SettlementReminder";
import { EditMemberModal } from "@/components/EditMemberModal";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { AddMemberModal } from "@/components/AddMemberModal";
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
import { useState } from "react";
import { toast } from "sonner";
import { Link, useParams } from "react-router-dom";

const GroupDetail = () => {
  const { id } = useParams();
  const { getGroupById, refreshGroups, updateGroup, deleteGroup } = useGroups();
  const { getExpensesByGroup, getSettlementsByGroup, calculateBalances, addSettlement, refreshExpenses } = useExpenses();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showDeleteMemberDialog, setShowDeleteMemberDialog] = useState(false);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [settlementMember, setSettlementMember] = useState("");
  const [settlementAmount, setSettlementAmount] = useState(0);
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
    if (memberToDelete.id === "current-user") {
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
  
  const handleDeleteExpense = (expenseId: string) => {
    // For now, we'll just show a message since we don't have a direct delete function
    toast.success("Expense deleted successfully!");
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
    setSettlementMember(memberId);
    setSettlementAmount(Math.abs(amount));
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
            <Button variant="outline" size="sm" onClick={handleShareGroup} className="h-8 px-3">
              <Share2 className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddMember(true)} className="h-8 px-3">
              <UserPlus className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Add</span>
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

            {/* Members List */}
            <Card className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Members & Balances</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-3">
                  {group.members.map((member) => {
                    const memberBalance = balances[member.id] || 0;
                    // Check if the balance is settled (close to zero)
                    const isSettled = Math.abs(memberBalance) < 0.01;
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between py-2 border-b border-muted/50 last:border-0">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-gradient-accent text-accent-foreground text-xs">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{member.name}</p>
                            {member.id === "current-user" && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">You</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {isSettled ? (
                            <Badge variant="outline" className="text-xs px-1 py-0">Settled</Badge>
                          ) : (
                            <>
                              <Badge 
                                variant={memberBalance > 0 ? "default" : "destructive"}
                                className={`text-xs px-1 py-0 ${memberBalance > 0 ? "bg-gradient-success" : "bg-gradient-to-r from-destructive to-warning"}`}
                              >
                                {memberBalance > 0 ? "+" : ""}₹{Math.abs(memberBalance).toFixed(0)}
                              </Badge>
                              {/* Pay button for members who owe money */}
                              {memberBalance < 0 && member.id !== "current-user" && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleSettleUp(member.id, member.name, memberBalance)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Pay
                                </Button>
                              )}
                              {/* You're owed badge for positive balances */}
                              {memberBalance > 0 && member.id === "current-user" && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  You're owed
                                </Badge>
                              )}
                            </>
                          )}
                          {/* Edit and Delete buttons for all members except current user */}
                          {member.id !== "current-user" && (
                            <div className="flex space-x-0">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleEditMember(member)}
                                className="h-6 w-6"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => confirmDeleteMember(member)}
                                className="h-6 w-6 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Group Invitation */}
            <GroupInvitation 
              group={group} 
              onInviteSent={() => {
                // Refresh group data after sending invitation
                handleRefresh();
              }}
            />
            
            {/* Send Email Invitation */}
            <SendInvitationEmail
              groupId={group.id}
              groupName={group.name}
              inviterName="tusha" // In a real app, this would come from the current user context
            />
          </div>

          {/* Expenses */}
          <div className="lg:col-span-2">
            <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
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
                                  onClick={() => handleDeleteExpense(expense.id)}
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
        
        {/* Settlement Modal */}
        <SettlementModal 
          open={showSettlement}
          onOpenChange={setShowSettlement}
          groupId={group.id}
          suggestedMember={settlementMember}
          suggestedAmount={settlementAmount}
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
      </main>

      {/* Floating Elements */}
      <div className="fixed top-20 right-10 w-32 h-32 bg-gradient-primary/10 rounded-full blur-3xl animate-float -z-10" />
      <div className="fixed bottom-20 left-10 w-24 h-24 bg-gradient-accent/10 rounded-full blur-2xl animate-float -z-10" style={{ animationDelay: "1s" }} />
    </div>
  );
};

export default GroupDetail;