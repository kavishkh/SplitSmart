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
  getExpensesByGroup: (groupId: string) => Expense[];
  getSettlementsByGroup: (groupId: string) => Settlement[];
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
      
      // Transform database expenses
      const transformedExpenses: Expense[] = validDbExpenses.map((dbExpense: any) => ({
        id: dbExpense?.id || `expense-${Date.now()}-${Math.random()}`,
        description: dbExpense?.description || 'Unnamed expense',
        amount: dbExpense?.amount || 0,
        category: dbExpense?.category || 'Other',
        groupId: dbExpense?.groupId || '',
        paidBy: dbExpense?.paidBy || 'unknown',
        splitBetween: Array.isArray(dbExpense?.splitBetween) ? dbExpense.splitBetween : [],
        date: new Date(dbExpense?.date || Date.now()),
        createdBy: dbExpense?.createdBy || currentUser?.id || 'current-user',
        settled: dbExpense?.settled || false
      }));
      
      // Transform database settlements
      const transformedSettlements: Settlement[] = validDbSettlements.map((dbSettlement: any) => ({
        id: dbSettlement?.id || `settlement-${Date.now()}-${Math.random()}`,
        groupId: dbSettlement?.groupId || '',
        groupName: dbSettlement?.groupName || 'Unnamed Group',
        fromMember: dbSettlement?.fromMember || '',
        fromMemberName: dbSettlement?.fromMemberName || 'Unknown',
        toMember: dbSettlement?.toMember || '',
        toMemberName: dbSettlement?.toMemberName || 'Unknown',
        amount: dbSettlement?.amount || 0,
        date: new Date(dbSettlement?.date || Date.now()),
        confirmed: dbSettlement?.confirmed || false,
        description: dbSettlement?.description || ''
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
      
      // Create expense in database
      const newExpense = await expenseAPI.create({
        ...expenseData,
        createdBy: currentUser?.id || 'current-user'
      });

      // Transform and add to local state
      const transformedExpense: Expense = {
        id: newExpense?.id || `expense-${Date.now()}`,
        description: newExpense?.description || expenseData.description || 'New expense',
        amount: newExpense?.amount || expenseData.amount || 0,
        category: newExpense?.category || expenseData.category || 'Other',
        groupId: newExpense?.groupId || expenseData.groupId || '',
        paidBy: newExpense?.paidBy || expenseData.paidBy || currentUser?.id || 'current-user',
        splitBetween: Array.isArray(newExpense?.splitBetween) ? newExpense.splitBetween : expenseData.splitBetween || [],
        date: new Date(newExpense?.date || Date.now()),
        createdBy: newExpense?.createdBy || currentUser?.id || 'current-user',
        settled: false
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
      
      // Create settlement in database
      const newSettlement = await settlementAPI.create(settlementData);

      // Transform and add to local state
      const transformedSettlement: Settlement = {
        id: newSettlement?.id || `settlement-${Date.now()}`,
        groupId: newSettlement?.groupId || settlementData.groupId || '',
        groupName: newSettlement?.groupName || settlementData.groupName || 'Group',
        fromMember: newSettlement?.fromMember || settlementData.fromMember || '',
        fromMemberName: newSettlement?.fromMemberName || settlementData.fromMemberName || 'Member',
        toMember: newSettlement?.toMember || settlementData.toMember || '',
        toMemberName: newSettlement?.toMemberName || settlementData.toMemberName || 'Member',
        amount: newSettlement?.amount || settlementData.amount || 0,
        date: new Date(newSettlement?.date || Date.now()),
        confirmed: false,
        description: newSettlement?.description || settlementData.description || ''
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

  const confirmSettlement = (settlementId: string) => {
    // Handle case where settlements might be undefined
    if (!settlements) {
      console.warn('No settlements available to confirm');
      return;
    }
    
    setSettlements(prev => prev.map(settlement => 
      settlement.id === settlementId ? { ...settlement, confirmed: true } : settlement
    ));
    toast.success("Settlement confirmed!");
    console.log('✅ Confirmed settlement:', settlementId);
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
        getExpensesByGroup,
        getSettlementsByGroup,
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