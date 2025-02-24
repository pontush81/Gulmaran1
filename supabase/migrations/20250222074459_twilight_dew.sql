/*
  # Fix guest apartment booking policies

  1. Changes
    - Add trigger to automatically set user_id on insert
    - Update policies to handle user_id correctly
    - Ensure proper access control for all operations
*/

-- Create function to set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS trigger AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id
DROP TRIGGER IF EXISTS set_user_id_trigger ON guest_apartment_bookings;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON guest_apartment_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

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
  WITH CHECK (true); -- user_id is set by trigger

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