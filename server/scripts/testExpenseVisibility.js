import fetch from 'node-fetch';

async function testExpenseVisibility() {
  console.log('🧪 Testing Expense Visibility Fix...\n');
  
  try {
    // Test 1: Create a group for user-tusha
    console.log('1. Creating a group for user-tusha...');
    const groupResponse = await fetch('http://localhost:40001/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Group for Expenses',
        description: 'Group to test expense visibility',
        createdBy: 'user-tusha',
        members: [
          { id: 'user-tusha', name: 'tusha', email: 'tusha@splitsmart.com' },
          { id: 'user-john', name: 'John', email: 'john@example.com' }
        ]
      }),
    });
    
    const group = await groupResponse.json();
    console.log(`   Created group: ${group.name} (ID: ${group.id})`);
    
    // Test 2: Create an expense in the group paid by user-tusha
    console.log('2. Creating an expense paid by user-tusha...');
    const expenseResponse = await fetch('http://localhost:40001/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Dinner at Restaurant',
        amount: 100,
        category: 'Food',
        groupId: group.id,
        paidBy: 'user-tusha',
        splitBetween: ['user-tusha', 'user-john'],
        createdBy: 'user-tusha'
      }),
    });
    
    const expense = await expenseResponse.json();
    console.log(`   Created expense: ${expense.description} (ID: ${expense.id})`);
    
    // Test 3: Fetch expenses for user-tusha (should see the expense)
    console.log('3. Fetching expenses for user-tusha...');
    const response1 = await fetch('http://localhost:40001/api/expenses?userId=user-tusha');
    const expenses1 = await response1.json();
    console.log(`   Found ${expenses1.length} expenses for user-tusha`);
    
    // Test 4: Fetch expenses for user-john (should see the expense since he's involved)
    console.log('4. Fetching expenses for user-john...');
    const response2 = await fetch('http://localhost:40001/api/expenses?userId=user-john');
    const expenses2 = await response2.json();
    console.log(`   Found ${expenses2.length} expenses for user-john`);
    
    // Test 5: Fetch expenses for a different user (should see no expenses)
    console.log('5. Fetching expenses for user-alice...');
    const response3 = await fetch('http://localhost:40001/api/expenses?userId=user-alice');
    const expenses3 = await response3.json();
    console.log(`   Found ${expenses3.length} expenses for user-alice`);
    
    // Test 6: Fetch expenses by group for user-tusha
    console.log('6. Fetching expenses by group for user-tusha...');
    const response4 = await fetch(`http://localhost:40001/api/expenses/group/${group.id}?userId=user-tusha`);
    const groupExpenses1 = await response4.json();
    console.log(`   Found ${groupExpenses1.length} expenses in group for user-tusha`);
    
    // Test 7: Fetch expenses by group for user-john
    console.log('7. Fetching expenses by group for user-john...');
    const response5 = await fetch(`http://localhost:40001/api/expenses/group/${group.id}?userId=user-john`);
    const groupExpenses2 = await response5.json();
    console.log(`   Found ${groupExpenses2.length} expenses in group for user-john`);
    
    // Test 8: Fetch expenses by group for user-alice
    console.log('8. Fetching expenses by group for user-alice...');
    const response6 = await fetch(`http://localhost:40001/api/expenses/group/${group.id}?userId=user-alice`);
    const groupExpenses3 = await response6.json();
    console.log(`   Found ${groupExpenses3.length} expenses in group for user-alice`);
    
    console.log('\n🎉 Expense visibility test completed!');
    console.log('Summary:');
    console.log(`- User-tusha can see ${expenses1.length} expenses (should be 1)`);
    console.log(`- User-john can see ${expenses2.length} expenses (should be 1 since he's involved)`);
    console.log(`- User-alice can see ${expenses3.length} expenses (should be 0)`);
    console.log(`- In group context:`);
    console.log(`  • User-tusha can see ${groupExpenses1.length} expenses (should be 1)`);
    console.log(`  • User-john can see ${groupExpenses2.length} expenses (should be 1)`);
    console.log(`  • User-alice can see ${groupExpenses3.length} expenses (should be 0)`);
    
    // Verify results
    const userTushaCanSeeExpense = expenses1.length === 1;
    const userJohnCanSeeExpense = expenses2.length === 1;
    const userAliceCannotSeeExpense = expenses3.length === 0;
    const inGroupUserTushaCanSeeExpense = groupExpenses1.length === 1;
    const inGroupUserJohnCanSeeExpense = groupExpenses2.length === 1;
    const inGroupUserAliceCannotSeeExpense = groupExpenses3.length === 0;
    
    console.log('\n✅ Verification Results:');
    console.log(`- User-tusha can see their expense: ${userTushaCanSeeExpense ? '✅ YES' : '❌ NO'}`);
    console.log(`- User-john can see expense they're involved in: ${userJohnCanSeeExpense ? '✅ YES' : '❌ NO'}`);
    console.log(`- User-alice cannot see unrelated expenses: ${userAliceCannotSeeExpense ? '✅ YES' : '❌ NO'}`);
    console.log(`- In group context for user-tusha: ${inGroupUserTushaCanSeeExpense ? '✅ YES' : '❌ NO'}`);
    console.log(`- In group context for user-john: ${inGroupUserJohnCanSeeExpense ? '✅ YES' : '❌ NO'}`);
    console.log(`- In group context for user-alice: ${inGroupUserAliceCannotSeeExpense ? '✅ YES' : '❌ NO'}`);
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Run the test
testExpenseVisibility();