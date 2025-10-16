import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tqhdwtwrbguharyecfyt.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxaGR3dHdyYmd1aGFyeWVjZnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODUzMzgsImV4cCI6MjA3NTc2MTMzOH0.osLw-8zpFQtNZ8byOxTl27fbJeob7n3KRkgKVT-LdEs';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTables() {
  console.log('Setting up Supabase tables...');

  try {
    // Create users table
    const { error: usersError } = await supabase.rpc('create_users_table');
    if (usersError) {
      console.log('Users table creation result:', usersError.message);
    } else {
      console.log('Users table created successfully');
    }

    // Create groups table
    const { error: groupsError } = await supabase.rpc('create_groups_table');
    if (groupsError) {
      console.log('Groups table creation result:', groupsError.message);
    } else {
      console.log('Groups table created successfully');
    }

    // Create expenses table
    const { error: expensesError } = await supabase.rpc('create_expenses_table');
    if (expensesError) {
      console.log('Expenses table creation result:', expensesError.message);
    } else {
      console.log('Expenses table created successfully');
    }

    // Create settlements table
    const { error: settlementsError } = await supabase.rpc('create_settlements_table');
    if (settlementsError) {
      console.log('Settlements table creation result:', settlementsError.message);
    } else {
      console.log('Settlements table created successfully');
    }

    console.log('Supabase setup completed');
  } catch (error) {
    console.error('Error setting up Supabase:', error.message);
  }
}

// Since we can't create tables directly with the JavaScript client,
// we'll provide the SQL commands that need to be run in the Supabase SQL editor
function printSQLCommands() {
  console.log(`
Please run the following SQL commands in your Supabase SQL editor:

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

-- Add foreign key constraints (optional but recommended)
-- ALTER TABLE groups ADD CONSTRAINT fk_groups_created_by FOREIGN KEY (created_by) REFERENCES users(id);
-- ALTER TABLE expenses ADD CONSTRAINT fk_expenses_group_id FOREIGN KEY (group_id) REFERENCES groups(id);
-- ALTER TABLE expenses ADD CONSTRAINT fk_expenses_paid_by FOREIGN KEY (paid_by) REFERENCES users(id);
-- ALTER TABLE settlements ADD CONSTRAINT fk_settlements_group_id FOREIGN KEY (group_id) REFERENCES groups(id);
-- ALTER TABLE settlements ADD CONSTRAINT fk_settlements_from_user FOREIGN KEY (from_user) REFERENCES users(id);
-- ALTER TABLE settlements ADD CONSTRAINT fk_settlements_to_user FOREIGN KEY (to_user) REFERENCES users(id);
`);
}

printSQLCommands();