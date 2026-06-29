import type { Resultaat, SituatieData, InkomenData, VerplichtingenData, WoningData } from './wizard';

export interface WizardInvoer {
  situatie: Partial<SituatieData>;
  inkomen1: Partial<InkomenData>;
  inkomen2: Partial<InkomenData>;
  verplichtingen: Partial<VerplichtingenData>;
  woning: Partial<WoningData>;
}

export interface FundaDetails {
  prijs?: number;
  oppervlakte?: number;
  bouwjaar?: number;
  kamers?: number;
  slaapkamers?: number;
  energielabel?: string;
  isNieuwbouw?: boolean;
  prijstype?: string;
}

export interface FundaAnalyse {
  marktwaarde: number;
  biedadvies: string;
  vraagprijsOordeel: string;
  kostenKoper?: number;
  aandachtspunten: string[];
  pluspunten: string[];
  samenvatting: string;
}

export interface HuispediaData {
  transacties?: { datum: string; bedrag: number }[];
  laasteVerkoopJaar?: number;
  laasteVerkoopPrijs?: number;
  jarenInBezit?: number;
  eigenaarSinds?: string;
}

export interface FundaAnalyseCache {
  fundaAnalyse: FundaAnalyse | null;
  fundaDetails: FundaDetails | null;
  huispediaData: HuispediaData | null;
}

export interface GeslaagdeWoning {
  id: string;
  fundaUrl: string;
  adres: string;
  stad: string;
  vraagprijs: number;
  marktwaarde?: number;
  toegevoegd: string;
  analyseData?: FundaAnalyseCache;
}

export interface Profiel {
  id: string;
  naam: string;
  aangemaakt: string;
  maxHypotheek: number;
  resultaat: Resultaat;
  wizardInvoer?: WizardInvoer;
}

export interface Berekening {
  id: string;
  naam: string;
  maxHypotheek: number;
  resultaat: Resultaat;
  wizardInvoer: WizardInvoer;
  aangemaakt: string;
}

export interface Sessie {
  naam: string;
  email: string;
  aangemaakt: string;
  rol?: 'admin' | 'gebruiker';
}
