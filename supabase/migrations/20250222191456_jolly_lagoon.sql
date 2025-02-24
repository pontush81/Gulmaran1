/*
  # Add default pages

  1. Changes
    - Insert default pages if they don't exist
    - Each page gets a unique slug automatically via trigger

  2. Security
    - No changes to RLS policies
*/

-- Insert default pages if they don't exist
INSERT INTO pages (title, content)
SELECT 'Välkommen', '<h1>Välkommen till BRF Gulmåran</h1><p>Här hittar du information om vår bostadsrättsförening.</p>'
WHERE NOT EXISTS (SELECT 1 FROM pages WHERE title = 'Välkommen');

INSERT INTO pages (title, content)
SELECT 'Kontakt', '<h1>Kontakta oss</h1><p>Här hittar du kontaktinformation till styrelsen och andra viktiga kontakter.</p>'
WHERE NOT EXISTS (SELECT 1 FROM pages WHERE title = 'Kontakt');

INSERT INTO pages (title, content)
SELECT 'Om föreningen', '<h1>Om BRF Gulmåran</h1><p>Information om vår bostadsrättsförening, dess historia och verksamhet.</p>'
WHERE NOT EXISTS (SELECT 1 FROM pages WHERE title = 'Om föreningen');

INSERT INTO pages (title, content)
SELECT 'Regler', '<h1>Föreningens regler</h1><p>Här hittar du information om föreningens regler och riktlinjer.</p>'
WHERE NOT EXISTS (SELECT 1 FROM pages WHERE title = 'Regler');

INSERT INTO pages (title, content)
SELECT 'Faciliteter', '<h1>Faciliteter</h1><p>Information om föreningens gemensamma faciliteter och hur du bokar dem.</p>'
WHERE NOT EXISTS (SELECT 1 FROM pages WHERE title = 'Faciliteter');