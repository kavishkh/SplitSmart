import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useGroups } from "@/hooks/use-groups";
import { useUser } from "@/hooks/use-user";
import { Users, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export function GroupInvitationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getGroupById, refreshGroups } = useGroups();
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        // Refresh groups to get the latest data
        await refreshGroups();
        
        // Get the group by ID
        const foundGroup = getGroupById(id || "");
        if (foundGroup) {
          setGroup(foundGroup);
          
          // Check if current user is already a member
          const memberExists = foundGroup.members.some(
            (member: any) => member.email === currentUser?.email
          );
          setIsMember(memberExists);
        } else {
          toast.error("Group not found");
        }
      } catch (error) {
        console.error("Error fetching group:", error);
        toast.error("Failed to load group information");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGroup();
    }
  }, [id, getGroupById, refreshGroups, currentUser?.email]);

  const handleJoinGroup = async () => {
    if (!group || !currentUser) return;
    
    setJoining(true);
    try {
      // In a real implementation, this would call an API to add the user to the group
      // For now, we'll just show a success message and redirect to the group page
      
      toast.success(`You've successfully joined "${group.name}"!`);
      setTimeout(() => {
        navigate(`/groups/${group.id}`);
      }, 1500);
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error("Failed to join group. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading group information...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <div className="mx-auto bg-destructive/10 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-center">Group Not Found</CardTitle>
              <CardDescription className="text-center">
                The invitation link is invalid or the group no longer exists.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate("/groups")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Groups
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto bg-gradient-primary p-3 rounded-full w-16 h-16 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl mt-4">Group Invitation</CardTitle>
              <CardDescription>
                You've been invited to join the group "{group.name}"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{group.name}</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  {group.description || "No description provided"}
                </p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{group.members.length} members</span>
                </div>
              </div>

              {isMember ? (
                <div className="text-center py-4">
                  <div className="mx-auto bg-success/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Already a Member</h3>
                  <p className="text-muted-foreground mb-4">
                    You're already part of this group.
                  </p>
                  <Button onClick={() => navigate(`/groups/${group.id}`)}>
                    Go to Group
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground mb-6">
                    Click below to join this group and start sharing expenses with other members.
                  </p>
                  <Button 
                    onClick={handleJoinGroup} 
                    disabled={joining}
                    className="w-full max-w-xs"
                  >
                    {joining ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2"></div>
                        Joining...
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Join Group
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/groups")}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Groups
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}