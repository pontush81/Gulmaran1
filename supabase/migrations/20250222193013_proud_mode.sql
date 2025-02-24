/*
  # Add default pages
  
  1. Changes
    - Insert default pages if they don't exist
*/

-- Insert default pages
INSERT INTO pages (title, content, published)
VALUES
  ('Välkommen', '<h1>Välkommen till BRF Gulmåran</h1><p>Här hittar du information om vår bostadsrättsförening.</p>', true),
  ('Kontakt', '<h1>Kontakta oss</h1><p>Här hittar du kontaktinformation till styrelsen och andra viktiga kontakter.</p>', true),
  ('Om föreningen', '<h1>Om BRF Gulmåran</h1><p>Information om vår bostadsrättsförening, dess historia och verksamhet.</p>', true),
  ('Regler', '<h1>Föreningens regler</h1><p>Här hittar du information om föreningens regler och riktlinjer.</p>', true),
  ('Faciliteter', '<h1>Faciliteter</h1><p>Information om föreningens gemensamma faciliteter och hur du bokar dem.</p>', true),
  ('Aktivitetsrum', '<h1>Aktivitetsrum</h1><p>Information om föreningens aktivitetsrum och hur du bokar det.</p>', true),
  ('Elbil', '<h1>Elbil</h1><p>Information om laddning av elbilar i föreningen.</p>', true),
  ('Ellagården', '<h1>Ellagården</h1><p>Information om Ellagården.</p>', true),
  ('Föreningsstämma', '<h1>Föreningsstämma</h1><p>Information om föreningens årsstämma och extra stämmor.</p>', true),
  ('Grillregler', '<h1>Grillregler</h1><p>Regler för grillning inom föreningen.</p>', true),
  ('Gästlägenhet', '<h1>Gästlägenhet</h1><p>Information om föreningens gästlägenhet och hur du bokar den.</p>', true),
  ('Färgkoder', '<h1>Färgkoder</h1><p>Färgkoder för målning inom föreningen.</p>', true),
  ('Skötselplan', '<h1>Skötselplan</h1><p>Information om föreningens skötselplan.</p>', true),
  ('Sophantering', '<h1>Sophantering</h1><p>Information om sophantering och återvinning.</p>', true),
  ('Styrelse', '<h1>Styrelse</h1><p>Information om föreningens styrelse.</p>', true),
  ('Styrelsemöten', '<h1>Styrelsemöten</h1><p>Information om styrelsemöten.</p>', true)
ON CONFLICT (slug) DO NOTHING;