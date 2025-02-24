/*
  # Clean pages table setup
  
  1. Changes
    - Drop existing table and related objects
    - Create simplified pages table
    - Add basic RLS policies
*/

-- First, drop everything related to pages to start fresh
DROP TABLE IF EXISTS pages CASCADE;

-- Create the pages table with minimal fields
CREATE TABLE pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Anyone can read pages"
  ON pages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert pages"
  ON pages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update pages"
  ON pages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete pages"
  ON pages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );