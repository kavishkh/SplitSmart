import transporter from '../config/nodemailer.js';

/**
 * Send a group invitation email
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.memberName - Name of the invited member
 * @param {string} params.groupName - Name of the group
 * @param {string} params.inviterName - Name of the person who sent the invitation
 * @param {string} params.invitationLink - Link to accept the invitation
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export async function sendGroupInvitationEmail({ to, memberName, groupName, inviterName, invitationLink }) {
  try {
    const mailOptions = {
      from: `"SplitSmart No-Reply" <${process.env.EMAIL_USER}>`,
      replyTo: 'no-reply@splitsmart.app',
      to: to,
      subject: `You've been invited to join ${groupName} on SplitSmart!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SplitSmart Invitation</title>
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
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
              background: #e7f3ff;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SplitSmart Group Invitation</h1>
            </div>
            <div class="content">
              <p>Hi ${memberName},</p>
              
              <p><strong>${inviterName}</strong> has invited you to join the group <strong>"${groupName}"</strong> on SplitSmart — a smart way to manage shared expenses with friends and family.</p>
              
              <div class="highlight">
                <p>You've been invited to collaborate on expense tracking and splitting within this group.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${invitationLink}" class="button">Accept Invitation</a>
              </div>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${invitationLink}</p>
              
              <p>If you didn't expect this invite, you can safely ignore this email.</p>
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
        SplitSmart Group Invitation
        
        Hi ${memberName},
        
        ${inviterName} has invited you to join the group "${groupName}" on SplitSmart — a smart way to manage shared expenses with friends and family.
        
        You've been invited to collaborate on expense tracking and splitting within this group.
        
        Accept your invitation by visiting:
        ${invitationLink}
        
        If you didn't expect this invite, you can safely ignore this email.
        
        — The SplitSmart Team
        This email was sent to ${to}
        Please do not reply to this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 Invitation email sent successfully:');
    console.log('   To:', to);
    console.log('   Subject:', mailOptions.subject);
    console.log('   Message ID:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a reminder email for pending payments
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.memberName - Name of the member
 * @param {string} params.groupName - Name of the group
 * @param {number} params.amountOwed - Amount the member owes
 * @param {string} params.paymentLink - Link to make payment
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export async function sendPaymentReminderEmail({ to, memberName, groupName, amountOwed, paymentLink }) {
  try {
    const mailOptions = {
      from: `"SplitSmart No-Reply" <${process.env.EMAIL_USER}>`,
      replyTo: 'no-reply@splitsmart.app',
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
    
    return { 
      success: true, 
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending payment reminder email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a settlement confirmation email
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.memberName - Name of the member
 * @param {string} params.groupName - Name of the group
 * @param {number} params.amount - Settlement amount
 * @param {string} params.fromMemberName - Name of the member who made the payment
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export async function sendSettlementConfirmationEmail({ to, memberName, groupName, amount, fromMemberName }) {
  try {
    const mailOptions = {
      from: `"SplitSmart No-Reply" <${process.env.EMAIL_USER}>`,
      replyTo: 'no-reply@splitsmart.app',
      to: to,
      subject: `Settlement Confirmed: ${amount} paid in ${groupName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SplitSmart Settlement Confirmation</title>
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
              background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
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
            .confirmation-box {
              background: #f0fff4;
              border: 1px solid #c6f6d5;
              border-radius: 6px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .confirmation-text {
              font-size: 20px;
              font-weight: 700;
              color: #38a169;
              margin: 0;
            }
            .details {
              color: #4a5568;
              font-size: 16px;
              margin: 5px 0 0 0;
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
              background: #e6fffa;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              border-left: 4px solid #38a169;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Settlement Confirmed</h1>
            </div>
            <div class="content">
              <p>Hi ${memberName},</p>
              
              <p>We're confirming that <strong>${fromMemberName}</strong> has settled <strong>${amount}</strong> in the group <strong>"${groupName}"</strong> on SplitSmart.</p>
              
              <div class="confirmation-box">
                <p class="confirmation-text">✓ Settlement Confirmed</p>
                <p class="details">Amount: ${amount}</p>
                <p class="details">Paid by: ${fromMemberName}</p>
                <p class="details">Group: ${groupName}</p>
              </div>
              
              <div class="highlight">
                <p>Your balance in this group has been updated accordingly. Thank you for keeping your expenses up to date!</p>
              </div>
              
              <p>If you have any questions about this settlement, please check your group details in the SplitSmart app.</p>
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
        SplitSmart Settlement Confirmation
        
        Hi ${memberName},
        
        We're confirming that ${fromMemberName} has settled ${amount} in the group "${groupName}" on SplitSmart.
        
        Settlement Confirmed:
        Amount: ${amount}
        Paid by: ${fromMemberName}
        Group: ${groupName}
        
        Your balance in this group has been updated accordingly. Thank you for keeping your expenses up to date!
        
        If you have any questions about this settlement, please check your group details in the SplitSmart app.
        
        — The SplitSmart Team
        This email was sent to ${to}
        Please do not reply to this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 Settlement confirmation email sent successfully:');
    console.log('   To:', to);
    console.log('   Subject:', mailOptions.subject);
    console.log('   Message ID:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending settlement confirmation email:', error);
    return { success: false, error: error.message };
  }
}

export default {
  sendGroupInvitationEmail,
  sendPaymentReminderEmail,
  sendSettlementConfirmationEmail
};

