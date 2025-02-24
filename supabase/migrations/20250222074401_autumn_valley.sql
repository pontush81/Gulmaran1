/*
  # Fix guest apartment booking policies

  1. Changes
    - Drop and recreate policies with correct user_id handling
    - Ensure users can create bookings with their own user_id
    - Maintain admin privileges for managing all bookings
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all bookings" ON guest_apartment_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON guest_apartment_bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON guest_apartment_bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON guest_apartment_bookings;

-- Recreate policies with correct user_id handling
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
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own bookings"
  ON guest_apartment_bookings
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
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
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );