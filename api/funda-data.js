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
    const adresIdx = html.toLowerCase().indexOf(zoekwoorden.toLowerCase().split(' ')[0]);
    if (adresIdx > -1) {
      const rondom = html.substring(Math.max(0, adresIdx - 800), adresIdx + 200);
      const m = rondom.match(/href="(\/detail\/koop\/[^"]+\/\d+\/)"/);
      if (m) return `https://www.funda.nl${m[1]}`;
    }
  } catch { }
  return null;
}

function parseHtml(html) {
  const data = {};

  // --- JSON-LD: Funda publiceert gestructureerde data voor zoekmachines ---
  // Dit is de meest betrouwbare bron: officieel door Funda gepubliceerd
  const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (ldMatch) {
    try {
      const ld = JSON.parse(ldMatch[1]);
      if (ld.offers?.price && Number(ld.offers.price) > 10000) {
        data.prijs = Number(ld.offers.price);
      }
      if (ld.address?.streetAddress) data.straat = ld.address.streetAddress;
      if (ld.address?.addressLocality) data.stadLd = ld.address.addressLocality;
    } catch { }
  }

  // --- HTML patronen als JSON-LD geen prijs heeft ---
  if (!data.prijs) {
    const patronen = [
      /€\s*([0-9]{2,4}\.[0-9]{3})\s*(?:k\.k|v\.o\.n)/i,
      /([0-9]{2,4}\.[0-9]{3})\s*(?:k\.k|v\.o\.n)/i,
      /"price"\s*:\s*([0-9]{5,7})/i,
      /"koopprijs"\s*:\s*([0-9]{5,7})/i,
    ];
    for (const p of patronen) {
      const m = html.match(p);
      if (m) {
        const prijs = Number(m[1].replace(/\./g, ''));
        if (prijs > 50000 && prijs < 5000000) { data.prijs = prijs; break; }
      }
    }
  }

  // Bouwjaar
  const byMatch = html.match(/[Bb]ouwjaar[\s\S]{0,80}?(\d{4})/);
  if (byMatch) { const y = Number(byMatch[1]); if (y > 1800 && y <= new Date().getFullYear() + 5) data.bouwjaar = y; }

  // Oppervlakte
  const m2Match = html.match(/(\d{2,4})\s*m²/) ?? html.match(/woonoppervlak[\s\S]{0,30}?(\d{2,4})/i);
  if (m2Match) { const m = Number(m2Match[1]); if (m > 10 && m < 1000) data.oppervlakte = m; }

  // Energielabel
  const labelMatch = html.match(/[Ee]nergielabel[\s\S]{0,50}?([A-G][+]{0,4})/) ?? html.match(/[Ee]nergieklasse[\s\S]{0,50}?([A-G][+]{0,4})/);
  if (labelMatch) data.energielabel = labelMatch[1].toUpperCase();

  // Slaapkamers
  const slaapMatch = html.match(/(\d+)\s*[Ss]laapkamers?/);
  if (slaapMatch) { const k = Number(slaapMatch[1]); if (k > 0 && k < 20) data.slaapkamers = k; }

  // Kamers
  const kamersMatch = html.match(/(\d+)\s*kamers?(?!\s*slaap)/i);
  if (kamersMatch) { const k = Number(kamersMatch[1]); if (k > 0 && k < 20) data.kamers = k; }

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
