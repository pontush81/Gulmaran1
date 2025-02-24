/*
  # Add cascade delete for users

  1. Changes
    - Add ON DELETE CASCADE to users table foreign key reference
    - This ensures that when a user is deleted from auth.users, their record in public.users is also deleted

  2. Security
    - Maintains existing RLS policies
    - No changes to access control
*/

-- First drop the existing foreign key constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Re-add the constraint with CASCADE
ALTER TABLE users
  ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;