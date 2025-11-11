#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * 
 * This script helps you test your email configuration for SplitSmart.
 * 
 * Usage:
 * 1. Update your .env file with your email credentials
 * 2. Run this script to test the configuration:
 *    - For mock emails (default in development): node server/scripts/emailSetupHelper.js
 *    - For real emails: USE_REAL_EMAILS=true node server/scripts/emailSetupHelper.js (Linux/Mac)
 *    - For real emails: $env:USE_REAL_EMAILS="true"; node server/scripts/emailSetupHelper.js (Windows)
 */

import dotenv from 'dotenv';
import transporter from '../config/nodemailer.js';
import { sendGroupInvitationEmail } from '../services/emailService.js';

dotenv.config();

async function testEmailSetup() {
  console.log('📧 SplitSmart Email Configuration Test');
  console.log('=====================================');
  
  // Display current configuration
  console.log('\n📋 Current Configuration:');
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Use Real Emails: ${process.env.NODE_ENV === 'production' || process.env.USE_REAL_EMAILS === 'true'}`);
  console.log(`  Email Service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
  console.log(`  SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
  console.log(`  SMTP Port: ${process.env.SMTP_PORT || 587}`);
  
  // Test transporter configuration
  console.log('\n🔍 Testing Email Transporter...');
  
  try {
    // Send a test email
    const testResult = await transporter.sendMail({
      from: `"SplitSmart No-Reply" <${process.env.EMAIL_USER}>`,
      replyTo: 'no-reply@splitsmart.app',
      to: 'test@example.com',
      subject: 'SplitSmart Email Configuration Test',
      text: 'This is a test email to verify your email configuration is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">SplitSmart Email Configuration Test</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Configuration Summary:</h3>
            <ul>
              <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</li>
              <li><strong>Email Mode:</strong> ${process.env.NODE_ENV === 'production' || process.env.USE_REAL_EMAILS === 'true' ? 'Real Emails' : 'Mock/Simulated'}</li>
              <li><strong>Service:</strong> ${process.env.EMAIL_SERVICE || 'gmail'}</li>
            </ul>
          </div>
          <p>If you're seeing this email, your configuration is working correctly!</p>
          <p><small>This is an automated test message from SplitSmart.</small></p>
        </div>
      `
    });
    
    console.log('✅ Email Transporter Test: PASSED');
    console.log(`   Message ID: ${testResult.messageId}`);
    
    if (process.env.NODE_ENV === 'production' || process.env.USE_REAL_EMAILS === 'true') {
      console.log('   📨 Real email was sent (check your inbox)');
    } else {
      console.log('   🎭 Mock email was generated (no real email sent)');
    }
    
    // Test the actual invitation email function
    console.log('\n🔍 Testing Invitation Email Function...');
    const invitationResult = await sendGroupInvitationEmail({
      to: 'test@example.com',
      memberName: 'Test User',
      groupName: 'Test Group',
      inviterName: 'Admin User',
      invitationLink: 'http://localhost:8081/accept-invitation?token=abc123'
    });
    
    if (invitationResult.success) {
      console.log('✅ Invitation Email Function: PASSED');
      console.log(`   Message ID: ${invitationResult.messageId}`);
    } else {
      console.log('❌ Invitation Email Function: FAILED');
      console.log(`   Error: ${invitationResult.error}`);
    }
    
    console.log('\n🎉 All tests completed!');
    
    if (process.env.NODE_ENV === 'production' || process.env.USE_REAL_EMAILS === 'true') {
      console.log('\n💡 Tips for Production:');
      console.log('   • Make sure your email credentials are secure');
      console.log('   • Verify your domain SPF/DKIM records for better deliverability');
      console.log('   • Monitor email sending limits of your provider');
    } else {
      console.log('\n💡 Development Tips:');
      console.log('   • To send real emails, set USE_REAL_EMAILS=true in your environment');
      console.log('   • Update your .env file with real email credentials');
      console.log('   • See EMAIL_SETUP.md for detailed configuration instructions');
    }
    
  } catch (error) {
    console.log('❌ Email Transporter Test: FAILED');
    console.log(`   Error: ${error.message}`);
    
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('   1. Check your email credentials in .env file');
    console.log('   2. For Gmail, ensure you\'re using an App Password, not your regular password');
    console.log('   3. Verify your SMTP settings (host, port, security)');
    console.log('   4. Check if your firewall is blocking SMTP connections');
    console.log('   5. See EMAIL_SETUP.md for detailed configuration instructions');
  }
}

// Run the test
testEmailSetup().catch(console.error);