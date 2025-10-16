import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExpenses } from "@/hooks/use-expenses";
import { useGroups } from "@/hooks/use-groups";
import { useUser } from "@/hooks/use-user";

export const TestExpenseFunctionality = () => {
  const { expenses, addExpense, refreshExpenses } = useExpenses();
  const { groups } = useGroups();
  const { currentUser } = useUser();
  const [testDescription, setTestDescription] = useState("Test Expense");
  const [testAmount, setTestAmount] = useState("100");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const handleAddTestExpense = async () => {
    if (!selectedGroupId) {
      alert("Please select a group");
      return;
    }

    try {
      await addExpense({
        description: testDescription,
        amount: parseFloat(testAmount),
        category: "other",
        groupId: selectedGroupId,
        paidBy: currentUser?.id || "current-user",
        splitBetween: [currentUser?.id || "current-user"],
        createdBy: currentUser?.id || "current-user"
      });
      alert("Expense added successfully!");
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense");
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshExpenses();
      alert("Expenses refreshed!");
    } catch (error) {
      console.error("Error refreshing expenses:", error);
      alert("Failed to refresh expenses");
    }
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Test Expense Functionality</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={testDescription}
            onChange={(e) => setTestDescription(e.target.value)}
            placeholder="Test Expense"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            value={testAmount}
            onChange={(e) => setTestAmount(e.target.value)}
            placeholder="100"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="group">Group</Label>
          <select
            id="group"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select a group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleAddTestExpense}>Add Test Expense</Button>
          <Button onClick={handleRefresh} variant="outline">Refresh Expenses</Button>
        </div>
        
        <div className="mt-4">
          <h3 className="font-semibold">Current Expenses Count: {expenses.length}</h3>
          {expenses.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto">
              {expenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="text-sm border-b py-1">
                  {expense.description} - ₹{expense.amount}
                </div>
              ))}
              {expenses.length > 5 && <div className="text-sm">... and {expenses.length - 5} more</div>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};