/*
  # Fix storage bucket configuration

  1. Changes
    - Recreate storage bucket with correct configuration
    - Update storage policies with unambiguous column references

  2. Security
    - Enable RLS for storage
    - Add policies for authenticated access
*/

-- First, ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('board-meeting-documents', 'board-meeting-documents', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read board meeting documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload board meeting documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update board meeting documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete board meeting documents" ON storage.objects;

-- Create new storage policies with unambiguous column references
CREATE POLICY "Anyone can read board meeting documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'board-meeting-documents');

CREATE POLICY "Admins can upload board meeting documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'board-meeting-documents' AND
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

CREATE POLICY "Admins can update board meeting documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'board-meeting-documents' AND
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

CREATE POLICY "Admins can delete board meeting documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'board-meeting-documents' AND
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);