import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDatabase, getDatabase, createChangeStream, isDatabaseAvailable, closeDatabase } from './config/database.js';
import http from 'http';
import { Server } from 'socket.io';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
// Import email service functions
import { sendGroupInvitationEmail } from './services/emailService.js';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
// Fix the path to correctly point to the .env file in the project root
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading environment variables from:', envPath);
dotenv.config({ path: envPath });

// Log environment variables for debugging
console.log('EMAIL_USER from env:', process.env.EMAIL_USER);
console.log('EMAIL_PASS from env:', process.env.EMAIL_PASS ? '*** (set)' : 'not set');
console.log('MONGODB_URI from env:', process.env.MONGODB_URI ? '*** (set)' : 'not set');
console.log('PORT from env:', process.env.PORT || 'using default');

const app = express();
const PORT = process.env.PORT || 40001;

// Create HTTP server and Socket.IO server for real-time functionality
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Store connected clients for real-time updates
let connectedClients = new Set();

// Set up Socket.IO connection handlers
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  connectedClients.add(socket.id);
  
  // Handle subscription requests
  socket.on('subscribe', (collections) => {
    console.log('📌 Client subscribed to collections:', collections);
    socket.join(collections);
    socket.emit('subscribed', { collections });
  });
  
  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    connectedClients.delete(socket.id);
  });
});

// Function to emit real-time updates to all connected clients
const emitRealtimeUpdate = (type, operation, data) => {
  const updateData = { type, operation, data };
  console.log('📡 Emitting real-time update:', updateData);
  io.emit('data_update', updateData);
};

// Create Nodemailer transporter
const createTransporter = () => {
  try {
    // Check if we have email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Email credentials not found. Email service will not work.');
      return null;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    return null;
  }
};

const transporter = createTransporter();

// Database connection with retry logic
let db;
let connectionRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 5;

const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database connection...');
    const database = await connectDatabase();
    if (database) {
      db = database;
      console.log('✅ Database connected successfully');
      connectionRetryCount = 0; // Reset retry count on success
      
      // Set up change streams for real-time updates
      // createChangeStream('users', (change) => {
      //   console.log('User change detected:', change);
      //   // Broadcast to connected clients
      //   connectedClients.forEach(clientId => {
      //     io.to(clientId).emit('userUpdate', change);
      //   });
      // });
      
      // createChangeStream('groups', (change) => {
      //   console.log('Group change detected:', change);
      //   // Broadcast to connected clients
      //   connectedClients.forEach(clientId => {
      //     io.to(clientId).emit('groupUpdate', change);
      //   });
      // });
    } else {
      console.error('❌ Failed to connect to database');
      
      // Increment retry count and schedule retry if under limit
      connectionRetryCount++;
      if (connectionRetryCount <= MAX_RETRY_ATTEMPTS) {
        console.log(`🔄 Retry attempt ${connectionRetryCount}/${MAX_RETRY_ATTEMPTS} in 5 seconds...`);
        setTimeout(initializeDatabase, 5000);
      } else {
        console.error('⚠️  Maximum retry attempts reached. Application will start without database connectivity');
        console.error('⚠️  Please check your MongoDB credentials and connection');
      }
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    
    // Increment retry count and schedule retry if under limit
    connectionRetryCount++;
    if (connectionRetryCount <= MAX_RETRY_ATTEMPTS) {
      console.log(`🔄 Retry attempt ${connectionRetryCount}/${MAX_RETRY_ATTEMPTS} in 5 seconds...`);
      setTimeout(initializeDatabase, 5000);
    } else {
      console.error('⚠️  Maximum retry attempts reached. Application will start without database connectivity');
      console.error('⚠️  Please check your MongoDB credentials and connection');
    }
  }
};

// Initialize database connection
initializeDatabase();

// Update API routes to handle database unavailability more gracefully

// Add a health check endpoint that shows database status
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    databaseConnected: isDatabaseAvailable(),
    uptime: process.uptime()
  });
});

// User routes
app.get('/api/users', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'The application is running but database connectivity is unavailable. Please contact the administrator.'
      });
    }
    
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: 'An error occurred while fetching users. Please try again later.'
    });
  }
});

// POST route for creating users (signup)
app.post('/api/users', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'User registration is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const userData = req.body;
    
    // Validate required fields
    if (!userData.name || !userData.email || !userData.password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }
    
    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    // Create initials from name
    const initials = userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    // Add timestamps
    const newUser = {
      ...userData,
      password: hashedPassword, // Store hashed password
      id: userData.id || `user-${Date.now()}`,
      initials: userData.initials || initials,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString()
    };
    
    // Insert user into database
    const result = await usersCollection.insertOne(newUser);
    
    if (result.insertedId) {
      // Return the created user (excluding password for security)
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

// POST route for user login
app.post('/api/login', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Login is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }
    
    const usersCollection = db.collection('users');
    
    // Find user by email
    const user = await usersCollection.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      // Return the user (excluding password for security)
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

// Group routes
app.get('/api/groups', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Groups data is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const groupsCollection = db.collection('groups');
    
    // For demo purposes, we'll filter groups to only show those created by the current user
    // In a real implementation, you would use proper authentication (JWT, sessions, etc.)
    // and get the user ID from the authenticated request
    
    // Get user ID from query parameter for demo purposes
    // In production, this should come from authenticated session/JWT
    const userId = req.query.userId || 'user-tusha'; // Default to demo user
    
    // Find groups where the user is either the owner or a member
    const groups = await groupsCollection.find({
      $or: [
        { createdBy: userId }, // Groups created by the user
        { 'members.id': userId } // Groups where the user is a member
      ]
    }).toArray();
    
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// POST route for creating groups
app.post('/api/groups', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Group creation is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const groupData = req.body;
    
    // Validate required fields
    if (!groupData.name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    // Ensure createdBy field is set
    if (!groupData.createdBy) {
      return res.status(400).json({ error: 'Group creator information is required' });
    }
    
    const groupsCollection = db.collection('groups');
    
    // Add timestamps and default values
    const newGroup = {
      ...groupData,
      id: groupData.id || `group-${Date.now()}`,
      createdAt: groupData.createdAt || new Date().toISOString(),
      updatedAt: groupData.updatedAt || new Date().toISOString(),
      totalAmount: groupData.totalAmount || 0,
      yourBalance: groupData.yourBalance || 0,
      lastActivity: groupData.lastActivity || new Date().toISOString()
    };
    
    // Insert group into database
    const result = await groupsCollection.insertOne(newGroup);
    
    if (result.insertedId) {
      // Emit real-time update
      emitRealtimeUpdate('group_change', 'insert', newGroup);
      // Send invitation emails to all members except the creator
      if (transporter && Array.isArray(newGroup.members) && newGroup.members.length > 1) {
        console.log('📧 Sending invitation emails to group members...');
        
        // Find the creator (usually the first member or the one with ownerId)
        const creator = newGroup.members.find(member => member.id === newGroup.createdBy) || newGroup.members[0];
        const creatorName = creator ? creator.name : 'A SplitSmart user';
        
        // Send invitations to all members except the creator
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
        
        // Wait for all emails to be sent
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

// POST route for sending invitation emails
app.post('/api/send-invite', async (req, res) => {
  const { to, memberName, groupName, inviterName } = req.body;
  
  // Validate required fields
  if (!to || !memberName || !groupName || !inviterName) {
    return res.status(400).json({ 
      error: 'Missing required fields: to, memberName, groupName, and inviterName are required' 
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }
  
  // Check if transporter is available
  if (!transporter) {
    return res.status(500).json({ 
      error: 'Email service not configured properly' 
    });
  }
  
  try {
    // Generate invitation link
    const invitationLink = `http://localhost:8081/accept-invitation?group=${encodeURIComponent(groupName)}&email=${encodeURIComponent(to)}`;
    
    // Use the email service function for consistency
    const emailResult = await sendGroupInvitationEmail({
      to: to,
      memberName: memberName,
      groupName: groupName,
      inviterName: inviterName,
      invitationLink: invitationLink
    });
    
    if (emailResult.success) {
      res.json({ 
        success: true, 
        message: 'Invitation email sent successfully',
        messageId: emailResult.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: emailResult.error || 'Failed to send invitation email' 
      });
    }
  } catch (error) {
    console.error('Error sending invitation email:', error);
    res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to send invitation email' 
    });
  }
});

// Add the missing endpoint that the client is trying to call
app.post('/api/send-invitation-email', async (req, res) => {
  const { to, memberName, groupName, inviterName, invitationLink } = req.body;
  
  // Validate required fields
  if (!to || !memberName || !groupName || !inviterName) {
    return res.status(400).json({ 
      error: 'Missing required fields: to, memberName, groupName, and inviterName are required' 
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }
  
  // Check if transporter is available
  if (!transporter) {
    // Return a simulated success response in development/mock mode
    if (process.env.NODE_ENV !== 'production' && process.env.USE_REAL_EMAILS !== 'true') {
      return res.json({ 
        success: true, 
        message: 'Email service is in mock mode. No real email was sent.',
        data: {
          messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      });
    }
    
    return res.status(500).json({ 
      error: 'Email service not configured properly' 
    });
  }
  
  try {
    // If invitationLink is not provided, generate one
    const finalInvitationLink = invitationLink || `http://localhost:8081/accept-invitation?group=${encodeURIComponent(groupName)}&email=${encodeURIComponent(to)}`;
    
    // Use the email service function for consistency
    const emailResult = await sendGroupInvitationEmail({
      to: to,
      memberName: memberName,
      groupName: groupName,
      inviterName: inviterName,
      invitationLink: finalInvitationLink
    });
    
    if (emailResult.success) {
      res.json({ 
        success: true, 
        message: 'Invitation email sent successfully',
        data: {
          messageId: emailResult.messageId
        }
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: emailResult.error || 'Failed to send invitation email' 
      });
    }
  } catch (error) {
    console.error('Error sending invitation email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send invitation email' 
    });
  }
});

// POST route for sending reminder emails
app.post('/api/send-reminder', async (req, res) => {
  const { to, memberName, groupName, amountOwed } = req.body;
  
  // Validate required fields
  if (!to || !memberName || !groupName || !amountOwed) {
    return res.status(400).json({ 
      error: 'Missing required fields: to, memberName, groupName, and amountOwed are required' 
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }
  
  // Check if transporter is available
  if (!transporter) {
    return res.status(500).json({ 
      error: 'Email service not configured properly' 
    });
  }
  
  try {
    // Generate payment link
    const paymentLink = `http://localhost:8081/groups/${encodeURIComponent(groupName)}`;
    
    // Send email
    const mailOptions = {
      from: `"SplitSmart No-Reply" <${process.env.EMAIL_USER}>`,
      replyTo: 'no-reply@splitsmart.com',
      to: to,
      subject: `Payment Reminder: You owe ${amountOwed} in ${groupName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SplitSmart Payment Reminder</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8f9fa;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px;
            }
            .content p {
              margin: 0 0 15px 0;
            }
            .amount-box {
              background: #fff5f5;
              border: 1px solid #fed7d7;
              border-radius: 6px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .amount {
              font-size: 28px;
              font-weight: 700;
              color: #e53e3e;
              margin: 0;
            }
            .group-name {
              color: #718096;
              font-size: 16px;
              margin: 5px 0 0 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .button:hover {
              opacity: 0.9;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6c757d;
              border-top: 1px solid #e9ecef;
            }
            .highlight {
              background: #fff8e6;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              border-left: 4px solid #f59e0b;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${memberName},</p>
              
              <p>This is a friendly reminder that you have a pending payment in the group <strong>"${groupName}"</strong> on SplitSmart.</p>
              
              <div class="amount-box">
                <p class="amount">${amountOwed}</p>
                <p class="group-name">Amount owed in ${groupName}</p>
              </div>
              
              <div class="highlight">
                <p>Please settle this payment at your earliest convenience to keep your group expenses up to date.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${paymentLink}" class="button">Make Payment</a>
              </div>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #f5576c;">${paymentLink}</p>
              
              <p>Thank you for settling your balance!</p>
            </div>
            <div class="footer">
              <p>— The SplitSmart Team</p>
              <p>This email was sent to ${to}</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        SplitSmart Payment Reminder
        
        Hi ${memberName},
        
        This is a friendly reminder that you have a pending payment in the group "${groupName}" on SplitSmart.
        
        Amount owed: ${amountOwed}
        Group: ${groupName}
        
        Please settle this payment at your earliest convenience to keep your group expenses up to date.
        
        Make your payment by visiting:
        ${paymentLink}
        
        Thank you for settling your balance!
        
        — The SplitSmart Team
        This email was sent to ${to}
        Please do not reply to this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 Payment reminder email sent successfully:');
    console.log('   To:', to);
    console.log('   Subject:', mailOptions.subject);
    console.log('   Message ID:', info.messageId);
    
    res.json({ 
      success: true, 
      message: 'Payment reminder email sent successfully',
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Error sending payment reminder email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send payment reminder email' 
    });
  }
});

// DELETE route for deleting groups
app.delete('/api/groups/:id', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Group deletion is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const { id } = req.params;
    
    // Validate required fields
    if (!id) {
      return res.status(400).json({ error: 'Group ID is required' });
    }
    
    const groupsCollection = db.collection('groups');
    
    // Check if group exists
    const group = await groupsCollection.findOne({ id });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Delete the group
    const result = await groupsCollection.deleteOne({ id });
    
    if (result.deletedCount > 0) {
      // Also delete associated expenses and settlements
      const expensesCollection = db.collection('expenses');
      await expensesCollection.deleteMany({ groupId: id });
      
      const settlementsCollection = db.collection('settlements');
      await settlementsCollection.deleteMany({ groupId: id });
      
      res.status(204).send(); // No content
    } else {
      res.status(500).json({ error: 'Failed to delete group' });
    }
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// Expense routes
// GET route for fetching all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Expenses data is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const expensesCollection = db.collection('expenses');
    const expenses = await expensesCollection.find({}).toArray();
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET route for fetching expenses by group
app.get('/api/expenses/group/:groupId', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Expenses data is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const { groupId } = req.params;
    
    const expensesCollection = db.collection('expenses');
    const expenses = await expensesCollection.find({ groupId }).toArray();
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses by group:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST route for creating expenses
app.post('/api/expenses', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Expense creation is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const expenseData = req.body;
    
    // Validate required fields
    if (!expenseData.description || !expenseData.amount || !expenseData.groupId || !expenseData.paidBy || !expenseData.splitBetween) {
      return res.status(400).json({ error: 'Description, amount, groupId, paidBy, and splitBetween are required' });
    }
    
    const expensesCollection = db.collection('expenses');
    
    // Add timestamps and default values
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
    
    // Insert expense into database
    const result = await expensesCollection.insertOne(newExpense);
    
    if (result.insertedId) {
      // Emit real-time update
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

// PUT route for updating expenses
app.put('/api/expenses/:id', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Expense update is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const { id } = req.params;
    const expenseData = req.body;
    
    const expensesCollection = db.collection('expenses');
    
    // Update timestamps
    const updatedExpense = {
      ...expenseData,
      updatedAt: new Date().toISOString()
    };
    
    // Update expense in database
    const result = await expensesCollection.updateOne(
      { id },
      { $set: updatedExpense }
    );
    
    if (result.modifiedCount > 0) {
      // Fetch the updated expense to emit it
      const updatedDoc = await expensesCollection.findOne({ id });
      // Emit real-time update
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

// DELETE route for deleting expenses
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Expense deletion is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const { id } = req.params;
    
    const expensesCollection = db.collection('expenses');
    
    // Find the expense before deleting to emit it
    const expenseToDelete = await expensesCollection.findOne({ id });
    
    // Delete expense from database
    const result = await expensesCollection.deleteOne({ id });
    
    if (result.deletedCount > 0) {
      // Emit real-time update
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

// Settlement routes
// GET route for fetching all settlements
app.get('/api/settlements', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Settlements data is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const settlementsCollection = db.collection('settlements');
    const settlements = await settlementsCollection.find({}).toArray();
    res.json(settlements);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

// GET route for fetching settlements by group
app.get('/api/settlements/group/:groupId', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Settlements data is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const { groupId } = req.params;
    
    const settlementsCollection = db.collection('settlements');
    const settlements = await settlementsCollection.find({ groupId }).toArray();
    res.json(settlements);
  } catch (error) {
    console.error('Error fetching settlements by group:', error);
    res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

// POST route for creating settlements
app.post('/api/settlements', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Settlement creation is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const settlementData = req.body;
    
    // Validate required fields
    if (!settlementData.groupId || !settlementData.fromMember || !settlementData.toMember || !settlementData.amount) {
      return res.status(400).json({ error: 'groupId, fromMember, toMember, and amount are required' });
    }
    
    const settlementsCollection = db.collection('settlements');
    
    // Add timestamps and default values
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
    
    // Insert settlement into database
    const result = await settlementsCollection.insertOne(newSettlement);
    
    if (result.insertedId) {
      // Emit real-time update
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

// PATCH route for confirming settlements
app.patch('/api/settlements/:id/confirm', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Settlement confirmation is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const { id } = req.params;
    
    const settlementsCollection = db.collection('settlements');
    
    // Update settlement in database
    const result = await settlementsCollection.updateOne(
      { id },
      { 
        $set: { 
          confirmed: true,
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      // Fetch the updated settlement to emit it
      const updatedSettlement = await settlementsCollection.findOne({ id });
      // Emit real-time update
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

// DELETE route for deleting settlements
app.delete('/api/settlements/:id', async (req, res) => {
  try {
    if (!isDatabaseAvailable() || !db) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Settlement deletion is temporarily unavailable due to database connectivity issues.'
      });
    }
    
    const { id } = req.params;
    
    const settlementsCollection = db.collection('settlements');
    
    // Find the settlement before deleting to emit it
    const settlementToDelete = await settlementsCollection.findOne({ id });
    
    // Delete settlement from database
    const result = await settlementsCollection.deleteOne({ id });
    
    if (result.deletedCount > 0) {
      // Emit real-time update
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

// Add a database status endpoint
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

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  await closeDatabase();
  process.exit(0);
});

export { io, connectedClients };