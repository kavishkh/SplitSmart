import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === 'your_service_role_key_here') {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  console.error('You can find your service role key in your Supabase project dashboard under Settings > API');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// RLS commands to execute
const rlsCommands = [
  // Enable RLS on all tables
  'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;',
  
  // Drop existing policies if they exist (ignore errors if they don't exist)
  'DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;',
  'DROP POLICY IF EXISTS "Allow all operations on groups" ON public.groups;',
  'DROP POLICY IF EXISTS "Allow all operations on expenses" ON public.expenses;',
  'DROP POLICY IF EXISTS "Allow all operations on settlements" ON public.settlements;',
  
  // Create permissive policies for development
  // WARNING: These policies are NOT secure for production use!
  'CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true) WITH CHECK (true);',
  'CREATE POLICY "Allow all operations on groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);',
  'CREATE POLICY "Allow all operations on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);',
  'CREATE POLICY "Allow all operations on settlements" ON public.settlements FOR ALL USING (true) WITH CHECK (true);',
  
  // Grant necessary permissions
  'GRANT ALL ON public.users TO authenticated;',
  'GRANT ALL ON public.groups TO authenticated;',
  'GRANT ALL ON public.expenses TO authenticated;',
  'GRANT ALL ON public.settlements TO authenticated;'
];

async function enableRLS() {
  console.log('Enabling Row Level Security on Supabase tables...');
  
  try {
    let successCount = 0;
    let warningCount = 0;
    
    for (const [index, command] of rlsCommands.entries()) {
      try {
        const { error } = await supabase.rpc('execute_sql', {
          sql: command
        });
        
        if (error) {
          console.log(`⚠️  Warning on command ${index + 1}:`, error.message);
          warningCount++;
        } else {
          console.log(`✅ Executed command ${index + 1}:`, command.substring(0, 50) + (command.length > 50 ? '...' : ''));
          successCount++;
        }
      } catch (cmdError) {
        console.log(`❌ Error on command ${index + 1}:`, cmdError.message);
        warningCount++;
      }
    }
    
    console.log(`\n📊 Execution Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Warnings: ${warningCount}`);
    console.log(`   📦 Total Commands: ${rlsCommands.length}`);
    
    console.log('\n🎉 RLS setup completed!');
    console.log('\n⚠️  WARNING: The permissive policies are NOT secure for production use!');
    console.log('For production, replace them with restrictive policies from rls_policies.sql');
    
  } catch (error) {
    console.error('❌ Error enabling RLS:', error.message);
    process.exit(1);
  }
}

enableRLS();