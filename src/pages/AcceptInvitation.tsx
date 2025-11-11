import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, UserPlus, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGroups } from "@/hooks/use-groups";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getGroupById, refreshGroups } = useGroups();
  const { currentUser } = useUser();
  const [group, setGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const groupId = searchParams.get("groupId");
  const email = searchParams.get("email");

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        if (!groupId || !email) {
          setError("Invalid invitation link");
          return;
        }

        // Refresh groups to get the latest data
        await refreshGroups();
        
        const foundGroup = getGroupById(groupId);
        if (!foundGroup) {
          setError("Group not found");
          return;
        }

        // Check if the email matches an invited member
        const invitedMember = foundGroup.members.find(
          (member: any) => member.email === email && member.status === 'invited'
        );

        if (!invitedMember) {
          // Check if already accepted
          const acceptedMember = foundGroup.members.find(
            (member: any) => member.email === email && member.status === 'accepted'
          );
          
          if (acceptedMember) {
            setSuccess(true);
            setGroup(foundGroup);
            return;
          }
          
          setError("Invitation not found or already accepted");
          return;
        }

        setGroup(foundGroup);
      } catch (err) {
        setError("Failed to load invitation information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroup();
  }, [groupId, email, getGroupById, refreshGroups]);

  const handleAcceptInvitation = async () => {
    if (!group || !email || !currentUser) return;

    setIsAccepting(true);
    try {
      // In a real implementation, you would call an API endpoint to accept the invitation
      // For now, we'll simulate this with a toast message
      toast.success(`You've accepted the invitation to "${group.name}"!`);
      setSuccess(true);
      
      // Refresh groups to show updated status
      await refreshGroups();
      
      // Navigate to the group after a short delay
      setTimeout(() => {
        navigate(`/groups/${group.id}`);
      }, 2000);
    } catch (error) {
      toast.error("Failed to accept invitation");
    } finally {
      setIsAccepting(false);
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
          <p>Loading invitation...</p>
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto mt-20">
            <Card className="text-center animate-slide-up">
              <CardHeader>
                <div className="mx-auto mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Invitation Accepted!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  You are now a member of <strong>{group?.name}</strong>.
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to the group page...
                </p>
                <Button 
                  onClick={() => navigate(`/groups/${group?.id}`)}
                  className="w-full"
                >
                  Go to Group
                </Button>
              </CardContent>
            </Card>
          </div>
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
                    {group?.members.filter((m: any) => m.status === 'accepted').slice(0, 5).map((member: any) => (
                      <div key={member.id} className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xs">
                        {member.name.charAt(0)}
                      </div>
                    ))}
                    {group?.members.filter((m: any) => m.status === 'accepted').length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                        +{group.members.filter((m: any) => m.status === 'accepted').length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">{email}</span> has been invited to join this group.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleAcceptInvitation}
                  disabled={isAccepting}
                  className="w-full py-6 text-lg"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Accepting Invitation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Accept Invitation
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
                <p>By accepting this invitation, you'll be able to:</p>
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

export default AcceptInvitation;