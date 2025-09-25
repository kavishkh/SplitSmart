import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, Mail, Check, Users } from "lucide-react";
import { Group } from "@/hooks/use-groups";
import { sendGroupInvitationEmail } from "@/services/emailService";

interface GroupInvitationProps {
  group: Group;
  onInviteSent?: () => void;
}

export function GroupInvitation({ group, onInviteSent }: GroupInvitationProps) {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Generate invitation link for the group
  const generateInvitationLink = () => {
    return `${window.location.origin}/groups/${group.id}/join`;
  };

  // Copy invitation link to clipboard
  const copyInvitationLink = () => {
    const link = generateInvitationLink();
    navigator.clipboard.writeText(link).then(() => {
      toast.success("Invitation link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  // Send invitation via email (real implementation)
  const sendInvitationEmail = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    try {
      // Get current user name (in a real app, this would come from context)
      const inviterName = "A group member"; // Default value
      
      // Send the email using Resend
      const result = await sendGroupInvitationEmail({
        to: email,
        groupName: group.name,
        inviterName,
        invitationLink: generateInvitationLink()
      });

      if (result.success) {
        // Show success message
        toast.success(`Invitation sent to ${email}!`);
        setSent(true);
        setEmail("");
        
        // Reset sent status after 3 seconds
        setTimeout(() => setSent(false), 3000);
        
        // Callback if provided
        if (onInviteSent) onInviteSent();
      } else {
        throw new Error(result.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error(`Failed to send invitation: ${error.message || "Please try again"}`);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key press in email input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendInvitationEmail();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Invite Members
        </CardTitle>
        <CardDescription>
          Share this link with others to invite them to join "{group.name}"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invitation Link Section */}
        <div className="space-y-2">
          <Label>Invitation Link</Label>
          <div className="flex gap-2">
            <Input 
              value={generateInvitationLink()} 
              readOnly 
              className="flex-1"
            />
            <Button 
              onClick={copyInvitationLink}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Anyone with this link can join the group
          </p>
        </div>

        {/* Email Invitation Section */}
        <div className="space-y-2">
          <Label>Send via Email</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={sendInvitationEmail}
              disabled={isSending || sent}
              className="shrink-0"
            >
              {sent ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Sent
                </>
              ) : isSending ? (
                "Sending..."
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Send an email invitation directly to a member
          </p>
        </div>
      </CardContent>
    </Card>
  );
}