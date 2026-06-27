import type { Resultaat } from './wizard';

export interface GeslaagdeWoning {
  id: string;
  fundaUrl: string;
  adres: string;
  stad: string;
  vraagprijs: number;
  marktwaarde?: number;
  toegevoegd: string;
}

export interface Profiel {
  id: string;
  naam: string;
  aangemaakt: string;
  maxHypotheek: number;
  resultaat: Resultaat;
}

export interface Sessie {
  naam: string;
  email: string;
  aangemaakt: string;
  rol?: 'admin' | 'gebruiker';
}
