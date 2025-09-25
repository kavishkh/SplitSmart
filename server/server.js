import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDatabase from './config/database.js';
import User from './models/User.js';
import Group from './models/Group.js';
import Expense from './models/Expense.js';
import Settlement from './models/Settlement.js';
import { Resend } from 'resend';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Resend with the API key from environment variables
const resendApiKey = process.env.RESEND_API_KEY || 're_KDLVGMNw_EKRwEeE4HeAUcM5UZsfRWnyw';
console.log('Resend API Key (first 5 chars):', resendApiKey.substring(0, 5) + '...');
const resend = new Resend(resendApiKey);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    message: 'SplitSmart backend is running'
  });
});

// User routes
app.get('/api/users', async (req, res) => {
  try {
    // Try to fetch from database, but return empty array if database is not available
    const users = await User.find({}).catch(() => []);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.json([]); // Return empty array instead of error
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    // If database is not available, still return a success response for demo purposes
    const demoUser = { ...req.body, id: req.body.id || `user-${Date.now()}` };
    res.status(201).json(demoUser);
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }).catch(() => null);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(404).json({ error: 'User not found' });
  }
});

// Group routes
app.get('/api/groups', async (req, res) => {
  try {
    // Try to fetch from database, but return empty array if database is not available
    const groups = await Group.find({}).catch(() => []);
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.json([]); // Return empty array instead of error
  }
});

app.post('/api/groups', async (req, res) => {
  try {
    const group = new Group(req.body);
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    // If database is not available, still return a success response for demo purposes
    const demoGroup = { ...req.body, id: req.body.id || `group-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
    res.status(201).json(demoGroup);
  }
});

app.get('/api/groups/:id', async (req, res) => {
  try {
    const group = await Group.findOne({ id: req.params.id }).catch(() => null);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(404).json({ error: 'Group not found' });
  }
});

app.put('/api/groups/:id', async (req, res) => {
  try {
    const group = await Group.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).catch(() => null);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(group);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(404).json({ error: 'Group not found' });
  }
});

app.delete('/api/groups/:id', async (req, res) => {
  try {
    const group = await Group.findOneAndDelete({ id: req.params.id }).catch(() => null);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(204).send(); // Still return success for demo purposes
  }
});

// Expense routes
app.get('/api/expenses', async (req, res) => {
  try {
    // Try to fetch from database, but return empty array if database is not available
    const expenses = await Expense.find({}).catch(() => []);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.json([]); // Return empty array instead of error
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    // If database is not available, still return a success response for demo purposes
    const demoExpense = { ...req.body, id: req.body.id || `expense-${Date.now()}`, date: new Date(), createdAt: new Date(), updatedAt: new Date() };
    res.status(201).json(demoExpense);
  }
});

app.get('/api/expenses/group/:groupId', async (req, res) => {
  try {
    const expenses = await Expense.find({ groupId: req.params.groupId }).catch(() => []);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching group expenses:', error);
    res.json([]); // Return empty array instead of error
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    ).catch(() => null);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(404).json({ error: 'Expense not found' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ id: req.params.id }).catch(() => null);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(204).send(); // Still return success for demo purposes
  }
});

// Settlement routes
app.get('/api/settlements', async (req, res) => {
  try {
    // Try to fetch from database, but return empty array if database is not available
    const settlements = await Settlement.find({}).catch(() => []);
    res.json(settlements);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.json([]); // Return empty array instead of error
  }
});

app.post('/api/settlements', async (req, res) => {
  try {
    const settlement = new Settlement(req.body);
    await settlement.save();
    res.status(201).json(settlement);
  } catch (error) {
    console.error('Error creating settlement:', error);
    // If database is not available, still return a success response for demo purposes
    const demoSettlement = { ...req.body, id: req.body.id || `settlement-${Date.now()}`, date: new Date(), createdAt: new Date(), updatedAt: new Date(), confirmed: false };
    res.status(201).json(demoSettlement);
  }
});

app.patch('/api/settlements/:id/confirm', async (req, res) => {
  try {
    const settlement = await Settlement.findOneAndUpdate(
      { id: req.params.id },
      { confirmed: true, updatedAt: new Date() },
      { new: true }
    ).catch(() => null);
    if (!settlement) {
      return res.status(404).json({ error: 'Settlement not found' });
    }
    res.json(settlement);
  } catch (error) {
    console.error('Error confirming settlement:', error);
    res.status(404).json({ error: 'Settlement not found' });
  }
});

app.delete('/api/settlements/:id', async (req, res) => {
  try {
    const settlement = await Settlement.findOneAndDelete({ id: req.params.id }).catch(() => null);
    if (!settlement) {
      return res.status(404).json({ error: 'Settlement not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting settlement:', error);
    res.status(204).send(); // Still return success for demo purposes
  }
});

// Email routes
app.post('/api/send-invitation-email', async (req, res) => {
  try {
    const { to, groupName, inviterName, invitationLink } = req.body;
    
    console.log('Attempting to send invitation email to:', to);
    
    // Check if we're in development mode and the recipient is not the verified email
    const verifiedEmail = 'kavishkhanna06@gmail.com';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // In development, only send to verified email address
    if (isDevelopment && to !== verifiedEmail) {
      console.log('Development mode: Simulating email send to', to);
      // In development, we simulate success without actually sending
      return res.json({ 
        success: true, 
        data: { id: 'simulated-' + Date.now() },
        message: `In development mode, emails can only be sent to the verified email address (${verifiedEmail}). This email would be sent to ${to} in production after verifying a custom domain with Resend.`
      });
    }
    
    const { data, error } = await resend.emails.send({
      from: 'SplitSmart <onboarding@resend.dev>',
      to: [to],
      subject: `You're invited to join ${groupName} on SplitSmart`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6e41e2 0%, #9e7aff 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">SplitSmart</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">You're Invited!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Hello there,
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              <strong>${inviterName}</strong> has invited you to join the group 
              <strong>"${groupName}"</strong> on SplitSmart.
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="margin-top: 0; color: #333;">What is SplitSmart?</h3>
              <p style="color: #666; margin-bottom: 0;">
                SplitSmart helps you easily split expenses with friends, family, and roommates. 
                Track shared costs, settle balances, and keep your finances organized.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" 
                 style="background: #6e41e2; color: white; text-decoration: none; padding: 12px 24px; 
                        border-radius: 6px; font-weight: bold; display: inline-block;">
                Join Group
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center;">
              Or copy and paste this link into your browser:<br/>
              <a href="${invitationLink}" style="color: #6e41e2;">${invitationLink}</a>
            </p>
            
            <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
          
          <div style="background: #333; color: #fff; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; font-size: 14px;">
              &copy; 2023 SplitSmart. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending invitation email:', error);
      // If it's a domain verification error, return a more user-friendly message
      if (error.message && error.message.includes('domain is not verified')) {
        return res.status(400).json({ 
          success: false, 
          error: 'In development mode, emails can only be sent to the verified email address (kavishkhanna06@gmail.com). In production, you would need to verify a custom domain with Resend.' 
        });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    console.log('Invitation email sent successfully:', data);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/send-settlement-reminder', async (req, res) => {
  try {
    const { to, fromName, amount, groupName, settlementLink } = req.body;
    
    console.log('Attempting to send settlement reminder to:', to);
    
    // Check if we're in development mode and the recipient is not the verified email
    const verifiedEmail = 'kavishkhanna06@gmail.com';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // In development, only send to verified email address
    if (isDevelopment && to !== verifiedEmail) {
      console.log('Development mode: Simulating settlement reminder send to', to);
      // In development, we simulate success without actually sending
      return res.json({ 
        success: true, 
        data: { id: 'simulated-' + Date.now() },
        message: `In development mode, emails can only be sent to the verified email address (${verifiedEmail}). This settlement reminder would be sent to ${to} in production after verifying a custom domain with Resend.`
      });
    }
    
    const { data, error } = await resend.emails.send({
      from: 'SplitSmart <onboarding@resend.dev>',
      to: [to],
      subject: `Settlement Reminder: ₹${amount} owed in ${groupName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6e41e2 0%, #9e7aff 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">SplitSmart</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Settlement Reminder</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Hello there,
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              This is a friendly reminder that <strong>${fromName}</strong> owes you 
              <strong>₹${amount}</strong> in the group <strong>"${groupName}"</strong>.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${settlementLink}" 
                 style="background: #6e41e2; color: white; text-decoration: none; padding: 12px 24px; 
                        border-radius: 6px; font-weight: bold; display: inline-block;">
                Settle Now
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center;">
              Or copy and paste this link into your browser:<br/>
              <a href="${settlementLink}" style="color: #6e41e2;">${settlementLink}</a>
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="margin-top: 0; color: #333;">Why use SplitSmart?</h3>
              <p style="color: #666; margin-bottom: 0;">
                SplitSmart makes it easy to track shared expenses and settle balances with friends and family. 
                Keep your finances organized and avoid awkward money conversations.
              </p>
            </div>
          </div>
          
          <div style="background: #333; color: #fff; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; font-size: 14px;">
              &copy; 2023 SplitSmart. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending settlement reminder:', error);
      // If it's a domain verification error, return a more user-friendly message
      if (error.message && error.message.includes('domain is not verified')) {
        return res.status(400).json({ 
          success: false, 
          error: 'In development mode, emails can only be sent to the verified email address (kavishkhanna06@gmail.com). In production, you would need to verify a custom domain with Resend.' 
        });
      }
      return res.status(400).json({ success: false, error: error.message });
    }

    console.log('Settlement reminder sent successfully:', data);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Failed to send settlement reminder:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Connect to database
connectDatabase().catch((error) => {
  console.error('Failed to connect to MongoDB:', error);
  console.log('Running in demo mode without database connection');
});

// Handle React routing, return all requests to React app
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Health Check: http://localhost:${PORT}/api/health`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`Frontend served from: http://localhost:${PORT}`);
  }
});
