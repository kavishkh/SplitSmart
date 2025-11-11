import React, { useState } from 'react';

const EmailForm = () => {
  const [inviteData, setInviteData] = useState({
    to: '',
    memberName: '',
    groupName: '',
    inviterName: ''
  });
  
  const [reminderData, setReminderData] = useState({
    to: '',
    memberName: '',
    groupName: '',
    amountOwed: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setMessage('Invitation email sent successfully!');
        // Reset form
        setInviteData({
          to: '',
          memberName: '',
          groupName: '',
          inviterName: ''
        });
      } else {
        setError(result.error || 'Failed to send invitation email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error sending invite:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReminderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const response = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setMessage('Reminder email sent successfully!');
        // Reset form
        setReminderData({
          to: '',
          memberName: '',
          groupName: '',
          amountOwed: ''
        });
      } else {
        setError(result.error || 'Failed to send reminder email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error sending reminder:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Send SplitSmart Emails</h2>
      
      {message && (
        <div style={{ 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {message}
        </div>
      )}
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}
      
      <div style={{ marginBottom: '40px' }}>
        <h3>Send Group Invitation</h3>
        <form onSubmit={handleInviteSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label>Recipient Email:</label>
            <input
              type="email"
              value={inviteData.to}
              onChange={(e) => setInviteData({...inviteData, to: e.target.value})}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Member Name:</label>
            <input
              type="text"
              value={inviteData.memberName}
              onChange={(e) => setInviteData({...inviteData, memberName: e.target.value})}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Group Name:</label>
            <input
              type="text"
              value={inviteData.groupName}
              onChange={(e) => setInviteData({...inviteData, groupName: e.target.value})}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Inviter Name:</label>
            <input
              type="text"
              value={inviteData.inviterName}
              onChange={(e) => setInviteData({...inviteData, inviterName: e.target.value})}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              backgroundColor: '#007bff', 
              color: 'white', 
              padding: '10px 20px', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>
      
      <div>
        <h3>Send Payment Reminder</h3>
        <form onSubmit={handleReminderSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label>Recipient Email:</label>
            <input
              type="email"
              value={reminderData.to}
              onChange={(e) => setReminderData({...reminderData, to: e.target.value})}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Member Name:</label>
            <input
              type="text"
              value={reminderData.memberName}
              onChange={(e) => setReminderData({...reminderData, memberName: e.target.value})}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Group Name:</label>
            <input
              type="text"
              value={reminderData.groupName}
              onChange={(e) => setReminderData({...reminderData, groupName: e.target.value})}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Amount Owed:</label>
            <input
              type="text"
              value={reminderData.amountOwed}
              onChange={(e) => setReminderData({...reminderData, amountOwed: e.target.value})}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              backgroundColor: '#007bff', 
              color: 'white', 
              padding: '10px 20px', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Sending...' : 'Send Reminder'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailForm;