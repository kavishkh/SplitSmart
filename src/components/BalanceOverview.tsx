import React from "react";
import { TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGroups } from "@/hooks/use-groups";
import { useExpenses } from "@/hooks/use-expenses";

interface BalanceCardProps {
  title: string;
  amount: number;
  type: "owe" | "owed" | "total" | "groups";
  icon: React.ReactNode;
  trend?: number;
}

const BalanceCard = ({ title, amount, type, icon, trend }: BalanceCardProps) => {
  const isPositive = type === "owed" || (type === "total" && amount >= 0);
  const isNegative = type === "owe" || (type === "total" && amount < 0);
  
  // Style constants
  const cardClass = "card-balance animate-slide-up hover:animate-pulse-glow transition-all duration-300";
  const oweIconClass = "p-3 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/10";
  const owedIconClass = "p-3 rounded-xl bg-gradient-to-br from-success/20 to-success/10";
  const groupsIconClass = "p-3 rounded-xl bg-gradient-accent/20";
  const defaultIconClass = "p-3 rounded-xl bg-gradient-primary/20";
  
  const getIconWrapperClass = () => {
    if (type === "owe") return oweIconClass;
    if (type === "owed") return owedIconClass;
    if (type === "groups") return groupsIconClass;
    return defaultIconClass;
  };
  
  return (
    <Card className={cardClass}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={getIconWrapperClass()}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-center space-x-2 mt-1">
                {type !== "groups" ? (
                  <span className={`text-2xl font-bold counter-up ${
                    isPositive ? "balance-positive" : 
                    isNegative ? "balance-negative" : 
                    "text-foreground"
                  }`}>
                    ₹{Math.abs(amount).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-foreground counter-up">
                    {amount}
                  </span>
                )}
                {trend && (
                  <Badge variant={trend > 0 ? "default" : "destructive"} className="animate-fade-in-scale">
                    {trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {Math.abs(trend)}%
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {type !== "groups" && (
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${
                isPositive ? "bg-gradient-success" : 
                isNegative ? "bg-gradient-to-r from-destructive to-warning" : 
                "bg-gradient-primary"
              }`}
              style={{ width: `${Math.min(Math.abs(amount) / 1000 * 100, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const BalanceOverview = () => {
  const { groups } = useGroups();
  const { getExpensesWhereIOwe, getMyOwedAmounts, expenses } = useExpenses();
  
  // Add error boundaries for data calculations
  let expensesWhereIOwe = [];
  let myOwedAmounts = [];
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
      .filter(expense => expense && expense.paidBy === "current-user" && expense.splitBetween && expense.splitBetween.length > 1)
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
  
  const balanceData = [
    {
      title: "You owe",
      amount: totalOwed || 0,
      type: "owe" as const,
      icon: <TrendingDown className="h-5 w-5 text-destructive" />,
      trend: totalOwed > 0 ? -12 : undefined
    },
    {
      title: "You are owed",
      amount: youAreOwed || 0,
      type: "owed" as const,
      icon: <TrendingUp className="h-5 w-5 text-success" />,
      trend: youAreOwed > 0 ? 8 : undefined
    },
    {
      title: "Total Balance",
      amount: totalBalance || 0,
      type: "total" as const,
      icon: <DollarSign className="h-5 w-5 text-primary" />,
      trend: totalBalance > 0 ? 15 : totalBalance < 0 ? -10 : undefined
    },
    {
      title: "Active Groups",
      amount: groups ? groups.length : 0,
      type: "groups" as const,
      icon: <Users className="h-5 w-5 text-accent" />
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {balanceData.map((data, index) => (
        <div key={data.title} style={{ animationDelay: `${index * 0.1}s` }}>
          <BalanceCard {...data} />
        </div>
      ))}
    </div>
  );
};