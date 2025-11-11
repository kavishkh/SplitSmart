import { useState } from "react";
import { Receipt, IndianRupee, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  groupId: string;
  paidBy: string;
  splitBetween: string[];
  date: string;
}

interface EditExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense;
  groups: Array<{id: string, name: string}>;
  onSave: (updatedExpense: Expense) => void;
}

export const EditExpenseModal = ({ open, onOpenChange, expense, groups, onSave }: EditExpenseModalProps) => {
  // Add safety checks for expense object
  const safeExpense = expense || {
    id: "",
    description: "",
    amount: 0,
    category: "other",
    groupId: "",
    paidBy: "",
    splitBetween: [],
    date: new Date().toISOString()
  };

  const [description, setDescription] = useState(safeExpense.description || "");
  const [amount, setAmount] = useState((safeExpense.amount || 0).toString());
  const [category, setCategory] = useState(safeExpense.category || "other");
  const [selectedGroupId, setSelectedGroupId] = useState(safeExpense.groupId || "");

  const categories = [
    { id: "food", name: "Food & Dining", icon: "🍽️" },
    { id: "transport", name: "Transportation", icon: "🚗" },
    { id: "entertainment", name: "Entertainment", icon: "🎬" },
    { id: "utilities", name: "Utilities", icon: "💡" },
    { id: "shopping", name: "Shopping", icon: "🛍️" },
    { id: "other", name: "Other", icon: "📄" }
  ];

  const validateForm = () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
      return false;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return false;
    }
    
    if (!category) {
      toast.error("Please select a category");
      return false;
    }
    
    if (!selectedGroupId) {
      toast.error("Please select a group");
      return false;
    }
    
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    
    onSave({
      ...safeExpense,
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      groupId: selectedGroupId,
    });
    
    toast.success("Expense updated successfully!");
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-full md:max-w-md mx-auto dialog-content">
        <DialogHeader className="dialog-header">
          <DialogTitle className="flex items-center space-x-2 text-lg dialog-title">
            <Receipt className="h-5 w-5 text-primary" />
            <span>Edit Expense</span>
          </DialogTitle>
          <DialogDescription>
            Update the expense details
          </DialogDescription>
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
                onKeyPress={handleKeyPress}
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
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="py-5 input-field">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-sm">{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group */}
          <div className="space-y-2">
            <Label className="text-sm">Group *</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="py-5 input-field">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups && groups.length > 0 ? (
                  groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{group.name}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No groups available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
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