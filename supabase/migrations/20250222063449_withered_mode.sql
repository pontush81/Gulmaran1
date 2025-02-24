/*
  # Add board meetings and documents tables

  1. New Tables
    - `board_meetings`
      - `id` (uuid, primary key)
      - `date` (date, when the meeting occurs/occurred)
      - `title` (text, meeting title/description)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `board_meeting_documents`
      - `id` (uuid, primary key)
      - `meeting_id` (uuid, references board_meetings)
      - `name` (text, document name)
      - `file_path` (text, Supabase storage path)
      - `created_at` (timestamp)
      - `uploaded_by` (uuid, references users)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read
    - Add policies for admins to manage meetings and documents
*/

-- Create board meetings table
CREATE TABLE IF NOT EXISTS board_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create board meeting documents table
CREATE TABLE IF NOT EXISTS board_meeting_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES board_meetings(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE board_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_meeting_documents ENABLE ROW LEVEL SECURITY;

-- Policies for board_meetings
CREATE POLICY "Anyone can read board meetings"
  ON board_meetings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert board meetings"
  ON board_meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update board meetings"
  ON board_meetings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete board meetings"
  ON board_meetings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policies for board_meeting_documents
CREATE POLICY "Anyone can read board meeting documents"
  ON board_meeting_documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert board meeting documents"
  ON board_meeting_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update own board meeting documents"
  ON board_meeting_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete board meeting documents"
  ON board_meeting_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create storage bucket for board meeting documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('board-meeting-documents', 'board-meeting-documents', false);

-- Enable RLS for storage
CREATE POLICY "Anyone can read board meeting documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'board-meeting-documents');

CREATE POLICY "Admins can upload board meeting documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'board-meeting-documents' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update board meeting documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'board-meeting-documents' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete board meeting documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'board-meeting-documents' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );