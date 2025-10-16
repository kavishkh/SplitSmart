import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, XCircle, UserPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGroups } from "@/hooks/use-groups";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

const JoinGroup = () => {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const { getGroupById, updateGroup } = useGroups();
  const { currentUser } = useUser();
  const [group, setGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        if (!groupId) {
          setError("Invalid group invitation");
          return;
        }

        const foundGroup = getGroupById(groupId);
        if (!foundGroup) {
          setError("Group not found");
          return;
        }

        setGroup(foundGroup);
      } catch (err) {
        setError("Failed to load group information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroup();
  }, [groupId, getGroupById]);

  const handleJoinGroup = async () => {
    if (!group || !currentUser) return;

    setIsJoining(true);
    try {
      // Check if user is already in the group
      const isAlreadyMember = group.members.some(
        (member: any) => member.id === currentUser.id
      );

      if (isAlreadyMember) {
        toast.info("You are already a member of this group");
        navigate(`/groups/${group.id}`);
        return;
      }

      // Add current user to group members
      const updatedMembers = [
        ...group.members,
        {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
        },
      ];

      // Update the group with new member
      updateGroup(group.id, { members: updatedMembers });

      toast.success(`You've joined "${group.name}" successfully!`);
      navigate(`/groups/${group.id}`);
    } catch (error) {
      toast.error("Failed to join group");
    } finally {
      setIsJoining(false);
    }
  };

  const handleGoBack = () => {
    navigate("/groups");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading group information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto mt-20">
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-destructive">
                <XCircle className="h-8 w-8 mr-2" />
                <span>Invalid Invitation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-6 text-muted-foreground">{error}</p>
              <Button onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Groups
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto mt-10">
          <Card className="animate-slide-up">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto"
                  style={{ 
                    background: `linear-gradient(135deg, ${group?.color || 'from-blue-500 to-purple-600'})` 
                  }}
                >
                  <UserPlus className="h-8 w-8" />
                </div>
              </div>
              <CardTitle className="text-2xl">Group Invitation</CardTitle>
              <p className="text-muted-foreground">
                You've been invited to join a group
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">{group?.name}</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  {group?.description}
                </p>
                
                {/* Group Members Preview */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Members</p>
                  <div className="flex justify-center space-x-2">
                    {group?.members.slice(0, 5).map((member: any) => (
                      <Avatar key={member.id} className="w-8 h-8 border-2 border-background">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {group?.members.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                        +{group.members.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleJoinGroup}
                  disabled={isJoining}
                  className="w-full py-6 text-lg"
                >
                  {isJoining ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                      Joining Group...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      Join Group
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleGoBack}
                  className="w-full py-6"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Groups
                </Button>
              </div>
              
              <div className="text-center text-xs text-muted-foreground">
                <p>By joining this group, you'll be able to:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Add and view group expenses</li>
                  <li>• Split costs with other members</li>
                  <li>• Settle payments between members</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JoinGroup;