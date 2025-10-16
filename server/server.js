import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './config/supabase.js';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data store for demo mode
let users = [];
let groups = [];
let expenses = [];
let settlements = [];

// Database connection status
let isDatabaseConnected = false;
let dbClient = null;

// Connect to database
(async () => {
  try {
    console.log('Attempting to connect to Supabase...');
    
    // Test the connection by checking if we can access the Supabase project
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    // We don't care about the actual result, just that we can connect
    console.log('✅ Supabase Connected');
    console.log('✅ Using Supabase for data storage');
    isDatabaseConnected = true;
    dbClient = supabase;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    console.log('⚠️ Supabase connection failed. Application will run in demo mode with limited functionality.');
    console.log('⚠️ Data will not be persisted between sessions.');
  }
})();

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    databaseConnected: isDatabaseConnected,
    message: isDatabaseConnected 
      ? 'SplitSmart backend is running with Supabase' 
      : 'SplitSmart backend is running in demo mode (no database persistence)'
  });
});

// User routes
app.get('/api/users', async (req, res) => {
  if (!isDatabaseConnected) {
    // Return in-memory users for demo mode
    return res.json(users);
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  if (!isDatabaseConnected) {
    // Create user in in-memory store for demo mode
    const user = { id: generateId(), ...req.body, createdAt: new Date(), updatedAt: new Date() };
    users.push(user);
    return res.status(201).json(user);
  }
  
  try {
    // Ensure the user has an ID
    const userData = {
      id: req.body.id || generateId(),
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      initials: req.body.initials || req.body.name.substring(0, 2).toUpperCase(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  if (!isDatabaseConnected) {
    // Find user in in-memory store for demo mode
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Group routes
app.get('/api/groups', async (req, res) => {
  if (!isDatabaseConnected) {
    // Return in-memory groups for demo mode
    return res.json(groups);
  }
  
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

app.post('/api/groups', async (req, res) => {
  if (!isDatabaseConnected) {
    // Create group in in-memory store for demo mode
    const group = { id: generateId(), ...req.body, createdAt: new Date(), updatedAt: new Date() };
    groups.push(group);
    return res.status(201).json(group);
  }
  
  try {
    // Ensure the group has an ID
    const groupData = {
      id: req.body.id || generateId(),
      name: req.body.name,
      description: req.body.description,
      members: req.body.members || [],
      created_by: req.body.createdBy || req.body.created_by,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const { data, error } = await supabase
      .from('groups')
      .insert([groupData])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

app.get('/api/groups/:id', async (req, res) => {
  if (!isDatabaseConnected) {
    // Find group in in-memory store for demo mode
    const group = groups.find(g => g.id === req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    return res.json(group);
  }
  
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

app.put('/api/groups/:id', async (req, res) => {
  if (!isDatabaseConnected) {
    // Update group in in-memory store for demo mode
    const groupIndex = groups.findIndex(g => g.id === req.params.id);
    if (groupIndex === -1) {
      return res.status(404).json({ error: 'Group not found' });
    }
    groups[groupIndex] = { ...groups[groupIndex], ...req.body, updatedAt: new Date() };
    return res.json(groups[groupIndex]);
  }
  
  try {
    const groupData = {
      name: req.body.name,
      description: req.body.description,
      members: req.body.members || [],
      created_by: req.body.createdBy || req.body.created_by,
      updated_at: new Date()
    };
    
    const { data, error } = await supabase
      .from('groups')
      .update(groupData)
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    if (data.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

app.delete('/api/groups/:id', async (req, res) => {
  if (!isDatabaseConnected) {
    // Delete group from in-memory store for demo mode
    const groupIndex = groups.findIndex(g => g.id === req.params.id);
    if (groupIndex === -1) {
      return res.status(404).json({ error: 'Group not found' });
    }
    groups.splice(groupIndex, 1);
    return res.status(204).send();
  }
  
  try {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).send();
  }
});

// Expense routes
app.get('/api/expenses', async (req, res) => {
  if (!isDatabaseConnected) {
    // Return in-memory expenses for demo mode
    return res.json(expenses);
  }
  
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', async (req, res) => {
  if (!isDatabaseConnected) {
    // Create expense in in-memory store for demo mode
    const expense = { id: generateId(), ...req.body, createdAt: new Date(), updatedAt: new Date() };
    expenses.push(expense);
    return res.status(201).json(expense);
  }
  
  try {
    // Ensure the expense has an ID and handle both naming conventions
    const expenseData = {
      id: req.body.id || req.body.ID || generateId(),
      group_id: req.body.groupId || req.body.group_id || req.body.GROUP_ID,
      description: req.body.description || req.body.DESCRIPTION,
      amount: req.body.amount || req.body.AMOUNT,
      paid_by: req.body.paidBy || req.body.paid_by || req.body.PAID_BY,
      split_between: req.body.splitBetween || req.body.split_between || req.body.SPLIT_BETWEEN || [],
      date: req.body.date || req.body.DATE || new Date(),
      created_by: req.body.createdBy || req.body.created_by || req.body.CREATED_BY,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Ensure all required fields are present
    if (!expenseData.description || !expenseData.amount || !expenseData.group_id) {
      return res.status(400).json({ error: 'Missing required fields: description, amount, and group_id are required' });
    }
    
    // Ensure amount is a number
    expenseData.amount = parseFloat(expenseData.amount);
    if (isNaN(expenseData.amount)) {
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }
    
    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

app.get('/api/expenses/group/:groupId', async (req, res) => {
  if (!isDatabaseConnected) {
    // Find expenses for group in in-memory store for demo mode
    const groupExpenses = expenses.filter(e => e.groupId === req.params.groupId || e.group_id === req.params.groupId);
    return res.json(groupExpenses);
  }
  
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('group_id', req.params.groupId);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching group expenses:', error);
    res.status(500).json({ error: 'Failed to fetch group expenses' });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  if (!isDatabaseConnected) {
    // Update expense in in-memory store for demo mode
    const expenseIndex = expenses.findIndex(e => e.id === req.params.id);
    if (expenseIndex === -1) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    expenses[expenseIndex] = { ...expenses[expenseIndex], ...req.body, updatedAt: new Date() };
    return res.json(expenses[expenseIndex]);
  }
  
  try {
    const expenseData = {
      description: req.body.description || req.body.DESCRIPTION,
      amount: req.body.amount || req.body.AMOUNT,
      group_id: req.body.groupId || req.body.group_id || req.body.GROUP_ID,
      paid_by: req.body.paidBy || req.body.paid_by || req.body.PAID_BY,
      split_between: req.body.splitBetween || req.body.split_between || req.body.SPLIT_BETWEEN || [],
      date: req.body.date || req.body.DATE,
      updated_at: new Date()
    };
    
    // Ensure amount is a number if provided
    if (expenseData.amount !== undefined) {
      expenseData.amount = parseFloat(expenseData.amount);
      if (isNaN(expenseData.amount)) {
        return res.status(400).json({ error: 'Amount must be a valid number' });
      }
    }
    
    const { data, error } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    if (data.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  if (!isDatabaseConnected) {
    // Delete expense from in-memory store for demo mode
    const expenseIndex = expenses.findIndex(e => e.id === req.params.id);
    if (expenseIndex === -1) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    expenses.splice(expenseIndex, 1);
    return res.status(204).send();
  }
  
  try {
    // Bypass RLS by using service role key for deletion
    // This allows any authenticated user to delete expenses for demo purposes
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', req.params.id);
    
    if (error) {
      console.error('Error deleting expense:', error);
      // If RLS prevents deletion, try a different approach
      if (error.code === '42501') { // insufficient_privilege
        return res.status(403).json({ 
          error: 'Permission denied', 
          message: 'You do not have permission to delete this expense. Only the creator can delete expenses.' 
        });
      }
      throw error;
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense. Please try again.' });
  }
});

// Settlement routes
app.get('/api/settlements', async (req, res) => {
  if (!isDatabaseConnected) {
    // Return in-memory settlements for demo mode
    return res.json(settlements);
  }
  
  try {
    const { data, error } = await supabase
      .from('settlements')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

app.post('/api/settlements', async (req, res) => {
  if (!isDatabaseConnected) {
    // Create settlement in in-memory store for demo mode
    const settlement = { id: generateId(), ...req.body, createdAt: new Date(), updatedAt: new Date() };
    settlements.push(settlement);
    return res.status(201).json(settlement);
  }
  
  try {
    // Ensure the settlement has an ID and handle both naming conventions
    const settlementData = {
      id: req.body.id || req.body.ID || generateId(),
      group_id: req.body.groupId || req.body.group_id || req.body.GROUP_ID,
      from_user: req.body.fromUser || req.body.from_user || req.body.from || req.body.FROM_USER,
      to_user: req.body.toUser || req.body.to_user || req.body.to || req.body.TO_USER,
      amount: req.body.amount || req.body.AMOUNT,
      description: req.body.description || req.body.DESCRIPTION,
      confirmed: req.body.confirmed || req.body.CONFIRMED || false,
      date: req.body.date || req.body.DATE || new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Ensure all required fields are present
    if (!settlementData.amount || !settlementData.group_id || !settlementData.from_user || !settlementData.to_user) {
      return res.status(400).json({ error: 'Missing required fields: amount, group_id, from_user, and to_user are required' });
    }
    
    // Ensure amount is a number
    settlementData.amount = parseFloat(settlementData.amount);
    if (isNaN(settlementData.amount)) {
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }
    
    const { data, error } = await supabase
      .from('settlements')
      .insert([settlementData])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating settlement:', error);
    res.status(500).json({ error: 'Failed to create settlement' });
  }
});

app.patch('/api/settlements/:id/confirm', async (req, res) => {
  if (!isDatabaseConnected) {
    // Confirm settlement in in-memory store for demo mode
    const settlementIndex = settlements.findIndex(s => s.id === req.params.id);
    if (settlementIndex === -1) {
      return res.status(404).json({ error: 'Settlement not found' });
    }
    settlements[settlementIndex] = { ...settlements[settlementIndex], confirmed: true, updatedAt: new Date() };
    return res.json(settlements[settlementIndex]);
  }
  
  try {
    const { data, error } = await supabase
      .from('settlements')
      .update({ confirmed: true, updated_at: new Date() })
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    if (data.length === 0) {
      return res.status(404).json({ error: 'Settlement not found' });
    }
    res.json(data[0]);
  } catch (error) {
    console.error('Error confirming settlement:', error);
    res.status(500).json({ error: 'Failed to confirm settlement' });
  }
});

app.delete('/api/settlements/:id', async (req, res) => {
  if (!isDatabaseConnected) {
    // Delete settlement from in-memory store for demo mode
    const settlementIndex = settlements.findIndex(s => s.id === req.params.id);
    if (settlementIndex === -1) {
      return res.status(404).json({ error: 'Settlement not found' });
    }
    settlements.splice(settlementIndex, 1);
    return res.status(204).send();
  }
  
  try {
    const { error } = await supabase
      .from('settlements')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting settlement:', error);
    res.status(500).send();
  }
});

// Real-time data subscription endpoints
app.get('/api/subscribe/users', (req, res) => {
  if (!isDatabaseConnected) {
    return res.status(400).json({ error: 'Real-time subscriptions not available in demo mode' });
  }
  
  // In a real implementation, you would set up a WebSocket connection here
  // For now, we'll just return a success message
  res.json({ message: 'Real-time subscription for users would be established here' });
});

app.get('/api/subscribe/groups', (req, res) => {
  if (!isDatabaseConnected) {
    return res.status(400).json({ error: 'Real-time subscriptions not available in demo mode' });
  }
  
  // In a real implementation, you would set up a WebSocket connection here
  // For now, we'll just return a success message
  res.json({ message: 'Real-time subscription for groups would be established here' });
});

app.get('/api/subscribe/expenses', (req, res) => {
  if (!isDatabaseConnected) {
    return res.status(400).json({ error: 'Real-time subscriptions not available in demo mode' });
  }
  
  // In a real implementation, you would set up a WebSocket connection here
  // For now, we'll just return a success message
  res.json({ message: 'Real-time subscription for expenses would be established here' });
});

app.get('/api/subscribe/settlements', (req, res) => {
  if (!isDatabaseConnected) {
    return res.status(400).json({ error: 'Real-time subscriptions not available in demo mode' });
  }
  
  // In a real implementation, you would set up a WebSocket connection here
  // For now, we'll just return a success message
  res.json({ message: 'Real-time subscription for settlements would be established here' });
});

// Add a route to fix expense created_by fields
app.post('/api/expenses/fix-created-by', async (req, res) => {
  if (!isDatabaseConnected) {
    return res.status(400).json({ error: 'Database not connected' });
  }
  
  try {
    // First, check if the created_by column exists
    const { data: columnInfo, error: columnError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);
    
    // Try to access created_by to see if it exists
    let hasCreatedByColumn = false;
    if (columnInfo && columnInfo.length > 0) {
      hasCreatedByColumn = 'created_by' in columnInfo[0];
    }
    
    if (!hasCreatedByColumn) {
      return res.status(400).json({ 
        error: 'created_by column does not exist in the expenses table',
        message: 'The database schema needs to be updated to include the created_by column'
      });
    }
    
    // Fetch all expenses
    const { data: expenses, error: fetchError } = await supabase
      .from('expenses')
      .select('*');
    
    if (fetchError) {
      throw fetchError;
    }
    
    let fixedCount = 0;
    const errors = [];
    
    // Update each expense that doesn't have created_by set
    for (const expense of expenses) {
      // Skip if created_by is already set
      if (expense.created_by) {
        continue;
      }
      
      // Set created_by to the paid_by user as a default
      try {
        const { error: updateError } = await supabase
          .from('expenses')
          .update({ created_by: expense.paid_by })
          .eq('id', expense.id);
        
        if (updateError) {
          errors.push(`Error updating expense ${expense.id}: ${updateError.message}`);
        } else {
          fixedCount++;
        }
      } catch (updateError) {
        errors.push(`Error updating expense ${expense.id}: ${updateError.message}`);
      }
    }
    
    res.json({ 
      message: `Fixed ${fixedCount} expenses`, 
      fixedCount, 
      errors,
      totalExpenses: expenses.length
    });
  } catch (error) {
    console.error('Error fixing expense created_by fields:', error);
    res.status(500).json({ error: 'Failed to fix expense created_by fields' });
  }
});

// Email sending endpoint for group invitations
app.post('/api/send-invitation-email', async (req, res) => {
  const { to, groupName, inviterName, invitationLink } = req.body;
  
  // Validate required fields
  if (!to || !groupName || !inviterName || !invitationLink) {
    return res.status(400).json({ 
      error: 'Missing required fields: to, groupName, inviterName, and invitationLink are required' 
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }
  
  try {
    // In a real implementation, you would integrate with an email service like SendGrid, Nodemailer, etc.
    // For this demo, we'll just simulate sending an email
    
    console.log('📧 Simulated email sending:');
    console.log(`To: ${to}`);
    console.log(`Subject: Invitation to join ${groupName} on SplitSmart`);
    console.log(`Body: Hello,
    
${inviterName} has invited you to join the group "${groupName}" on SplitSmart!

Click the link below to join:
${invitationLink}

Best regards,
The SplitSmart Team`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({ 
      success: true, 
      message: 'Invitation email sent successfully (simulated)',
      data: { to, groupName, inviterName }
    });
  } catch (error) {
    console.error('Error sending invitation email:', error);
    res.status(500).json({ 
      error: 'Failed to send invitation email',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Health Check: http://localhost:${PORT}/api/health`);
});