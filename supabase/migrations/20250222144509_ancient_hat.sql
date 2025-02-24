/*
  # Add email field to guest apartment bookings

  1. Changes
    - Add email field to guest_apartment_bookings table
    - Make email field required
*/

-- Add email column
ALTER TABLE guest_apartment_bookings
ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';

-- Remove default after adding column
ALTER TABLE guest_apartment_bookings
ALTER COLUMN email DROP DEFAULT;