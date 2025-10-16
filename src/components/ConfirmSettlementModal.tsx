import { useState } from "react";
import { CheckCircle, CreditCard, IndianRupee, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useExpenses } from "@/hooks/use-expenses";
import { useGroups } from "@/hooks/use-groups";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

interface ConfirmSettlementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: any;
  onConfirm: (settlementId: string) => void;
}

export const ConfirmSettlementModal = ({ 
  open, 
  onOpenChange, 
  settlement,
  onConfirm
}: ConfirmSettlementModalProps) => {
  const { confirmSettlement } = useExpenses();
  const { getGroupById } = useGroups();
  const { currentUser } = useUser();
  const [isConfirming, setIsConfirming] = useState(false);

  const group = getGroupById(settlement?.groupId || "");
  const fromMember = group?.members.find((m: any) => m.id === settlement?.fromMember);
  const toMember = group?.members.find((m: any) => m.id === settlement?.toMember);

  const handleConfirm = async () => {
    if (!settlement) return;
    
    setIsConfirming(true);
    try {
      await confirmSettlement(settlement.id);
      onConfirm(settlement.id);
      toast.success("Settlement confirmed successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to confirm settlement");
    } finally {
      setIsConfirming(false);
    }
  };

  if (!settlement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-full md:max-w-md mx-auto dialog-content">
        <DialogHeader className="dialog-header">
          <DialogTitle className="flex items-center space-x-2 text-lg dialog-title">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>Confirm Settlement</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Settlement Summary */}
          <Card className="bg-gradient-success/10 border-success/20 card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">₹{settlement.amount.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Settlement Amount</div>
                </div>
                <Badge variant="outline" className="text-xs px-2 py-1 badge">
                  {group?.name}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center">
                  <Avatar className="w-10 h-10 mb-1">
                    <AvatarImage src={fromMember?.avatar} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                      {fromMember?.name.charAt(0) || "F"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-center max-w-16 truncate">
                    {fromMember?.name || "From"}
                  </span>
                </div>
                
                <div className="flex-1 mx-2">
                  <div className="h-px bg-muted"></div>
                  <div className="text-center text-xs text-muted-foreground mt-1">pays</div>
                </div>
                
                <div className="flex flex-col items-center">
                  <Avatar className="w-10 h-10 mb-1">
                    <AvatarImage src={toMember?.avatar} />
                    <AvatarFallback className="bg-gradient-accent text-accent-foreground text-xs">
                      {toMember?.name.charAt(0) || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-center max-w-16 truncate">
                    {toMember?.name || "To"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settlement Details */}
          <Card className="card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Date</span>
                </div>
                <span className="text-sm">
                  {new Date(settlement.date).toLocaleDateString()}
                </span>
              </div>
              
              {settlement.description && (
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    <div className="mt-0.5 w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-sm text-muted-foreground">Note</span>
                  </div>
                  <span className="text-sm text-right max-w-[60%]">
                    {settlement.description}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Status</span>
                </div>
                <Badge 
                  variant={settlement.confirmed ? "default" : "secondary"}
                  className={`text-xs ${settlement.confirmed ? 'bg-gradient-success' : ''}`}
                >
                  {settlement.confirmed ? "Confirmed" : "Pending"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 py-5 text-sm button-secondary" 
              onClick={() => onOpenChange(false)}
              disabled={isConfirming}
            >
              Cancel
            </Button>
            
            {!settlement.confirmed && (
              <Button 
                className="flex-1 py-5 text-sm button-primary" 
                onClick={handleConfirm}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1"></div>
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirm Payment
                  </>
                )}
              </Button>
            )}
            
            {settlement.confirmed && (
              <Button 
                className="flex-1 py-5 text-sm bg-gradient-success hover:opacity-90" 
                onClick={() => onOpenChange(false)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirmed
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};