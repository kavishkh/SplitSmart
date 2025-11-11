# MongoDB Setup Instructions

This document provides instructions for setting up MongoDB with your SplitSmart application.

## Current Status

Your application is currently configured to use MongoDB but is running in demo mode because the MongoDB authentication is failing. The application is using in-memory storage as a fallback, which means data will not persist between server restarts.

## MongoDB Connection Issue

The error you're seeing is:
```
❌ MongoDB connection error: bad auth : Authentication failed.
```

This typically happens when:
1. The username or password in the connection string is incorrect
2. The MongoDB user doesn't exist or doesn't have proper permissions
3. The MongoDB cluster is not properly configured

## How to Fix MongoDB Connection

### 1. Verify MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in with your credentials
3. Select your cluster "splitwiseapp"

### 2. Check Database User

1. In MongoDB Atlas, go to "Database Access" in the left sidebar
2. Verify that a user named "Khanna" exists
3. If the user doesn't exist, create it:
   - Click "ADD NEW DATABASE USER"
   - Select "Password" as the authentication method
   - Enter "Khanna" as the username
   - Enter "9478934457" as the password
   - Set user privileges to "Atlas Admin" (for development) or more restrictive for production
   - Click "Add User"

### 3. Check Network Access

1. In MongoDB Atlas, go to "Network Access" in the left sidebar
2. Ensure that your IP address is whitelisted
3. For development, you can add "0.0.0.0/0" to allow access from anywhere (NOT recommended for production)
4. For production, add only your specific IP address

### 4. Update Connection String

If you've made changes to your MongoDB setup, update the connection string in your [.env](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/github/.env) file:

```
MONGODB_URI=mongodb+srv://Khanna:9478934457@splitwiseapp.9r9zryh.mongodb.net/splitwiseApp?retryWrites=true&w=majority
```

### 5. Test the Connection

After making these changes, restart your server:
```bash
npm run server
```

Check the health endpoint to verify the connection:
```bash
curl http://localhost:5000/api/health
```

If successful, you should see:
```json
{
  "status": "OK",
  "timestamp": "2025-10-30T08:01:46.918Z",
  "databaseConnected": true,
  "message": "SplitSmart backend is running with MongoDB"
}
```

## Initialize Database Collections

Once the MongoDB connection is working, initialize the database collections:

```bash
npm run init:mongodb
```

This will create the required collections:
- users
- groups
- expenses
- settlements

## Troubleshooting

If you continue to have issues:

1. Double-check your username and password
2. Ensure your IP is whitelisted in MongoDB Atlas
3. Try creating a new database user with a different username/password
4. Check that your MongoDB cluster is deployed and running

## Using Demo Mode

If you prefer to continue using the in-memory storage for development:
1. No changes are needed - the application will automatically fall back to demo mode
2. Remember that data will not persist between server restarts
3. This is fine for development but not suitable for production

## Security Notes

For production deployment:
1. Use a strong password for your MongoDB user
2. Restrict network access to specific IP addresses
3. Use environment variables to store sensitive information
4. Consider using MongoDB's built-in encryption features