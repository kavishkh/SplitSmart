import { useState, useEffect } from "react";
import { Users, Plus, Trash2, UserPlus, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";

interface Member {
  id: string;
  name: string;
  email: string;
}

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (group: {
    name: string;
    description: string;
    members: Member[];
    color: string;
  }) => void;
}

const groupColors = [
  "from-blue-500 to-purple-600",
  "from-green-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
  "from-yellow-500 to-orange-600",
  "from-purple-500 to-pink-600",
  "from-teal-500 to-green-600",
];

export const CreateGroupModal = ({ open, onOpenChange, onCreateGroup }: CreateGroupModalProps) => {
  const { currentUser } = useUser();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(groupColors[0]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");

  // Initialize with current user when modal opens
  useEffect(() => {
    if (open) {
      setMembers([{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
      }]);
    }
  }, [open, currentUser]);

  // Real-time email validation
  useEffect(() => {
    if (memberEmail.trim()) {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(memberEmail.trim())) {
        setEmailError("Please enter a valid email address");
        return;
      }
      
      // Check for duplicate email
      const isDuplicate = members.some(member => 
        member.email.toLowerCase() === memberEmail.trim().toLowerCase()
      );
      if (isDuplicate) {
        setEmailError("This email is already added to the group");
        return;
      }
      
      setEmailError("");
    } else {
      setEmailError("");
    }
  }, [memberEmail, members]);

  // Real-time name validation
  useEffect(() => {
    if (memberName.trim()) {
      if (memberName.trim().length < 2) {
        setNameError("Name must be at least 2 characters long");
        return;
      }
      setNameError("");
    } else {
      setNameError("");
    }
  }, [memberName]);

  // Handle Enter key press to add member
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !nameError && !emailError && memberName.trim() && memberEmail.trim()) {
      e.preventDefault();
      handleAddMember();
    }
  };

  const handleAddMember = () => {
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
    
    // Check for duplicate email (case-insensitive)
    const isDuplicate = members.some(member => 
      member.email.toLowerCase() === memberEmail.trim().toLowerCase()
    );
    if (isDuplicate) {
      setEmailError("This email is already added to the group");
      return;
    }
    
    // Check for duplicate name
    const isDuplicateName = members.some(member => 
      member.name.toLowerCase() === memberName.trim().toLowerCase()
    );
    if (isDuplicateName) {
      setNameError("This name is already used in the group");
      return;
    }

    const newMember: Member = {
      id: Date.now().toString(),
      name: memberName.trim(),
      email: memberEmail.trim().toLowerCase(),
    };

    setMembers([...members, newMember]);
    setMemberName("");
    setMemberEmail("");
    setNameError("");
    setEmailError("");
    toast.success(`${newMember.name} added successfully! 🎉`);
  };

  const handleRemoveMember = (memberId: string) => {
    if (memberId === currentUser.id) {
      toast.error("You cannot remove yourself from the group");
      return;
    }
    
    const memberToRemove = members.find(member => member.id === memberId);
    setMembers(members.filter(member => member.id !== memberId));
    
    if (memberToRemove) {
      toast.success(`${memberToRemove.name} removed successfully`);
    }
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (members.length < 2) {
      toast.error("A group must have at least 2 members");
      return;
    }

    onCreateGroup({
      name: groupName.trim(),
      description: description.trim(),
      members,
      color: selectedColor,
    });

    // Reset form
    setGroupName("");
    setDescription("");
    setSelectedColor(groupColors[0]);
    setMembers([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-full md:max-w-lg mx-auto max-h-[90vh] overflow-y-auto dialog-content">
        <DialogHeader className="dialog-header">
          <DialogTitle className="flex items-center space-x-2 text-lg dialog-title">
            <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center">
              <Users className="h-3 w-3 text-primary-foreground" />
            </div>
            <span>Create New Group</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Create a group to split expenses with friends and family
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm">Group Name *</Label>
            <Input
              id="groupName"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="py-5 input-field"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description for your group (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[60px] input-field"
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label className="text-sm">Group Color</Label>
            <div className="flex flex-wrap gap-2">
              {groupColors.map((color) => (
                <div
                  key={color}
                  className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${
                    selectedColor === color ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${color.includes("blue") ? "#3b82f6" : 
                      color.includes("green") ? "#10b981" : 
                      color.includes("orange") ? "#f97316" : 
                      color.includes("pink") ? "#ec4899" : 
                      color.includes("indigo") ? "#6366f1" : 
                      color.includes("yellow") ? "#eab308" : 
                      color.includes("purple") ? "#8b5cf6" : 
                      color.includes("teal") ? "#14b8a6" : "#3b82f6"} 0%, ${
                      color.includes("purple") ? "#8b5cf6" : 
                      color.includes("teal") ? "#0d9488" : 
                      color.includes("red") ? "#dc2626" : 
                      color.includes("rose") ? "#e11d48" : 
                      color.includes("blue") ? "#6366f1" : 
                      color.includes("orange") ? "#ea580c" : 
                      color.includes("pink") ? "#db2777" : 
                      color.includes("green") ? "#059669" : "#8b5cf6"} 100%)`
                  }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Members Section */}
          <div className="space-y-3">
            <Label className="text-sm">Members</Label>
            
            {/* Add Member Form */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Input
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
                  <Input
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
                onClick={handleAddMember}
                disabled={!memberName.trim() || !memberEmail.trim() || !!nameError || !!emailError}
                variant="outline"
                size="sm"
                className="w-full py-5 button-secondary"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            {/* Members List */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {members.map((member) => (
                <div 
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/10 card"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  {member.id === currentUser.id ? (
                    <Badge variant="secondary" className="text-xs py-0.5 badge">
                      You
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-primary/10 p-3 rounded-lg border border-primary/20 card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Total Members</span>
              </div>
              <Badge variant="secondary" className="badge">{members.length}</Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-end pt-2">
          <div className="flex space-x-2 w-full">
            <Button variant="outline" className="flex-1 py-5 text-sm button-secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || members.length < 2}
              className="flex-1 py-5 text-sm button-primary"
            >
              <Check className="h-4 w-4 mr-1" />
              Create Group
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};