// Alle normen leven hier — in productie ophalen uit Supabase.

export const NHG_GRENS_2026 = 470_000;       // Vastgesteld NHG 2026
export const NHG_PREMIE = 0.006;             // 0,6% borgtochtprovisie
export const STARTER_GRENS_2026 = 555_000;   // Startersvrijstelling grens 2026
export const STARTER_MAX_LEEFTIJD = 35;
export const MAX_LTV = 1.0;

// Wettelijke AFM-toetsrente voor periodes korter dan 10 jaar (zie §4.1)
export const AFM_TOETSRENTE = 0.050;

// Werkelijke rentes per rentevaste periode (≥10 jaar) — in productie uit Supabase
export const TOETSRENTES: Record<number, number> = {
  1:  AFM_TOETSRENTE,  // < 10 jaar → altijd AFM-toetsrente
  5:  AFM_TOETSRENTE,  // < 10 jaar → altijd AFM-toetsrente
  10: 0.050,
  15: 0.051,
  20: 0.053,
  30: 0.055,
};

// LTI-factoren (Nibud 2026, toetsrente ~5%)
export interface LtiRij {
  maxInkomen: number;
  factor: number;
}

export const LTI_NORMEN: LtiRij[] = [
  { maxInkomen: 20_000,   factor: 2.95 },
  { maxInkomen: 22_000,   factor: 3.17 },
  { maxInkomen: 24_000,   factor: 3.38 },
  { maxInkomen: 26_000,   factor: 3.59 },
  { maxInkomen: 28_000,   factor: 3.72 },
  { maxInkomen: 30_000,   factor: 3.85 },
  { maxInkomen: 35_000,   factor: 4.00 },
  { maxInkomen: 40_000,   factor: 4.15 },
  { maxInkomen: 45_000,   factor: 4.27 },
  { maxInkomen: 50_000,   factor: 4.38 },
  { maxInkomen: 55_000,   factor: 4.46 },
  { maxInkomen: 60_000,   factor: 4.52 },
  { maxInkomen: 70_000,   factor: 4.57 },
  { maxInkomen: 80_000,   factor: 4.62 },
  { maxInkomen: Infinity, factor: 4.68 },
];

// Energielabel extra leenruimte 2026 (Tijdelijke Regeling Hypothecair Krediet)
// A++++ daalde van €50k naar €40k; A++ van €25k naar €15k
export const ENERGIELABEL_BONUS: Partial<Record<string, number>> = {
  'A++++': 40_000,
  'A+++':  40_000,
  'A++':   15_000,
  'A+':    10_000,
};

// Nibud 2026 alleenstaanden-correctie
export const ALLEENSTAANDEN_OPSLAG   = 17_000;
export const ALLEENSTAANDEN_DREMPEL  = 30_000;

export const BELASTING_LAAG  = 0.3748;   // Schijf 2 tarief 2026 (ook max. aftrekpercentage)
export const BELASTING_HOOG  = 0.495;    // Schijf 3 tarief 2026
export const BELASTING_GRENS = 76_817;   // Grens schijf 2/3 in 2026
