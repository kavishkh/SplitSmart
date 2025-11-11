# SplitSmart - Expense Sharing Application

SplitSmart is a modern expense sharing application built with React, TypeScript, and Node.js that helps you split bills and manage shared expenses with friends and family.

## Features

- **Group Management**: Create and manage expense groups
- **Expense Tracking**: Add and track shared expenses
- **Smart Splitting**: Automatic calculation of who owes whom
- **Real-time Updates**: Live updates across all devices
- **Payment Reminders**: Automated email reminders for pending payments
- **Settlements**: Easy settlement of debts between group members
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express, MongoDB
- **Real-time**: Socket.IO
- **Email Service**: Nodemailer with support for Gmail, SendGrid, and other providers

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance
- Email service account (Gmail, SendGrid, etc.)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd splitwise1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and configure your settings:
   ```bash
   cp .env.example .env
   ```

4. Configure MongoDB:
   Update the `MONGODB_URI` in your `.env` file with your MongoDB connection string.

5. Configure Email Service (Optional but recommended):
   See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed instructions.

### Running the Application

#### Development Mode

```bash
npm run dev:full
```

This will start both the frontend (on port 8081) and backend servers.

#### Production Mode

```bash
npm run build
npm run server
```

### Email Service Configuration

To send real emails instead of simulated ones:

1. Set `USE_REAL_EMAILS=true` in your `.env` file
2. Configure your email provider credentials
3. For Gmail, you need to generate an App Password (see [EMAIL_SETUP.md](EMAIL_SETUP.md))

### Default User

The application comes with a default user for testing:
- Username: tusha
- Password: Kavish12

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/users` - Get all users
- `GET /api/groups` - Get all groups
- `POST /api/send-invitation-email` - Send group invitation email
- `POST /api/resend-email` - Resend email

## Troubleshooting

If you encounter issues:

1. **Database Connection**: Verify your MongoDB URI is correct
2. **Email Sending**: Check your email configuration and credentials
3. **Port Conflicts**: Ensure ports 8081 and 5005 are available

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on the GitHub repository or contact the maintainers.