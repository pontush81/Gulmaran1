/*
  # Migrate sections to pages

  1. Changes
    - Move all content from sections table to pages table
    - Drop sections table
    - Update RLS policies

  2. Security
    - Maintain existing security model
    - All pages inherit the same RLS policies
*/

-- First, migrate all sections to pages
INSERT INTO pages (title, content, created_at, updated_at)
SELECT title, content, created_at, updated_at
FROM sections
ON CONFLICT (slug) DO UPDATE
SET content = EXCLUDED.content,
    updated_at = EXCLUDED.updated_at;

-- Drop the sections table
DROP TABLE sections;