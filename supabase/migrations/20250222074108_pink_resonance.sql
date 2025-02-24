/*
  # Guest apartment booking system

  1. New Tables
    - `guest_apartment_bookings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `start_date` (date)
      - `end_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `status` (text: pending, approved, rejected, cancelled)
      - `notes` (text)

  2. Security
    - Enable RLS
    - Users can read all bookings
    - Users can create bookings
    - Users can update/cancel their own bookings
    - Admins can update all bookings
*/

-- Create guest apartment bookings table
CREATE TABLE IF NOT EXISTS guest_apartment_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Ensure end_date is after start_date
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  -- Prevent bookings longer than 7 days
  CONSTRAINT max_booking_length CHECK (end_date - start_date <= 7)
);

-- Create function to check for booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_start_date date,
  p_end_date date,
  p_booking_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM guest_apartment_bookings
    WHERE status = 'approved'
    AND p_booking_id IS DISTINCT FROM id
    AND (
      (start_date <= p_end_date AND end_date >= p_start_date)
      OR
      (p_start_date <= end_date AND p_end_date >= start_date)
    )
  );
END;
$$;

-- Create trigger to prevent conflicting bookings
CREATE OR REPLACE FUNCTION prevent_booking_conflict()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'approved' AND check_booking_conflict(NEW.start_date, NEW.end_date, NEW.id) THEN
    RAISE EXCEPTION 'Booking conflicts with an existing approved booking';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_booking_conflict
  BEFORE INSERT OR UPDATE ON guest_apartment_bookings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_booking_conflict();

-- Enable RLS
ALTER TABLE guest_apartment_bookings ENABLE ROW LEVEL SECURITY;

-- Policies for guest_apartment_bookings
CREATE POLICY "Users can read all bookings"
  ON guest_apartment_bookings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create bookings"
  ON guest_apartment_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update own bookings"
  ON guest_apartment_bookings
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can delete own bookings"
  ON guest_apartment_bookings
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );