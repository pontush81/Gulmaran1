/*
  # Add guest name field to bookings

  1. Changes
    - Add guest_name column to guest_apartment_bookings table
*/

-- Add guest_name column
ALTER TABLE guest_apartment_bookings
ADD COLUMN IF NOT EXISTS guest_name text NOT NULL DEFAULT '';

-- Remove default after adding column
ALTER TABLE guest_apartment_bookings
ALTER COLUMN guest_name DROP DEFAULT;