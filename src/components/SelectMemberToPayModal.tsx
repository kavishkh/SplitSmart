import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, IndianRupee } from "lucide-react";
import { toast } from "sonner";

interface SelectMemberToPayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  members: any[];
  currentUser: any;
  onMemberSelected: (memberId: string, amount: number) => void;
  suggestedAmount?: number;
}

export const SelectMemberToPayModal = ({ 
  open, 
  onOpenChange, 
  groupId,
  groupName,
  members,
  currentUser,
  onMemberSelected,
  suggestedAmount = 0
}: SelectMemberToPayModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [amount, setAmount] = useState(suggestedAmount.toString());
  
  // Filter members based on search query and exclude current user
  const filteredMembers = members.filter(member => 
    member.id !== currentUser?.id &&
    (member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     member.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectMember = (memberId: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    onMemberSelected(memberId, parseFloat(amount));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-full md:max-w-md mx-auto dialog-content">
        <DialogHeader className="dialog-header">
          <DialogTitle className="text-lg dialog-title">Select Member to Pay</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
          {/* Group Info */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 card">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  {groupName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{groupName}</p>
                  <p className="text-xs text-muted-foreground">Select member to settle with</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount *</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-base font-semibold py-5 input-field"
              />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 input-field"
            />
          </div>

          {/* Members List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {searchQuery ? "No members found" : "No members available"}
              </p>
            ) : (
              filteredMembers.map((member) => (
                <Card 
                  key={member.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors card"
                  onClick={() => handleSelectMember(member.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-sm">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{member.name}</p>
                        {member.email && (
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Cancel Button */}
          <Button 
            variant="outline" 
            className="w-full py-5 text-sm button-secondary" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};