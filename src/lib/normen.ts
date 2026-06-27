// Alle normen leven hier — in productie ophalen uit Supabase.

export const NHG_GRENS_2026 = 435_000;
export const NHG_PREMIE = 0.006;
export const STARTER_GRENS_2026 = 510_000;
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

export const ENERGIELABEL_BONUS: Partial<Record<string, number>> = {
  'A++++': 50_000,
  'A+++':  50_000,
  'A++':   25_000,
  'A+':    25_000,
};

export const BELASTING_LAAG  = 0.3693;
export const BELASTING_HOOG  = 0.495;
export const BELASTING_GRENS = 73_031;
