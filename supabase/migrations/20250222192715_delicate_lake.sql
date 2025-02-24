/*
  # Simplified pages table with only title field
  
  1. Changes
    - Drop existing triggers and functions
    - Recreate pages table with minimal fields
    - Add simple slug generation
    - Enable RLS with basic policies
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS set_page_slug_trigger ON pages;
DROP TRIGGER IF EXISTS set_page_updated_by_trigger ON pages;
DROP FUNCTION IF EXISTS set_page_slug();
DROP FUNCTION IF EXISTS set_page_updated_by();
DROP FUNCTION IF EXISTS generate_page_slug(text);

-- Drop and recreate pages table
DROP TABLE IF EXISTS pages;

CREATE TABLE pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text GENERATED ALWAYS AS (
    lower(regexp_replace(
      regexp_replace(
        title,
        '[^a-zA-Z0-9\s]',
        '',
        'g'
      ),
      '\s+',
      '-',
      'g'
    ))
  ) STORED UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Create policies
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