import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDatabase, isDatabaseAvailable, closeDatabase } from './config/database.js';
import http from 'http';
import { Server } from 'socket.io';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { sendGroupInvitationEmail } from './services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 40001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

let connectedClients = new Set();
let db;
let connectionRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 5;

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  connectedClients.add(socket.id);
  
  socket.on('subscribe', (collections) => {
    console.log('📌 Client subscribed to collections:', collections);
    socket.join(collections);
    socket.emit('subscribed', { collections });
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    connectedClients.delete(socket.id);
  });
});

const emitRealtimeUpdate = (type, operation, data) => {
  const updateData = { type, operation, data };
  console.log('📡 Emitting real-time update:', updateData);
  io.emit('data_update', updateData);
};

const createTransporter = () => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Email credentials not set. Email service will not work.');
      return null;
    }
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    return null;
  }
};

const transporter = createTransporter();

const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database connection...');
    const database = await connectDatabase();
    if (database) {
      db = database;
      console.log('✅ Database connected successfully');
      connectionRetryCount = 0;
    } else {
      connectionRetryCount++;
      if (connectionRetryCount <= MAX_RETRY_ATTEMPTS) {
        console.log(`🔄 Retry attempt ${connectionRetryCount}/${MAX_RETRY_ATTEMPTS} in 5 seconds...`);
        setTimeout(initializeDatabase, 5000);
      } else {
        console.error('⚠️  Maximum retry attempts reached. Starting without database connectivity');
      }
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    connectionRetryCount++;
    if (connectionRetryCount <= MAX_RETRY_ATTEMPTS) {
      console.log(`🔄 Retry attempt ${connectionRetryCount}/${MAX_RETRY_ATTEMPTS} in 5 seconds...`);
      setTimeout(initializeDatabase, 5000);
    } else {
      console.error('⚠️  Maximum retry attempts reached. Starting without database connectivity');
    }
  }
};

initializeDatabase();

const checkDb = (res) => {
  if (!isDatabaseAvailable() || !db) {
    return res.status(503).json({ 
      error: 'Database not connected',
      message: 'Service temporarily unavailable due to database connectivity issues.'
    });
  }
  return null;
};

const userFilter = (userId) => ({
  $or: [{ createdBy: userId }, { 'members.id': userId }]
});

const expenseFilter = (userId) => ({
  $or: [{ createdBy: userId }, { paidBy: userId }, { splitBetween: userId }]
});

const settlementFilter = (userId) => ({
  $or: [{ fromMember: userId }, { toMember: userId }]
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: 'An unexpected error occurred' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    databaseConnected: isDatabaseAvailable(),
    uptime: process.uptime()
  });
});

app.get('/api/users', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const users = await db.collection('users').find({}).toArray();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const userData = req.body;
    
    if (!userData.name || !userData.email || !userData.password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }
    
    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    const initials = userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const newUser = {
      ...userData,
      password: hashedPassword,
      id: userData.id || `user-${Date.now()}`,
      initials: userData.initials || initials,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString()
    };
    
    const result = await usersCollection.insertOne(newUser);
    
    if (result.insertedId) {
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/api/login', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }
    
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      const { password: userPassword, ...userWithoutPassword } = user;
      res.json({ 
        success: true, 
        user: userWithoutPassword,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/api/groups', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const userId = req.query.userId || 'user-tusha';
    const groups = await db.collection('groups').find(userFilter(userId)).toArray();
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

app.post('/api/groups', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const groupData = req.body;
    
    if (!groupData.name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    if (!groupData.createdBy) {
      return res.status(400).json({ error: 'Group creator information is required' });
    }
    
    const newGroup = {
      ...groupData,
      id: groupData.id || `group-${Date.now()}`,
      createdAt: groupData.createdAt || new Date().toISOString(),
      updatedAt: groupData.updatedAt || new Date().toISOString(),
      totalAmount: groupData.totalAmount || 0,
      yourBalance: groupData.yourBalance || 0,
      lastActivity: groupData.lastActivity || new Date().toISOString()
    };
    
    const result = await db.collection('groups').insertOne(newGroup);
    
    if (result.insertedId) {
      emitRealtimeUpdate('group_change', 'insert', newGroup);
      
      if (transporter && Array.isArray(newGroup.members) && newGroup.members.length > 1) {
        console.log('📧 Sending invitation emails to group members...');
        
        const creator = newGroup.members.find(member => member.id === newGroup.createdBy) || newGroup.members[0];
        const creatorName = creator ? creator.name : 'A SplitSmart user';
        
        const invitationPromises = newGroup.members
          .filter(member => member.id !== newGroup.createdBy)
          .map(async (member) => {
            try {
              const invitationLink = `http://localhost:8081/accept-invitation?group=${encodeURIComponent(newGroup.name)}&email=${encodeURIComponent(member.email)}`;
              
              const emailResult = await sendGroupInvitationEmail({
                to: member.email,
                memberName: member.name,
                groupName: newGroup.name,
                inviterName: creatorName,
                invitationLink: invitationLink
              });
              
              if (emailResult.success) {
                console.log(`✅ Invitation email sent to ${member.email}`);
              } else {
                console.error(`❌ Failed to send invitation to ${member.email}:`, emailResult.error);
              }
              
              return emailResult;
            } catch (emailError) {
              console.error(`❌ Error sending invitation to ${member.email}:`, emailError);
              return { success: false, error: emailError.message };
            }
          });
        
        Promise.all(invitationPromises)
          .then(results => {
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            console.log(`📧 Group invitation emails summary: ${successful} sent successfully, ${failed} failed`);
          })
          .catch(error => {
            console.error('❌ Error in batch sending invitations:', error);
          });
      }
      
      res.status(201).json(newGroup);
    } else {
      res.status(500).json({ error: 'Failed to create group' });
    }
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

app.delete('/api/groups/:id', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Group ID is required' });
    }
    
    const groupsCollection = db.collection('groups');
    const group = await groupsCollection.findOne({ id });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const result = await groupsCollection.deleteOne({ id });
    
    if (result.deletedCount > 0) {
      await db.collection('expenses').deleteMany({ groupId: id });
      await db.collection('settlements').deleteMany({ groupId: id });
      res.status(204).send();
    } else {
      res.status(500).json({ error: 'Failed to delete group' });
    }
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

const sendEmail = async (req, res, getEmailOptions) => {
  if (!transporter) {
    if (process.env.NODE_ENV !== 'production' && process.env.USE_REAL_EMAILS !== 'true') {
      return res.json({ 
        success: true, 
        message: 'Email service is in mock mode. No real email was sent.',
        data: {
          messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      });
    }
    return res.status(500).json({ error: 'Email service not configured properly' });
  }
  
  try {
    const emailOptions = getEmailOptions(req.body);
    const info = await transporter.sendMail(emailOptions);
    console.log('📧 Email sent successfully:', info.messageId);
    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send email' 
    });
  }
};

app.post('/api/send-invite', async (req, res) => {
  const { to, memberName, groupName, inviterName } = req.body;
  
  if (!to || !memberName || !groupName || !inviterName) {
    return res.status(400).json({ 
      error: 'Missing required fields: to, memberName, groupName, and inviterName are required' 
    });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }
  
  const getEmailOptions = (data) => {
    const invitationLink = `http://localhost:8081/accept-invitation?group=${encodeURIComponent(data.groupName)}&email=${encodeURIComponent(data.to)}`;
    
    return {
      from: `"SplitSmart No-Reply" <${process.env.EMAIL_USER}>`,
      replyTo: 'no-reply@splitsmart.com',
      to: data.to,
      subject: `You've been invited to join ${data.groupName} on SplitSmart`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>SplitSmart Group Invitation</title>
        </head>
        <body>
          <div>
            <div>
              <h1>Group Invitation</h1>
            </div>
            <div>
              <p>Hi ${data.memberName},</p>
              <p>You've been invited to join <strong>"${data.groupName}"</strong> on SplitSmart by ${data.inviterName}.</p>
              <a href="${invitationLink}">Accept Invitation</a>
              <p>Or copy and paste this link:</p>
              <p>${invitationLink}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        SplitSmart Group Invitation
        
        Hi ${data.memberName},
        
        You've been invited to join "${data.groupName}" on SplitSmart by ${data.inviterName}.
        
        Accept the invitation by visiting:
        ${invitationLink}
      `
    };
  };
  
  sendEmail(req, res, getEmailOptions);
});

app.post('/api/send-invitation-email', async (req, res) => {
  const { to, memberName, groupName, inviterName, invitationLink } = req.body;
  
  if (!to || !memberName || !groupName || !inviterName) {
    return res.status(400).json({ 
      error: 'Missing required fields: to, memberName, groupName, and inviterName are required' 
    });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }
  
  const getEmailOptions = (data) => {
    const finalInvitationLink = data.invitationLink || 
      `http://localhost:8081/accept-invitation?group=${encodeURIComponent(data.groupName)}&email=${encodeURIComponent(data.to)}`;
    
    return {
      from: `"SplitSmart No-Reply" <${process.env.EMAIL_USER}>`,
      replyTo: 'no-reply@splitsmart.com',
      to: data.to,
      subject: `You've been invited to join ${data.groupName} on SplitSmart`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>SplitSmart Group Invitation</title>
        </head>
        <body>
          <div>
            <div>
              <h1>Group Invitation</h1>
            </div>
            <div>
              <p>Hi ${data.memberName},</p>
              <p>You've been invited to join <strong>"${data.groupName}"</strong> on SplitSmart by ${data.inviterName}.</p>
              <a href="${finalInvitationLink}">Accept Invitation</a>
              <p>Or copy and paste this link:</p>
              <p>${finalInvitationLink}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        SplitSmart Group Invitation
        
        Hi ${data.memberName},
        
        You've been invited to join "${data.groupName}" on SplitSmart by ${data.inviterName}.
        
        Accept the invitation by visiting:
        ${finalInvitationLink}
      `
    };
  };
  
  sendEmail(req, res, getEmailOptions);
});

app.post('/api/send-reminder', async (req, res) => {
  const { to, memberName, groupName, amountOwed } = req.body;
  
  if (!to || !memberName || !groupName || !amountOwed) {
    return res.status(400).json({ 
      error: 'Missing required fields: to, memberName, groupName, and amountOwed are required' 
    });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }
  
  const getEmailOptions = (data) => {
    const paymentLink = `http://localhost:8081/groups/${encodeURIComponent(data.groupName)}`;
    
    return {
      from: `"SplitSmart No-Reply" <${process.env.EMAIL_USER}>`,
      replyTo: 'no-reply@splitsmart.com',
      to: data.to,
      subject: `Payment Reminder: You owe ${data.amountOwed} in ${data.groupName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>SplitSmart Payment Reminder</title>
        </head>
        <body>
          <div>
            <div>
              <h1>Payment Reminder</h1>
            </div>
            <div>
              <p>Hi ${data.memberName},</p>
              <p>This is a friendly reminder that you have a pending payment in the group <strong>"${data.groupName}"</strong> on SplitSmart.</p>
              <p>${data.amountOwed}</p>
              <a href="${paymentLink}">Make Payment</a>
              <p>Or copy and paste this link:</p>
              <p>${paymentLink}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        SplitSmart Payment Reminder
        
        Hi ${data.memberName},
        
        This is a friendly reminder that you have a pending payment in the group "${data.groupName}" on SplitSmart.
        
        Amount owed: ${data.amountOwed}
        Group: ${data.groupName}
        
        Make your payment by visiting:
        ${paymentLink}
      `
    };
  };
  
  sendEmail(req, res, getEmailOptions);
});

app.get('/api/expenses', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const userId = req.query.userId || 'user-tusha';
    const expenses = await db.collection('expenses').find(expenseFilter(userId)).toArray();
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.get('/api/expenses/group/:groupId', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const { groupId } = req.params;
    const userId = req.query.userId || 'user-tusha';
    
    const expenses = await db.collection('expenses').find({
      groupId: groupId,
      ...expenseFilter(userId)
    }).toArray();
    
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses by group:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const expenseData = req.body;
    
    if (!expenseData.description || !expenseData.amount || !expenseData.groupId || !expenseData.paidBy || !expenseData.splitBetween) {
      return res.status(400).json({ error: 'Description, amount, groupId, paidBy, and splitBetween are required' });
    }
    
    const newExpense = {
      id: expenseData.id || `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: expenseData.description,
      amount: parseFloat(expenseData.amount),
      category: expenseData.category || 'other',
      groupId: expenseData.groupId,
      paidBy: expenseData.paidBy,
      splitBetween: Array.isArray(expenseData.splitBetween) ? expenseData.splitBetween : [expenseData.splitBetween],
      date: expenseData.date || new Date().toISOString(),
      createdAt: expenseData.createdAt || new Date().toISOString(),
      updatedAt: expenseData.updatedAt || new Date().toISOString(),
      createdBy: expenseData.createdBy || expenseData.paidBy,
      settled: expenseData.settled !== undefined ? expenseData.settled : false
    };
    
    const result = await db.collection('expenses').insertOne(newExpense);
    
    if (result.insertedId) {
      emitRealtimeUpdate('expense_change', 'insert', newExpense);
      res.status(201).json(newExpense);
    } else {
      res.status(500).json({ error: 'Failed to create expense' });
    }
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const { id } = req.params;
    const expenseData = req.body;
    
    const updatedExpense = {
      ...expenseData,
      updatedAt: new Date().toISOString()
    };
    
    const result = await db.collection('expenses').updateOne(
      { id },
      { $set: updatedExpense }
    );
    
    if (result.modifiedCount > 0) {
      const updatedDoc = await db.collection('expenses').findOne({ id });
      emitRealtimeUpdate('expense_change', 'update', updatedDoc);
      res.json(updatedDoc);
    } else {
      res.status(404).json({ error: 'Expense not found' });
    }
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const { id } = req.params;
    
    const expenseToDelete = await db.collection('expenses').findOne({ id });
    const result = await db.collection('expenses').deleteOne({ id });
    
    if (result.deletedCount > 0) {
      emitRealtimeUpdate('expense_change', 'delete', expenseToDelete);
      res.json({ message: 'Expense deleted successfully' });
    } else {
      res.status(404).json({ error: 'Expense not found' });
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

app.get('/api/settlements', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const userId = req.query.userId || 'user-tusha';
    const settlements = await db.collection('settlements').find(settlementFilter(userId)).toArray();
    res.json(settlements);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

app.get('/api/settlements/group/:groupId', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const { groupId } = req.params;
    const userId = req.query.userId || 'user-tusha';
    
    const settlements = await db.collection('settlements').find({
      groupId: groupId,
      ...settlementFilter(userId)
    }).toArray();
    
    res.json(settlements);
  } catch (error) {
    console.error('Error fetching settlements by group:', error);
    res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

app.post('/api/settlements', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const settlementData = req.body;
    
    if (!settlementData.groupId || !settlementData.fromMember || !settlementData.toMember || !settlementData.amount) {
      return res.status(400).json({ error: 'groupId, fromMember, toMember, and amount are required' });
    }
    
    const newSettlement = {
      id: settlementData.id || `settlement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      groupId: settlementData.groupId,
      groupName: settlementData.groupName || 'Unnamed Group',
      fromMember: settlementData.fromMember,
      fromMemberName: settlementData.fromMemberName || 'Unknown',
      toMember: settlementData.toMember,
      toMemberName: settlementData.toMemberName || 'Unknown',
      amount: parseFloat(settlementData.amount),
      description: settlementData.description || '',
      date: settlementData.date || new Date().toISOString(),
      createdAt: settlementData.createdAt || new Date().toISOString(),
      updatedAt: settlementData.updatedAt || new Date().toISOString(),
      confirmed: settlementData.confirmed !== undefined ? settlementData.confirmed : false
    };
    
    const result = await db.collection('settlements').insertOne(newSettlement);
    
    if (result.insertedId) {
      emitRealtimeUpdate('settlement_change', 'insert', newSettlement);
      res.status(201).json(newSettlement);
    } else {
      res.status(500).json({ error: 'Failed to create settlement' });
    }
  } catch (error) {
    console.error('Error creating settlement:', error);
    res.status(500).json({ error: 'Failed to create settlement' });
  }
});

app.patch('/api/settlements/:id/confirm', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const { id } = req.params;
    
    const result = await db.collection('settlements').updateOne(
      { id },
      { 
        $set: { 
          confirmed: true,
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      const updatedSettlement = await db.collection('settlements').findOne({ id });
      emitRealtimeUpdate('settlement_change', 'update', updatedSettlement);
      res.json(updatedSettlement);
    } else {
      res.status(404).json({ error: 'Settlement not found' });
    }
  } catch (error) {
    console.error('Error confirming settlement:', error);
    res.status(500).json({ error: 'Failed to confirm settlement' });
  }
});

app.delete('/api/settlements/:id', async (req, res) => {
  const dbError = checkDb(res);
  if (dbError) return dbError;
  
  try {
    const { id } = req.params;
    
    const settlementToDelete = await db.collection('settlements').findOne({ id });
    const result = await db.collection('settlements').deleteOne({ id });
    
    if (result.deletedCount > 0) {
      emitRealtimeUpdate('settlement_change', 'delete', settlementToDelete);
      res.json({ message: 'Settlement deleted successfully' });
    } else {
      res.status(404).json({ error: 'Settlement not found' });
    }
  } catch (error) {
    console.error('Error deleting settlement:', error);
    res.status(500).json({ error: 'Failed to delete settlement' });
  }
});

app.get('/api/db-status', (req, res) => {
  const connected = isDatabaseAvailable();
  res.json({ 
    connected,
    databaseName: process.env.DATABASE_NAME || 'splitwiseApp',
    message: connected 
      ? 'Database is connected and operational' 
      : 'Database is not connected. Application is running in limited mode.'
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  await closeDatabase();
  process.exit(0);
});

export { io, connectedClients };