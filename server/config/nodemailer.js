import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter object using the default SMTP transport
const createTransporter = () => {
  // Check if we should use real emails
  const useRealEmails = process.env.USE_REAL_EMAILS === 'true' || 
                        process.env.NODE_ENV === 'production' || 
                        process.env.NODE_ENV === 'prod';
  
  if (useRealEmails) {
    try {
      // Check if we have email configuration
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️  Email credentials not found. Falling back to mock mode.');
        return createMockTransporter();
      }

      // Configure transporter based on email service
      const transporterConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      };

      // Special handling for Gmail
      if (process.env.EMAIL_SERVICE === 'gmail' || transporterConfig.host.includes('gmail')) {
        transporterConfig.auth.user = process.env.EMAIL_USER;
        transporterConfig.auth.pass = process.env.EMAIL_PASS;
      }

      const transporter = nodemailer.createTransport(transporterConfig);
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email transporter verification failed:', error);
        } else {
          console.log('✅ Email transporter verified successfully');
        }
      });
      
      return transporter;
    } catch (error) {
      console.error('❌ Failed to create email transporter:', error);
      console.warn('⚠️  Falling back to mock mode.');
      return createMockTransporter();
    }
  }
  
  // For development, use mock emails by default
  // But allow real emails if explicitly configured
  if (process.env.USE_REAL_EMAILS === 'true') {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      // Verify the transporter configuration
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email transporter verification failed:', error);
        } else {
          console.log('✅ Email transporter verified successfully');
        }
      });
      
      return transporter;
    } catch (error) {
      console.error('❌ Failed to create email transporter:', error);
      console.warn('⚠️  Falling back to mock mode.');
      return createMockTransporter();
    }
  }
  
  // Default to mock transporter for development
  return createMockTransporter();
};

// Create a mock transporter for development/testing
const createMockTransporter = () => {
  return {
    sendMail: async (mailOptions) => {
      console.log('📧 [MOCK EMAIL - DEVELOPMENT MODE]');
      console.log('   From:', mailOptions.from);
      console.log('   To:', mailOptions.to);
      console.log('   Subject:', mailOptions.subject);
      console.log('   Text:', mailOptions.text ? mailOptions.text.substring(0, 100) + '...' : 'None');
      console.log('   HTML:', mailOptions.html ? mailOptions.html.substring(0, 100) + '...' : 'None');
      
      // Generate a mock message ID
      const messageId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        messageId: messageId,
        response: 'Mock email sent successfully'
      };
    },
    verify: (callback) => {
      callback(null, true);
    }
  };
};

const transporter = createTransporter();

export default transporter;