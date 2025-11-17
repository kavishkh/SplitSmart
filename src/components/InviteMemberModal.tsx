import { useState, useMemo } from "react";
import { UserPlus, Copy, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { groupAPI } from "@/services/api.js";

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  ownerId: string;
}

export const InviteMemberModal = ({ open, onOpenChange, groupId, groupName, ownerId }: InviteMemberModalProps) => {
  const [email, setEmail] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { currentUser } = useUser();
  
  // Generate invite link using useMemo so it's recalculated when dependencies change
  const inviteLink = useMemo(() => {
    return `${window.location.origin}/accept?groupId=${groupId}&email=${encodeURIComponent(email || '')}`;
  }, [groupId, email]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setIsCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  const handleSendInvite = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    try {
      // Send invitation email via API (using the same inviteLink generated above)
      await groupAPI.sendInvitation({
        to: email,
        memberName: email.split('@')[0], // Use part before @ as name
        groupName: groupName,
        inviterName: currentUser?.name || 'A SplitSmart user',
        invitationLink: inviteLink
      });

      toast.success(`Invitation sent to ${email}!`);
      setEmail("");
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || "Failed to send invitation. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email) {
      handleSendInvite();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-full md:max-w-md mx-auto dialog-content">
        <DialogHeader className="dialog-header">
          <DialogTitle className="flex items-center space-x-2 text-lg dialog-title">
            <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center">
              <UserPlus className="h-3 w-3 text-primary-foreground" />
            </div>
            <span>Invite Members</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Invite members to join "{groupName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Email Invitation */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Send via Email</Label>
            <div className="flex space-x-2">
              <Input
                id="email"
                placeholder="friend@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="py-5 input-field flex-1"
              />
              <Button 
                onClick={handleSendInvite}
                disabled={!email || isSending}
                className="py-5 px-4 button-primary"
              >
                {isSending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                ) : (
                  <Mail className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              We'll send an email invitation to join the group
            </p>
          </div>

          {/* Share Link */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Share Invite Link</Label>
            <div className="flex space-x-2">
              <Input
                value={inviteLink}
                readOnly
                className="py-5 input-field flex-1 text-xs"
              />
              <Button 
                onClick={handleCopyLink}
                variant="outline"
                className="py-5 px-4 button-secondary"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can join the group
            </p>
          </div>

          {/* QR Code Option (Placeholder) */}
          <div className="space-y-2 p-3 bg-muted/10 rounded-lg border">
            <Label className="text-sm font-medium">QR Code</Label>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Scan QR code to join (coming soon)
              </p>
              <div className="w-12 h-12 bg-gradient-primary rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">QR</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-end pt-2">
          <Button variant="outline" className="py-5 text-sm button-secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};