import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDatabase from './config/database.js';
// Import routes
import userRoutes from './routes/userRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import settlementRoutes from './routes/settlementRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import { Resend } from 'resend';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Resend with the API key from environment variables
const resendApiKey = process.env.RESEND_API_KEY || 're_KDLVGMNw_EKRwEeE4HeAUcM5UZsfRWnyw';
console.log('Resend API Key (first 5 chars):', resendApiKey.substring(0, 5) + '...');
const resend = new Resend(resendApiKey);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    message: 'SplitSmart backend is running'
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api', emailRoutes);

// Connect to database
connectDatabase().catch((error) => {
  console.error('Failed to connect to MongoDB:', error);
  console.log('Running in demo mode without database connection');
});

// Serve static files from the React app build directory in production
// This should come AFTER API routes but BEFORE the catch-all route
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../../Frontend/dist');
  console.log('Serving static files from:', staticPath);
  
  // Add logging for static file requests
  app.use((req, res, next) => {
    console.log('Received request:', req.method, req.url);
    next();
  });
  
  // Serve static files
  app.use(express.static(staticPath, {
    setHeaders: (res, path, stat) => {
      console.log('Serving static file:', path);
      res.set('Cache-Control', 'no-cache');
    }
  }));
  
  // Handle React routing, return all requests to React app
  // This should be the LAST middleware
  app.use((req, res) => {
    console.log('Fallback to index.html for:', req.url);
    const indexPath = path.join(staticPath, 'index.html');
    console.log('Index file path:', indexPath);
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(500).send('Error serving index.html');
      }
    });
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