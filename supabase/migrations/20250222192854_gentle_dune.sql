/*
  # Add slugs to pages table
  
  1. Changes
    - Add slug column
    - Create function to generate slugs
    - Create trigger to automatically generate slugs
    - Update existing pages with slugs
*/

-- Add slug column if it doesn't exist
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS slug text;

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
  -- Convert to lowercase
  base_slug := lower(title);
  
  -- Replace Swedish characters
  base_slug := replace(replace(replace(replace(replace(replace(
    base_slug,
    'å', 'a'),
    'ä', 'a'),
    'ö', 'o'),
    'Å', 'a'),
    'Ä', 'a'),
    'Ö', 'o'
  );
  
  -- Replace spaces and special characters with hyphens
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  
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

-- Update existing pages with slugs
UPDATE pages SET slug = generate_page_slug(title) WHERE slug IS NULL OR slug = '';

-- Add unique constraint to slug
ALTER TABLE pages ADD CONSTRAINT pages_slug_key UNIQUE (slug);