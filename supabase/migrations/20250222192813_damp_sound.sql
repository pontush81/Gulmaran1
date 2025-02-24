/*
  # Add content and published fields to pages table
  
  1. Changes
    - Add content field for storing page content
    - Add published field for controlling page visibility
*/

-- Add content and published fields to pages table
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS content text DEFAULT '',
ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;

-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read pages" ON pages;
DROP POLICY IF EXISTS "Admins can insert pages" ON pages;
DROP POLICY IF EXISTS "Admins can update pages" ON pages;
DROP POLICY IF EXISTS "Admins can delete pages" ON pages;

-- Create new policies
CREATE POLICY "Anyone can read published pages"
  ON pages
  FOR SELECT
  TO authenticated
  USING (published = true OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

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