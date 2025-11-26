import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDatabase, getDatabase, isDatabaseAvailable, closeDatabase } from './config/database.js';
import http from 'http';
import { Server } from 'socket.io';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { sendGroupInvitationEmail } from './services/emailService.js';
import passport from 'passport';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import crypto from 'crypto';
import fs from 'fs';
// Import passport configuration (this will setup Google OAuth if credentials are provided)
import './config/passport.js';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3000; // Try a different port

// Create HTTP server and Socket.IO server
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
app.use(session({
  secret: process.env.JWT_SECRET || 'splitwise_jwt_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Store connected clients
let connectedClients = new Set();

// Socket.IO connection handlers
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

// Emit real-time updates
const emitRealtimeUpdate = (type, operation, data) => {
  const updateData = { type, operation, data };
  console.log('📡 Emitting real-time update:', updateData);
  io.emit('data_update', updateData);
};

// Create Nodemailer transporter
const createTransporter = () => {
  try {
    // Log email configuration for debugging
    console.log('📧 Email configuration check:');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
    console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
    console.log('   SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com');
    console.log('   SMTP_PORT:', process.env.SMTP_PORT || 587);
    console.log('   SMTP_SECURE:', process.env.SMTP_SECURE === 'true');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Email credentials not set. Email service will not work.');
      return null;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    console.log('✅ Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    return null;
  }
};

const transporter = createTransporter();

// Verify transporter configuration
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter verification failed:', error);
    } else {
      console.log('✅ Email transporter verified successfully');
    }
  });
}

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

// Initialize database
initializeDatabase();

// Utility function for database availability check
const checkDbAvailability = (res) => {
  if (!isDatabaseAvailable() || !db) {
    return res.status(503).json({ 
      error: 'Database not connected',
      message: 'Service temporarily unavailable due to database connectivity issues.'
    });
  }
  return null;
};

// Utility function for user-based filtering
const createUserFilter = (userId) => ({
  $or: [
    { createdBy: userId },
    { 'members.id': userId }
  ]
});

const createExpenseFilter = (userId) => ({
  $or: [
    { createdBy: userId },
    { paidBy: userId },
    { splitBetween: userId }
  ]
});

const createSettlementFilter = (userId) => ({
  $or: [
    { fromMember: userId },
    { toMember: userId }
  ]
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    databaseConnected: isDatabaseAvailable(),
    uptime: process.uptime()
  });
});

// Session check endpoint
app.get('/api/auth/session', (req, res) => {
  if (req.session && req.session.user) {
    // User is authenticated via session (Google OAuth)
    const { password, ...userWithoutPassword } = req.session.user;
    res.json({ 
      user: userWithoutPassword,
      isAuthenticated: true
    });
  } else {
    // User is not authenticated
    res.status(401).json({ 
      error: 'Not authenticated',
      isAuthenticated: false
    });
  }
});

// Session logout endpoint
app.post('/api/auth/logout', (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    
    // Clear the session cookie
    res.clearCookie('connect.sid'); // 'connect.sid' is the default session cookie name
    
    res.json({ message: 'Logged out successfully' });
  });
});

// Google OAuth routes - only register if Google OAuth is available
// Check if Google OAuth is properly configured
const isGoogleOAuthConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL);

if (isGoogleOAuthConfigured) {
  console.log('✅ Google OAuth is properly configured');
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login?error=google_auth_failed' }),
    (req, res) => {
      // Successful authentication, return user data
      console.log('✅ Google OAuth successful for user:', req.user?.email);
      
      // Store user in session
      req.session.user = req.user;
      
      // Save the session before redirecting
      req.session.save((err) => {
        if (err) {
          console.error('❌ Error saving session:', err);
          return res.redirect('http://localhost:5173/login?error=session_failed');
        }
        
        // For API-based authentication, return JSON response
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
          res.json({
            success: true,
            user: {
              id: req.user.id,
              name: req.user.name,
              email: req.user.email,
              initials: req.user.initials
            },
            message: 'Google authentication successful'
          });
        } else {
          // For browser-based authentication, redirect to frontend with user data
          res.redirect('http://localhost:5173/login?google_success=true');
        }
      });
    }
  );
} else {
  console.warn('⚠️ Google OAuth is not configured. Disabling Google login.');
  // Provide fallback routes that return error
  app.get('/auth/google', (req, res) => {
    res.status(501).json({ error: 'Google OAuth is not configured' });
  });
  
  app.get('/auth/google/callback', (req, res) => {
    res.status(501).json({ error: 'Google OAuth is not configured' });
  });
}

// OTP routes for password reset
app.post('/api/forgot-password', async (req, res) => {
  const dbError = checkDbAvailability(res);
  if (dbError) return dbError;
  
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }
    
    // Check if user exists
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      // For security reasons, we don't reveal if the email exists
      return res.json({ message: 'If the email exists in our system, a password reset link has been sent.' });
    }
    
    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    
    console.log('🔐 Generated OTP for email:', email, 'OTP:', otp, 'Expires at:', expiresAt);
    
    // Store OTP in database
    const otpRecord = {
      email,
      otp, // Store as string
      expiresAt,
      createdAt: new Date()
    };
    
    await db.collection('otps').updateOne(
      { email },
      { $set: otpRecord },
      { upsert: true }
    );
    
    console.log('💾 OTP record stored for email:', email, otpRecord);
    
    // Send OTP via email
    if (transporter) {
      const mailOptions = {
        from: `"SplitSmart No-Reply" <${process.env.EMAIL_USER}>`,
        replyTo: 'no-reply@splitsmart.com',
        to: email,
        subject: 'SplitSmart Password Reset OTP',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SplitSmart Password Reset</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; background: #ffffff; }
              .otp { font-size: 32px; font-weight: 700; color: #333; letter-spacing: 5px; text-align: center; margin: 30px 0; }
              .button { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; }
              .warning { color: #e53e3e; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset</h1>
              </div>
              <div class="content">
                <p>Hi ${user.name},</p>
                <p>You have requested to reset your password on SplitSmart.</p>
                <p>Use the following OTP to reset your password:</p>
                <div class="otp">${otp}</div>
                <p class="warning">This OTP will expire in 15 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          SplitSmart Password Reset
          
          Hi ${user.name},
          
          You have requested to reset your password on SplitSmart.
          
          Use the following OTP to reset your password: ${otp}
          
          This OTP will expire in 15 minutes.
          
          If you didn't request this, please ignore this email.
        `
      };
      
      try {
        console.log('📧 Attempting to send OTP email to:', email);
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Password reset OTP sent successfully to:', email, 'Message ID:', info.messageId);
        res.json({ message: 'Password reset OTP sent to your email.' });
      } catch (emailError) {
        console.error('❌ Error sending password reset email to:', email, emailError);
        // Check if it's an authentication error
        if (emailError.code === 'EAUTH') {
          console.error('❌ Email authentication failed. Check your EMAIL_USER and EMAIL_PASS in .env file');
          res.status(500).json({ error: 'Email authentication failed. Please contact support.' });
        } else if (emailError.code === 'EENVELOPE') {
          console.error('❌ Invalid email address format');
          res.status(500).json({ error: 'Invalid email address. Please check the email address.' });
        } else {
          res.status(500).json({ error: 'Failed to send password reset email. Please try again.' });
        }
      }
    } else {
      console.error('❌ Email transporter is not available');
      res.status(500).json({ error: 'Email service not configured properly' });
    }
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  const dbError = checkDbAvailability(res);
  if (dbError) return dbError;
  
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    
    // Find OTP in database
    const otpRecord = await db.collection('otps').findOne({ email });
    
    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    // Check if OTP is expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await db.collection('otps').deleteOne({ email });
      return res.status(400).json({ error: 'OTP has expired' });
    }
    
    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    // OTP is valid, remove it from database
    await db.collection('otps').deleteOne({ email });
    
    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  const dbError = checkDbAvailability(res);
  if (dbError) return dbError;
  
  try {
    const { email, otp, newPassword } = req.body;
    
    console.log('🔐 Password reset request received:', { email, otp: '***', newPassword: '***' });
    
    if (!email || !otp || !newPassword) {
      console.log('❌ Missing required fields:', { email: !!email, otp: !!otp, newPassword: !!newPassword });
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }
    
    // Validate password strength
    if (newPassword.length < 6) {
      console.log('❌ Password too short:', newPassword.length);
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Find OTP in database
    console.log('🔍 Looking for OTP record for email:', email);
    const otpRecord = await db.collection('otps').findOne({ email });
    console.log('📋 OTP record found:', otpRecord);
    
    if (!otpRecord) {
      console.log('❌ No OTP record found for email:', email);
      // Let's check if there are any OTP records at all to debug
      const allOtps = await db.collection('otps').find({}).toArray();
      console.log('📋 All OTP records in database:', allOtps);
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    // Check if OTP is expired
    const now = new Date();
    const expiresAt = new Date(otpRecord.expiresAt);
    console.log('⏱️  OTP expiration check:', { now, expiresAt, expired: now > expiresAt });
    
    if (now > expiresAt) {
      await db.collection('otps').deleteOne({ email });
      console.log('⏰ OTP expired for email:', email);
      return res.status(400).json({ error: 'OTP has expired' });
    }
    
    // Check if OTP matches (with detailed logging)
    console.log('🔢 OTP verification:', { 
      provided: otp, 
      stored: otpRecord.otp, 
      match: otpRecord.otp === otp,
      providedType: typeof otp,
      storedType: typeof otpRecord.otp
    });
    
    // Ensure both OTPs are strings for comparison
    if (String(otpRecord.otp) !== String(otp)) {
      console.log('❌ OTP mismatch for email:', email);
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    // Hash new password
    console.log('🔒 Hashing new password for email:', email);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log('🔒 Password hashed successfully');
    
    // Check if user exists before updating
    console.log('👤 Checking if user exists for email:', email);
    const userExists = await db.collection('users').findOne({ email });
    console.log('👤 User exists:', userExists ? 'YES' : 'NO');
    
    if (!userExists) {
      console.log('❌ User not found for email:', email);
      return res.status(400).json({ error: 'User not found' });
    }
    
    // Update user's password in the database
    console.log('💾 Updating password for user with email:', email);
    console.log('💾 New hashed password:', hashedPassword.substring(0, 20) + '...');
    
    const result = await db.collection('users').updateOne(
      { email },
      { $set: { password: hashedPassword, updatedAt: new Date().toISOString() } }
    );
    
    console.log('✅ Password update result:', result);
    
    if (result.modifiedCount > 0) {
      console.log('✅ Password successfully updated in database for user:', email);
      // Remove OTP from database as it's no longer needed
      await db.collection('otps').deleteOne({ email });
      console.log('🗑️  OTP record deleted for email:', email);
      
      res.json({ message: 'Password reset successfully' });
    } else {
      console.log('❌ Failed to update password for email:', email);
      // Let's add more detailed logging to understand why the update failed
      const user = await db.collection('users').findOne({ email });
      console.log('👤 User found for email:', email, user ? 'YES' : 'NO');
      if (user) {
        console.log('👤 User ID:', user._id);
      }
      res.status(500).json({ error: 'Failed to reset password' });
    }
  } catch (error) {
    console.error('💥 Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// User routes
app.get('/api/users', async (req, res) => {
  const dbError = checkDbAvailability(res);
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
  const dbError = checkDbAvailability(res);
  if (dbError) return dbError;
  
  try {
    const userData = req.body;
    
    // Validation
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
    
    // Create user
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
  try {
    const dbError = checkDbAvailability(res);
    if (dbError) return dbError;
    
    const { email, password } = req.body;
    
    console.log('Login attempt with email:', email);
    
    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Login failed: Invalid email format');
      return res.status(400).json({ error: 'Invalid email address format' });
    }
    
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    console.log('User found, verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      console.log('Login successful for user:', email);
      const { password: userPassword, ...userWithoutPassword } = user;
      return res.json({ 
        success: true, 
        user: userWithoutPassword,
        message: 'Login successful'
      });
    } else {
      console.log('Login failed: Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    // Ensure we always return a JSON response
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to login. Please try again.' });
    }
  }
});

// Group routes
app.get('/api/groups', async (req, res) => {
  const dbError = checkDbAvailability(res);
  if (dbError) return dbError;
  
  try {
    const userId = req.query.userId || 'user-tusha';
    const groups = await db.collection('groups').find(createUserFilter(userId)).toArray();
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get a single group by ID
app.get('/api/groups/:id', async (req, res) => {
  const dbError = checkDbAvailability(res);
  if (dbError) return dbError;
  
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Group ID is required' });
    }
    
    const group = await db.collection('groups').findOne({ id });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

app.post('/api/groups', async (req, res) => {
  const dbError = checkDbAvailability(res);
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
      
      // Send invitation emails
      if (transporter && Array.isArray(newGroup.members) && newGroup.members.length > 1) {
        console.log('📧 Sending invitation emails to group members...');
        
        const creator = newGroup.members.find(member => member.id === newGroup.createdBy) || newGroup.members[0];
        const creatorName = creator ? creator.name : 'A SplitSmart user';
        
        const invitationPromises = newGroup.members
          .filter(member => member.id !== newGroup.createdBy)
          .map(async (member) => {
            try {
              // Use the email service directly instead of making an HTTP request to ourselves
              const emailResult = await sendGroupInvitationEmail({
                to: member.email,
                memberName: member.name,
                groupName: newGroup.name,
                inviterName: creatorName,
                groupId: newGroup.id
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
  const dbError = checkDbAvailability(res);
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
      // Delete associated expenses and settlements
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

// Update group endpoint
app.put('/api/groups/:id', async (req, res) => {
  const dbError = checkDbAvailability(res);
  if (dbError) return dbError;
  
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Group ID is required' });
    }
    
    // Remove fields that shouldn't be updated directly
    const { id: _, createdAt, ...updateFields } = updateData;
    updateFields.updatedAt = new Date().toISOString();
    
    const groupsCollection = db.collection('groups');
    const result = await groupsCollection.updateOne(
      { id },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (result.modifiedCount > 0) {
      // Fetch the updated group to return it
      const updatedGroup = await groupsCollection.findOne({ id });
      emitRealtimeUpdate('group_change', 'update', updatedGroup);
      res.json(updatedGroup);
    } else {
      // Return the existing group if no changes were made
      const existingGroup = await groupsCollection.findOne({ id });
      res.json(existingGroup);
    }
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Accept group invitation endpoint
app.post('/api/groups/:id/accept-invitation', async (req, res) => {
  const dbError = checkDbAvailability(res);
  if (dbError) return dbError;
  
  try {
    const { id } = req.params;
    const { email } = req.body;
    
    if (!id || !email) {
      return res.status(400).json({ error: 'Group ID and email are required' });
    }
    
    const groupsCollection = db.collection('groups');
    const group = await groupsCollection.findOne({ id });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Find the member with the matching email and invited status
    const memberIndex = group.members.findIndex(
      (member) => member.email === email && member.status === 'invited'
    );
    
    if (memberIndex === -1) {
      // Check if already accepted
      const acceptedMember = group.members.find(
        (member) => member.email === email && member.status === 'accepted'
      );
      
      if (acceptedMember) {
        return res.json({ success: true, message: 'Invitation already accepted' });
      }
      
      return res.status(400).json({ error: 'Invitation not found or already accepted' });
    }
    
    // Update the member status to accepted
    group.members[memberIndex].status = 'accepted';
    group.members[memberIndex].joinedAt = new Date().toISOString();
    
    // Update the group in the database
    const result = await groupsCollection.updateOne(
      { id },
      { $set: { members: group.members, updatedAt: new Date().toISOString() } }
    );
    
    if (result.modifiedCount > 0) {
      res.json({ success: true, message: 'Invitation accepted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to accept invitation' });
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// Email routes
const sendEmailHandler = async (req, res, getEmailOptions) => {
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
  const { to, memberName, groupName, inviterName, groupId } = req.body;
  
  if (!to || !memberName || !groupName || !inviterName || !groupId) {
    return res.status(400).json({ 
      error: 'Missing required fields: to, memberName, groupName, inviterName, and groupId are required' 
    });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }
  
  const getEmailOptions = (data) => {
    // Use environment variable for frontend URL or default to localhost for development
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const invitationLink = `${frontendUrl}/accept?groupId=${encodeURIComponent(data.groupId)}&email=${encodeURIComponent(data.to)}`;
    
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SplitSmart Group Invitation</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #ffffff; }
            .button { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Group Invitation</h1>
            </div>
            <div class="content">
              <p>Hi ${data.memberName},</p>
              <p>You've been invited to join <strong>"${data.groupName}"</strong> on SplitSmart by ${data.inviterName}.</p>
              <a href="${invitationLink}" class="button">Accept Invitation</a>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all;">${invitationLink}</p>
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
  
  sendEmailHandler(req, res, getEmailOptions);
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SplitSmart Payment Reminder</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #ffffff; }
            .amount { font-size: 28px; font-weight: 700; color: #e53e3e; }
            .button { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${data.memberName},</p>
              <p>This is a friendly reminder that you have a pending payment in the group <strong>"${data.groupName}"</strong> on SplitSmart.</p>
              <p class="amount">${data.amountOwed}</p>
              <a href="${paymentLink}" class="button">Make Payment</a>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all;">${paymentLink}</p>
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
  
  sendEmailHandler(req, res, getEmailOptions);
});

// Expense routes
app.get('/api/expenses', async (req, res) => {
  const dbError = checkDbAvailability(res);
  if (dbError) return dbError;
  
  try {
    const userId = req.query.userId || 'user-tusha';
    const expenses = await db.collection('expenses').find(createExpenseFilter(userId)).toArray();
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.get('/api/expenses/group/:groupId', async (req, res) => {
  const dbError = checkDbAvailability(res);
  if (dbError) return dbError;
  
  try {
    const { groupId } = req.params;
    const userId = req.query.userId || 'user-tusha';
    
    const expenses = await db.collection('expenses').find({
      groupId: groupId,
      ...createExpenseFilter(userId)
    }).toArray();
    
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses by group:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', async (req, res) => {
  const dbError = checkDbAvailability(res);
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
  const dbError = checkDbAvailability(res);
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
  const dbError = checkDbAvailability(res);
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

// Settlement routes
app.get('/api/settlements', async (req, res) => {
  const dbError = checkDbAvailability(res);
  if (dbError) return dbError;
  
  try {
    const userId = req.query.userId || 'user-tusha';
    const settlements = await db.collection('settlements').find(createSettlementFilter(userId)).toArray();
    res.json(settlements);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

app.get('/api/settlements/group/:groupId', async (req, res) => {
  const dbError = checkDbAvailability(res);
  if (dbError) return dbError;
  
  try {
    const { groupId } = req.params;
    const userId = req.query.userId || 'user-tusha';
    
    const settlements = await db.collection('settlements').find({
      groupId: groupId,
      ...createSettlementFilter(userId)
    }).toArray();
    
    res.json(settlements);
  } catch (error) {
    console.error('Error fetching settlements by group:', error);
    res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

app.post('/api/settlements', async (req, res) => {
  const dbError = checkDbAvailability(res);
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
  const dbError = checkDbAvailability(res);
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
  const dbError = checkDbAvailability(res);
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

// Status endpoints
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
  const distPath = path.join(__dirname, '../dist');
  // Check if dist directory exists before serving
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.warn('⚠️  Dist directory not found, skipping static file serving');
  }
}

// Start server
const serverInstance = server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

// Add listener for server close event
serverInstance.on('close', () => {
  console.log('Server instance closed');
});

// Add listener for server error event
serverInstance.on('error', (err) => {
  console.error('Server error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  await closeDatabase();
  process.exit(0);
});

// Add process exit handlers for debugging
process.on('exit', (code) => {
  console.log(`Process exiting with code: ${code}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export { io, connectedClients };