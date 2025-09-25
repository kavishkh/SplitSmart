import { Resend } from 'resend';

// Initialize Resend with the API key from environment variables
const resendApiKey = process.env.RESEND_API_KEY || 're_KDLVGMNw_EKRwEeE4HeAUcM5UZsfRWnyw';
const resend = new Resend(resendApiKey);

export const sendInvitationEmail = async (req, res) => {
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
};

export const sendSettlementReminder = async (req, res) => {
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
};