import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardHeader 
} from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  MoreVertical, 
  Edit, 
  UserPlus, 
  Trash2 
} from "lucide-react";
import { useGroups } from "@/hooks/use-groups";
import { useUser } from "@/hooks/use-user";

const GroupCard = ({ group }: { group: any }) => {
  const { deleteGroup } = useGroups();
  const { currentUser } = useUser();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Constants for styling
  const isOwed = group.yourBalance > 0;
  const owes = group.yourBalance < 0;
  const isOwner = group.ownerId === (currentUser?.id || "current-user");
  const groupIconClass = `w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${group.color} shadow-sm`;
  const avatarWrapperClass = "w-6 h-6 border border-card ring-1 ring-border";
  const balancePositiveClass = "bg-gradient-success text-white";
  const balanceNegativeClass = "bg-gradient-to-r from-destructive to-warning text-white";
  
  // Filter members to only show accepted members
  const acceptedMembers = group.members ? group.members.filter((member: any) => member.status !== 'invited') : [];
  
  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(group.id);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
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
              <h3 className="font-semibold text-foreground truncate">{group.name || 'Unnamed Group'}</h3>
              <p className="text-xs text-muted-foreground flex items-center">
                <Calendar className="h-2.5 w-2.5 mr-1" />
                {group.lastActivity || 'No activity'}
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
            {acceptedMembers.slice(0, 4).map((member: any, index: number) => (
              <Avatar 
                key={member.id || index} 
                className={avatarWrapperClass}
                style={{ zIndex: acceptedMembers.length - index }}
              >
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="bg-gradient-accent text-accent-foreground text-xs font-medium">
                  {member.name ? member.name.charAt(0) : '?'}
                </AvatarFallback>
              </Avatar>
            ))}
            {acceptedMembers.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-muted border flex items-center justify-center text-xs font-medium text-muted-foreground">
                +{acceptedMembers.length - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {acceptedMembers.length} member{acceptedMembers.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Balance Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="font-medium text-sm">₹{(group.totalSpent || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-border/50">
          {(!group.yourBalance || group.yourBalance === 0) ? (
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
                {isOwed ? "+" : ""}₹{Math.abs(group.yourBalance || 0).toFixed(0)}
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
              Are you sure you want to delete "{group.name || 'this group'}"? This action cannot be undone.
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
  const { groups, isLoading } = useGroups();

  console.log('📊 GroupsGrid rendering with:', { groups, isLoading, searchQuery, filters }); // Debug log

  // Show loading state
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading groups...</p>
      </div>
    );
  }

  // Handle case where groups is undefined or null
  if (!groups) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-destructive/20 rounded-full flex items-center justify-center">
          <Users className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Error loading groups</h3>
        <p className="text-muted-foreground mb-4">There was an issue loading your groups. Please try refreshing the page.</p>
        {onCreateGroup && (
          <Button onClick={onCreateGroup} className="bg-gradient-primary hover:bg-gradient-primary/90">
            Create Your First Group
          </Button>
        )}
      </div>
    );
  }

  // Filter and sort groups based on search and filters
  const filteredGroups = groups
    .filter(group => {
      // Search filter
      if (searchQuery && !group.name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !group.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Balance filter
      if (filters.balanceFilter === "owed" && (group.yourBalance || 0) <= 0) return false;
      if (filters.balanceFilter === "owes" && (group.yourBalance || 0) >= 0) return false;
      if (filters.balanceFilter === "settled" && (group.yourBalance || 0) !== 0) return false;

      // Member count filter
      const memberCount = group.members ? group.members.length : 0;
      if (filters.memberCount === "small" && memberCount > 3) return false;
      if (filters.memberCount === "medium" && (memberCount <= 3 || memberCount > 6)) return false;
      if (filters.memberCount === "large" && memberCount <= 6) return false;

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "name":
          return (a.name || '').localeCompare(b.name || '');
        case "amount":
          return (b.totalSpent || 0) - (a.totalSpent || 0);
        case "balance":
          return Math.abs(b.yourBalance || 0) - Math.abs(a.yourBalance || 0);
        case "members":
          const aMemberCount = a.members ? a.members.length : 0;
          const bMemberCount = b.members ? b.members.length : 0;
          return bMemberCount - aMemberCount;
        case "recent":
        default:
          return new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime();
      }
    });

  console.log('🔍 Filtered groups count:', filteredGroups.length); // Debug log

  if (filteredGroups.length === 0 && searchQuery) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary/20 rounded-full flex items-center justify-center">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No groups found</h3>
        <p className="text-muted-foreground mb-4">Try adjusting your search or create a new group</p>
        {onCreateGroup && (
          <Button onClick={onCreateGroup}>
            Create New Group
          </Button>
        )}
      </div>
    );
  }

  if (filteredGroups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary/20 rounded-full flex items-center justify-center">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
        <p className="text-muted-foreground mb-4">Create your first group to start tracking expenses</p>
        {onCreateGroup && (
          <Button onClick={onCreateGroup} className="bg-gradient-primary hover:bg-gradient-primary/90">
            Create Your First Group
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredGroups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
};