const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'nl-NL,nl;q=0.9',
  'Referer': 'https://www.funda.nl/',
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

function parseHtml(html) {
  const data = {};

  // 1. JSON-LD — Funda publiceert offers.price hier altijd (bevestigd via debug)
  const ldScripts = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([^<]+)<\/script>/gi)];
  for (const match of ldScripts) {
    try {
      const ld = JSON.parse(match[1]);
      if (!data.prijs && Number(ld.offers?.price) > 10000) {
        data.prijs = Number(ld.offers.price);
      }
      if (ld.address?.streetAddress) data.straat = ld.address.streetAddress;
      if (ld.address?.addressLocality) data.stadLd = ld.address.addressLocality;
    } catch { }
  }

  // 2. Directe zoekpatronen in de HTML-string (geen block-parsing, geen backtracking)
  const zoek = (patronen) => {
    for (const p of patronen) {
      const m = html.match(p);
      if (m) return m[1];
    }
    return null;
  };

  if (!data.prijs) {
    const m = zoek([
      /"price"\s*:\s*(\d{5,7})/,
      /"koopprijs"\s*:\s*(\d{5,7})/i,
      /"vraagprijs"\s*:\s*(\d{5,7})/i,
      /€\s*([\d]{2,4}\.[\d]{3})\s*k\.k/i,
      /€\s*([\d]{2,4}\.[\d]{3})/,
    ]);
    if (m) {
      const v = Number(String(m).replace(/\./g, ''));
      if (v > 50000 && v < 5_000_000) data.prijs = v;
    }
  }

  if (!data.bouwjaar) {
    const m = zoek([/"bouwjaar"\s*:\s*(\d{4})/i, /[Bb]ouwjaar[\s\S]{0,60}?(\d{4})/]);
    if (m) { const y = Number(m); if (y > 1800 && y <= new Date().getFullYear() + 5) data.bouwjaar = y; }
  }

  if (!data.oppervlakte) {
    // Specifiek woonoppervlakte — NIET perceeloppervlakte of bruto vloeroppervlak
    const m = zoek([
      /"woonoppervlakte"\s*:\s*(\d{2,4})/i,
      /"gebruiksoppervlakteWonen"\s*:\s*(\d{2,4})/i,
      /"livingArea"\s*:\s*(\d{2,4})/i,
    ]);
    if (m) { const v = Number(m); if (v > 10 && v < 1000) data.oppervlakte = v; }
  }

  if (!data.energielabel) {
    const m = zoek([
      /"energieklasse"\s*:\s*"([A-G][+]{0,4})"/i,
      /"energielabel"\s*:\s*"([A-G][+]{0,4})"/i,
      /[Ee]nergielabel[\s\S]{0,50}?([A-G][+]{0,4})/,
    ]);
    if (m) data.energielabel = m.toUpperCase();
  }

  if (!data.slaapkamers) {
    const m = zoek([
      /"aantalSlaapkamers"\s*:\s*(\d+)/i,
      /"slaapkamers"\s*:\s*(\d+)/i,
      /(\d+)\s*slaapkamers?/i,
    ]);
    if (m) { const v = Number(m); if (v > 0 && v < 20) data.slaapkamers = v; }
  }

  if (!data.kamers) {
    const m = zoek([
      /"aantalKamers"\s*:\s*(\d+)/i,
      /(\d+)\s*kamers?(?!\s*slaap)/i,
    ]);
    if (m) { const v = Number(m); if (v > 0 && v < 20) data.kamers = v; }
  }

  // Nieuwbouw/VON alleen via JSON-signalen — "nieuwbouw" staat in Funda-nav op ELKE pagina
  const vonInJson = /"(?:prijstype|priceType|aanbodType)"\s*:\s*"[^"]*(?:von|vrij)[^"]*"/i.test(html)
    || /"isNieuwbouw"\s*:\s*true/i.test(html)
    || /"nieuwbouw"\s*:\s*true/i.test(html);
  data.prijstype = vonInJson ? 'von' : 'kk';
  data.isNieuwbouw = vonInJson;

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
