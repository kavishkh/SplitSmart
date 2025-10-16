import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testExpenseAPI() {
  console.log('Testing Expense API...\n');
  
  try {
    // Test 1: Fetch all expenses
    console.log('1. Testing GET /api/expenses');
    const fetchResponse = await fetch('http://localhost:5000/api/expenses');
    const expenses = await fetchResponse.json();
    console.log(`   Found ${expenses.length} expenses\n`);
    
    // Test 2: Create a test expense
    console.log('2. Testing POST /api/expenses');
    const testExpense = {
      description: 'API Test Expense',
      amount: 50.75,
      category: 'other',
      groupId: 'test-group-id',
      paidBy: 'test-user-id',
      splitBetween: ['test-user-id'],
      date: new Date().toISOString()
    };
    
    const createResponse = await fetch('http://localhost:5000/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testExpense)
    });
    
    if (createResponse.ok) {
      const createdExpense = await createResponse.json();
      console.log('   ✅ Expense created successfully');
      console.log('   Created expense ID:', createdExpense.id);
      
      // Test 3: Fetch expenses for the test group
      console.log('\n3. Testing GET /api/expenses/group/:groupId');
      const groupResponse = await fetch(`http://localhost:5000/api/expenses/group/test-group-id`);
      const groupExpenses = await groupResponse.json();
      console.log(`   Found ${groupExpenses.length} expenses for test group`);
      
      // Test 4: Update the test expense
      console.log('\n4. Testing PUT /api/expenses/:id');
      const updateResponse = await fetch(`http://localhost:5000/api/expenses/${createdExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Updated API Test Expense',
          amount: 75.50
        })
      });
      
      if (updateResponse.ok) {
        console.log('   ✅ Expense updated successfully');
      } else {
        console.log('   ❌ Failed to update expense');
      }
      
      // Test 5: Delete the test expense
      console.log('\n5. Testing DELETE /api/expenses/:id');
      const deleteResponse = await fetch(`http://localhost:5000/api/expenses/${createdExpense.id}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        console.log('   ✅ Expense deleted successfully');
      } else {
        console.log('   ❌ Failed to delete expense');
      }
    } else {
      console.log('   ❌ Failed to create expense');
      const error = await createResponse.json();
      console.log('   Error:', error);
    }
    
    console.log('\n🎉 Expense API tests completed!');
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

testExpenseAPI();