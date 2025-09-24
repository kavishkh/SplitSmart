# SplitSmart Application Deployment Guide

This document provides instructions for deploying the SplitSmart application, a MERN stack application with React frontend and Express backend.

## Project Structure

```
split-buddy-mern/
├── server/                 # Express backend server
│   ├── config/             # Database configuration
│   ├── models/             # Mongoose models
│   └── server.js           # Main server file
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utility libraries
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── App.tsx             # Main App component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
└── README.md               # Project documentation
```

## Prerequisites

1. Node.js (version 16 or higher)
2. MongoDB database (local or cloud instance)
3. Resend API key for email functionality

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# Server Configuration
PORT=5000
NODE_ENV=production

# Resend API Key
RESEND_API_KEY=your_resend_api_key

# User Configuration (from memory)
DEFAULT_USER=your_default_username
DEFAULT_PASSWORD=your_default_password
```

## Installation Steps

1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd split-buddy-mern
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables as described above.

4. Build the frontend:
   ```bash
   npm run build
   ```

## Deployment Options

### Option 1: Deploy as a Single Server (Recommended)

This deploys both frontend and backend on the same server:

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm run server
   ```

The server will serve the frontend static files and handle API requests.

### Option 2: Separate Frontend and Backend Deployment

1. Start the backend server:
   ```bash
   npm run server
   ```

2. In a separate terminal, start the frontend development server:
   ```bash
   npm run dev
   ```

For production, build the frontend and serve it using a static file server.

## Scripts

- `npm run dev`: Start frontend development server
- `npm run build`: Build the frontend for production
- `npm run server`: Start the backend server
- `npm run dev:full`: Start both frontend and backend in development mode

## Key Features

- User authentication and management
- Group creation and management
- Expense tracking and splitting
- Settlement processing
- Email notifications via Resend
- Responsive UI with dark mode support

## Troubleshooting

1. **Database Connection Issues**: Verify your MongoDB connection string in `.env`
2. **Email Sending Failures**: Check your Resend API key and domain verification
3. **CORS Errors**: Ensure the frontend and backend URLs are properly configured
4. **Port Conflicts**: Change the PORT value in `.env` if 5000 is already in use

## Production Considerations

1. Use a production MongoDB instance (MongoDB Atlas recommended)
2. Set `NODE_ENV=production` in your environment variables
3. Use a process manager like PM2 for production deployment
4. Configure proper SSL certificates for HTTPS
5. Set up monitoring and logging for your application