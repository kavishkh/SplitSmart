import { Users, MoreVertical, Calendar, DollarSign, Trash2, Edit, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Link } from "react-router-dom";
import { useGroups } from "@/hooks/use-groups";
import type { Group } from "@/hooks/use-groups";
import { useState } from "react";

const GroupCard = ({ group }: { group: Group }) => {
  const { deleteGroup } = useGroups();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Constants for styling
  const isOwed = group.yourBalance > 0;
  const owes = group.yourBalance < 0;
  const isOwner = group.ownerId === "current-user";
  const groupIconClass = `w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${group.color} shadow-sm`;
  const avatarWrapperClass = "w-6 h-6 border border-card ring-1 ring-border";
  const balancePositiveClass = "bg-gradient-success text-white";
  const balanceNegativeClass = "bg-gradient-to-r from-destructive to-warning text-white";
  
  const handleDeleteGroup = () => {
    deleteGroup(group.id);
    setShowDeleteDialog(false);
  };

  return (
    <Card className="card-interactive hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Link to={`/groups/${group.id}`} className="flex items-center space-x-2 flex-1">
            <div className={groupIconClass}>
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{group.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center">
                <Calendar className="h-2.5 w-2.5 mr-1" />
                {group.lastActivity}
              </p>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>
                <Edit className="h-3 w-3 mr-2" />
                Edit Group
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserPlus className="h-3 w-3 mr-2" />
                Add Member
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isOwner && (
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete Group
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        {/* Member Avatars */}
        <div className="flex items-center space-x-1 mb-3">
          <div className="flex -space-x-1">
            {group.members.slice(0, 4).map((member, index) => (
              <Avatar 
                key={member.id} 
                className={avatarWrapperClass}
                style={{ zIndex: group.members.length - index }}
              >
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="bg-gradient-accent text-accent-foreground text-xs font-medium">
                  {member.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {group.members.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-muted border flex items-center justify-center text-xs font-medium text-muted-foreground">
                +{group.members.length - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Balance Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="font-medium text-sm">₹{group.totalSpent.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-border/50">
          {group.yourBalance === 0 ? (
            <Badge variant="outline" className="w-full justify-center py-1 text-xs">
              Settled up! 🎉
            </Badge>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Your balance:</span>
              <Badge 
                variant={isOwed ? "default" : "destructive"}
                className={`text-xs py-0.5 ${isOwed ? balancePositiveClass : balanceNegativeClass}`}
              >
                {isOwed ? "+" : ""}₹{Math.abs(group.yourBalance).toFixed(0)}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
    </Card>
  );
};

export const GroupsGrid = ({ 
  onCreateGroup,
  searchQuery = "",
  filters = { sortBy: "recent", balanceFilter: "all", memberCount: "all" }
}: { 
  onCreateGroup?: () => void;
  searchQuery?: string;
  filters?: {
    sortBy: string;
    balanceFilter: string;
    memberCount: string;
  };
}) => {
  const { groups } = useGroups();

  console.log('📊 GroupsGrid rendering with:', { groups, searchQuery, filters }); // Debug log

  // Filter and sort groups based on search and filters
  const filteredGroups = groups
    .filter(group => {
      // Search filter
      if (searchQuery && !group.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !group.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Balance filter
      if (filters.balanceFilter === "owed" && group.yourBalance <= 0) return false;
      if (filters.balanceFilter === "owes" && group.yourBalance >= 0) return false;
      if (filters.balanceFilter === "settled" && group.yourBalance !== 0) return false;

      // Member count filter
      if (filters.memberCount === "small" && group.members.length > 3) return false;
      if (filters.memberCount === "medium" && (group.members.length <= 3 || group.members.length > 6)) return false;
      if (filters.memberCount === "large" && group.members.length <= 6) return false;

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "amount":
          return b.totalSpent - a.totalSpent;
        case "balance":
          return Math.abs(b.yourBalance) - Math.abs(a.yourBalance);
        case "members":
          return b.members.length - a.members.length;
        case "recent":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  console.log('🔍 Filtered groups count:', filteredGroups.length); // Debug log

  if (filteredGroups.length === 0 && searchQuery) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary/20 rounded-full flex items-center justify-center">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No groups found</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          No groups match your search "{searchQuery}". Try adjusting your search terms.
        </p>
      </div>
    );
  }

  if (filteredGroups.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary/20 rounded-full flex items-center justify-center">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No groups yet</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Create your first group to start splitting expenses.
        </p>
        <Button size="sm" className="h-8 px-4" onClick={onCreateGroup}>
          <Users className="h-3 w-3 mr-1" />
          Create Group
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Your Groups ({filteredGroups.length})</h2>
        <Button size="sm" className="h-8 px-4" onClick={onCreateGroup}>
          <Users className="h-3 w-3 mr-1" />
          Create
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group, index) => (
          <div 
            key={group.id} 
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <GroupCard group={group} />
          </div>
        ))}
      </div>
    </div>
  );
};
