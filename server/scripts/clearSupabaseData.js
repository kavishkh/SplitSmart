import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tqhdwtwrbguharyecfyt.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxaGR3dHdyYmd1aGFyeWVjZnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODUzMzgsImV4cCI6MjA3NTc2MTMzOH0.osLw-8zpFQtNZ8byOxTl27fbJeob7n3KRkgKVT-LdEs';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function clearSupabaseData() {
  console.log('Clearing Supabase data...');
  
  try {
    // Clear expenses table
    console.log('Clearing expenses...');
    const { error: expenseError } = await supabase
      .from('expenses')
      .delete()
      .neq('id', ''); // Delete all records
    
    if (expenseError) {
      console.log('Expense deletion error:', expenseError.message);
    } else {
      console.log('✅ Expenses cleared successfully');
    }
    
    // Clear settlements table
    console.log('Clearing settlements...');
    const { error: settlementError } = await supabase
      .from('settlements')
      .delete()
      .neq('id', ''); // Delete all records
    
    if (settlementError) {
      console.log('Settlement deletion error:', settlementError.message);
    } else {
      console.log('✅ Settlements cleared successfully');
    }
    
    // Clear groups table
    console.log('Clearing groups...');
    const { error: groupError } = await supabase
      .from('groups')
      .delete()
      .neq('id', ''); // Delete all records
    
    if (groupError) {
      console.log('Group deletion error:', groupError.message);
    } else {
      console.log('✅ Groups cleared successfully');
    }
    
    console.log('\n🎉 Supabase data cleared successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Start your application with: npm run dev:full');
  } catch (error) {
    console.error('❌ Error clearing Supabase data:', error.message);
  }
}

clearSupabaseData();