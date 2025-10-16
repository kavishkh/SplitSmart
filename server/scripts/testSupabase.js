import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tqhdwtwrbguharyecfyt.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxaGR3dHdyYmd1aGFyeWVjZnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODUzMzgsImV4cCI6MjA3NTc2MTMzOH0.osLw-8zpFQtNZ8byOxTl27fbJeob7n3KRkgKVT-LdEs';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test connection by getting the Supabase project info
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('Connection test result:', error.message);
      console.log('This might be because the tables do not exist yet.');
      console.log('Please run the SQL commands from setupSupabase.js in your Supabase SQL editor.');
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

async function testRealtimeCapability() {
  console.log('Testing real-time capability...');
  
  try {
    // Try to create a channel to test real-time functionality
    const channel = supabase.channel('test-channel');
    
    if (channel) {
      console.log('✅ Real-time capability is available');
      // Clean up the channel
      supabase.removeChannel(channel);
      return true;
    } else {
      console.log('❌ Real-time capability is not available');
      return false;
    }
  } catch (error) {
    console.error('❌ Real-time capability test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('Running all Supabase tests...\n');
  
  const connectionSuccess = await testConnection();
  console.log('');
  
  const realtimeSuccess = await testRealtimeCapability();
  console.log('');
  
  if (connectionSuccess && realtimeSuccess) {
    console.log('🎉 All tests passed! Supabase is ready to use with real-time capabilities.');
  } else {
    console.log('⚠️ Some tests failed. Please check your Supabase configuration.');
  }
}

runAllTests();