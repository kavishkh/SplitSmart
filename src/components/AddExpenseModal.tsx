import { useState } from "react";
import { Plus, Receipt, Users, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useGroups } from "@/hooks/use-groups";
import { useExpenses } from "@/hooks/use-expenses";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedGroupId?: string;
}

export const AddExpenseModal = ({ open, onOpenChange, preselectedGroupId }: AddExpenseModalProps) => {
  const { groups } = useGroups();
  const { addExpense } = useExpenses();
  const { currentUser } = useUser();
  
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(preselectedGroupId || "");
  const [selectedMembers, setSelectedMembers] = useState([currentUser?.id || "current-user"]);

  // Get members from selected group
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const availableMembers = selectedGroup ? selectedGroup.members : [];

  const categories = [
    { id: "food", name: "Food & Dining", icon: "🍽️" },
    { id: "transport", name: "Transportation", icon: "🚗" },
    { id: "entertainment", name: "Entertainment", icon: "🎬" },
    { id: "utilities", name: "Utilities", icon: "💡" },
    { id: "shopping", name: "Shopping", icon: "🛍️" },
    { id: "other", name: "Other", icon: "📄" }
  ];

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const calculateSplit = () => {
    const total = parseFloat(amount) || 0;
    const count = selectedMembers.length;
    return count > 0 ? (total / count).toFixed(2) : "0.00";
  };

  const handleSubmit = () => {
    if (!amount || !description || !selectedGroupId || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member to split with");
      return;
    }

    addExpense({
      description,
      amount: parseFloat(amount),
      category,
      groupId: selectedGroupId,
      paidBy: currentUser?.id || "current-user",
      splitBetween: selectedMembers,
      createdBy: currentUser?.id || "current-user"
    });

    // Reset form
    setAmount("");
    setDescription("");
    setCategory("");
    setSelectedGroupId(preselectedGroupId || "");
    setSelectedMembers([currentUser?.id || "current-user"]);
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-full md:max-w-lg mx-auto max-h-[90vh] overflow-y-auto dialog-content">
        <DialogHeader className="dialog-header">
          <DialogTitle className="flex items-center space-x-2 text-lg dialog-title">
            <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center">
              <Receipt className="h-3 w-3 text-primary-foreground" />
            </div>
            <span>Add New Expense</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">Amount *</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-base font-semibold py-5 input-field"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">Description *</Label>
            <Textarea
              id="description"
              placeholder="What was this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[60px] input-field"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm">Category *</Label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <Card 
                  key={cat.id}
                  className={`cursor-pointer transition-all duration-200 card ${
                    category === cat.id 
                      ? "ring-2 ring-primary bg-primary/5" 
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setCategory(cat.id)}
                >
                  <CardContent className="p-2 text-center">
                    <div className="text-lg mb-1">{cat.icon}</div>
                    <div className="text-xs font-medium">{cat.name}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Group Selection */}
          <div className="space-y-2">
            <Label htmlFor="group" className="text-sm">Group *</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="py-5 input-field">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{g.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Split Between */}
          {selectedGroupId && availableMembers.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm">Split Between</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableMembers.map((member) => (
                  <Card 
                    key={member.id}
                    className={`cursor-pointer transition-all duration-200 card ${
                      selectedMembers.includes(member.id) 
                        ? "ring-2 ring-primary bg-primary/5" 
                        : "hover:bg-muted/20"
                    }`}
                    onClick={() => toggleMember(member.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          checked={selectedMembers.includes(member.id)}
                          onCheckedChange={() => toggleMember(member.id)}
                        />
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Each person pays ₹{calculateSplit()}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            className="w-full py-5 text-base font-medium button-primary"
            disabled={!amount || !description || !selectedGroupId || !category || selectedMembers.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};