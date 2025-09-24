import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { sendGroupInvitationEmail } from "@/services/emailService";

interface SendInvitationEmailProps {
  groupId: string;
  groupName: string;
  inviterName: string;
}

export function SendInvitationEmail({ groupId, groupName, inviterName }: SendInvitationEmailProps) {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Generate invitation link
  const generateInvitationLink = () => {
    return `${window.location.origin}/groups/${groupId}/join`;
  };

  // Send invitation email
  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    try {
      // Send the email using the existing email service
      const result = await sendGroupInvitationEmail({
        to: email,
        groupName,
        inviterName,
        invitationLink: generateInvitationLink()
      });

      if (result.success) {
        // Show success message
        if (result.message) {
          // This is a simulated response in development
          toast.info(`Invitation simulation: ${result.message}`);
        } else {
          // This is a real email sent in production
          toast.success(`Invitation sent to ${email}!`);
        }
        setSent(true);
        setEmail("");
        
        // Reset sent status after 3 seconds
        setTimeout(() => setSent(false), 3000);
      } else {
        throw new Error(result.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      // Show a more user-friendly error message
      if (error.message && error.message.includes('domain is not verified')) {
        toast.error("In development mode, emails can only be sent to the verified email address (kavishkhanna06@gmail.com). In production, you would need to verify a custom domain with Resend.");
      } else {
        toast.error(`Failed to send invitation: ${error.message || "Please try again"}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Group Invitation</CardTitle>
        <CardDescription>Invite others to join your group via email</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={sendInvitation} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSending || sent}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isSending || sent}
            className="w-full"
          >
            {sent ? (
              "Invitation Sent"
            ) : isSending ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2"></div>
                Sending...
              </>
            ) : (
              "Send Invitation"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}