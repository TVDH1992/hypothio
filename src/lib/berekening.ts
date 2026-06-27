import {
  LTI_NORMEN, LtiRij, TOETSRENTES, NHG_GRENS_2026, NHG_PREMIE,
  STARTER_GRENS_2026, STARTER_MAX_LEEFTIJD, MAX_LTV,
  ENERGIELABEL_BONUS, BELASTING_LAAG, BELASTING_HOOG, BELASTING_GRENS,
} from './normen';
import type { InkomenData, VerplichtingenData, WoningData, SituatieData, Resultaat } from '../types/wizard';

function annuityFactor(jaarsrente: number, looptijdJaar: number): number {
  const r = jaarsrente / 12;
  const n = looptijdJaar * 12;
  if (r === 0) return n;
  return (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
}

function getLtiFactor(inkomen: number, normen: LtiRij[]): number {
  return normen.find(r => inkomen <= r.maxInkomen)?.factor ?? normen[normen.length - 1].factor;
}

export function berekenToetsinkomen(inkomen: Partial<InkomenData>): number {
  if (inkomen.isZZP) {
    return ((inkomen.zzpWinst1 ?? 0) + (inkomen.zzpWinst2 ?? 0) + (inkomen.zzpWinst3 ?? 0)) / 3;
  }

  const salaris = inkomen.brutoSalaris ?? 0;
  let basis = inkomen.frequentie === 'vierWeken' ? salaris * 13.04 : salaris * 12;

  if (inkomen.heeftVakantiegeld)    basis += basis * 0.08;
  if (inkomen.heeftDertiendeMaand)  basis += basis / 13;

  basis += (inkomen.ortPerMaand ?? 0) * 12;
  basis += inkomen.vasterJaarbonus ?? 0;
  basis += (inkomen.alimentatieOntvangen ?? 0) * 12;
  basis += inkomen.pensioen ?? 0;

  return basis;
}

export function berekenMaandlasten(v: Partial<VerplichtingenData>): number {
  let lasten = 0;
  lasten += v.persoonlijkeLening ?? 0;
  lasten += (v.doorlopendKredietLimiet ?? 0) * 0.02;
  lasten += (v.creditcardLimiet ?? 0) * 0.02;
  lasten += v.privateLease ?? 0;
  lasten += v.alimentatieBetalen ?? 0;

  const schuld = v.studieschuldRestant ?? 0;
  if (schuld > 0 && v.studieschuldStelsel && v.studieschuldStelsel !== 'geen') {
    lasten += schuld / (v.studieschuldStelsel === 'oud' ? 180 : 420);
  }

  return lasten;
}

function maandlastAnnuitair(hypotheek: number, jaarsrente: number, looptijdJaar: number): number {
  const r = jaarsrente / 12;
  const n = looptijdJaar * 12;
  if (r === 0) return hypotheek / n;
  return hypotheek * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function berekenResultaat(
  situatie: Partial<SituatieData>,
  inkomen1: Partial<InkomenData>,
  inkomen2: Partial<InkomenData>,
  verplichtingen: Partial<VerplichtingenData>,
  woning: Partial<WoningData>,
): Resultaat {
  const ti1 = berekenToetsinkomen(inkomen1);
  const ti2 = situatie.metPartner ? berekenToetsinkomen(inkomen2) : 0;
  const toetsinkomen = ti1 + ti2;

  const maandlasten = berekenMaandlasten(verplichtingen);

  const periode = woning.rentevastePeriode ?? 10;
  const toetsrente = TOETSRENTES[periode] ?? TOETSRENTES[10]!;
  const looptijdJaar = woning.looptijdJaar ?? 30;

  const ltiFactor  = getLtiFactor(toetsinkomen, LTI_NORMEN);
  const annFactor  = annuityFactor(toetsrente, looptijdJaar);

  // Max op basis van inkomen minus verplichtingen
  const maxOpInkomen = Math.max(0, toetsinkomen * ltiFactor - maandlasten * annFactor);

  const koopsom = woning.koopsom ?? 0;
  const energielabelBonus = ENERGIELABEL_BONUS[woning.energielabel ?? 'C'] ?? 0;
  const maxOpWoning = koopsom * MAX_LTV + energielabelBonus;

  const effectiefMax = koopsom > 0 ? Math.min(maxOpInkomen, maxOpWoning) : maxOpInkomen;

  const nhgMogelijk = koopsom > 0 && koopsom <= NHG_GRENS_2026 && effectiefMax <= NHG_GRENS_2026;

  const leeftijd = situatie.leeftijd ?? 0;
  const startersvrijstelling =
    situatie.isStarter === true &&
    leeftijd >= 18 &&
    leeftijd < STARTER_MAX_LEEFTIJD &&
    koopsom > 0 &&
    koopsom < STARTER_GRENS_2026;

  // NHG-premie wordt meegefinancierd
  const hypotheekBedrag = nhgMogelijk ? effectiefMax * (1 + NHG_PREMIE) : effectiefMax;
  const hypotheekvorm   = woning.hypotheekvorm ?? 'annuitair';

  let brutoMaandlast: number;
  if (hypotheekvorm === 'lineair') {
    const aflossing = hypotheekBedrag / (looptijdJaar * 12);
    const rente     = hypotheekBedrag * toetsrente / 12;
    brutoMaandlast  = aflossing + rente;
  } else if (hypotheekvorm === 'aflossingsvrij') {
    brutoMaandlast = hypotheekBedrag * toetsrente / 12;
  } else {
    brutoMaandlast = maandlastAnnuitair(hypotheekBedrag, toetsrente, looptijdJaar);
  }

  // Netto maandlast (eerste maand benadering)
  const belastingtarief  = toetsinkomen > BELASTING_GRENS ? BELASTING_HOOG : BELASTING_LAAG;
  const eersteRente      = hypotheekBedrag * toetsrente / 12;
  const belastingvoordeel = eersteRente * belastingtarief;
  const ewfMaand         = koopsom * 0.0035 / 12;
  const nettoMaandlast   = brutoMaandlast - belastingvoordeel + ewfMaand * belastingtarief;

  // Bijkomende kosten
  const overdracht = startersvrijstelling ? 0 : koopsom * 0.02;
  const nhgPremie  = nhgMogelijk ? effectiefMax * NHG_PREMIE : 0;
  const notaris    = 2_250;
  const taxatie    = 700;
  const advies     = 3_250;
  const totaal     = overdracht + nhgPremie + notaris + taxatie + advies;

  const eigenGeld     = woning.eigenGeld ?? 0;
  const eigenGeldTekort = Math.max(0, (koopsom - effectiefMax) + totaal - eigenGeld);

  return {
    toetsinkomen,
    maandlastenVerplichtingen: maandlasten,
    maxHypotheekOpInkomen: maxOpInkomen,
    maxHypotheekOpWoning: maxOpWoning,
    effectieveMaxHypotheek: effectiefMax,
    nhgMogelijk,
    startersvrijstelling,
    energielabelBonus,
    brutoMaandlast,
    nettoMaandlast,
    bijkomendeKosten: { overdrachtsbelasting: overdracht, notarisKosten: notaris, taxatieKosten: taxatie, adviesKosten: advies, nhgPremie, totaal },
    eigenGeldTekort,
  };
}
