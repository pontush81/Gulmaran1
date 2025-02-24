/*
  # Fix guest apartment bookings user relation

  1. Changes
    - Add foreign key reference from guest_apartment_bookings.user_id to users.id
    - Update RLS policies to use auth.uid() consistently
*/

-- Drop existing foreign key if it exists
ALTER TABLE guest_apartment_bookings
DROP CONSTRAINT IF EXISTS guest_apartment_bookings_user_id_fkey;

-- Add new foreign key reference to users table
ALTER TABLE guest_apartment_bookings
ADD CONSTRAINT guest_apartment_bookings_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all bookings" ON guest_apartment_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON guest_apartment_bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON guest_apartment_bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON guest_apartment_bookings;

-- Recreate policies with correct references
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
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can delete own bookings"
  ON guest_apartment_bookings
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );