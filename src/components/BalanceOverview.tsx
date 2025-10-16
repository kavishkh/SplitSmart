import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Users, Award, Zap } from "lucide-react";
import { useExpenses } from "@/hooks/use-expenses";
import { useGroups } from "@/hooks/use-groups";
import { useUser } from "@/hooks/use-user";

interface BalanceCardProps {
  title: string;
  amount: number;
  type: 'owe' | 'owed' | 'total' | 'groups';
  icon: React.ReactNode;
  trend?: number;
  description: string;
}

const BalanceCard = ({ title, amount, type, icon, trend, description }: BalanceCardProps) => {
  // Format currency for Indian Rupees
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get color based on type and amount
  const getAmountColor = () => {
    if (type === 'total') {
      return amount > 0 ? 'text-success' : amount < 0 ? 'text-destructive' : 'text-foreground';
    }
    return 'text-foreground';
  };

  return (
    <Card className="card-balance animate-slide-up hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className={`text-2xl font-bold ${getAmountColor()}`}>
              {type === 'groups' ? amount : formatCurrency(Math.abs(amount))}
            </h3>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
        </div>
        
        {trend !== undefined && (
          <div className="flex items-center mt-2">
            <span className={`text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">from last month</span>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      </CardContent>
    </Card>
  );
};

export const BalanceOverview = () => {
  const { expenses, getExpensesWhereIOwe, getMyOwedAmounts } = useExpenses();
  const { groups } = useGroups();
  const { currentUser } = useUser();
  
  // Calculate financial overview
  let expensesWhereIOwe: any[] = [];
  let myOwedAmounts: any[] = [];
  let totalOwed = 0;
  let youAreOwed = 0;
  let totalBalance = 0;
  
  try {
    console.log('Calculating balance overview...');
    expensesWhereIOwe = getExpensesWhereIOwe();
    myOwedAmounts = getMyOwedAmounts();
    totalOwed = myOwedAmounts.reduce((sum, debt) => sum + (debt.amount || 0), 0);
    
    // Calculate how much others owe me (simplified calculation)
    youAreOwed = expenses
      .filter(expense => expense && expense.paidBy === (currentUser?.id || "current-user") && expense.splitBetween && expense.splitBetween.length > 1)
      .reduce((sum, expense) => {
        if (!expense) return sum;
        const amountPerPerson = expense.amount / (expense.splitBetween ? expense.splitBetween.length : 1);
        return sum + (amountPerPerson * ((expense.splitBetween ? expense.splitBetween.length : 1) - 1));
      }, 0);
    
    totalBalance = youAreOwed - totalOwed;
    console.log('Balance overview calculated:', { totalOwed, youAreOwed, totalBalance });
  } catch (error) {
    console.error('Error calculating balance overview:', error);
  }
  
  // Calculate achievements
  const expenseCount = expenses ? expenses.length : 0;
  const groupCount = groups ? groups.length : 0;
  
  // Achievement badges
  const achievements = [];
  if (expenseCount >= 5) achievements.push("Expense Tracker");
  if (groupCount >= 2) achievements.push("Group Master");
  if (totalBalance > 0) achievements.push("In the Green");
  if (totalBalance < 0 && totalBalance > -1000) achievements.push("Balanced Budgeter");
  if (totalBalance < -1000) achievements.push("Big Spender");
  
  const balanceData = [
    {
      title: "You owe",
      amount: totalOwed || 0,
      type: "owe" as const,
      icon: <TrendingDown className="h-5 w-5 text-destructive" />,
      trend: totalOwed > 0 ? -12 : undefined,
      description: "Amount you need to pay others"
    },
    {
      title: "You are owed",
      amount: youAreOwed || 0,
      type: "owed" as const,
      icon: <TrendingUp className="h-5 w-5 text-success" />,
      trend: youAreOwed > 0 ? 8 : undefined,
      description: "Amount others need to pay you"
    },
    {
      title: "Total Balance",
      amount: totalBalance || 0,
      type: "total" as const,
      icon: <DollarSign className="h-5 w-5 text-primary" />,
      trend: totalBalance > 0 ? 15 : totalBalance < 0 ? -10 : undefined,
      description: totalBalance > 0 
        ? "You're in profit! Others owe you money" 
        : totalBalance < 0 
          ? "You owe money to others" 
          : "All balances are settled"
    },
    {
      title: "Active Groups",
      amount: groups ? groups.length : 0,
      type: "groups" as const,
      icon: <Users className="h-5 w-5 text-accent" />,
      description: groups && groups.length > 0 
        ? `Part of ${groups.length} expense group${groups.length !== 1 ? 's' : ''}` 
        : "Create your first group to start"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {balanceData.map((data, index) => (
          <div key={data.title} style={{ animationDelay: `${index * 0.1}s` }}>
            <BalanceCard {...data} />
          </div>
        ))}
      </div>
      
      {/* Achievements Section */}
      {achievements.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white animate-slide-up">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Award className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Your Achievements</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {achievements.map((achievement, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-white/20 text-white hover:bg-white/30 animate-fade-in-scale"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {achievement}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};