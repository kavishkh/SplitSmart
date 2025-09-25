import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendSettlementReminderEmail } from "@/services/emailService";

interface SettlementReminderProps {
  debtorEmail: string;
  debtorName: string;
  creditorName: string;
  amount: number;
  groupName: string;
  groupId: string;
  onReminderSent?: () => void;
  isSettled?: boolean;
}

export function SettlementReminder({
  debtorEmail,
  debtorName,
  creditorName,
  amount,
  groupName,
  groupId,
  onReminderSent,
  isSettled = false
}: SettlementReminderProps) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Generate settlement link
  const generateSettlementLink = () => {
    return `${window.location.origin}/groups/${groupId}`;
  };

  // Send settlement reminder email
  const sendReminderEmail = async () => {
    if (!debtorEmail) {
      toast.error("No email address provided");
      return;
    }

    if (amount <= 0) {
      toast.error("No amount owed");
      return;
    }

    setIsSending(true);
    try {
      // Send the email using Resend
      const result = await sendSettlementReminderEmail({
        to: debtorEmail,
        fromName: debtorName,
        amount: amount,
        groupName: groupName,
        settlementLink: generateSettlementLink()
      });

      if (result.success) {
        // Show success message
        if (result.message) {
          // This is a simulated response in development
          toast.info(`Reminder simulation: ${result.message}`);
        } else {
          // This is a real email sent in production
          toast.success(`Reminder sent to ${debtorName}!`);
        }
        setSent(true);
        
        // Reset sent status after 3 seconds
        setTimeout(() => setSent(false), 3000);
        
        // Callback if provided
        if (onReminderSent) onReminderSent();
      } else {
        throw new Error(result.error || "Failed to send reminder");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      // Show a more user-friendly error message
      if (error.message && error.message.includes('domain is not verified')) {
        toast.error("In development mode, emails can only be sent to the verified email address (kavishkhanna06@gmail.com). In production, you would need to verify a custom domain with Resend.");
      } else {
        toast.error(`Failed to send reminder: ${error.message || "Please try again"}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Don't show the button if the amount is settled or zero
  if (isSettled || amount <= 0) {
    return null;
  }

  return (
    <Button
      onClick={sendReminderEmail}
      disabled={isSending || sent}
      variant="outline"
      size="sm"
    >
      {sent ? (
        "Sent"
      ) : isSending ? (
        "Sending..."
      ) : (
        "Remind"
      )}
    </Button>
  );
}