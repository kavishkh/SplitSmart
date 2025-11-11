# Gmail App Password Setup Guide

## Why App Passwords?

Gmail requires App Passwords for applications that need to access your Gmail account. This is a security measure to prevent unauthorized access to your account.

## How to Generate an App Password

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Navigate to Security > 2-Step Verification
   - Follow the prompts to set up 2FA (you'll need your phone number)

2. **Generate an App Password**
   - In your Google Account settings, go to Security > 2-Step Verification > App passwords
   - If you can't find this option, make sure 2FA is enabled first
   - Select "Mail" as the app
   - Select your device (or "Other" if your device isn't listed)
   - Click "Generate"
   - Copy the 16-character password that appears

3. **Use the App Password**
   - In your `.env` file, replace `EMAIL_PASS` with the generated app password
   - Do NOT use your regular Gmail password
   - The app password will look like: `abcd efgh ijkl mnop` (with spaces)

## Example .env Configuration

```env
# Email Configuration for Gmail with App Password
USE_REAL_EMAILS=true
EMAIL_SERVICE=gmail
EMAIL_USER=your_actual_email@gmail.com
EMAIL_PASS=your_16_character_app_password  # No spaces
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Common Issues and Solutions

### "Username and Password not accepted" Error
- Make sure you're using an App Password, not your regular Gmail password
- Ensure there are no extra spaces in your app password
- Verify that 2FA is enabled on your account

### "Application-specific password not working"
- Generate a new App Password
- Make sure you're copying the password correctly (no spaces)
- Check that you've selected "Mail" as the app when generating the password

### Port/Connection Issues
- Try using port 465 with `SMTP_SECURE=true` if port 587 doesn't work
- Ensure your firewall isn't blocking outgoing connections on port 587

## Testing Your Configuration

After setting up your App Password:

1. Update your `.env` file with the new credentials
2. Run the test script: `npm run test:email:setup`
3. You should see "Email Transporter Test: PASSED" if everything is configured correctly

## Security Best Practices

- Never commit your `.env` file to version control
- Regenerate App Passwords periodically for security
- Use different App Passwords for different applications
- Revoke App Passwords you no longer need in your Google Account settings