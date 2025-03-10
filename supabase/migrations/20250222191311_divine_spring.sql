/*
  # Fix page slugs

  1. Changes
    - Drop existing trigger and functions
    - Create new function to generate slugs from titles
    - Add trigger to automatically generate slugs on insert/update
    - Update existing pages with slugs

  2. Security
    - No changes to RLS policies
*/

-- Drop existing trigger and functions if they exist
DROP TRIGGER IF EXISTS set_page_slug_trigger ON pages;
DROP FUNCTION IF EXISTS set_page_slug();
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
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  -- Remove consecutive hyphens
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  
  -- Remove leading and trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  -- Initial attempt with base slug
  final_slug := base_slug;
  
  -- If slug exists, append numbers until we find a unique one
  WHILE EXISTS (SELECT 1 FROM pages WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
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
  -- Only generate new slug if title changed or slug is empty
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