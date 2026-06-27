-- Rentestand tabel — actuele hypotheekrentes per rentevaste periode
-- Uitvoeren in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS rentestand (
  id           SERIAL PRIMARY KEY,
  periode      INTEGER       NOT NULL,  -- jaren rentevast: 1, 5, 10, 15, 20, 30
  rente        DECIMAL(6,4)  NOT NULL,  -- als decimaal bijv. 0.0385 (= 3,85%)
  geldig_vanaf DATE          NOT NULL DEFAULT CURRENT_DATE,
  actief       BOOLEAN       NOT NULL DEFAULT TRUE,
  aangemaakt_op TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- RLS: iedereen mag lezen (publieke data), niemand mag schrijven via client
ALTER TABLE rentestand ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publieke leestoegang rentestand"
  ON rentestand FOR SELECT USING (true);

-- Initiële rentes (actueel juni 2026, NHG annuïteit gemiddeld markt)
-- Periodes < 10 jaar worden in de app altijd vervangen door AFM-toetsrente (5,0%)
INSERT INTO rentestand (periode, rente, geldig_vanaf) VALUES
  (1,  0.0500, CURRENT_DATE),  -- AFM-toetsrente (wettelijk minimum)
  (5,  0.0500, CURRENT_DATE),  -- AFM-toetsrente (wettelijk minimum)
  (10, 0.0385, CURRENT_DATE),
  (15, 0.0395, CURRENT_DATE),
  (20, 0.0405, CURRENT_DATE),
  (30, 0.0420, CURRENT_DATE);

-- Index voor snelle query op actieve rentes
CREATE INDEX IF NOT EXISTS idx_rentestand_actief ON rentestand (actief, periode);

-- Handige view: alleen actieve rentes
CREATE OR REPLACE VIEW actuele_rentestand AS
  SELECT periode, rente, geldig_vanaf
  FROM rentestand
  WHERE actief = TRUE
  ORDER BY periode;
