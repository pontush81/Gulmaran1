/*
  # Fix pages table and slug generation

  1. Changes
    - Drop existing triggers and functions
    - Create new slug generation function
    - Create new trigger for automatic slug generation
    - Migrate sections to pages
    - Drop sections table

  2. Security
    - Maintain existing security model
    - All pages inherit the same RLS policies
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS set_page_slug_trigger ON pages;
DROP FUNCTION IF EXISTS set_page_slug();
DROP FUNCTION IF EXISTS generate_page_slug(text);
DROP FUNCTION IF EXISTS generate_page_slug(text, uuid);
DROP FUNCTION IF EXISTS generate_slug(text);

-- Create function to generate slugs
CREATE OR REPLACE FUNCTION generate_page_slug(title text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Convert to lowercase and replace spaces and special characters with hyphens
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s-åäöÅÄÖ]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  -- Handle Swedish characters
  base_slug := replace(replace(replace(replace(replace(replace(
    base_slug,
    'å', 'a'),
    'ä', 'a'),
    'ö', 'o'),
    'Å', 'a'),
    'Ä', 'a'),
    'Ö', 'o'
  );
  
  -- Remove consecutive hyphens
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  
  -- Remove leading and trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  -- Initial attempt with base slug
  final_slug := base_slug;
  
  -- If slug exists, append numbers until we find a unique one
  WHILE EXISTS (SELECT 1 FROM pages WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Create trigger function to set slug
CREATE OR REPLACE FUNCTION set_page_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.title IS DISTINCT FROM OLD.title OR NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_page_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER set_page_slug_trigger
  BEFORE INSERT OR UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION set_page_slug();

-- First ensure the pages table exists with correct structure
CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on pages if not already enabled
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
DROP POLICY IF EXISTS "Anyone can read pages" ON pages;
DROP POLICY IF EXISTS "Admins can insert pages" ON pages;
DROP POLICY IF EXISTS "Admins can update pages" ON pages;
DROP POLICY IF EXISTS "Admins can delete pages" ON pages;

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

-- Migrate sections to pages if sections table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sections') THEN
    INSERT INTO pages (title, content, created_at, updated_at)
    SELECT title, content, created_at, updated_at
    FROM sections
    ON CONFLICT (slug) DO UPDATE
    SET content = EXCLUDED.content,
        updated_at = EXCLUDED.updated_at;

    DROP TABLE sections;
  END IF;
END
$$;

-- Update any pages that might be missing slugs
UPDATE pages SET slug = generate_page_slug(title) WHERE slug IS NULL OR slug = '';