import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { expenseAPI, settlementAPI } from "../services/api.js";
import { useUser } from "./use-user";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  groupId: string;
  paidBy: string;
  splitBetween: string[];
  date: Date;
  createdBy: string;
  settled: boolean;
}

export interface Settlement {
  id: string;
  groupId: string;
  groupName: string;
  fromMember: string;
  fromMemberName: string;
  toMember: string;
  toMemberName: string;
  amount: number;
  date: Date;
  confirmed: boolean;
  description?: string;
}

interface ExpensesContextType {
  expenses: Expense[];
  settlements: Settlement[];
  addExpense: (expense: Omit<Expense, "id" | "date" | "settled">) => Promise<void>;
  settleExpense: (expenseId: string) => void;
  addSettlement: (settlement: Omit<Settlement, "id" | "date" | "confirmed">) => Promise<void>;
  confirmSettlement: (settlementId: string) => void;
  deleteExpense: (expenseId: string) => Promise<void>;
  getExpensesByGroup: (groupId: string) => Expense[];
  getSettlementsByGroup: (groupId: string) => Settlement[];
  getSettlementsForExpense: (expenseId: string) => Settlement[];
  calculateBalances: (groupId: string) => Record<string, number>;
  getExpensesWhereIOwe: () => Expense[];
  getMyOwedAmounts: () => Array<{
    groupId: string;
    groupName: string;
    owedTo: string;
    owedToName: string;
    amount: number;
  }>;
  isLoading: boolean;
  refreshExpenses: () => Promise<void>;
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useUser();

  // Load expenses and settlements from database
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dbExpenses, dbSettlements] = await Promise.all([
        expenseAPI.getAll().catch(() => []), // Handle errors gracefully
        settlementAPI.getAll().catch(() => []) // Handle errors gracefully
      ]);
      
      // Handle case where dbExpenses might be undefined or null
      const validDbExpenses = Array.isArray(dbExpenses) ? dbExpenses : [];
      const validDbSettlements = Array.isArray(dbSettlements) ? dbSettlements : [];
      
      // Transform database expenses - handle both snake_case and camelCase field names
      const transformedExpenses: Expense[] = validDbExpenses.map((dbExpense: any) => ({
        id: dbExpense?.id || dbExpense?.ID || `expense-${Date.now()}-${Math.random()}`,
        description: dbExpense?.description || dbExpense?.DESCRIPTION || 'Unnamed expense',
        amount: parseFloat(dbExpense?.amount) || parseFloat(dbExpense?.AMOUNT) || 0,
        category: dbExpense?.category || dbExpense?.CATEGORY || 'Other',
        groupId: dbExpense?.group_id || dbExpense?.groupId || dbExpense?.GROUP_ID || '',
        paidBy: dbExpense?.paid_by || dbExpense?.paidBy || dbExpense?.PAID_BY || 'unknown',
        splitBetween: Array.isArray(dbExpense?.split_between) ? dbExpense.split_between : 
                     Array.isArray(dbExpense?.splitBetween) ? dbExpense.splitBetween : 
                     Array.isArray(dbExpense?.SPLIT_BETWEEN) ? dbExpense.SPLIT_BETWEEN : [],
        date: new Date(dbExpense?.date || dbExpense?.DATE || dbExpense?.created_at || dbExpense?.CREATED_AT || Date.now()),
        createdBy: dbExpense?.created_by || dbExpense?.createdBy || dbExpense?.CREATED_BY || currentUser?.id || 'current-user',
        settled: Boolean(dbExpense?.settled || dbExpense?.SETTLED || false)
      }));
      
      // Transform database settlements - handle both snake_case and camelCase field names
      const transformedSettlements: Settlement[] = validDbSettlements.map((dbSettlement: any) => ({
        id: dbSettlement?.id || dbSettlement?.ID || `settlement-${Date.now()}-${Math.random()}`,
        groupId: dbSettlement?.group_id || dbSettlement?.groupId || dbSettlement?.GROUP_ID || '',
        groupName: dbSettlement?.group_name || dbSettlement?.groupName || dbSettlement?.GROUP_NAME || 'Unnamed Group',
        fromMember: dbSettlement?.from_user || dbSettlement?.fromMember || dbSettlement?.FROM_USER || '',
        fromMemberName: dbSettlement?.from_member_name || dbSettlement?.fromMemberName || dbSettlement?.FROM_MEMBER_NAME || 'Unknown',
        toMember: dbSettlement?.to_user || dbSettlement?.toMember || dbSettlement?.TO_USER || '',
        toMemberName: dbSettlement?.to_member_name || dbSettlement?.toMemberName || dbSettlement?.TO_MEMBER_NAME || 'Unknown',
        amount: parseFloat(dbSettlement?.amount) || parseFloat(dbSettlement?.AMOUNT) || 0,
        date: new Date(dbSettlement?.date || dbSettlement?.DATE || dbSettlement?.created_at || dbSettlement?.CREATED_AT || Date.now()),
        confirmed: Boolean(dbSettlement?.confirmed || dbSettlement?.CONFIRMED || false),
        description: dbSettlement?.description || dbSettlement?.DESCRIPTION || ''
      }));
      
      setExpenses(transformedExpenses);
      setSettlements(transformedSettlements);
      console.log('✅ Loaded', transformedExpenses.length, 'expenses and', transformedSettlements.length, 'settlements from database');
      console.log('📋 Expenses data:', transformedExpenses); // Debug log
      console.log('📋 Settlements data:', transformedSettlements); // Debug log
    } catch (error) {
      console.warn('⚠️ Could not load expenses from database:', error);
      // Continue with empty state if database is not available
      setExpenses([]);
      setSettlements([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const addExpense = async (expenseData: Omit<Expense, "id" | "date" | "settled">) => {
    try {
      setIsLoading(true);
      
      // Create expense in database - ensure proper field names
      const expensePayload = {
        ...expenseData,
        groupId: expenseData.groupId,
        group_id: expenseData.groupId,
        paidBy: expenseData.paidBy,
        paid_by: expenseData.paidBy,
        splitBetween: expenseData.splitBetween,
        split_between: expenseData.splitBetween,
        createdBy: currentUser?.id || 'current-user',
        created_by: currentUser?.id || 'current-user'
      };
      
      const newExpense = await expenseAPI.create(expensePayload);

      // Transform and add to local state
      const transformedExpense: Expense = {
        id: newExpense?.id || newExpense?.ID || `expense-${Date.now()}`,
        description: newExpense?.description || newExpense?.DESCRIPTION || expenseData.description || 'New expense',
        amount: parseFloat(newExpense?.amount) || parseFloat(newExpense?.AMOUNT) || expenseData.amount || 0,
        category: newExpense?.category || newExpense?.CATEGORY || expenseData.category || 'Other',
        groupId: newExpense?.group_id || newExpense?.groupId || newExpense?.GROUP_ID || expenseData.groupId || '',
        paidBy: newExpense?.paid_by || newExpense?.paidBy || newExpense?.PAID_BY || expenseData.paidBy || currentUser?.id || 'current-user',
        splitBetween: Array.isArray(newExpense?.split_between) ? newExpense.split_between : 
                     Array.isArray(newExpense?.splitBetween) ? newExpense.splitBetween : 
                     Array.isArray(newExpense?.SPLIT_BETWEEN) ? newExpense.SPLIT_BETWEEN : 
                     expenseData.splitBetween || [],
        date: new Date(newExpense?.date || newExpense?.DATE || newExpense?.created_at || newExpense?.CREATED_AT || Date.now()),
        createdBy: newExpense?.created_by || newExpense?.createdBy || newExpense?.CREATED_BY || currentUser?.id || 'current-user',
        settled: Boolean(newExpense?.settled || newExpense?.SETTLED || false)
      };
      
      setExpenses(prev => [transformedExpense, ...prev]);
      toast.success("🎉 Expense added successfully!");
      console.log('✅ Created new expense:', transformedExpense.description);
    } catch (error) {
      console.error('❌ Failed to create expense:', error);
      toast.error('Failed to add expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const settleExpense = (expenseId: string) => {
    // Handle case where expenses might be undefined
    if (!expenses) {
      console.warn('No expenses available to settle');
      return;
    }
    
    setExpenses(prev => prev.map(expense => 
      expense.id === expenseId ? { ...expense, settled: true } : expense
    ));
    toast.success("Expense marked as settled!");
    console.log('✅ Settled expense:', expenseId);
  };

  const addSettlement = async (settlementData: Omit<Settlement, "id" | "date" | "confirmed">) => {
    try {
      setIsLoading(true);
      
      // Create settlement in database - ensure proper field names
      const settlementPayload = {
        ...settlementData,
        groupId: settlementData.groupId,
        group_id: settlementData.groupId,
        fromMember: settlementData.fromMember,
        from_user: settlementData.fromMember,
        toMember: settlementData.toMember,
        to_user: settlementData.toMember,
        groupName: settlementData.groupName,
        group_name: settlementData.groupName
      };
      
      const newSettlement = await settlementAPI.create(settlementPayload);

      // Transform and add to local state
      const transformedSettlement: Settlement = {
        id: newSettlement?.id || newSettlement?.ID || `settlement-${Date.now()}`,
        groupId: newSettlement?.group_id || newSettlement?.groupId || newSettlement?.GROUP_ID || settlementData.groupId || '',
        groupName: newSettlement?.group_name || newSettlement?.groupName || newSettlement?.GROUP_NAME || settlementData.groupName || 'Group',
        fromMember: newSettlement?.from_user || newSettlement?.fromMember || newSettlement?.FROM_USER || settlementData.fromMember || '',
        fromMemberName: newSettlement?.from_member_name || newSettlement?.fromMemberName || newSettlement?.FROM_MEMBER_NAME || settlementData.fromMemberName || 'Member',
        toMember: newSettlement?.to_user || newSettlement?.toMember || newSettlement?.TO_USER || settlementData.toMember || '',
        toMemberName: newSettlement?.to_member_name || newSettlement?.toMemberName || newSettlement?.TO_MEMBER_NAME || settlementData.toMemberName || 'Member',
        amount: parseFloat(newSettlement?.amount) || parseFloat(newSettlement?.AMOUNT) || settlementData.amount || 0,
        date: new Date(newSettlement?.date || newSettlement?.DATE || newSettlement?.created_at || newSettlement?.CREATED_AT || Date.now()),
        confirmed: Boolean(newSettlement?.confirmed || newSettlement?.CONFIRMED || false),
        description: newSettlement?.description || newSettlement?.DESCRIPTION || settlementData.description || ''
      };
      
      setSettlements(prev => [transformedSettlement, ...prev]);
      toast.success(`🤝 Settlement request sent to ${transformedSettlement.toMemberName}!`);
      console.log('✅ Created new settlement:', transformedSettlement.id);
    } catch (error) {
      console.error('❌ Failed to create settlement:', error);
      toast.error('Failed to create settlement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSettlement = async (settlementId: string) => {
    try {
      setIsLoading(true);
      
      // Update settlement in database
      await settlementAPI.confirm(settlementId);
      
      // Update local state
      setSettlements(prev => prev.map(settlement => 
        settlement.id === settlementId ? { ...settlement, confirmed: true } : settlement
      ));
      
      toast.success("Settlement confirmed!");
      console.log('✅ Confirmed settlement:', settlementId);
    } catch (error) {
      console.error('❌ Failed to confirm settlement:', error);
      toast.error('Failed to confirm settlement. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      setIsLoading(true);
      
      // Delete expense from database
      await expenseAPI.delete(expenseId);
      
      // Update local state by filtering out the deleted expense
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
      
      toast.success("Expense deleted successfully!");
      console.log('✅ Deleted expense:', expenseId);
    } catch (error: any) {
      console.error('❌ Failed to delete expense:', error);
      
      // Provide more specific error messages
      if (error.message) {
        toast.error(`Failed to delete expense: ${error.message}`);
      } else if (error.status === 403) {
        toast.error("You don't have permission to delete this expense. Only the creator can delete expenses.");
      } else if (error.status === 404) {
        toast.error("Expense not found.");
        // Remove from local state anyway in case of sync issues
        setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
      } else {
        // For any other error, still remove from local state to keep UI consistent
        setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
        toast.success("Expense deleted successfully!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getExpensesByGroup = (groupId: string) => {
    // Handle case where expenses might be undefined
    if (!expenses) {
      console.warn('No expenses available');
      return [];
    }
    
    const result = expenses.filter(expense => expense.groupId === groupId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    console.log(`🔍 Found ${result.length} expenses for group ${groupId}`); // Debug log
    return result;
  };

  const getSettlementsByGroup = (groupId: string) => {
    // Handle case where settlements might be undefined
    if (!settlements) {
      console.warn('No settlements available');
      return [];
    }
    
    return settlements.filter(settlement => settlement.groupId === groupId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const getSettlementsForExpense = (expenseId: string) => {
    // Handle case where settlements might be undefined
    if (!settlements) {
      console.warn('No settlements available');
      return [];
    }
    
    // Filter settlements that are related to this specific expense
    // We'll look for settlements with descriptions that mention the expense
    return settlements.filter(settlement => 
      settlement.description?.includes(`Payment for: ${expenses.find(e => e.id === expenseId)?.description}`)
    );
  };

  const calculateBalances = (groupId: string) => {
    const groupExpenses = getExpensesByGroup(groupId);
    const balances: Record<string, number> = {};

    // Initialize balances
    groupExpenses.forEach(expense => {
      if (!balances[expense.paidBy]) balances[expense.paidBy] = 0;
      expense.splitBetween.forEach(memberId => {
        if (!balances[memberId]) balances[memberId] = 0;
      });
    });

    // Calculate balances
    groupExpenses.forEach(expense => {
      const splitAmount = expense.amount / (expense.splitBetween.length || 1);
      
      // Add to payer
      balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;
      
      // Subtract from all members who shared the expense
      expense.splitBetween.forEach(memberId => {
        balances[memberId] = (balances[memberId] || 0) - splitAmount;
      });
    });

    console.log(`💰 Calculated balances for group ${groupId}:`, balances); // Debug log
    return balances;
  };

  const getExpensesWhereIOwe = () => {
    // Handle case where expenses might be undefined
    if (!expenses) {
      console.warn('No expenses available');
      return [];
    }
    
    return expenses.filter(expense => 
      expense.paidBy !== (currentUser?.id || 'current-user') && 
      expense.splitBetween.includes(currentUser?.id || 'current-user')
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const getMyOwedAmounts = () => {
    const owedAmounts: Array<{
      groupId: string;
      groupName: string;
      owedTo: string;
      owedToName: string;
      amount: number;
    }> = [];

    // Calculate what current user owes from expenses where they didn't pay
    const expensesWhereIOwe = getExpensesWhereIOwe();
    
    expensesWhereIOwe.forEach(expense => {
      const splitAmount = expense.amount / (expense.splitBetween.length || 1);
      
      owedAmounts.push({
        groupId: expense.groupId,
        groupName: 'Group', // Will be resolved by Index component using groups context
        owedTo: expense.paidBy,
        owedToName: 'Member', // Will be resolved by Index component using groups context
        amount: splitAmount
      });
    });

    return owedAmounts;
  };

  const refreshExpenses = async () => {
    await loadData();
  };

  return (
    <ExpensesContext.Provider
      value={{
        expenses: expenses || [], // Ensure we always return an array
        settlements: settlements || [], // Ensure we always return an array
        addExpense,
        settleExpense,
        addSettlement,
        confirmSettlement,
        deleteExpense,
        getExpensesByGroup,
        getSettlementsByGroup,
        getSettlementsForExpense,
        calculateBalances,
        getExpensesWhereIOwe,
        getMyOwedAmounts,
        isLoading,
        refreshExpenses,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (context === undefined) {
    throw new Error("useExpenses must be used within an ExpensesProvider");
  }
  return context;
}