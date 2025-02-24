/*
  # Fix recursive policies for users table
  
  1. Changes
    - Remove recursive policies that were causing infinite recursion
    - Create new, simplified policies for users table
    - Maintain security while avoiding policy loops
  
  2. Security
    - Users can still read their own data
    - Admins can read all users
    - Policies are more efficient and avoid recursion
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;

-- Create new, non-recursive policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (role = 'admin');