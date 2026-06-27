import type { Profiel, GeslaagdeWoning, Sessie } from '../types/profiel';

const SESSIE_KEY   = 'hypothio_sessie';
const PROFIEL_KEY  = 'hypothio_profiel';
const WONINGEN_KEY = 'hypothio_woningen';

export function laadSessie(): Sessie | null {
  try {
    const raw = localStorage.getItem(SESSIE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function slaSessionOp(sessie: Sessie): void {
  localStorage.setItem(SESSIE_KEY, JSON.stringify(sessie));
}

export function verwijderSessie(): void {
  localStorage.removeItem(SESSIE_KEY);
}

export function slaProfielOp(profiel: Profiel): void {
  localStorage.setItem(PROFIEL_KEY, JSON.stringify(profiel));
}

export function laadProfiel(): Profiel | null {
  try {
    const raw = localStorage.getItem(PROFIEL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function verwijderProfiel(): void {
  localStorage.removeItem(PROFIEL_KEY);
  localStorage.removeItem(WONINGEN_KEY);
}

export function laadWoningen(): GeslaagdeWoning[] {
  try {
    const raw = localStorage.getItem(WONINGEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function voegWoningToe(woning: GeslaagdeWoning): void {
  const woningen = laadWoningen();
  woningen.unshift(woning);
  localStorage.setItem(WONINGEN_KEY, JSON.stringify(woningen));
}

export function verwijderWoning(id: string): void {
  const woningen = laadWoningen().filter(w => w.id !== id);
  localStorage.setItem(WONINGEN_KEY, JSON.stringify(woningen));
}

// Extraheer adres en stad uit een Funda URL
// Bijv: https://www.funda.nl/koop/amsterdam/huis-12345678-dorpsstraat-42/
export function parseFundaUrl(url: string): { adres: string; stad: string; geldig: boolean } {
  try {
    const clean = url.trim().replace(/\/$/, '');
    const parts = clean.split('/').filter(Boolean);

    // Zoek "koop" of "huur" segment
    const koopIdx = parts.findIndex(p => p === 'koop' || p === 'huur');
    if (koopIdx === -1 || parts.length < koopIdx + 3) {
      return { adres: '', stad: '', geldig: false };
    }

    const stad = parts[koopIdx + 1];
    const slug = parts[koopIdx + 2];

    const slugParts = slug.split('-');
    // Oud formaat: huis-{8cijfers}-straat-nummer
    // Nieuw formaat: huis-straatnaam-nummer-postcode
    const isOudFormaat = /^\d{8}$/.test(slugParts[1] ?? '');
    const raw = isOudFormaat ? slugParts.slice(2) : slugParts.slice(1);
    // Postcode eraf filteren (bijv. 3332bg)
    const adresDelen = raw.filter(d => !/^\d{4}[a-z]{2}$/i.test(d));
    const adres = adresDelen
      .map(d => d.charAt(0).toUpperCase() + d.slice(1))
      .join(' ');

    return {
      adres: adres || slug,
      stad: stad.charAt(0).toUpperCase() + stad.slice(1),
      geldig: adres.length > 0,
    };
  } catch {
    return { adres: '', stad: '', geldig: false };
  }
}
