# SplitSmart Application Deployment Guide

This document provides instructions for deploying the SplitSmart application, a MERN stack application with React frontend and Express backend.

## Project Structure

```
SplitSmart/
├── Backend/                # Express backend server
│   ├── src/                # Backend source code
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middlewares/    # Custom middlewares
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── index.js        # Entry point
│   │   └── server.js       # Main server file
│   ├── .env.example        # Example environment variables
│   └── package.json        # Backend dependencies and scripts
├── Frontend/               # React frontend source
│   ├── src/                # React frontend source
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies and scripts
│   └── ...                 # Other frontend config files
├── .env                    # Environment variables
└── package.json            # Root dependencies and scripts
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
   npm run start
   ```

The server will serve the frontend static files and handle API requests.

### Option 2: Deploy on Render (Recommended for beginners)

1. Push your code to a GitHub repository
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" and select "Web Service"
4. Connect your GitHub repository
5. Configure your service:
   - **Name**: Give your service a name (e.g., "splitsmart")
   - **Environment**: Node
   - **Build command**: `npm install; npm run build`
   - **Start command**: `npm start`
   - **Auto-deploy**: Yes (recommended)
6. Add environment variables in the Render dashboard:
   - `NODE_ENV`: production
   - `PORT`: 10000 (Render's default port)
   - `MONGODB_URI`: Your MongoDB connection string
   - `RESEND_API_KEY`: Your Resend API key
7. Click "Create Web Service" and wait for deployment

### Option 3: Separate Frontend and Backend Deployment

1. Start the backend server:
   ```bash
   npm run backend:start
   ```

2. In a separate terminal, start the frontend development server:
   ```bash
   npm run frontend:dev
   ```

For production, build the frontend and serve it using a static file server.

## Scripts

- `npm run dev`: Start both frontend and backend in development mode
- `npm run build`: Build both frontend and backend
- `npm start`: Start the application in production mode
- `npm run frontend:dev`: Start frontend development server
- `npm run backend:dev`: Start backend development server

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
5. **Path Error with Wildcard Routes**: If you encounter `PathError [TypeError]: Missing parameter name at index 1: *`, ensure that the wildcard route (`app.use((req, res) => {})`) is defined after all API routes in your server.js file

## Production Considerations

1. Use a production MongoDB instance (MongoDB Atlas recommended)
2. Set `NODE_ENV=production` in your environment variables
3. Use a process manager like PM2 for production deployment
4. Configure proper SSL certificates for HTTPS
5. Set up monitoring and logging for your application
6. When deploying on Render, ensure your MongoDB connection string is properly formatted with URL-encoded special characters
7. For Render deployments, always use environment variables for sensitive information like database credentials and API keys