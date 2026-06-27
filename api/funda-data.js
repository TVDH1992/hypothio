const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'nl-NL,nl;q=0.9',
  'Referer': 'https://www.funda.nl/',
  'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"',
  'sec-ch-ua-mobile': '?0',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Upgrade-Insecure-Requests': '1',
};

async function haalHtml(url) {
  if (process.env.SCRAPER_API_KEY) {
    const res = await fetch(
      `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&country_code=nl`,
      { headers: { Accept: 'text/html' } }
    );
    if (!res.ok) throw new Error(`ScraperAPI: ${res.status}`);
    return res.text();
  }
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function zoekEchteUrl(invoerUrl) {
  const parts = invoerUrl.trim().replace(/\/$/, '').split('/').filter(Boolean);
  const koopIdx = parts.findIndex(p => p === 'koop' || p === 'huur');
  if (koopIdx === -1) return null;
  const stad = parts[koopIdx + 1];
  const slug = parts[koopIdx + 2] ?? '';
  const zoekwoorden = slug.split('-').filter(d => d && !/^\d{4}[a-z]{2}$/i.test(d)).slice(1, 4).join(' ');
  if (!stad || !zoekwoorden) return null;
  try {
    const res = await fetch(`https://www.funda.nl/koop/${stad}/`, { headers: HEADERS });
    if (!res.ok) return null;
    const html = await res.text();
    const urlMatches = [...html.matchAll(/href="(\/detail\/koop\/[^"]+\/\d+\/)"/g)];
    for (const m of urlMatches) {
      if (zoekwoorden.split(' ').some(w => m[1].toLowerCase().includes(w.toLowerCase()))) {
        return `https://www.funda.nl${m[1]}`;
      }
    }
  } catch { }
  return null;
}

function parseJsonStr(str, data) {
  if (!data.prijs) {
    const m = str.match(/"(?:koopprijs|vraagprijs|price|koopsomEuros|koopPrijs|listPrice|salePrice|amount|koopsom)"\s*:\s*(\d{5,7})/i)
      ?? str.match(/"[^"]{0,30}(?:prijs|price|koopsom|bedrag)[^"]{0,30}"\s*:\s*(\d{5,7})/i);
    if (m) { const v = Number(m[1]); if (v > 50000 && v < 5_000_000) data.prijs = v; }
  }
  if (!data.bouwjaar) {
    const m = str.match(/"[^"]{0,20}(?:bouwjaar|constructionYear|yearBuilt|bouwYear)[^"]{0,20}"\s*:\s*(\d{4})/i);
    if (m) { const y = Number(m[1]); if (y > 1800 && y <= new Date().getFullYear() + 5) data.bouwjaar = y; }
  }
  if (!data.oppervlakte) {
    const m = str.match(/"[^"]{0,30}(?:woonoppervlakte|oppervlakte|livingArea|usableArea|gebruiksoppervlak)[^"]{0,30}"\s*:\s*(\d{2,4})/i);
    if (m) { const v = Number(m[1]); if (v > 10 && v < 2000) data.oppervlakte = v; }
  }
  if (!data.energielabel) {
    const m = str.match(/"[^"]{0,20}(?:energieklasse|energielabel|energyLabel|energyClass)[^"]{0,20}"\s*:\s*"([A-G][+]{0,4})"/i);
    if (m) data.energielabel = m[1].toUpperCase();
  }
  if (!data.slaapkamers) {
    const m = str.match(/"[^"]{0,20}(?:slaapkamers|bedrooms|aantalSlaap)[^"]{0,20}"\s*:\s*(\d+)/i);
    if (m) { const v = Number(m[1]); if (v > 0 && v < 20) data.slaapkamers = v; }
  }
  if (!data.kamers) {
    const m = str.match(/"[^"]{0,20}(?:aantalKamers|kamers|rooms|numberOfRooms)[^"]{0,20}"\s*:\s*(\d+)/i);
    if (m) { const v = Number(m[1]); if (v > 0 && v < 20) data.kamers = v; }
  }
}

function parseHtml(html) {
  const data = {};

  // 1. Alle JSON-LD scripts doorzoeken (Funda heeft er meerdere op de pagina)
  const ldScripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of ldScripts) {
    try {
      const ld = JSON.parse(match[1]);
      if (!data.prijs && ld.offers?.price && Number(ld.offers.price) > 10000) {
        data.prijs = Number(ld.offers.price);
      }
      if (ld.address?.streetAddress) data.straat = ld.address.streetAddress;
      if (ld.address?.addressLocality) data.stadLd = ld.address.addressLocality;
      // Prijs kan ook als string met punten: "425.000"
      if (!data.prijs && ld.offers?.price) {
        const p = Number(String(ld.offers.price).replace(/\./g, ''));
        if (p > 10000) data.prijs = p;
      }
    } catch { }
  }

  // 2. Funda gebruikt Nuxt.js — zoek in alle inline scripts naar property data
  // Nuxt embed: window.__NUXT__={...} of <script type="application/json" id="__NUXT_DATA__">
  const scriptBlocks = [...html.matchAll(/<script[^>]*>([\s\S]{200,}?)<\/script>/gi)]
    .map(m => m[1]);

  for (const block of scriptBlocks) {
    // Sla JSON-LD en externe scripts over
    if (block.includes('"@context"') || block.includes('src=')) continue;
    try {
      // Probeer als JSON (Nuxt data payload)
      const str = block.replace(/^[\s\S]*?(\{|\[)/, '$1').replace(/[;\s]+$/, '');
      const parsed = JSON.parse(str);
      const s = JSON.stringify(parsed);
      parseJsonStr(s, data);
      if (data.prijs) break;
    } catch {
      // Geen geldig JSON — zoek toch naar patronen in de script tekst
      parseJsonStr(block, data);
    }
  }

  // 3. HTML regex fallback voor prijs
  if (!data.prijs) {
    const patronen = [
      /€\s*([\d]{2,4}\.[\d]{3})\s*(?:k\.k\.|v\.o\.n\.)/i,
      /€\s*([\d]{2,4}\.[\d]{3})/,
      /"price"\s*:\s*"?([\d]{5,7})"?/i,
    ];
    for (const p of patronen) {
      const m = html.match(p);
      if (m) {
        const v = Number(m[1].replace(/\./g, ''));
        if (v > 50000 && v < 5_000_000) { data.prijs = v; break; }
      }
    }
  }

  // 4. HTML regex fallback voor overige velden
  if (!data.bouwjaar) {
    const m = html.match(/[Bb]ouwjaar[\s\S]{0,80}?(\d{4})/);
    if (m) { const y = Number(m[1]); if (y > 1800 && y <= new Date().getFullYear() + 5) data.bouwjaar = y; }
  }

  if (!data.oppervlakte) {
    const m = html.match(/(\d{2,4})\s*m²\s*wonen/i) ?? html.match(/(\d{2,4})\s*m²/);
    if (m) { const v = Number(m[1]); if (v > 10 && v < 2000) data.oppervlakte = v; }
  }

  if (!data.energielabel) {
    const m = html.match(/[Ee]nergielabel[\s\S]{0,50}?([A-G][+]{0,4})/)
      ?? html.match(/[Ee]nergieklasse[\s\S]{0,50}?([A-G][+]{0,4})/);
    if (m) data.energielabel = m[1].toUpperCase();
  }

  if (!data.slaapkamers) {
    const m = html.match(/(\d+)\s*slaapkamers?/i);
    if (m) { const v = Number(m[1]); if (v > 0 && v < 20) data.slaapkamers = v; }
  }

  if (!data.kamers) {
    const m = html.match(/(\d+)\s*kamers?(?!\s*slaap)/i);
    if (m) { const v = Number(m[1]); if (v > 0 && v < 20) data.kamers = v; }
  }

  data.isNieuwbouw = /nieuwbouw|v\.o\.n\.|vrij\s+op\s+naam/i.test(html);
  data.prijstype = /v\.o\.n\./i.test(html) ? 'von' : 'kk';

  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { url } = req.body ?? {};
  if (!url || !url.includes('funda.nl')) return res.status(400).json({ error: 'Ongeldige URL' });

  let teGebruikenUrl = url.trim();
  let html;

  try {
    html = await haalHtml(teGebruikenUrl);
  } catch (e) {
    if (e.message?.includes('HTTP 4')) {
      const echteUrl = await zoekEchteUrl(teGebruikenUrl);
      if (echteUrl) {
        teGebruikenUrl = echteUrl;
        try { html = await haalHtml(echteUrl); }
        catch (e2) { return res.status(500).json({ error: e2.message }); }
      } else {
        return res.status(404).json({ error: 'Woning niet gevonden op Funda' });
      }
    } else {
      return res.status(500).json({ error: e.message });
    }
  }

  if (html.length < 8000 && /cf-browser-verification|challenge-platform|turnstile/i.test(html)) {
    return res.status(422).json({ error: 'Toegang geblokkeerd', geblokkeerd: true });
  }

  const data = parseHtml(html);
  data._url = teGebruikenUrl;
  return res.status(200).json(data);
}
