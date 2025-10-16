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

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkRLSStatus() {
  console.log('Checking RLS status for tables...\n');
  
  const tables = ['users', 'groups', 'expenses', 'settlements'];
  
  for (const table of tables) {
    try {
      // Check if RLS is enabled
      const { data: rlsData, error: rlsError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('tablename', table)
        .single();
      
      if (rlsError) {
        console.log(`❌ Error checking ${table}:`, rlsError.message);
        continue;
      }
      
      // This is a simplified check - in practice, you'd need to query the PostgreSQL system tables
      // directly to get the exact RLS status, which requires a different approach in Supabase
      console.log(`📋 ${table}: Table exists`);
      
      // Check for policies (simplified approach)
      console.log(`   🔍 RLS policies: Run "\\d policies" in SQL editor to see details`);
      
    } catch (error) {
      console.log(`❌ Error checking ${table}:`, error.message);
    }
  }
  
  console.log('\n📝 To get detailed RLS information:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Open the SQL editor');
  console.log('3. Run the following query:');
  console.log('   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = \'public\';');
  console.log('\n🔐 For policy details, run:');
  console.log('   SELECT * FROM pg_policy;');
}

checkRLSStatus();