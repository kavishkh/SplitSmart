#!/usr/bin/env node

/**
 * Email Functionality Test Script
 * 
 * This script tests the email functionality by sending a test invitation email.
 * 
 * Usage:
 *   node server/scripts/testEmailFunctionality.js
 */

import dotenv from 'dotenv';
import { sendGroupInvitationEmail } from '../services/emailService.js';

dotenv.config();

async function testEmailFunctionality() {
  console.log('📧 Testing SplitSmart Email Functionality');
  console.log('========================================');
  
  try {
    // Test sending an invitation email
    console.log('\n📧 Sending test invitation email...');
    
    const result = await sendGroupInvitationEmail({
      to: 'test@example.com',
      memberName: 'Test User',
      groupName: 'Test Group',
      inviterName: 'Admin User',
      invitationLink: 'http://localhost:8081/accept-invitation?token=abc123'
    });
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('   Message:', result.message);
      console.log('   Data:', result.data);
    } else {
      console.log('❌ Failed to send email');
      console.log('   Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error during email test:', error);
  }
  
  console.log('\n🎉 Email functionality test completed!');
}

// Run the test
testEmailFunctionality().catch(console.error);