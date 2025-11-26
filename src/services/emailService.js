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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
      const invitationLink = `${frontendUrl}/accept?groupId=${groupId}&email=${encodeURIComponent(member.email)}`;
      
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
    const response = await fetch('/api/send-invite', {
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
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If we can't parse the error, use the default message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error: error.message };
  }
}