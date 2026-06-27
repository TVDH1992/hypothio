const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'nl-NL,nl;q=0.9',
  'Referer': 'https://www.funda.nl/',
  'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Upgrade-Insecure-Requests': '1',
};

async function haalHtml(url) {
  if (process.env.SCRAPER_API_KEY) {
    const proxyUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&country_code=nl`;
    const res = await fetch(proxyUrl, { headers: { Accept: 'text/html' } });
    if (!res.ok) throw new Error(`ScraperAPI: ${res.status}`);
    return res.text();
  }
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// Zoek de echte Funda detail URL op basis van stad + adres uit de slug
async function zoekEchteUrl(invoerUrl) {
  const clean = invoerUrl.trim().replace(/\/$/, '');
  const parts = clean.split('/').filter(Boolean);

  // Haal stad en type uit URL: /detail/koop/{stad}/{type-adres}/
  const koopIdx = parts.findIndex(p => p === 'koop' || p === 'huur');
  if (koopIdx === -1 || parts.length < koopIdx + 2) return null;

  const stad = parts[koopIdx + 1];
  const slug = parts[koopIdx + 2] ?? '';

  // Haal zoektermen uit slug (verwijder type-prefix en postcode)
  const slugDelen = slug.split('-').filter(d => d && !/^\d{4}[a-z]{2}$/i.test(d));
  // Eerste deel is type (appartement/huis), rest is adres
  const zoekwoorden = slugDelen.slice(1, 4).join(' ');

  if (!stad || !zoekwoorden) return null;

  // Zoek op Funda zoekpagina
  const zoekUrl = `https://www.funda.nl/koop/${stad}/`;
  try {
    const res = await fetch(zoekUrl, { headers: HEADERS });
    if (!res.ok) return null;
    const html = await res.text();

    // Vind listing URLs op de pagina
    const urlMatches = [...html.matchAll(/href="(\/detail\/koop\/[^"]+\/\d+\/)"/g)];
    for (const match of urlMatches) {
      const kandidaatUrl = match[1];
      // Check of de zoekwoorden voorkomen in de URL
      const treffer = zoekwoorden.split(' ').filter(Boolean)
        .some(woord => kandidaatUrl.toLowerCase().includes(woord.toLowerCase()));
      if (treffer) return `https://www.funda.nl${kandidaatUrl}`;
    }

    // Tweede poging: zoek het adres in de HTML tekst en pak de bijbehorende href
    const adresIdx = html.toLowerCase().indexOf(zoekwoorden.toLowerCase().split(' ')[0]);
    if (adresIdx > -1) {
      const rondom = html.substring(Math.max(0, adresIdx - 800), adresIdx + 200);
      const hrefMatch = rondom.match(/href="(\/detail\/koop\/[^"]+\/\d+\/)"/);
      if (hrefMatch) return `https://www.funda.nl${hrefMatch[1]}`;
    }
  } catch { /* niet beschikbaar */ }

  return null;
}

function parseHtml(html) {
  const data = {};

  // Prijs: meerdere patronen, meest specifiek eerst
  const prijsPatterns = [
    /€\s*([0-9]{2,4}\.[0-9]{3})\s*(?:k\.k|v\.o\.n)/i,   // "€ 425.000 k.k."
    /([0-9]{2,4}\.[0-9]{3})\s*(?:k\.k|v\.o\.n)/i,        // "425.000 k.k."
    /koopprijs[^>]*>\s*€?\s*([0-9]{2,4}\.?[0-9]{3})/i,   // "Koopprijs 425000"
    /"koopprijs"\s*:\s*([0-9]+)/i,                         // JSON "koopprijs":425000
    /"price"\s*:\s*"?([0-9]+)"?/i,                         // JSON "price":425000
    /vraagprijs[^>]*>\s*€?\s*([0-9]{2,4}\.?[0-9]{3})/i,  // "Vraagprijs 425.000"
  ];
  for (const pattern of prijsPatterns) {
    const m = html.match(pattern);
    if (m) {
      const p = Number(m[1].replace(/\./g, ''));
      if (p > 50000 && p < 5000000) { data.prijs = p; break; }
    }
  }

  // Bouwjaar
  const bouwjaarMatch = html.match(/[Bb]ouwjaar[\s\S]{0,80}?(\d{4})/);
  if (bouwjaarMatch) {
    const y = Number(bouwjaarMatch[1]);
    if (y > 1800 && y <= new Date().getFullYear() + 5) data.bouwjaar = y;
  }

  // Oppervlakte
  const m2Match = html.match(/(\d{2,4})\s*m²/)
               ?? html.match(/woonoppervlak[\s\S]{0,30}?(\d{2,4})/i);
  if (m2Match) {
    const m2 = Number(m2Match[1]);
    if (m2 > 10 && m2 < 1000) data.oppervlakte = m2;
  }

  // Energielabel
  const labelMatch = html.match(/[Ee]nergielabel[\s\S]{0,50}?([A-G][+]{0,4})/)
                  ?? html.match(/[Ee]nergieklasse[\s\S]{0,50}?([A-G][+]{0,4})/);
  if (labelMatch) data.energielabel = labelMatch[1].toUpperCase();

  // Slaapkamers
  const slaapMatch = html.match(/(\d+)\s*[Ss]laapkamers?/);
  if (slaapMatch) {
    const k = Number(slaapMatch[1]);
    if (k > 0 && k < 20) data.slaapkamers = k;
  }

  // Kamers
  const kamersMatch = html.match(/(\d+)\s*kamers?(?!\s*slaap)/i)
                   ?? html.match(/aantal\s*kamers?[\s\S]{0,30}?(\d+)/i);
  if (kamersMatch) {
    const k = Number(kamersMatch[1]);
    if (k > 0 && k < 20) data.kamers = k;
  }

  data.isNieuwbouw = /nieuwbouw|v\.o\.n\.|vrij\s+op\s+naam/i.test(html);
  data.prijstype = /v\.o\.n\./i.test(html) ? 'von' : 'kk';

  const aangeboden = html.match(/aangeboden\s+(?:per|op|sinds)[^>]*>\s*([^<]{5,30})/i);
  if (aangeboden) data.aangeboden = aangeboden[1].trim();

  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { url } = req.body ?? {};
  if (!url || !url.includes('funda.nl')) return res.status(400).json({ error: 'Ongeldige URL' });

  let teGebruikenUrl = url.trim();

  try {
    let html;
    try {
      html = await haalHtml(teGebruikenUrl);
    } catch (e) {
      // 404 of andere fout: zoek de echte URL op via Funda zoekpagina
      if (e.message?.includes('404') || e.message?.includes('HTTP 4')) {
        const echteUrl = await zoekEchteUrl(teGebruikenUrl);
        if (echteUrl) {
          teGebruikenUrl = echteUrl;
          html = await haalHtml(echteUrl);
        } else {
          return res.status(404).json({ error: 'Woning niet gevonden op Funda' });
        }
      } else {
        throw e;
      }
    }

    const geblokkeerd = html.length < 8000 && /cf-browser-verification|challenge-platform|turnstile/i.test(html);
    if (geblokkeerd) {
      return res.status(422).json({ error: 'Toegang geblokkeerd', geblokkeerd: true });
    }

    const data = parseHtml(html);
    data._url = teGebruikenUrl; // zodat frontend weet welke URL gebruikt is
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message ?? 'Kon pagina niet ophalen' });
  }
}
