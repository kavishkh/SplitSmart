# SplitSmart - Expense Splitting Application

SplitSmart is a modern expense splitting application that helps friends and groups manage shared expenses easily.

## Features

- Create and manage groups
- Add and track expenses
- Split expenses between group members
- Record settlements between members
- Group invitation system (email and link sharing)
- Settlement confirmation workflow
- Direct expense payments (pay only for expenses you owe)
- Comprehensive payment views (expenses, settlements, combined)
- Real-time data synchronization
- Responsive design for all devices

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL with Real-time capabilities)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (Frontend), Supabase (Backend)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd splitwise1/Readyapp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

To get your service role key:
1. Go to your Supabase project dashboard
2. Click on "Settings" (gear icon) in the left sidebar
3. Click on "API"
4. Copy the `service_role` key value

⚠️ **IMPORTANT**: Never commit your service role key to version control!
See [SUPABASE_SERVICE_KEY_SETUP.md](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/SUPABASE_SERVICE_KEY_SETUP.md) for detailed instructions.

### 4. Set Up Supabase Database

To resolve RLS security warnings and set up the database:

```bash
npm run setup:supabase:complete
```

This will:
- Create all necessary tables
- Enable Row Level Security
- Set up permissive policies for development

For detailed instructions, see [SUPABASE_SETUP.md](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/SUPABASE_SETUP.md) and [RLS_SOLUTION.md](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/RLS_SOLUTION.md).

### 5. Start the Development Server

```bash
npm run dev:full
```

This will start both the frontend and backend servers concurrently.

## Available Scripts

- `npm run dev` - Start frontend development server
- `npm run server` - Start backend server
- `npm run dev:full` - Start both frontend and backend servers
- `npm run build` - Build the application for production
- `npm run setup:supabase:complete` - Set up Supabase database with RLS
- `npm run enable:rls:improved` - Enable RLS with improved script
- `npm run check:rls` - Check RLS status of tables
- `npm run test:expense-api` - Test expense API functionality

## Project Structure

```
.
├── src/                      # Frontend source code
│   ├── components/           # React components
│   │   ├── AddExpenseModal.tsx     # Add expense form
│   │   ├── AddMemberModal.tsx      # Add member to group
│   │   ├── ConfirmSettlementModal.tsx # Confirm settlement payments
│   │   ├── CreateGroupModal.tsx    # Create new group
│   │   ├── EditExpenseModal.tsx    # Edit existing expenses
│   │   ├── EditMemberModal.tsx     # Edit group members
│   │   ├── GroupsGrid.tsx          # Groups display grid
│   │   ├── InviteMemberModal.tsx   # Invite members to group
│   │   ├── PayExpenseModal.tsx     # Pay for specific expenses
│   │   ├── SettlementModal.tsx     # Create settlement payments
│   │   └── Header.tsx              # Application header
│   ├── hooks/               # Custom hooks
│   │   ├── use-expense-payments.tsx # Expense-specific payment management
│   │   ├── use-expenses.tsx        # Expense and settlement management
│   │   ├── use-groups.tsx          # Group management
│   │   ├── use-mobile.tsx          # Mobile detection
│   │   ├── use-theme.tsx           # Theme management
│   │   ├── use-toast.ts             # Toast notifications
│   │   └── use-user.tsx            # User management
│   ├── lib/                 # Utility functions
│   ├── pages/               # Page components
│   │   ├── AddExpense.tsx          # Add expense page
│   │   ├── Expenses.tsx            # Expenses listing
│   │   ├── GooglePayExpenses.tsx   # Google Pay integration
│   │   ├── GroupDetail.tsx         # Group detail view
│   │   ├── Groups.tsx              # Groups listing
│   │   ├── Index.tsx               # Dashboard page
│   │   ├── JoinGroup.tsx           # Group invitation acceptance
│   │   ├── Login.tsx               # Authentication page
│   │   ├── NotFound.tsx            # 404 page
│   │   ├── Payments.tsx            # Combined payments view
│   │   ├── Profile.tsx             # User profile
│   │   └── Settlements.tsx         # Settlements listing
│   └── App.tsx              # Main application component
├── server/                   # Backend server code
│   ├── scripts/             # Database setup scripts
│   ├── config/              # Configuration files
│   └── server.js            # Main server file
├── public/                   # Static assets
└── package.json              # Project dependencies and scripts
```

## Supabase Setup

The application uses Supabase for data storage and real-time capabilities. To set up Supabase:

1. Create a Supabase project at https://supabase.com/
2. Get your project URL and API keys from the Supabase dashboard
3. Add them to your `.env` file
4. Run the setup script: `npm run setup:supabase:complete`

## Security Notes

⚠️ **IMPORTANT**: The default setup uses permissive RLS policies that allow all operations for authenticated users. These are suitable for development but NOT secure for production.

For production deployment:
1. Replace permissive policies with restrictive ones
2. Review and customize policies based on your security requirements
3. See [server/scripts/rls_policies.sql](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/server/scripts/rls_policies.sql) for secure policy examples

## Troubleshooting

### RLS Security Warnings

If you see RLS warnings in your Supabase dashboard:
1. Run `npm run setup:supabase:complete`
2. Refresh your Supabase dashboard
3. The warnings should disappear

### Data Not Persisting

If data isn't persisting between sessions:
1. Check that Supabase is properly configured
2. Verify the connection in server logs
3. Ensure RLS policies are correctly set up

### Expense Functionality Issues

If you're having issues with the expense functionality:
1. Check the browser console for error messages
2. Verify that all required fields are filled in when adding expenses
3. Run `npm run test:expense-api` to test the API endpoints
4. Refer to [EXPENSE_FUNCTIONALITY_FIX.md](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/EXPENSE_FUNCTIONALITY_FIX.md) for detailed troubleshooting steps

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on the GitHub repository or contact the maintainers.