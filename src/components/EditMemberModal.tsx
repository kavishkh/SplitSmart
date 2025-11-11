import { useState } from "react";
import { User, Save, X } from "lucide-react";
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

interface Member {
  id: string;
  name: string;
  email: string;
}

interface EditMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
  onSave: (updatedMember: Member) => void;
}

export const EditMemberModal = ({ open, onOpenChange, member, onSave }: EditMemberModalProps) => {
  // Add safety checks for member object
  const safeMember = member || {
    id: "",
    name: "",
    email: ""
  };

  const [name, setName] = useState(safeMember.name || "");
  const [email, setEmail] = useState(safeMember.email || "");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateForm = () => {
    let isValid = true;
    
    // Validate name
    if (!name.trim()) {
      setNameError("Please enter a name");
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError("Name must be at least 2 characters long");
      isValid = false;
    } else {
      setNameError("");
    }
    
    // Validate email
    if (!email.trim()) {
      setEmailError("Please enter an email address");
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError("Please enter a valid email address");
        isValid = false;
      } else {
        setEmailError("");
      }
    }
    
    return isValid;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    
    onSave({
      id: safeMember.id || "",
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });
    
    toast.success("Member updated successfully!");
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !nameError && !emailError) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-full md:max-w-md mx-auto dialog-content">
        <DialogHeader className="dialog-header">
          <DialogTitle className="flex items-center space-x-2 text-lg dialog-title">
            <User className="h-5 w-5 text-primary" />
            <span>Edit Member</span>
          </DialogTitle>
          <DialogDescription>
            Update the member's information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">Name *</Label>
            <Input
              id="name"
              placeholder="Enter member's name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`py-5 input-field ${nameError ? "border-destructive" : ""}`}
            />
            {nameError && (
              <p className="text-destructive text-xs mt-1">
                {nameError}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter member's email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`py-5 input-field ${emailError ? "border-destructive" : ""}`}
            />
            {emailError && (
              <p className="text-destructive text-xs mt-1">
                {emailError}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-end pt-2">
          <div className="flex space-x-2 w-full">
            <Button 
              variant="outline" 
              className="flex-1 py-5 text-sm button-secondary" 
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1 py-5 text-sm button-primary"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};