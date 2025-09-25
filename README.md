# SplitSmart

SplitSmart is a modern expense splitting application that helps you easily split expenses with friends, family, and roommates. Track shared costs, settle balances, and keep your finances organized.

## Project Structure

```
your-project/
│
├── frontend/                # React frontend
│   ├── public/              # Static assets (images, icons, etc.)
│   ├── src/                 # Frontend source code
│   │   ├── components/
│   │   ├── pages/           # Application pages
│   │   ├── styles/
│   │   └── App.js / index.js
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── backend/                 # Node.js / Express backend
│   ├── src/                 # Backend source code
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Controller logic
│   │   ├── models/          # Database models
│   │   ├── middlewares/     # Middlewares
│   │   ├── config/          # Configuration files
│   │   └── server.js
│   ├── package.json
│   ├── .env.example         # Example env file
│   └── ...
│
├── package.json             # Root package.json for workspace management
└── .gitignore
```

## Features

- Create and manage expense groups
- Add expenses and split them among group members
- Track who owes whom
- Send email invitations to group members
- Send settlement reminders
- Responsive design for all devices

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- React Router for navigation
- TanStack Query for data fetching

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Resend for email delivery
- RESTful API design

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database (local or cloud)
- Resend API key for email functionality

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd splitsmart
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Set up environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Update the values with your configuration

### Development

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

### Production

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Start the backend server in production mode:
   ```bash
   cd backend
   npm start
   ```

## API Endpoints

### Health Check
- `GET /api/health` - Check if the API is running

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get a specific user

### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/:id` - Get a specific group
- `PUT /api/groups/:id` - Update a group
- `DELETE /api/groups/:id` - Delete a group

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create a new expense
- `GET /api/expenses/group/:groupId` - Get expenses for a specific group
- `PUT /api/expenses/:id` - Update an expense
- `DELETE /api/expenses/:id` - Delete an expense

### Settlements
- `GET /api/settlements` - Get all settlements
- `POST /api/settlements` - Create a new settlement
- `PATCH /api/settlements/:id/confirm` - Confirm a settlement
- `DELETE /api/settlements/:id` - Delete a settlement

### Email
- `POST /api/send-invitation-email` - Send group invitation email
- `POST /api/send-settlement-reminder` - Send settlement reminder email

## Environment Variables

### Backend (.env)
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `RESEND_API_KEY` - Resend API key for email service

## Deployment

The application can be deployed to any cloud platform that supports Node.js applications. For production deployment:

1. Set the `NODE_ENV` environment variable to `production`
2. Ensure the MongoDB connection string is properly configured
3. Set up the Resend API key for email functionality
4. Build the frontend and ensure it's served by the backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.