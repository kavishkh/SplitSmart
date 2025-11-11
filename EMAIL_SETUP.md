# Email Service Setup

## Gmail Configuration (Recommended for Production)

To use Gmail for sending real emails, you need to configure an App Password. See our detailed [Gmail App Password Setup Guide](GMAIL_APP_PASSWORD_GUIDE.md) for step-by-step instructions.

### Quick Setup:

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to your Google Account settings
   - Navigate to Security > 2-Step Verification > App passwords
   - Generate a new app password for "Mail"
3. Update your `.env` file with your actual credentials:

```env
# Email Configuration for Gmail
USE_REAL_EMAILS=true
EMAIL_SERVICE=gmail
EMAIL_USER=your_actual_email@gmail.com
EMAIL_PASS=your_generated_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Alternative Email Providers

If you prefer not to use Gmail, you can use other email providers:

### SendGrid
```env
USE_REAL_EMAILS=true
EMAIL_SERVICE=SendGrid
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
```

### Mailgun
```env
USE_REAL_EMAILS=true
EMAIL_SERVICE=Mailgun
EMAIL_USER=your_mailgun_smtp_username
EMAIL_PASS=your_mailgun_smtp_password
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
```

## Testing Email Functionality

To test your email configuration:

1. Update your `.env` file with valid credentials
2. Run the test script: `npm run test:email:setup`
3. Check your inbox for the test emails (if using real emails)

## Troubleshooting

If you're still having issues:

1. Verify your credentials are correct
2. Ensure your App Password was generated correctly
3. Check that your firewall isn't blocking SMTP connections
4. Try using a different email provider

## Development vs Production

- In development mode, emails are simulated (not sent) by default
- Set `USE_REAL_EMAILS=true` to send real emails in development
- In production mode, real emails are sent automatically
- Set `NODE_ENV=production` for production mode

## Email Templates

The application includes professionally designed email templates for:
- Group invitations
- Payment reminders
- Settlement confirmations

All templates are responsive and will render correctly on both desktop and mobile devices.