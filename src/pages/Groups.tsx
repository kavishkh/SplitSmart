import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Calendar, IndianRupee, TrendingUp, RefreshCw } from "lucide-react";
import { Header } from "@/components/Header";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { useGroups } from "@/hooks/use-groups";
import { useUser } from "@/hooks/use-user";

const Groups = () => {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { groups, isLoading, refreshGroups, createGroup } = useGroups();
  const { currentUser } = useUser();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshGroups();
    setIsRefreshing(false);
  };

  const handleCreateGroup = async (groupData: any) => {
    try {
      await createGroup(groupData);
      setShowCreateGroup(false);
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-lg text-muted-foreground">Loading groups...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
            <p className="text-muted-foreground">
              Manage your expense groups and track shared costs
            </p>
          </div>
          <Button onClick={() => setShowCreateGroup(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>

        {groups && groups.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              // Calculate user's balance in this group
              let userBalance = 0;
              if (currentUser) {
                // Find the current user in the group members
                const userInGroup = group.members.find(member => member.id === currentUser.id);
                if (userInGroup) {
                  // For simplicity, we're using the yourBalance field from the group
                  // In a real implementation, this would be calculated from expenses
                  userBalance = group.yourBalance || 0;
                }
              }
              
              return (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{group.name}</span>
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: group.color }}
                      />
                    </CardTitle>
                    {group.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {group.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="mr-2 h-4 w-4" />
                          <span>{group.members.length} members</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>{new Date(group.lastActivity).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Your balance:</span>
                          <span className={`font-semibold ${userBalance > 0 ? 'text-green-600' : userBalance < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {userBalance >= 0 ? '+' : ''}{userBalance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <Link to={`/groups/${group.id}`}>
                        <Button variant="outline" className="w-full">
                          <IndianRupee className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No groups yet</h3>
              <p className="mt-2 text-muted-foreground">
                Create your first group to start tracking shared expenses.
              </p>
              <Button 
                onClick={() => setShowCreateGroup(true)} 
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </CardContent>
          </Card>
        )}

        {showCreateGroup && (
          <CreateGroupModal 
            open={showCreateGroup} 
            onOpenChange={setShowCreateGroup}
            onCreateGroup={handleCreateGroup}
          />
        )}
      </div>
    </div>
  );
};

export default Groups;