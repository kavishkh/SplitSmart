import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tqhdwtwrbguharyecfyt.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxaGR3dHdyYmd1aGFyeWVjZnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODUzMzgsImV4cCI6MjA3NTc2MTMzOH0.osLw-8zpFQtNZ8byOxTl27fbJeob7n3KRkgKVT-LdEs';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function enableRLS() {
  console.log('Enabling Row Level Security (RLS) on all tables...');
  
  try {
    // Enable RLS on users table
    console.log('Enabling RLS on users table...');
    let { error: usersError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;'
    });
    
    if (usersError) {
      console.log('Users RLS error:', usersError.message);
    } else {
      console.log('✅ RLS enabled on users table');
    }
    
    // Enable RLS on groups table
    console.log('Enabling RLS on groups table...');
    let { error: groupsError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;'
    });
    
    if (groupsError) {
      console.log('Groups RLS error:', groupsError.message);
    } else {
      console.log('✅ RLS enabled on groups table');
    }
    
    // Enable RLS on expenses table
    console.log('Enabling RLS on expenses table...');
    let { error: expensesError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;'
    });
    
    if (expensesError) {
      console.log('Expenses RLS error:', expensesError.message);
    } else {
      console.log('✅ RLS enabled on expenses table');
    }
    
    // Enable RLS on settlements table
    console.log('Enabling RLS on settlements table...');
    let { error: settlementsError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;'
    });
    
    if (settlementsError) {
      console.log('Settlements RLS error:', settlementsError.message);
    } else {
      console.log('✅ RLS enabled on settlements table');
    }
    
    console.log('\n🎉 RLS enabled on all tables!');
    console.log('\n📝 Next steps:');
    console.log('1. Set up RLS policies for each table based on your application requirements');
    console.log('2. Start your application with: npm run dev:full');
  } catch (error) {
    console.error('❌ Error enabling RLS:', error.message);
  }
}

enableRLS();