import { useState } from "react";
import { toast } from "sonner";
import { useExpenses } from "./use-expenses";
import { useUser } from "./use-user";

export interface ExpensePayment {
  id: string;
  expenseId: string;
  fromMember: string;
  toMember: string;
  amount: number;
  date: Date;
  confirmed: boolean;
  description?: string;
}

export function useExpensePayments() {
  const { expenses, settlements, addSettlement } = useExpenses();
  const { currentUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  // Get expenses where current user owes money
  const getExpensesWhereIOwe = () => {
    if (!expenses || !currentUser) return [];
    
    return expenses.filter(expense => 
      expense.paidBy !== currentUser.id && 
      expense.splitBetween.includes(currentUser.id)
    );
  };

  // Calculate how much current user owes for a specific expense
  const getAmountOwedForExpense = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense || !currentUser) return 0;
    
    // Check if current user is part of the split
    if (!expense.splitBetween.includes(currentUser.id)) return 0;
    
    // Calculate the amount owed by this user
    const splitAmount = expense.amount / (expense.splitBetween.length || 1);
    return splitAmount;
  };

  // Get users who owe money for a specific expense
  const getUsersOwingForExpense = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return [];
    
    const splitAmount = expense.amount / (expense.splitBetween.length || 1);
    
    return expense.splitBetween.map(memberId => ({
      memberId,
      amount: splitAmount
    }));
  };

  // Pay for a specific expense
  const payForExpense = async (
    expenseId: string,
    groupId: string,
    groupName: string,
    description?: string
  ) => {
    try {
      setIsLoading(true);
      
      const expense = expenses.find(e => e.id === expenseId);
      if (!expense) {
        throw new Error("Expense not found");
      }
      
      // Calculate amount owed by current user
      const amountOwed = getAmountOwedForExpense(expenseId);
      if (amountOwed <= 0) {
        throw new Error("You don't owe anything for this expense");
      }
      
      // Create settlement from current user to expense creator
      await addSettlement({
        groupId,
        groupName,
        fromMember: currentUser?.id || "current-user",
        fromMemberName: "You",
        toMember: expense.paidBy,
        toMemberName: "Expense Creator",
        amount: amountOwed,
        description: description || `Payment for: ${expense.description}`
      });
      
      toast.success(`Payment of ₹${amountOwed.toFixed(2)} sent successfully!`);
      return true;
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process payment");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Get payment status for an expense
  const getPaymentStatusForExpense = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense || !currentUser) return "not_applicable";
    
    // If current user created the expense, they don't need to pay
    if (expense.paidBy === currentUser.id) {
      return "not_applicable";
    }
    
    // If current user is not part of the split, they don't need to pay
    if (!expense.splitBetween.includes(currentUser.id)) {
      return "not_applicable";
    }
    
    // Check if there's already a settlement for this expense
    const existingSettlement = settlements.find(settlement => 
      settlement.fromMember === currentUser.id &&
      settlement.toMember === expense.paidBy &&
      settlement.description?.includes(expense.description)
    );
    
    if (existingSettlement) {
      return existingSettlement.confirmed ? "paid" : "pending";
    }
    
    return "unpaid";
  };

  return {
    getExpensesWhereIOwe,
    getAmountOwedForExpense,
    getUsersOwingForExpense,
    payForExpense,
    getPaymentStatusForExpense,
    isLoading
  };
}