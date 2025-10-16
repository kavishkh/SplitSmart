# Supabase Setup and RLS Configuration

This document explains how to set up your Supabase database for the SplitSmart application and resolve the RLS (Row Level Security) warnings.

## Prerequisites

1. A Supabase account and project
2. Environment variables configured in your `.env` file:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

## Setting Up the Database

### Option 1: Automated Setup (Recommended)

Run the complete setup script which will create all tables and configure RLS policies:

```bash
npm run setup:supabase:complete
```

This script will:
- Create all necessary tables (users, groups, expenses, settlements)
- Enable RLS on all tables
- Set up permissive policies for development (WARNING: Not secure for production)

### Option 2: Manual Setup via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Open the SQL editor
3. Copy and paste the contents of [server/scripts/completeSetup.sql](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/server/scripts/completeSetup.sql)
4. Run the SQL commands

## Resolving RLS Security Warnings

The Supabase dashboard may show warnings about tables not having Row Level Security enabled. These warnings are resolved by the setup scripts, but if you're still seeing them:

1. Make sure you've run the setup script or executed the SQL manually
2. Refresh your Supabase dashboard
3. The warnings should disappear

## RLS Policy Options

This project includes two sets of RLS policies:

### Development Policies (Permissive)
Located in: [server/scripts/completeSetup.sql](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/server/scripts/completeSetup.sql)

These policies allow all operations for authenticated users and are useful for development but NOT secure for production.

### Production Policies (Secure)
Located in: [server/scripts/rls_policies.sql](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/server/scripts/rls_policies.sql)

These policies implement proper security measures:
- Users can only view their own records
- Users can only access groups they belong to
- Users can only view expenses from their groups
- Users can only manage their own settlements

To use production policies:
1. Run the development setup first
2. Then execute the production policies SQL in your Supabase dashboard

## Troubleshooting

### "policy already exists" Error
This occurs when trying to create a policy that already exists. The setup scripts handle this by using `DROP POLICY IF EXISTS` before creating policies.

### Connection Issues
Ensure your environment variables are correctly set:
- `SUPABASE_URL` should match your project URL
- `SUPABASE_ANON_KEY` for client-side operations
- `SUPABASE_SERVICE_ROLE_KEY` for admin operations (needed for setup scripts)

### Data Not Persisting
If data isn't persisting between sessions:
1. Check that the Supabase connection is successful (check server logs)
2. Verify that you're not running in demo mode
3. Ensure RLS policies are properly configured

## Security Notes

⚠️ **IMPORTANT**: The permissive policies in [completeSetup.sql](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/server/scripts/completeSetup.sql) are NOT secure for production use!

For production deployment:
1. Use the secure policies from [rls_policies.sql](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/server/scripts/rls_policies.sql)
2. Review and customize the policies based on your specific security requirements
3. Test thoroughly to ensure proper access control

## Next Steps

After setting up the database:
1. Start your application: `npm run dev:full`
2. Access the application at `http://localhost:5173`
3. Check the server logs to confirm Supabase connection