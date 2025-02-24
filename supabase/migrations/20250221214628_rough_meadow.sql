/*
  # Fix materialized view and policy dependencies

  1. Changes
    - Drop policies in correct order
    - Drop materialized view and related objects
    - Create security definer function
    - Create new policies
    
  2. Security
    - Uses security definer function for safe admin checks
    - Maintains row level security
*/

-- First drop the policies that depend on the materialized view
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Now we can safely drop the materialized view and related objects
DROP MATERIALIZED VIEW IF EXISTS admin_users;
DROP TRIGGER IF EXISTS refresh_admin_users_trigger ON users;
DROP FUNCTION IF EXISTS refresh_admin_users();

-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND role = 'admin'
  );
END;
$$;

-- Create new policies using the security definer function
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.uid())
  );