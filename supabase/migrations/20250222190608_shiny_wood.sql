/*
  # Add page categories

  1. New Tables
    - `page_categories`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add category_id to pages table
    - Add ordering to pages table

  3. Security
    - Enable RLS on page_categories
    - Add policies for authenticated users and admins
*/

-- Create page categories table
CREATE TABLE IF NOT EXISTS page_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add category and ordering to pages
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES page_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;

-- Enable RLS
ALTER TABLE page_categories ENABLE ROW LEVEL SECURITY;

-- Policies for page_categories
CREATE POLICY "Anyone can read page categories"
  ON page_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert page categories"
  ON page_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update page categories"
  ON page_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete page categories"
  ON page_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default categories
INSERT INTO page_categories (name, description) VALUES
  ('Allmänt', 'Allmän information'),
  ('Regler', 'Regler och föreskrifter'),
  ('Faciliteter', 'Information om föreningens faciliteter'),
  ('Styrelse', 'Styrelse och förvaltning');