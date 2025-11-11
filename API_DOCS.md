# SplitSmart Email API

This document describes the email sending API endpoints for the SplitSmart application.

## Base URL

All endpoints are relative to: `http://localhost:5005/api`

## Endpoints

### Send Group Invitation Email

Sends an invitation email to a user to join a group.

**URL**: `POST /send-invite`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "to": "recipient@example.com",
  "memberName": "John Doe",
  "groupName": "Vacation Trip",
  "inviterName": "Jane Smith"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Invitation email sent successfully",
  "messageId": "<unique-message-id>"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message"
}
```

### Send Payment Reminder Email

Sends a payment reminder email to a user.

**URL**: `POST /send-reminder`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "to": "recipient@example.com",
  "memberName": "John Doe",
  "groupName": "Apartment Expenses",
  "amountOwed": "₹45.50"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment reminder email sent successfully",
  "messageId": "<unique-message-id>"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Email Templates

### Invitation Email

The invitation email template includes:
- A personalized greeting with the member's name
- Information about who invited them and to which group
- A highlighted section explaining the invitation
- A call-to-action button to accept the invitation
- A plain text link as an alternative
- A footer with "Please do not reply to this email"

### Reminder Email

The reminder email template includes:
- A personalized greeting with the member's name
- Information about the pending payment and group
- A highlighted amount box showing what they owe
- A highlighted section requesting prompt payment
- A call-to-action button to make payment
- A plain text link as an alternative
- A footer with "Please do not reply to this email"

## Configuration

To use these endpoints, you need to configure the following environment variables in your `.env` file:

```
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Frontend Integration

### Using fetch()

```javascript
// Send invitation email
const inviteData = {
  to: 'recipient@example.com',
  memberName: 'John Doe',
  groupName: 'Vacation Trip',
  inviterName: 'Jane Smith'
};

fetch('/api/send-invite', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(inviteData),
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Email sent successfully');
  } else {
    console.error('Error:', data.error);
  }
})
.catch(error => {
  console.error('Network error:', error);
});
```

### Using axios

```javascript
import axios from 'axios';

// Send reminder email
const reminderData = {
  to: 'recipient@example.com',
  memberName: 'John Doe',
  groupName: 'Apartment Expenses',
  amountOwed: '₹45.50'
};

axios.post('/api/send-reminder', reminderData)
  .then(response => {
    if (response.data.success) {
      console.log('Email sent successfully');
    } else {
      console.error('Error:', response.data.error);
    }
  })
  .catch(error => {
    console.error('Network error:', error);
  });
```