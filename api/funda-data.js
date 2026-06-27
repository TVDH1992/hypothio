async function fetchHtml(url) {
  const scraperKey = process.env.SCRAPER_API_KEY;

  // Via ScraperAPI als key beschikbaar — omzeilt Cloudflare
  if (scraperKey) {
    const proxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(url)}&country_code=nl`;
    const res = await fetch(proxyUrl, { headers: { 'Accept': 'text/html' } });
    if (!res.ok) throw new Error(`ScraperAPI: ${res.status}`);
    return { html: await res.text(), via: 'scraperapi' };
  }

  // Direct fetch als fallback (werkt soms, afhankelijk van Cloudflare status)
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'nl-NL,nl;q=0.9',
      'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { html: await res.text(), via: 'direct' };
}

function parseHtml(html) {
  const data = {};

  // JSON-LD structured data
  const jsonLdBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of jsonLdBlocks) {
    try {
      const json = JSON.parse(block.replace(/<script[^>]*>|<\/script>/gi, ''));
      const prijs = json.offers?.price ?? json.price;
      if (prijs && Number(prijs) > 10000 && !data.prijs) data.prijs = Number(prijs);
      const m2 = json.floorSize?.value ?? json.floorArea?.value;
      if (m2 && !data.oppervlakte) data.oppervlakte = Number(m2);
      if (json.numberOfRooms && !data.kamers) data.kamers = Number(json.numberOfRooms);
      if (json.yearBuilt && !data.bouwjaar) data.bouwjaar = Number(json.yearBuilt);
      if (json.address?.addressLocality && !data.stad) data.stad = json.address.addressLocality;
    } catch { /* doorgaan */ }
  }

  // Next.js __NEXT_DATA__
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const str = JSON.stringify(JSON.parse(nextDataMatch[1]));

      if (!data.prijs) {
        const m = str.match(/"koopprijs"\s*:\s*(\d+)/) ?? str.match(/"Koopprijs"\s*:\s*(\d+)/) ?? str.match(/"price"\s*:\s*(\d+)/);
        if (m && Number(m[1]) > 10000) data.prijs = Number(m[1]);
      }
      if (!data.bouwjaar) {
        const m = str.match(/"bouwjaar"\s*:\s*(\d{4})/) ?? str.match(/"yearBuilt"\s*:\s*(\d{4})/);
        if (m) data.bouwjaar = Number(m[1]);
      }
      if (!data.oppervlakte) {
        const m = str.match(/"woonoppervlakte"\s*:\s*(\d+)/) ?? str.match(/"Woonoppervlakte"\s*:\s*(\d+)/) ?? str.match(/"livingArea"\s*:\s*(\d+)/);
        if (m) data.oppervlakte = Number(m[1]);
      }
      if (!data.kamers) {
        const m = str.match(/"aantalKamers"\s*:\s*(\d+)/) ?? str.match(/"numberOfRooms"\s*:\s*(\d+)/);
        if (m) data.kamers = Number(m[1]);
      }
      if (!data.energielabel) {
        const m = str.match(/"energieklasse"\s*:\s*"([A-G][+]{0,2})"/) ?? str.match(/"energyLabel"\s*:\s*"([A-G][+]{0,2})"/i);
        if (m) data.energielabel = m[1].toUpperCase();
      }
      if (!data.oppervlaktePerceel) {
        const m = str.match(/"perceeloppervlakte"\s*:\s*(\d+)/);
        if (m) data.oppervlaktePerceel = Number(m[1]);
      }
    } catch { /* doorgaan */ }
  }

  // HTML regex fallbacks
  if (!data.prijs) {
    for (const pattern of [
      /€\s*([\d.]+)\s*(?:k\.k\.|v\.o\.n\.)/gi,
      /"koopprijs"\s*:\s*(\d+)/,
      /"price"\s*:\s*"?(\d+)"?/,
      /askingPrice["\s:]+(\d+)/i,
    ]) {
      const m = pattern.exec(html);
      if (m) {
        const p = Number(m[1].replace(/\./g, ''));
        if (p > 50000 && p < 5000000) { data.prijs = p; break; }
      }
    }
  }
  if (!data.bouwjaar) {
    const m = html.match(/[Bb]ouwjaar[\s\S]{0,30}?(\d{4})/) ?? html.match(/"bouwjaar"[^>]*>(\d{4})/);
    if (m) { const y = Number(m[1]); if (y > 1800 && y <= new Date().getFullYear()) data.bouwjaar = y; }
  }
  if (!data.oppervlakte) {
    const m = html.match(/woonoppervlak[\s\S]{0,30}?(\d+)\s*m/i);
    if (m) data.oppervlakte = Number(m[1]);
  }
  if (!data.energielabel) {
    const m = html.match(/energieklasse[\s\S]{0,20}?([A-G][+]{0,4})/i);
    if (m) data.energielabel = m[1].toUpperCase();
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

  try {
    const { html, via } = await fetchHtml(url);

    // Geef debug info mee als er niks gevonden wordt
    if (html.length < 5000 || /Just a moment|cf-browser-verification|cloudflare/i.test(html)) {
      return res.status(422).json({
        error: 'Funda blokkeert het verzoek — stel SCRAPER_API_KEY in via scraperapi.com (gratis)',
        via,
        geblokkeerd: true,
      });
    }

    const data = parseHtml(html);
    data._via = via;
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message ?? 'Kon pagina niet ophalen' });
  }
}
