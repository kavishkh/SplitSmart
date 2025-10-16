import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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

async function runCompleteSetup() {
  console.log('Running complete Supabase setup...');
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'server', 'scripts', 'completeSetup.sql');
    const sqlCommands = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL commands...');
    
    // Split commands by semicolon and execute each one
    const commands = sqlCommands
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    let successCount = 0;
    let warningCount = 0;
    
    for (const [index, command] of commands.entries()) {
      if (command) {
        try {
          // Use the Supabase Admin API to execute raw SQL
          const { error } = await supabase.rpc('execute_sql', {
            sql: command
          });
          
          if (error) {
            // Log warnings but continue execution
            console.log(`⚠️  Warning on command ${index + 1}:`, error.message);
            warningCount++;
          } else {
            console.log(`✅ Executed command ${index + 1}:`, command.substring(0, 50) + (command.length > 50 ? '...' : ''));
            successCount++;
          }
        } catch (cmdError) {
          // Log errors but continue execution
          console.log(`❌ Error on command ${index + 1}:`, cmdError.message);
          warningCount++;
        }
      }
    }
    
    console.log(`\n📊 Execution Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Warnings: ${warningCount}`);
    console.log(`   📦 Total Commands: ${commands.length}`);
    
    console.log('\n🎉 Complete Supabase setup finished!');
    console.log('\n📝 Next steps:');
    console.log('1. The RLS security warnings should now be resolved');
    console.log('2. Start your application with: npm run dev:full');
  } catch (error) {
    console.error('❌ Error running complete setup:', error.message);
    process.exit(1);
  }
}

runCompleteSetup();