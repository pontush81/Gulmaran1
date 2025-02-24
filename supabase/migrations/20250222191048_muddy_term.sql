/*
  # Remove page categories

  1. Changes
    - Drop page_categories table
    - Remove category_id and order columns from pages table
    - Clean up any orphaned data

  2. Security
    - No changes to RLS policies
*/

-- First remove the foreign key constraint
ALTER TABLE pages
DROP CONSTRAINT IF EXISTS pages_category_id_fkey;

-- Remove columns from pages table
ALTER TABLE pages
DROP COLUMN IF EXISTS category_id,
DROP COLUMN IF EXISTS "order";

-- Drop the page_categories table
DROP TABLE IF EXISTS page_categories;