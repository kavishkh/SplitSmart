import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { expenseAPI, settlementAPI } from "../services/api.js";
import { useUser } from "./use-user";
import realtimeService from "../services/realtime.js";

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

  // Handle real-time expense updates
  const handleExpenseUpdate = (operation: string, data: any) => {
    console.log(`🔄 Real-time expense ${operation}:`, data);
    
    switch (operation) {
      case 'insert':
        // Add new expense to the list
        const newExpense: Expense = {
          id: data?.id || data?.ID || `expense-${Date.now()}-${Math.random()}`,
          description: data?.description || data?.DESCRIPTION || 'Unnamed expense',
          amount: parseFloat(data?.amount) || parseFloat(data?.AMOUNT) || 0,
          category: data?.category || data?.CATEGORY || 'Other',
          groupId: data?.group_id || data?.groupId || data?.GROUP_ID || '',
          paidBy: data?.paid_by || data?.paidBy || data?.PAID_BY || 'unknown',
          splitBetween: Array.isArray(data?.split_between) ? data.split_between : 
                       Array.isArray(data?.splitBetween) ? data.splitBetween : 
                       Array.isArray(data?.SPLIT_BETWEEN) ? data.SPLIT_BETWEEN : [],
          date: new Date(data?.date || data?.DATE || data?.created_at || data?.CREATED_AT || Date.now()),
          createdBy: data?.created_by || data?.createdBy || data?.CREATED_BY || currentUser?.id || 'current-user',
          settled: Boolean(data?.settled || data?.SETTLED || false)
        };
        setExpenses(prev => [newExpense, ...prev]);
        toast.success(`New expense "${newExpense.description}" added!`);
        break;
        
      case 'update':
        // Update existing expense
        setExpenses(prev => prev.map(expense => 
          expense.id === data.id ? {
            ...expense,
            description: data?.description || expense.description,
            amount: parseFloat(data?.amount) || expense.amount,
            category: data?.category || expense.category,
            settled: Boolean(data?.settled !== undefined ? data.settled : expense.settled)
          } : expense
        ));
        break;
        
      case 'delete':
        // Remove expense from the list
        setExpenses(prev => prev.filter(expense => expense.id !== data.id));
        toast.success('Expense deleted');
        break;
    }
  };

  // Handle real-time settlement updates
  const handleSettlementUpdate = (operation: string, data: any) => {
    console.log(`🔄 Real-time settlement ${operation}:`, data);
    
    switch (operation) {
      case 'insert':
        // Add new settlement to the list
        const newSettlement: Settlement = {
          id: data?.id || data?.ID || `settlement-${Date.now()}-${Math.random()}`,
          groupId: data?.group_id || data?.groupId || data?.GROUP_ID || '',
          groupName: data?.group_name || data?.groupName || data?.GROUP_NAME || 'Unnamed Group',
          fromMember: data?.from_user || data?.fromMember || data?.FROM_USER || '',
          fromMemberName: data?.from_member_name || data?.fromMemberName || data?.FROM_MEMBER_NAME || 'Unknown',
          toMember: data?.to_user || data?.toMember || data?.TO_USER || '',
          toMemberName: data?.to_member_name || data?.toMemberName || data?.TO_MEMBER_NAME || 'Unknown',
          amount: parseFloat(data?.amount) || parseFloat(data?.AMOUNT) || 0,
          date: new Date(data?.date || data?.DATE || data?.created_at || data?.CREATED_AT || Date.now()),
          confirmed: Boolean(data?.confirmed || data?.CONFIRMED || false),
          description: data?.description || data?.DESCRIPTION || ''
        };
        setSettlements(prev => [newSettlement, ...prev]);
        toast.success(`New settlement added!`);
        break;
        
      case 'update':
        // Update existing settlement
        setSettlements(prev => prev.map(settlement => 
          settlement.id === data.id ? {
            ...settlement,
            confirmed: Boolean(data?.confirmed !== undefined ? data.confirmed : settlement.confirmed),
            description: data?.description || settlement.description
          } : settlement
        ));
        break;
        
      case 'delete':
        // Remove settlement from the list
        setSettlements(prev => prev.filter(settlement => settlement.id !== data.id));
        toast.success('Settlement deleted');
        break;
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
    
    // Connect to real-time service
    realtimeService.connect();
    
    // Add listeners for real-time updates
    realtimeService.addListener('expense_change', handleExpenseUpdate);
    realtimeService.addListener('settlement_change', handleSettlementUpdate);
    
    // Cleanup function
    return () => {
      realtimeService.removeListener('expense_change', handleExpenseUpdate);
      realtimeService.removeListener('settlement_change', handleSettlementUpdate);
      // Don't disconnect here as other components might be using the service
    };
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
        createdBy: currentUser?.id || 'current-user',
        created_by: currentUser?.id || 'current-user'
      };
      
      const newSettlement = await settlementAPI.create(settlementPayload);

      // Transform and add to local state
      const transformedSettlement: Settlement = {
        id: newSettlement?.id || newSettlement?.ID || `settlement-${Date.now()}`,
        groupId: newSettlement?.group_id || newSettlement?.groupId || newSettlement?.GROUP_ID || settlementData.groupId || '',
        groupName: newSettlement?.group_name || newSettlement?.groupName || newSettlement?.GROUP_NAME || settlementData.groupName || 'Unnamed Group',
        fromMember: newSettlement?.from_user || newSettlement?.fromMember || newSettlement?.FROM_USER || settlementData.fromMember || '',
        fromMemberName: newSettlement?.from_member_name || newSettlement?.fromMemberName || newSettlement?.FROM_MEMBER_NAME || settlementData.fromMemberName || 'Unknown',
        toMember: newSettlement?.to_user || newSettlement?.toMember || newSettlement?.TO_USER || settlementData.toMember || '',
        toMemberName: newSettlement?.to_member_name || newSettlement?.toMemberName || newSettlement?.TO_MEMBER_NAME || settlementData.toMemberName || 'Unknown',
        amount: parseFloat(newSettlement?.amount) || parseFloat(newSettlement?.AMOUNT) || settlementData.amount || 0,
        date: new Date(newSettlement?.date || newSettlement?.DATE || newSettlement?.created_at || newSettlement?.CREATED_AT || Date.now()),
        confirmed: Boolean(newSettlement?.confirmed || newSettlement?.CONFIRMED || false),
        description: newSettlement?.description || newSettlement?.DESCRIPTION || settlementData.description || ''
      };
      
      setSettlements(prev => [transformedSettlement, ...prev]);
      toast.success("Settlement recorded successfully! 🎉");
      console.log('✅ Created new settlement:', transformedSettlement.description || 'Settlement payment');
    } catch (error) {
      console.error('❌ Failed to create settlement:', error);
      toast.error('Failed to record settlement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSettlement = async (settlementId: string) => {
    try {
      // Confirm settlement in database
      await settlementAPI.confirm(settlementId);
      
      // Update local state
      setSettlements(prev => prev.map(settlement => 
        settlement.id === settlementId ? { ...settlement, confirmed: true } : settlement
      ));
      
      toast.success("Settlement confirmed! 🎉");
      console.log('✅ Confirmed settlement:', settlementId);
    } catch (error) {
      console.error('❌ Failed to confirm settlement:', error);
      toast.error('Failed to confirm settlement. Please try again.');
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      setIsLoading(true);
      
      // Delete expense from database
      await expenseAPI.delete(expenseId);
      
      // Update local state
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
      
      toast.success("Expense deleted successfully!");
      console.log('🗑️ Deleted expense:', expenseId);
    } catch (error) {
      console.error('❌ Failed to delete expense:', error);
      toast.error('Failed to delete expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getExpensesByGroup = (groupId: string) => {
    // Handle case where expenses might be undefined
    if (!expenses) return [];
    return expenses.filter(expense => expense.groupId === groupId);
  };

  const getSettlementsByGroup = (groupId: string) => {
    // Handle case where settlements might be undefined
    if (!settlements) return [];
    return settlements.filter(settlement => settlement.groupId === groupId);
  };

  const getSettlementsForExpense = (expenseId: string) => {
    // Handle case where settlements might be undefined
    if (!settlements) return [];
    // In a real implementation, you would filter settlements related to a specific expense
    // For now, we'll return an empty array as this would require additional data structure
    return [];
  };

  const calculateBalances = (groupId: string) => {
    const groupExpenses = getExpensesByGroup(groupId);
    const groupSettlements = getSettlementsByGroup(groupId);
    
    const balances: Record<string, number> = {};
    
    // Calculate balances from expenses
    groupExpenses.forEach(expense => {
      // Person who paid gets credited
      balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;
      
      // People who owe get debited
      const splitAmount = expense.amount / expense.splitBetween.length;
      expense.splitBetween.forEach(personId => {
        balances[personId] = (balances[personId] || 0) - splitAmount;
      });
    });
    
    // Adjust balances from settlements
    groupSettlements.forEach(settlement => {
      if (settlement.confirmed) {
        balances[settlement.fromMember] = (balances[settlement.fromMember] || 0) - settlement.amount;
        balances[settlement.toMember] = (balances[settlement.toMember] || 0) + settlement.amount;
      }
    });
    
    return balances;
  };

  const getExpensesWhereIOwe = () => {
    // Handle case where expenses might be undefined
    if (!expenses || !currentUser) return [];
    
    return expenses.filter(expense => 
      expense.splitBetween.includes(currentUser.id) && 
      expense.paidBy !== currentUser.id &&
      !expense.settled
    );
  };

  const getMyOwedAmounts = () => {
    // Handle case where expenses or settlements might be undefined
    if (!expenses || !settlements || !currentUser) return [];
    
    // This is a simplified implementation
    // In a real app, you would calculate this based on group memberships
    const owedAmounts: Array<{
      groupId: string;
      groupName: string;
      owedTo: string;
      owedToName: string;
      amount: number;
    }> = [];
    
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