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

async function fixExpenseCreatedBy() {
  console.log('Fixing created_by field for existing expenses...\n');
  
  try {
    // Fetch all expenses
    const { data: expenses, error: fetchError } = await supabase
      .from('expenses')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error fetching expenses:', fetchError.message);
      process.exit(1);
    }
    
    console.log(`Found ${expenses.length} expenses\n`);
    
    let fixedCount = 0;
    
    // Update each expense that doesn't have created_by set
    for (const expense of expenses) {
      // Skip if created_by is already set
      if (expense.created_by) {
        console.log(`✅ Expense ${expense.id} already has created_by set`);
        continue;
      }
      
      // Set created_by to the paid_by user as a default
      const { error: updateError } = await supabase
        .from('expenses')
        .update({ created_by: expense.paid_by })
        .eq('id', expense.id);
      
      if (updateError) {
        console.error(`❌ Error updating expense ${expense.id}:`, updateError.message);
      } else {
        console.log(`✅ Fixed expense ${expense.id}: set created_by to ${expense.paid_by}`);
        fixedCount++;
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} expenses`);
  } catch (error) {
    console.error('❌ Error during fix process:', error.message);
    process.exit(1);
  }
}

fixExpenseCreatedBy();