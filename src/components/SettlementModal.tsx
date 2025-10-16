import { useState } from "react";
import { CheckCircle2, CreditCard, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useGroups } from "@/hooks/use-groups";
import { useExpenses } from "@/hooks/use-expenses";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

interface SettlementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  suggestedMember?: string;
  suggestedAmount?: number;
}

export const SettlementModal = ({ 
  open, 
  onOpenChange, 
  groupId,
  suggestedMember = "",
  suggestedAmount = 0
}: SettlementModalProps) => {
  const { groups } = useGroups();
  const { addSettlement } = useExpenses();
  const { currentUser } = useUser();
  const [amount, setAmount] = useState(suggestedAmount.toString());
  const [selectedMember, setSelectedMember] = useState(suggestedMember);
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const group = groups.find(g => g.id === groupId);
  const members = group?.members.filter(m => m.id !== (currentUser?.id || "current-user")) || [];
  const selectedMemberData = members.find(m => m.id === selectedMember);

  const paymentMethods = [
    { id: "upi", name: "UPI", icon: "📱" },
    { id: "bank", name: "Bank Transfer", icon: "🏦" },
    { id: "cash", name: "Cash", icon: "💵" },
    { id: "digital_wallet", name: "Digital Wallet", icon: "💳" },
    { id: "other", name: "Other", icon: "💰" }
  ];

  const handleSubmit = () => {
    if (!amount || !selectedMember || !paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!group || !selectedMemberData) {
      toast.error("Invalid group or member selection");
      return;
    }

    addSettlement({
      groupId: group.id,
      groupName: group.name,
      fromMember: currentUser?.id || "current-user",
      fromMemberName: "You",
      toMember: selectedMember,
      toMemberName: selectedMemberData.name,
      amount: parseFloat(amount),
      description: description || `Payment via ${paymentMethods.find(pm => pm.id === paymentMethod)?.name}`
    });

    // Reset form
    setAmount("");
    setSelectedMember("");
    setDescription("");
    setPaymentMethod("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-full md:max-w-md mx-auto dialog-content">
        <DialogHeader className="dialog-header">
          <DialogTitle className="flex items-center space-x-2 text-lg dialog-title">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>Send Payment</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
          {/* Group Info */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 card">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                  style={{ backgroundColor: group?.color }}
                >
                  {group?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{group?.name}</p>
                  <p className="text-xs text-muted-foreground">Settlement payment</p>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Select Member */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pay to *</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="py-5 input-field">
                <SelectValue placeholder="Select member to pay" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-xs">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Payment Method *</Label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => (
                <Card 
                  key={method.id}
                  className={`cursor-pointer transition-all duration-200 card ${
                    paymentMethod === method.id 
                      ? "ring-2 ring-primary border-primary" 
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <CardContent className="p-2 text-center">
                    <div className="text-lg mb-1">{method.icon}</div>
                    <p className="text-xs font-medium">{method.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

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
          {selectedMemberData && amount && paymentMethod && (
            <Card className="bg-gradient-success/10 border-success/20 card">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={selectedMemberData.avatar} />
                      <AvatarFallback className="text-xs">
                        {selectedMemberData.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">Pay {selectedMemberData.name}</p>
                      <p className="text-xs text-muted-foreground">
                        via {paymentMethods.find(pm => pm.id === paymentMethod)?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success">₹{amount}</p>
                    <Badge variant="outline" className="text-xs px-1 py-0 badge">
                      {group?.name}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button variant="outline" className="flex-1 py-5 text-sm button-secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1 py-5 text-sm button-primary" onClick={handleSubmit}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};