import transporter from '../config/nodemailer.js';

const BASE_STYLES = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f8f9fa; margin:0; padding:0; }
  .container { max-width:600px; margin:auto; background:#fff; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1); overflow:hidden; }
  .header { color:#fff; padding:30px 20px; text-align:center; }
  .content { padding:30px; line-height:1.6; color:#333; }
  .button { display:inline-block; padding:12px 24px; border-radius:6px; font-weight:600; text-decoration:none; color:#fff; margin:20px 0; }
  .footer { background:#f8f9fa; padding:20px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #e9ecef; }
`;

function wrapEmail({ title, headerColor, bodyHTML, to }) {
  return `
  <!DOCTYPE html>
  <html>
  <head><style>${BASE_STYLES}</style></head>
  <body>
    <div class="container">
      <div class="header" style="background:${headerColor}">
        <h1>${title}</h1>
      </div>
      <div class="content">${bodyHTML}</div>
      <div class="footer">
        <p>— The SplitSmart Team</p>
        <p>This email was sent to ${to}</p>
        <p>Please do not reply to this email.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: `"SplitSmart No-Reply" <${process.env.EMAIL_USER}>`,
      replyTo: "no-reply@splitsmart.app",
      to,
      subject,
      html,
      text
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ---------------------------------------
    1️⃣ GROUP INVITATION EMAIL
---------------------------------------- */
export function sendGroupInvitationEmail({ to, memberName, groupName, inviterName, groupId }) {
  // Use environment variable for frontend URL or default to localhost for development
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  const invitationLink = `${frontendUrl}/accept?groupId=${encodeURIComponent(groupId)}&email=${encodeURIComponent(to)}`;
  
  const html = wrapEmail({
    to,
    title: "SplitSmart Group Invitation",
    headerColor: "linear-gradient(135deg, #667eea, #764ba2)",
    bodyHTML: `
      <p>Hi ${memberName},</p>
      <p><strong>${inviterName}</strong> invited you to join <strong>"${groupName}"</strong>.</p>
      <a href="${invitationLink}" class="button" style="background:#667eea;">Accept Invitation</a>
      <p>Link: ${invitationLink}</p>
    `
  });

  const text = `
    Hi ${memberName},
    ${inviterName} invited you to join "${groupName}".
    Accept here: ${invitationLink}
  `;

  return sendEmail({
    to,
    subject: `You've been invited to join ${groupName}!`,
    html,
    text
  });
}

/* ---------------------------------------
   2️⃣ PAYMENT REMINDER EMAIL
---------------------------------------- */
export function sendPaymentReminderEmail({ to, memberName, groupName, amountOwed, paymentLink }) {
  const html = wrapEmail({
    to,
    title: "Payment Reminder",
    headerColor: "linear-gradient(135deg, #f093fb, #f5576c)",
    bodyHTML: `
      <p>Hi ${memberName},</p>
      <p>You owe <strong>${amountOwed}</strong> in the group <strong>${groupName}</strong>.</p>
      <a href="${paymentLink}" class="button" style="background:#f5576c;">Make Payment</a>
      <p>Link: ${paymentLink}</p>
    `
  });

  const text = `
    Hi ${memberName},
    You owe ${amountOwed} in "${groupName}".
    Pay: ${paymentLink}
  `;

  return sendEmail({
    to,
    subject: `Payment Reminder: You owe ${amountOwed} in ${groupName}`,
    html,
    text
  });
}

/* ---------------------------------------
   3️⃣ SETTLEMENT CONFIRMATION EMAIL
---------------------------------------- */
export function sendSettlementConfirmationEmail({ to, memberName, groupName, amount, fromMemberName }) {
  const html = wrapEmail({
    to,
    title: "Settlement Confirmed",
    headerColor: "linear-gradient(135deg, #48bb78, #38a169)",
    bodyHTML: `
      <p>Hi ${memberName},</p>
      <p><strong>${fromMemberName}</strong> paid <strong>${amount}</strong> in <strong>${groupName}</strong>.</p>
    `
  });

  const text = `
    Hi ${memberName},
    ${fromMemberName} paid ${amount} in "${groupName}".
  `;

  return sendEmail({
    to,
    subject: `Settlement Confirmed: ${amount} paid in ${groupName}`,
    html,
    text
  });
}

export default {
  sendGroupInvitationEmail,
  sendPaymentReminderEmail,
  sendSettlementConfirmationEmail
};

