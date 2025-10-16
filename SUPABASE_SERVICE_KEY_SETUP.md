# Setting Up Your Supabase Service Role Key

To run the database setup scripts, you need to configure your Supabase service role key in the [.env](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/.env) file.

## Steps to Get Your Service Role Key

1. Go to your Supabase project dashboard
2. In the left sidebar, click on the "Settings" icon (gear icon)
3. Click on "API" in the settings menu
4. In the "Project API keys" section, find the "service_role" key
5. Copy the key value

## Configuring Your Environment

1. Open the [.env](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/.env) file in your project root
2. Replace `your_service_role_key_here` with your actual service role key:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
   ```

## Security Note

⚠️ **IMPORTANT**: Never commit your service role key to version control!
The [.gitignore](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/.gitignore) file should already exclude [.env](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/.env), but double-check that your [.env](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/.env) file is not committed to your repository.

The service role key has admin privileges and should only be used in server-side code, never in client-side code.

## Verification

After setting up your service role key:
1. Save the [.env](file:///C:/Users/tusha/OneDrive/Desktop/splitwise1/Readyapp/.env) file
2. Run the setup script: `npm run setup:supabase:complete`
3. The script should now execute without the "Missing Supabase credentials" error