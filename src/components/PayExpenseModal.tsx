import { useState } from "react";
import { CheckCircle2, IndianRupee, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useGroups } from "@/hooks/use-groups";
import { useExpensePayments } from "@/hooks/use-expense-payments";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

interface PayExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: any;
  groupId: string;
}

export const PayExpenseModal = ({ 
  open, 
  onOpenChange, 
  expense,
  groupId
}: PayExpenseModalProps) => {
  const { groups } = useGroups();
  const { payForExpense, getAmountOwedForExpense } = useExpensePayments();
  const { currentUser } = useUser();
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Add safety checks for expense and group data
  const group = groups?.find(g => g.id === groupId);
  const amountOwed = expense?.id ? getAmountOwedForExpense(expense.id) : 0;
  const paidByMember = group?.members?.find(m => m.id === expense?.paidBy);
  const splitBetweenCount = expense?.splitBetween ? expense.splitBetween.length : 1;

  const handleSubmit = async () => {
    if (!group) {
      toast.error("Group not found");
      return;
    }

    setIsProcessing(true);
    try {
      const success = await payForExpense(
        expense.id,
        group.id,
        group.name,
        description || `Payment for: ${expense.description}`
      );
      
      if (success) {
        onOpenChange(false);
        setDescription("");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Add safety check for expense and group
  if (!expense || !group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-full md:max-w-md mx-auto dialog-content">
        <DialogHeader className="dialog-header">
          <DialogTitle className="flex items-center space-x-2 text-lg dialog-title">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>Pay for Expense</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
          {/* Expense Info */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 card">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground text-sm truncate">{expense.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={paidByMember?.avatar} />
                      <AvatarFallback className="text-xs">
                        {paidByMember?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground truncate">
                      Paid by {paidByMember?.name || "Unknown"}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs px-2 py-1">
                  {group.name}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Amount to Pay</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={amountOwed?.toFixed(2) || "0.00"}
                readOnly
                className="pl-10 text-base font-semibold py-5 input-field bg-muted"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This is your share of the expense
            </p>
          </div>

          {/* Payment Details */}
          <Card className="card">
            <CardContent className="p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Expense</span>
                <span>₹{expense.amount?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Split Between</span>
                <span>{splitBetweenCount} people</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Your Share</span>
                <span className="text-primary">₹{amountOwed?.toFixed(2) || "0.00"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">Note (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a note about this payment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[50px] input-field"
            />
          </div>

          {/* Summary */}
          <Card className="bg-gradient-success/10 border-success/20 card">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Payment to {paidByMember?.name || "Creator"}</p>
                  <p className="text-xs text-muted-foreground">
                    For: {expense.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-success">₹{amountOwed?.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 py-5 text-sm button-secondary" 
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 py-5 text-sm button-primary" 
              onClick={handleSubmit}
              disabled={isProcessing || (amountOwed || 0) <= 0}
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Pay Now
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};