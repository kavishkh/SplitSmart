import { sendGroupInvitationEmail, sendPaymentReminderEmail, sendSettlementConfirmationEmail } from './emailService.js';

/**
 * Resend service for retrying failed email sends
 */

// Maximum number of resend attempts
const MAX_RESEND_ATTEMPTS = 3;

// Delay between resend attempts (in milliseconds)
const RESEND_DELAY = 5000; // 5 seconds

/**
 * Resend a group invitation email
 * @param {Object} params - Email parameters
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export async function resendGroupInvitationEmail(params, attempt = 1) {
  try {
    console.log(`Resending group invitation email (attempt ${attempt}/${MAX_RESEND_ATTEMPTS})...`);
    
    const result = await sendGroupInvitationEmail(params);
    
    if (result.success) {
      console.log('✅ Group invitation email resent successfully');
      return result;
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    console.error(`❌ Error resending group invitation email (attempt ${attempt}):`, error.message);
    
    // Retry if we haven't reached the maximum attempts
    if (attempt < MAX_RESEND_ATTEMPTS) {
      console.log(`⏳ Waiting ${RESEND_DELAY / 1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, RESEND_DELAY));
      return resendGroupInvitationEmail(params, attempt + 1);
    } else {
      console.error('❌ Maximum resend attempts reached for group invitation email');
      return { success: false, error: 'Maximum resend attempts reached' };
    }
  }
}

/**
 * Resend a payment reminder email
 * @param {Object} params - Email parameters
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export async function resendPaymentReminderEmail(params, attempt = 1) {
  try {
    console.log(`Resending payment reminder email (attempt ${attempt}/${MAX_RESEND_ATTEMPTS})...`);
    
    const result = await sendPaymentReminderEmail(params);
    
    if (result.success) {
      console.log('✅ Payment reminder email resent successfully');
      return result;
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    console.error(`❌ Error resending payment reminder email (attempt ${attempt}):`, error.message);
    
    // Retry if we haven't reached the maximum attempts
    if (attempt < MAX_RESEND_ATTEMPTS) {
      console.log(`⏳ Waiting ${RESEND_DELAY / 1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, RESEND_DELAY));
      return resendPaymentReminderEmail(params, attempt + 1);
    } else {
      console.error('❌ Maximum resend attempts reached for payment reminder email');
      return { success: false, error: 'Maximum resend attempts reached' };
    }
  }
}

/**
 * Resend a settlement confirmation email
 * @param {Object} params - Email parameters
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export async function resendSettlementConfirmationEmail(params, attempt = 1) {
  try {
    console.log(`Resending settlement confirmation email (attempt ${attempt}/${MAX_RESEND_ATTEMPTS})...`);
    
    const result = await sendSettlementConfirmationEmail(params);
    
    if (result.success) {
      console.log('✅ Settlement confirmation email resent successfully');
      return result;
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    console.error(`❌ Error resending settlement confirmation email (attempt ${attempt}):`, error.message);
    
    // Retry if we haven't reached the maximum attempts
    if (attempt < MAX_RESEND_ATTEMPTS) {
      console.log(`⏳ Waiting ${RESEND_DELAY / 1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, RESEND_DELAY));
      return resendSettlementConfirmationEmail(params, attempt + 1);
    } else {
      console.error('❌ Maximum resend attempts reached for settlement confirmation email');
      return { success: false, error: 'Maximum resend attempts reached' };
    }
  }
}

export default {
  resendGroupInvitationEmail,
  resendPaymentReminderEmail,
  resendSettlementConfirmationEmail
};