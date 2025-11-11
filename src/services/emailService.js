/**
 * Send invitation emails to multiple members when they are added to a group
 * @param {Object} params - Email parameters
 * @param {Array} params.members - Array of member objects with name and email
 * @param {string} params.groupName - Name of the group
 * @param {string} params.inviterName - Name of the person who sent the invitation
 * @param {string} params.groupId - ID of the group
 * @param {string} params.ownerId - ID of the group owner (to exclude from emails)
 * @returns {Promise<Array>} - Array of email sending results
 */
export async function sendGroupInvitationEmails({ members, groupName, inviterName, groupId, ownerId }) {
  const results = [];
  
  // Filter out the group owner from the members list
  const membersToNotify = members.filter(member => member.id !== ownerId);
  
  // Send email to each member
  for (const member of membersToNotify) {
    try {
      // Generate invitation link with member email for verification
      const invitationLink = `https://splitsmart.app/accept?groupId=${groupId}&email=${encodeURIComponent(member.email)}`;
      
      const result = await sendGroupInvitationEmail({
        to: member.email,
        memberName: member.name,
        groupName,
        inviterName,
        invitationLink
      });
      results.push({ member, success: result.success, error: result.error });
    } catch (error) {
      results.push({ member, success: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Send an invitation email to join a group
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
    const response = await fetch('/api/send-invitation-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        memberName,
        groupName,
        inviterName,
        invitationLink,
        from: '"SplitSmart No-Reply" <no-reply@splitsmart.app>'
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

    console.log('Email sent successfully:', result);
    return { success: true, data: result.data, message: result.message };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

export default {
  sendGroupInvitationEmail,
  sendGroupInvitationEmails
};