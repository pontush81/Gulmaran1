/*
  # Fix recursive policy issue with a different approach

  1. Changes
    - Drop existing policies
    - Create new policies using a materialized admin view for performance
    - Add trigger to keep admin view updated

  2. Security
    - Maintains row level security
    - Prevents infinite recursion
    - Improves query performance
*/

-- Create a materialized view for admin users
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_users AS
SELECT id FROM users WHERE role = 'admin';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS admin_users_id_idx ON admin_users(id);

-- Create function to refresh admin view
CREATE OR REPLACE FUNCTION refresh_admin_users()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_users;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh admin view
DROP TRIGGER IF EXISTS refresh_admin_users_trigger ON users;
CREATE TRIGGER refresh_admin_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_admin_users();

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create new policies using the materialized view
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Initial refresh of the materialized view
REFRESH MATERIALIZED VIEW admin_users;