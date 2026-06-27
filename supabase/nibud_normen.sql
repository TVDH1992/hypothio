-- Nibud LTI-normen tabel — jaarlijks bijwerken in januari
-- Uitvoeren in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS nibud_normen (
  id          SERIAL PRIMARY KEY,
  jaar        INTEGER       NOT NULL,
  max_inkomen DECIMAL(12,0) NOT NULL,  -- 9999999 = Infinity (laatste rij)
  factor      DECIMAL(5,2)  NOT NULL,
  actief      BOOLEAN       NOT NULL DEFAULT TRUE
);

ALTER TABLE nibud_normen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publieke leestoegang nibud_normen"
  ON nibud_normen FOR SELECT USING (true);

-- Nibud 2026 normen (toetsrente ~5%)
INSERT INTO nibud_normen (jaar, max_inkomen, factor) VALUES
  (2026, 20000,   2.95),
  (2026, 22000,   3.17),
  (2026, 24000,   3.38),
  (2026, 26000,   3.59),
  (2026, 28000,   3.72),
  (2026, 30000,   3.85),
  (2026, 35000,   4.00),
  (2026, 40000,   4.15),
  (2026, 45000,   4.27),
  (2026, 50000,   4.38),
  (2026, 55000,   4.46),
  (2026, 60000,   4.52),
  (2026, 70000,   4.57),
  (2026, 80000,   4.62),
  (2026, 9999999, 4.68);  -- Infinity

CREATE INDEX IF NOT EXISTS idx_nibud_actief ON nibud_normen (actief, max_inkomen);
