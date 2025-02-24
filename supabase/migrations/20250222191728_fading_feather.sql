/*
  # Update section name

  1. Changes
    - Update the title of the section from "Ellagråden" to "Ellagården"

  2. Security
    - No changes to security policies
*/

UPDATE sections 
SET title = 'Ellagården',
    updated_at = now()
WHERE title = 'Ellagråden';