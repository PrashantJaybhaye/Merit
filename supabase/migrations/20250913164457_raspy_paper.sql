/*
  # Create Admin User Account

  1. Authentication Setup
    - Creates a demo admin user account for testing
    - Email: admin@merit.com
    - Password: admin123
    
  2. Security
    - User will be created in Supabase Auth system
    - This is for demo purposes only
    
  Note: This migration creates the user account structure.
  The actual user creation needs to be done through Supabase Auth API or dashboard.
*/

-- This migration serves as documentation for the required admin user
-- The actual user creation should be done via Supabase dashboard or Auth API

-- Create a function to help with user setup (for reference)
CREATE OR REPLACE FUNCTION setup_admin_user_info()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'Admin user should be created with email: admin@merit.com and password: admin123';
END;
$$;

-- Add a comment for setup instructions
COMMENT ON FUNCTION setup_admin_user_info() IS 'Instructions for creating the demo admin user account';