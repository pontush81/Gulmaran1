/*
  # Update pages table and policies

  1. Changes
    - Add updated_by column to track who last modified the page
    - Add published column to control page visibility
    - Update RLS policies to reflect new columns
    - Add trigger to automatically set updated_by

  2. Security
    - Enable RLS
    - Add policies for read/write access
*/

-- Add new columns to pages
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;

-- Create trigger function to set updated_by
CREATE OR REPLACE FUNCTION set_page_updated_by()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER set_page_updated_by_trigger
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION set_page_updated_by();

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