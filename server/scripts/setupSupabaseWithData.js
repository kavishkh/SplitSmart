import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tqhdwtwrbguharyecfyt.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxaGR3dHdyYmd1aGFyeWVjZnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODUzMzgsImV4cCI6MjA3NTc2MTMzOH0.osLw-8zpFQtNZ8byOxTl27fbJeob7n3KRkgKVT-LdEs';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Default data to insert
const defaultUsers = [
  { id: 'user1', name: 'John Doe', email: 'john@example.com', password: 'password123', initials: 'JD' },
  { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', password: 'password123', initials: 'JS' },
  { id: 'user3', name: 'Bob Johnson', email: 'bob@example.com', password: 'password123', initials: 'BJ' }
];

// Empty default groups and expenses to avoid inserting default data
const defaultGroups = [];
const defaultExpenses = [];
const defaultSettlements = [];

async function setupSupabaseWithData() {
  console.log('Setting up Supabase tables with default data...');
  
  try {
    // Note: In a real implementation with Supabase CLI, you would run migrations
    // For now, we'll just provide the SQL commands and insert default data
    
    // Insert default user data
    console.log('Inserting default user data...');
    const { error: userInsertError } = await supabase
      .from('users')
      .upsert(defaultUsers, { onConflict: 'id' });
    
    if (userInsertError) {
      console.log('User data insertion result:', userInsertError.message);
    } else {
      console.log('✅ Default user data inserted successfully');
    }
    
    // Insert default group data
    console.log('Inserting default group data...');
    // Convert members array to JSON string for insertion
    const groupsToInsert = defaultGroups.map(group => ({
      ...group,
      members: JSON.stringify(group.members)
    }));
    
    const { error: groupInsertError } = await supabase
      .from('groups')
      .upsert(groupsToInsert, { onConflict: 'id' });
    
    if (groupInsertError) {
      console.log('Group data insertion result:', groupInsertError.message);
    } else {
      console.log('✅ Default group data inserted successfully');
    }
    
    // Insert default expense data
    console.log('Inserting default expense data...');
    // Convert split_between array to JSON string for insertion
    const expensesToInsert = defaultExpenses.map(expense => ({
      ...expense,
      split_between: JSON.stringify(expense.split_between)
    }));
    
    const { error: expenseInsertError } = await supabase
      .from('expenses')
      .upsert(expensesToInsert, { onConflict: 'id' });
    
    if (expenseInsertError) {
      console.log('Expense data insertion result:', expenseInsertError.message);
    } else {
      console.log('✅ Default expense data inserted successfully');
    }
    
    // Insert default settlement data
    console.log('Inserting default settlement data...');
    const { error: settlementInsertError } = await supabase
      .from('settlements')
      .upsert(defaultSettlements, { onConflict: 'id' });
    
    if (settlementInsertError) {
      console.log('Settlement data insertion result:', settlementInsertError.message);
    } else {
      console.log('✅ Default settlement data inserted successfully');
    }
    
    console.log('\n🎉 Supabase setup with default data completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Enable real-time subscriptions by running the following SQL in your Supabase dashboard:');
    console.log('   ALTER PUBLICATION supabase_realtime ADD TABLE users;');
    console.log('   ALTER PUBLICATION supabase_realtime ADD TABLE groups;');
    console.log('   ALTER PUBLICATION supabase_realtime ADD TABLE expenses;');
    console.log('   ALTER PUBLICATION supabase_realtime ADD TABLE settlements;');
    console.log('\n2. Start your application with: npm run dev:full');
  } catch (error) {
    console.error('❌ Error setting up Supabase:', error.message);
  }
}

// Print the SQL commands that need to be run in the Supabase SQL editor
function printSQLCommands() {
  console.log(`
📋 PLEASE RUN THE FOLLOWING SQL COMMANDS IN YOUR SUPABASE SQL EDITOR:

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  initials TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  members JSONB DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  paid_by TEXT NOT NULL,
  split_between JSONB DEFAULT '[]',
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settlements table
CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  description TEXT,
  confirmed BOOLEAN DEFAULT false,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default user data
INSERT INTO users (id, name, email, password, initials) VALUES
('user1', 'John Doe', 'john@example.com', 'password123', 'JD'),
('user2', 'Jane Smith', 'jane@example.com', 'password123', 'JS'),
('user3', 'Bob Johnson', 'bob@example.com', 'password123', 'BJ')
ON CONFLICT (id) DO NOTHING;

-- No default group data will be inserted
-- You can add groups through the application interface

-- No default expense data will be inserted
-- You can add expenses through the application interface

-- No default settlement data will be inserted
-- You can add settlements through the application interface
`);
}

printSQLCommands();
console.log('\n⏳ Setting up default data...\n');
setupSupabaseWithData();