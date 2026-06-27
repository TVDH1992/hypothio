export interface AdresSuggestie {
  pdokId: string;
  nummeraanduidingId: string;
  weergavenaam: string;
}

export interface WozResultaat {
  wozWaarde: number;
  peildatum: string;
  nummeraanduidingId: string;
}

const PDOK_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/free';
const WOZ_URL  = 'https://api.wozwaardeloket.nl/woz-waarden';

export async function zoekAdres(query: string): Promise<AdresSuggestie[]> {
  if (query.trim().length < 4) return [];
  const url = `${PDOK_URL}?q=${encodeURIComponent(query)}&fq=type:adres&rows=6`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Adres zoeken mislukt');
  const data = await res.json();
  return (data.response?.docs ?? [])
    .filter((d: Record<string, string>) => d.nummeraanduiding_id)
    .map((d: Record<string, string>) => ({
      pdokId: d.id,
      nummeraanduidingId: d.nummeraanduiding_id,
      weergavenaam: d.weergavenaam,
    }));
}

export async function haalWozWaarde(nummeraanduidingId: string): Promise<WozResultaat> {
  const res = await fetch(`${WOZ_URL}/${nummeraanduidingId}`);
  if (!res.ok) throw new Error('WOZ waarde niet beschikbaar voor dit adres');
  const data: Array<{ peildatum: string; vastgesteldeWaarde: number }> = await res.json();
  if (!data?.length) throw new Error('Geen WOZ gegevens gevonden');
  const latest = data.sort((a, b) => b.peildatum.localeCompare(a.peildatum))[0];
  return {
    wozWaarde: latest.vastgesteldeWaarde,
    peildatum: latest.peildatum,
    nummeraanduidingId,
  };
}

// Schat marktwaarde op basis van WOZ (correctiefactor 2024/2025 ~10%)
export function schatMarktwaarde(wozWaarde: number): number {
  return Math.round(wozWaarde * 1.10 / 1000) * 1000;
}

export function biedadvies(vraagprijs: number, marktwaarde: number): {
  label: string;
  kleur: 'groen' | 'oranje' | 'rood';
  toelichting: string;
} {
  const ratio = vraagprijs / marktwaarde;

  if (ratio < 0.95) {
    return {
      label: 'Scherp geprijsd',
      kleur: 'groen',
      toelichting: `De vraagprijs ligt ${Math.round((1 - ratio) * 100)}% onder de geschatte marktwaarde. Kans op concurrentie — overweeg bod op of boven vraagprijs.`,
    };
  }
  if (ratio <= 1.05) {
    return {
      label: 'Reële prijs',
      kleur: 'groen',
      toelichting: 'De vraagprijs sluit goed aan bij de geschatte marktwaarde. Onderhandelen is mogelijk maar beperkt.',
    };
  }
  if (ratio <= 1.15) {
    return {
      label: 'Iets boven marktwaarde',
      kleur: 'oranje',
      toelichting: `De vraagprijs ligt ${Math.round((ratio - 1) * 100)}% boven de schatting. Wees bewust van overbieden — check vergelijkbare woningen in de buurt.`,
    };
  }
  return {
    label: 'Fors boven marktwaarde',
    kleur: 'rood',
    toelichting: `De vraagprijs ligt ${Math.round((ratio - 1) * 100)}% boven de geschatte marktwaarde. Wees voorzichtig — laat een taxatie uitvoeren voor je bod uitbrengt.`,
  };
}
