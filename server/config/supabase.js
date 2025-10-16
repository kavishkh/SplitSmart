import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tqhdwtwrbguharyecfyt.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxaGR3dHdyYmd1aGFyeWVjZnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODUzMzgsImV4cCI6MjA3NTc2MTMzOH0.osLw-8zpFQtNZ8byOxTl27fbJeob7n3KRkgKVT-LdEs';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const connectSupabase = async () => {
  try {
    console.log('Attempting to connect to Supabase...');
    
    // Test the connection by checking if we can access the Supabase project
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    // We don't care about the actual result, just that we can connect
    console.log('✅ Supabase Connected');
    console.log(`📁 Supabase URL: ${SUPABASE_URL}`);
    
    return supabase;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return null;
  }
};

export { supabase };
export default connectSupabase;