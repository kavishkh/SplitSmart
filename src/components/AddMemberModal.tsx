import { useState, useEffect } from "react";
import { UserPlus, AlertCircle, Check } from "lucide-react";
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

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMembers: (members: Member[]) => void;
  existingMembers: Member[];
}

export const AddMemberModal = ({ open, onOpenChange, onAddMembers, existingMembers }: AddMemberModalProps) => {
  const [membersToAdd, setMembersToAdd] = useState<Member[]>([]);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");

  // Real-time email validation
  useEffect(() => {
    if (memberEmail.trim()) {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(memberEmail.trim())) {
        setEmailError("Please enter a valid email address");
        return;
      }
      
      // Check for duplicate email in existing members
      const isDuplicateExisting = existingMembers.some(member => 
        member.email.toLowerCase() === memberEmail.trim().toLowerCase()
      );
      if (isDuplicateExisting) {
        setEmailError("This email is already in the group");
        return;
      }
      
      // Check for duplicate email in members to add
      const isDuplicateToAdd = membersToAdd.some(member => 
        member.email.toLowerCase() === memberEmail.trim().toLowerCase()
      );
      if (isDuplicateToAdd) {
        setEmailError("This email is already added to the list");
        return;
      }
      
      setEmailError("");
    } else {
      setEmailError("");
    }
  }, [memberEmail, existingMembers, membersToAdd]);

  // Real-time name validation
  useEffect(() => {
    if (memberName.trim()) {
      if (memberName.trim().length < 2) {
        setNameError("Name must be at least 2 characters long");
        return;
      }
      
      // Check for duplicate name in existing members
      const isDuplicateExisting = existingMembers.some(member => 
        member.name.toLowerCase() === memberName.trim().toLowerCase()
      );
      if (isDuplicateExisting) {
        setNameError("This name is already used in the group");
        return;
      }
      
      // Check for duplicate name in members to add
      const isDuplicateToAdd = membersToAdd.some(member => 
        member.name.toLowerCase() === memberName.trim().toLowerCase()
      );
      if (isDuplicateToAdd) {
        setNameError("This name is already added to the list");
        return;
      }
      
      setNameError("");
    } else {
      setNameError("");
    }
  }, [memberName, existingMembers, membersToAdd]);

  // Handle Enter key press to add member
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !nameError && !emailError && memberName.trim() && memberEmail.trim()) {
      e.preventDefault();
      handleAddMemberToList();
    }
  };

  const handleAddMemberToList = () => {
    // Validate name
    if (!memberName.trim()) {
      setNameError("Please enter a name");
      return;
    }
    if (memberName.trim().length < 2) {
      setNameError("Name must be at least 2 characters long");
      return;
    }
    
    // Validate email
    if (!memberEmail.trim()) {
      setEmailError("Please enter an email address");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(memberEmail.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    // Check for duplicate email in existing members
    const isDuplicateExisting = existingMembers.some(member => 
      member.email.toLowerCase() === memberEmail.trim().toLowerCase()
    );
    if (isDuplicateExisting) {
      setEmailError("This email is already in the group");
      return;
    }
    
    // Check for duplicate email in members to add
    const isDuplicateToAdd = membersToAdd.some(member => 
      member.email.toLowerCase() === memberEmail.trim().toLowerCase()
    );
    if (isDuplicateToAdd) {
      setEmailError("This email is already added to the list");
      return;
    }
    
    // Check for duplicate name in existing members
    const isDuplicateExistingName = existingMembers.some(member => 
      member.name.toLowerCase() === memberName.trim().toLowerCase()
    );
    if (isDuplicateExistingName) {
      setNameError("This name is already used in the group");
      return;
    }
    
    // Check for duplicate name in members to add
    const isDuplicateToAddName = membersToAdd.some(member => 
      member.name.toLowerCase() === memberName.trim().toLowerCase()
    );
    if (isDuplicateToAddName) {
      setNameError("This name is already added to the list");
      return;
    }

    const newMember: Member = {
      id: Date.now().toString(),
      name: memberName.trim(),
      email: memberEmail.trim().toLowerCase(),
    };

    setMembersToAdd([...membersToAdd, newMember]);
    setMemberName("");
    setMemberEmail("");
    setNameError("");
    setEmailError("");
    toast.success(`${newMember.name} added to list! 🎉`);
  };

  const handleRemoveMember = (memberId: string) => {
    const memberToRemove = membersToAdd.find(member => member.id === memberId);
    setMembersToAdd(membersToAdd.filter(member => member.id !== memberId));
    
    if (memberToRemove) {
      toast.success(`${memberToRemove.name} removed from list`);
    }
  };

  const handleAddMembers = () => {
    if (membersToAdd.length === 0) {
      toast.error("Please add at least one member");
      return;
    }

    onAddMembers(membersToAdd);

    // Reset form
    setMembersToAdd([]);
    setMemberName("");
    setMemberEmail("");
    setNameError("");
    setEmailError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-full md:max-w-lg mx-auto max-h-[90vh] overflow-y-auto dialog-content">
        <DialogHeader className="dialog-header">
          <DialogTitle className="flex items-center space-x-2 text-lg dialog-title">
            <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center">
              <UserPlus className="h-3 w-3 text-primary-foreground" />
            </div>
            <span>Add Members to Group</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Add new members to your existing group
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Add Member Form */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label htmlFor="memberName" className="text-sm">Name *</Label>
                <Input
                  id="memberName"
                  placeholder="Name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className={`py-5 input-field ${nameError ? "border-destructive" : ""}`}
                />
                {nameError && (
                  <p className="text-destructive text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {nameError}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="memberEmail" className="text-sm">Email *</Label>
                <Input
                  id="memberEmail"
                  placeholder="Email"
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className={`py-5 input-field ${emailError ? "border-destructive" : ""}`}
                />
                {emailError && (
                  <p className="text-destructive text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {emailError}
                  </p>
                )}
              </div>
            </div>
            <Button 
              onClick={handleAddMemberToList}
              disabled={!memberName.trim() || !memberEmail.trim() || !!nameError || !!emailError}
              variant="outline"
              size="sm"
              className="w-full py-5 button-secondary"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add to List
            </Button>
          </div>

          {/* Members to Add List */}
          {membersToAdd.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Members to Add</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {membersToAdd.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/10 card"
                  >
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="h-8 w-8"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Members Summary */}
          <div className="bg-gradient-primary/10 p-3 rounded-lg border border-primary/20 card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Group Members</span>
              <span className="text-sm">{existingMembers.length}</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {existingMembers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {existingMembers.slice(0, 3).map((member) => (
                    <span key={member.id} className="bg-background px-2 py-1 rounded">
                      {member.name}
                    </span>
                  ))}
                  {existingMembers.length > 3 && (
                    <span className="bg-background px-2 py-1 rounded">
                      +{existingMembers.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-end pt-2">
          <div className="flex space-x-2 w-full">
            <Button variant="outline" className="flex-1 py-5 text-sm button-secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMembers}
              disabled={membersToAdd.length === 0}
              className="flex-1 py-5 text-sm button-primary"
            >
              <Check className="h-4 w-4 mr-1" />
              Add Members
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

