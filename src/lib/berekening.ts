import {
  LTI_NORMEN, LtiRij, TOETSRENTES, NHG_GRENS_2026, NHG_PREMIE,
  STARTER_GRENS_2026, STARTER_MAX_LEEFTIJD, MAX_LTV,
  ENERGIELABEL_BONUS, BELASTING_LAAG, AFM_TOETSRENTE,
  ALLEENSTAANDEN_OPSLAG, ALLEENSTAANDEN_DREMPEL,
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
  // Jaarsalaris op basis van uitbetalingsfrequentie
  const jaarsalaris = inkomen.frequentie === 'vierWeken' ? salaris * 13 : salaris * 12;
  // Vakantiegeld = 8% over 12 maanden basisloon (los van 13e maand)
  const vakantiegeld = inkomen.heeftVakantiegeld ? jaarsalaris * 0.08 : 0;
  // 13e maand = precies 1× bruto maandsalaris (geen vakantiegeld erover)
  const dertiendeMaand = inkomen.heeftDertiendeMaand ? salaris : 0;

  let basis = jaarsalaris + vakantiegeld + dertiendeMaand;
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

  const schuld = v.studieschuldOrigineel ?? 0;
  if (schuld > 0 && v.studieschuldStelsel && v.studieschuldStelsel !== 'geen') {
    // GHF: 0,45% van oorspronkelijke DUO-schuld (oud stelsel) of 0,35% (nieuw stelsel)
    lasten += schuld * (v.studieschuldStelsel === 'oud' ? 0.0045 : 0.0035);
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
  rentes: Record<number, number> = TOETSRENTES,
  ltiNormen: LtiRij[] = LTI_NORMEN,
): Resultaat {
  const ti1 = berekenToetsinkomen(inkomen1);
  const ti2 = situatie.metPartner ? berekenToetsinkomen(inkomen2) : 0;
  const toetsinkomen = ti1 + ti2;

  const maandlasten = berekenMaandlasten(verplichtingen);

  const periode = woning.rentevastePeriode ?? 10;
  const rawRente = rentes[periode] ?? rentes[10] ?? TOETSRENTES[10]!;
  const toetsrente = periode < 10 ? Math.max(rawRente, AFM_TOETSRENTE) : rawRente;
  const looptijdJaar = woning.looptijdJaar ?? 30;

  const ltiFactor  = getLtiFactor(toetsinkomen, ltiNormen);
  const annFactor  = annuityFactor(toetsrente, looptijdJaar);

  // Max op basis van inkomen minus verplichtingen (annFactor op gewenste looptijd voor vergelijkbaarheid)
  const maxOpInkomen = Math.max(0, toetsinkomen * ltiFactor - maandlasten * annFactor);

  const koopsom = woning.koopsom ?? 0;
  const energielabelBonus = ENERGIELABEL_BONUS[woning.energielabel ?? 'C'] ?? 0;

  // AOW-leeftijdbeperking: looptijd mag niet voorbij AOW-leeftijd (67)
  const leeftijd = situatie.leeftijd ?? 0;
  const maxLooptijdLeeftijd = leeftijd >= 18 ? Math.max(1, 67 - leeftijd) : looptijdJaar;
  const effectieveLooptijd = Math.min(looptijdJaar, maxLooptijdLeeftijd);
  const looptijdGecapped = leeftijd >= 18 && effectieveLooptijd < looptijdJaar;

  // LTV-grens puur op woningwaarde (100%); energiebonus wordt ALTIJD bovenop effectief max opgeteld
  const maxOpWoning = koopsom * MAX_LTV;
  const baseMax = koopsom > 0 ? Math.min(maxOpInkomen, maxOpWoning) : maxOpInkomen;
  let effectiefMax = baseMax + energielabelBonus;

  // Alleenstaanden-correctie (Nibud 2026): +€17.000 bij geen partner en inkomen ≥ €30.000
  if (!situatie.metPartner && toetsinkomen >= ALLEENSTAANDEN_DREMPEL) {
    effectiefMax += ALLEENSTAANDEN_OPSLAG;
    if (koopsom > 0) effectiefMax = Math.min(effectiefMax, koopsom * MAX_LTV);
  }

  const hypotheekvorm = woning.hypotheekvorm ?? 'annuitair';

  // Aflossingsvrij: wettelijk max 50% van woningwaarde (GHF art. 7)
  if (hypotheekvorm === 'aflossingsvrij' && koopsom > 0) {
    effectiefMax = Math.min(effectiefMax, koopsom * 0.5);
  }

  // NHG: koopsom ≤ grens én NHG vereist annuïtair of lineair aflossing
  const nhgMogelijk = koopsom > 0 && koopsom <= NHG_GRENS_2026 && hypotheekvorm !== 'aflossingsvrij';

  const startersvrijstelling =
    situatie.isStarter === true &&
    leeftijd >= 18 &&
    leeftijd < STARTER_MAX_LEEFTIJD &&
    koopsom > 0 &&
    koopsom < STARTER_GRENS_2026;

  // NHG-premie wordt meegefinancierd
  const hypotheekBedrag = nhgMogelijk ? effectiefMax * (1 + NHG_PREMIE) : effectiefMax;

  let brutoMaandlast: number;
  if (hypotheekvorm === 'lineair') {
    const aflossing = hypotheekBedrag / (effectieveLooptijd * 12);
    const rente     = hypotheekBedrag * toetsrente / 12;
    brutoMaandlast  = aflossing + rente;
  } else if (hypotheekvorm === 'aflossingsvrij') {
    brutoMaandlast = hypotheekBedrag * toetsrente / 12;
  } else {
    brutoMaandlast = maandlastAnnuitair(hypotheekBedrag, toetsrente, effectieveLooptijd);
  }

  // Netto maandlast (eerste maand benadering)
  // HRA max op basistarief (art. 3.120a Wet IB 2001); aflossingsvrij gesloten na 2013: geen HRA
  const belastingtarief   = BELASTING_LAAG;
  const eersteRente       = hypotheekBedrag * toetsrente / 12;
  const heeftHRA          = hypotheekvorm !== 'aflossingsvrij';
  const belastingvoordeel = heeftHRA ? eersteRente * belastingtarief : 0;
  const ewfMaand          = koopsom * 0.0035 / 12;
  const nettoMaandlast    = brutoMaandlast - belastingvoordeel + ewfMaand * belastingtarief;

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
    effectieveLooptijd,
    looptijdGecapped,
  };
}
