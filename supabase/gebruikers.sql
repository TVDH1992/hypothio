-- Gebruikersdata: profielen + woningen
-- Uitvoeren in Supabase SQL Editor (éénmalig)

-- Profiel: één rij per gebruiker met hun laatste berekening
CREATE TABLE IF NOT EXISTS profielen (
  user_id        UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  naam           TEXT          NOT NULL,
  max_hypotheek  INTEGER       NOT NULL,
  resultaat      JSONB         NOT NULL,
  aangemaakt_op  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  bijgewerkt_op  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE profielen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigen profiel lezen"      ON profielen FOR SELECT    USING (auth.uid() = user_id);
CREATE POLICY "Eigen profiel aanmaken"   ON profielen FOR INSERT    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Eigen profiel bijwerken"  ON profielen FOR UPDATE    USING (auth.uid() = user_id);
CREATE POLICY "Eigen profiel verwijderen" ON profielen FOR DELETE   USING (auth.uid() = user_id);

-- Woningen: opgeslagen Funda woningen per gebruiker
CREATE TABLE IF NOT EXISTS woningen (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  funda_url      TEXT          NOT NULL,
  adres          TEXT          NOT NULL,
  stad           TEXT          NOT NULL,
  vraagprijs     INTEGER       NOT NULL,
  marktwaarde    INTEGER,
  toegevoegd_op  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE woningen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigen woningen lezen"      ON woningen FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "Eigen woningen toevoegen"  ON woningen FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Eigen woningen verwijderen" ON woningen FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_woningen_user ON woningen (user_id, toegevoegd_op DESC);
