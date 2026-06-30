export type Frequentie = 'maand' | 'vierWeken';
export type Hypotheekvorm = 'annuitair' | 'lineair' | 'aflossingsvrij';
export type Energielabel = 'A++++'|'A+++'|'A++'|'A+'|'A'|'B'|'C'|'D'|'E'|'F'|'G';
export type StudieschuldStelsel = 'oud' | 'nieuw' | 'geen';
export type RentevastePeriode = 1 | 5 | 10 | 15 | 20 | 30;

export interface InkomenData {
  brutoSalaris: number;
  frequentie: Frequentie;
  heeftVakantiegeld: boolean;
  heeftDertiendeMaand: boolean;
  ortPerMaand: number;
  vasterJaarbonus: number;
  isZZP: boolean;
  zzpWinst1: number;
  zzpWinst2: number;
  zzpWinst3: number;
  alimentatieOntvangen: number;
  pensioen: number;
}

export interface VerplichtingenData {
  persoonlijkeLening: number;
  doorlopendKredietLimiet: number;
  creditcardLimiet: number;
  privateLease: number;
  studieschuldStelsel: StudieschuldStelsel;
  studieschuldOrigineel: number;
  alimentatieBetalen: number;
  bkrMelding: boolean;
}

export interface WoningData {
  koopsom: number;
  energielabel: Energielabel;
  eigenGeld: number;
  rentevastePeriode: RentevastePeriode;
  hypotheekvorm: Hypotheekvorm;
  looptijdJaar: number;
}

export interface SituatieData {
  metPartner: boolean;
  isStarter: boolean;
  leeftijd: number;
  partnerLeeftijd?: number;
}

export interface BijkomendeKosten {
  overdrachtsbelasting: number;
  notarisKosten: number;
  taxatieKosten: number;
  adviesKosten: number;
  nhgPremie: number;
  totaal: number;
}

export interface Resultaat {
  toetsinkomen: number;
  maandlastenVerplichtingen: number;
  maxHypotheekOpInkomen: number;
  maxHypotheekOpWoning: number;
  effectieveMaxHypotheek: number;
  nhgMogelijk: boolean;
  startersvrijstelling: boolean;
  energielabelBonus: number;
  brutoMaandlast: number;
  nettoMaandlast: number;
  bijkomendeKosten: BijkomendeKosten;
  eigenGeldTekort: number;
  effectieveLooptijd: number;
  looptijdGecapped: boolean;
}
