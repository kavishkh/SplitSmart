import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/Header";
import { useExpenses } from "@/hooks/use-expenses";
import { useGroups } from "@/hooks/use-groups";
import { useUser } from "@/hooks/use-user";
import { IndianRupee, Calendar, Users, CreditCard, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import googlePayService from "@/services/googlePayService";
import { GooglePayPaymentResult, GooglePayAvailabilityResponse } from "@/services/googlePayService.types";

const GooglePayExpenses = () => {
  const { expenses, settlements, getExpensesWhereIOwe, getSettlementsByGroup, addSettlement } = useExpenses();
  const { groups } = useGroups();
  const { currentUser } = useUser();
  const navigate = useNavigate();
  
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDescription, setPaymentDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedPaymentId, setProcessedPaymentId] = useState<string | null>(null);

  // Initialize Google Pay service
  useEffect(() => {
    googlePayService.initialize()
      .then(() => {
        console.log('Google Pay service initialized');
      })
      .catch((error) => {
        console.warn('Failed to initialize Google Pay service:', error);
      });
  }, []);

  // Get expenses where current user owes money
  const expensesWhereIOwe = getExpensesWhereIOwe();
  
  // Get settlements where current user is involved
  const mySettlements = settlements.filter(settlement => 
    settlement.fromMember === currentUser?.id || settlement.toMember === currentUser?.id
  );

  // Combine expenses and settlements into a single list of payments
  const payments = [
    ...expensesWhereIOwe.map(expense => ({
      id: expense.id,
      type: "expense" as const,
      amount: expense.amount / (expense.splitBetween.length || 1),
      description: expense.description,
      date: expense.date,
      groupId: expense.groupId,
      paidBy: expense.paidBy,
      groupName: groups.find(g => g.id === expense.groupId)?.name || "Unknown Group",
      splitBetween: expense.splitBetween
    })),
    ...mySettlements.map(settlement => ({
      id: settlement.id,
      type: "settlement" as const,
      amount: settlement.amount,
      description: settlement.description || `Settlement for group expenses`,
      date: settlement.date,
      groupId: settlement.groupId,
      paidBy: settlement.fromMember,
      groupName: settlement.groupName
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleGooglePayPayment = async (paymentId: string, amount: number, description: string, paidById: string, groupId: string) => {
    setSelectedPayment(paymentId);
    setPaymentAmount(amount);
    setPaymentDescription(description);
    setIsProcessing(true);
    
    try {
      // Check if Google Pay is available
      const isAvailable: GooglePayAvailabilityResponse = await googlePayService.isAvailable();
      
      if (isAvailable.result) {
        // Process payment
        const result: GooglePayPaymentResult = await googlePayService.processPayment(amount, description);
        
        if (result.success) {
          // Record the settlement in the database
          const group = groups.find(g => g.id === groupId);
          const paidByMember = group?.members.find(m => m.id === paidById);
          
          if (group && paidByMember && currentUser) {
            await addSettlement({
              groupId: groupId,
              groupName: group.name,
              fromMember: currentUser.id,
              fromMemberName: currentUser.name,
              toMember: paidById,
              toMemberName: paidByMember.name,
              amount: amount,
              description: `Payment for: ${description}`,
            });
            
            setProcessedPaymentId(paymentId);
            toast.success("Payment completed and recorded successfully!");
          }
          
          // Show success modal
          setTimeout(() => {
            setShowPaymentSuccess(true);
            setSelectedPayment(null);
            setIsProcessing(false);
          }, 2000);
        } else {
          toast.error("Payment failed. Please try again.");
          setIsProcessing(false);
          setSelectedPayment(null);
        }
      } else {
        toast.error("Google Pay is not available on this device");
        setIsProcessing(false);
        setSelectedPayment(null);
      }
    } catch (error) {
      console.error('Google Pay error:', error);
      toast.error("Payment failed. Please try again.");
      setIsProcessing(false);
      setSelectedPayment(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPaymentTypeBadge = (type: "expense" | "settlement") => {
    if (type === "expense") {
      return <Badge variant="secondary">Expense</Badge>;
    } else {
      return <Badge variant="default">Settlement</Badge>;
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentSuccess(false);
    // In a real app, you would update the backend to mark the payment as settled
  };

  const handleBackToExpenses = () => {
    navigate("/expenses");
  };

  const handleViewTransactions = () => {
    navigate("/google-pay/transactions");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Google Pay Payments</h1>
            <p className="text-muted-foreground">Pay your expenses directly through Google Pay</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleViewTransactions}
              className="bg-purple-500 hover:bg-purple-800 text-black hover:text-white shadow-md hover:shadow-lg px-4 py-2 h-9 hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 rounded-lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Transactions
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBackToExpenses}
              className="bg-blue-500 hover:bg-blue-800 text-black hover:text-white shadow-md hover:shadow-lg px-4 py-2 h-9 hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 rounded-lg"
            >
              Back to Expenses
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-foreground">
                  ₹{payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
                </span>
                <Badge variant="default" className="bg-gradient-success">
                  {payments.length} payments
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expenses Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-foreground">
                  ₹{expensesWhereIOwe.reduce((sum, expense) => sum + (expense.amount / (expense.splitBetween.length || 1)), 0).toFixed(2)}
                </span>
                <Badge variant="secondary">
                  {expensesWhereIOwe.length} expenses
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-balance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Settlements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-foreground">
                  ₹{mySettlements.reduce((sum, settlement) => sum + settlement.amount, 0).toFixed(2)}
                </span>
                <Badge variant="outline">
                  {mySettlements.length} settlements
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Instructions */}
        <Card className="mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">How to Pay with Google Pay</h3>
                <p className="text-muted-foreground text-sm">
                  Click on any "Pay with Google Pay" button below to initiate a payment. 
                  You'll be redirected to Google Pay to complete the transaction securely.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          {payments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No payments due</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any pending payments at the moment.
                </p>
                <Button onClick={handleBackToExpenses}>
                  View All Expenses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => {
                const group = groups.find(g => g.id === payment.groupId);
                const paidByMember = group?.members.find(m => m.id === payment.paidBy);
                
                // Check if this payment has already been processed
                const isProcessed = processedPaymentId === payment.id;
                
                return (
                  <Card key={payment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-primary/20 rounded-lg flex items-center justify-center">
                            <IndianRupee className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-foreground">{payment.description}</h4>
                              {getPaymentTypeBadge(payment.type)}
                              {isProcessed && (
                                <Badge variant="default" className="bg-green-500">Paid</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                              <span>Paid by {paidByMember?.name || "Unknown"}</span>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{payment.groupName}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(payment.date)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-semibold text-foreground">
                            ₹{payment.amount.toFixed(2)}
                          </div>
                          {payment.type === "expense" && !isProcessed ? (
                            <Button 
                              onClick={() => handleGooglePayPayment(payment.id, payment.amount, payment.description, payment.paidBy, payment.groupId)}
                              disabled={selectedPayment === payment.id || isProcessing}
                              className="mt-2 bg-green-500 hover:bg-green-800 text-black hover:text-white shadow-md hover:shadow-lg px-4 py-2 h-9 hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 rounded-lg"
                            >
                              {selectedPayment === payment.id || isProcessing ? (
                                <>
                                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2"></span>
                                  {isProcessing ? "Processing..." : "Processing..."}
                                </>
                              ) : (
                                <>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Pay with Google Pay
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button 
                              disabled 
                              className="mt-2 bg-gray-500 text-white shadow-md px-4 py-2 h-9 rounded-lg"
                            >
                              {isProcessed ? "Payment Recorded" : "Settlement"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Payment Success Modal */}
      {showPaymentSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
                <p className="text-muted-foreground mb-4">
                  You've successfully paid ₹{paymentAmount.toFixed(2)} for "{paymentDescription}"
                </p>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handlePaymentSuccess}
                    className="flex-1 bg-green-500 hover:bg-green-800 text-black hover:text-white shadow-md hover:shadow-lg px-4 py-2 h-9 hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 rounded-lg"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Elements */}
      <div className="fixed top-20 right-10 w-32 h-32 bg-gradient-primary/10 rounded-full blur-3xl animate-float -z-10" />
      <div className="fixed bottom-20 left-10 w-24 h-24 bg-gradient-accent/10 rounded-full blur-2xl animate-float -z-10" style={{ animationDelay: "1s" }} />
    </div>
  );
};

export default GooglePayExpenses;