/**
 * Send an invitation email to join a group
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.groupName - Name of the group
 * @param {string} params.inviterName - Name of the person who sent the invitation
 * @param {string} params.invitationLink - Link to join the group
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export async function sendGroupInvitationEmail({ to, groupName, inviterName, invitationLink }) {
  try {
    const response = await fetch('/api/send-invitation-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        groupName,
        inviterName,
        invitationLink
      }),
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to parse error response, but handle case where there's no body
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorResult = await response.json();
        errorMessage = errorResult.error || errorMessage;
      } catch (parseError) {
        // If we can't parse JSON, use status text or generic message
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Try to parse JSON response
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      throw new Error('Failed to parse response from server');
    }

    // If we got a simulated response, show a friendly message
    if (result.message) {
      console.log('Email service message:', result.message);
    }

    console.log('Email sent successfully:', result.data);
    return { success: true, data: result.data, message: result.message };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a settlement reminder email
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.fromName - Name of the person who owes money
 * @param {number} params.amount - Amount owed
 * @param {string} params.groupName - Name of the group
 * @param {string} params.settlementLink - Link to settle the expense
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export async function sendSettlementReminderEmail({ to, fromName, amount, groupName, settlementLink }) {
  try {
    const response = await fetch('/api/send-settlement-reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        fromName,
        amount,
        groupName,
        settlementLink
      }),
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to parse error response, but handle case where there's no body
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorResult = await response.json();
        errorMessage = errorResult.error || errorMessage;
      } catch (parseError) {
        // If we can't parse JSON, use status text or generic message
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Try to parse JSON response
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      throw new Error('Failed to parse response from server');
    }

    // If we got a simulated response, show a friendly message
    if (result.message) {
      console.log('Email service message:', result.message);
    }

    console.log('Email sent successfully:', result.data);
    return { success: true, data: result.data, message: result.message };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}