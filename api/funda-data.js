async function fetchHtml(url) {
  const scraperKey = process.env.SCRAPER_API_KEY;
  if (scraperKey) {
    const proxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(url)}&country_code=nl`;
    const res = await fetch(proxyUrl, { headers: { Accept: 'text/html' } });
    if (!res.ok) throw new Error(`ScraperAPI: ${res.status}`);
    return res.text();
  }
  const res = await fetch(url, {
    headers: {
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
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function parseHtml(html) {
  const data = {};

  // --- Prijs: "265.000 k.k." of "895.000 v.o.n." ---
  const prijsMatch = html.match(/([0-9]{2,4}\.?[0-9]{3})\s*(?:k\.k|v\.o\.n)/i);
  if (prijsMatch) {
    const p = Number(prijsMatch[1].replace(/\./g, ''));
    if (p > 50000 && p < 5000000) data.prijs = p;
  }

  // --- Bouwjaar ---
  const bouwjaarMatch = html.match(/[Bb]ouwjaar[\s\S]{0,80}?(\d{4})/);
  if (bouwjaarMatch) {
    const y = Number(bouwjaarMatch[1]);
    if (y > 1800 && y <= new Date().getFullYear() + 5) data.bouwjaar = y;
  }

  // --- Oppervlakte: "53 m²" of "woonoppervlakte 53" ---
  const m2Match = html.match(/(\d{2,4})\s*m²/) ??
                  html.match(/woonoppervlak[\s\S]{0,30}?(\d{2,4})/i);
  if (m2Match) {
    const m2 = Number(m2Match[1]);
    if (m2 > 10 && m2 < 1000) data.oppervlakte = m2;
  }

  // --- Energielabel ---
  const labelMatch = html.match(/[Ee]nergielabel[\s\S]{0,50}?([A-G][+]{0,4})/) ??
                     html.match(/[Ee]nergieklasse[\s\S]{0,50}?([A-G][+]{0,4})/);
  if (labelMatch) data.energielabel = labelMatch[1].toUpperCase();

  // --- Kamers ---
  const kamersMatch = html.match(/(\d+)\s*kamers?/i) ??
                      html.match(/aantal\s*kamers?[\s\S]{0,30}?(\d+)/i);
  if (kamersMatch) {
    const k = Number(kamersMatch[1]);
    if (k > 0 && k < 20) data.kamers = k;
  }

  // --- Nieuwbouw & prijstype ---
  data.isNieuwbouw = /nieuwbouw|v\.o\.n\.|vrij\s+op\s+naam/i.test(html);
  data.prijstype = /v\.o\.n\./i.test(html) ? 'von' : 'kk';

  // --- Aangeboden sinds ---
  const aangeboden = html.match(/aangeboden\s+(?:per|op|sinds)[^>]*>\s*([^<]{5,30})/i);
  if (aangeboden) data.aangeboden = aangeboden[1].trim();

  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { url } = req.body ?? {};
  if (!url || !url.includes('funda.nl')) return res.status(400).json({ error: 'Ongeldige URL' });

  try {
    const html = await fetchHtml(url);

    // Echt geblokkeerd: geen Funda-content maar wel een challenge pagina
    const geblokkeerd = html.length < 8000 && /cf-browser-verification|challenge-platform|turnstile/i.test(html);
    if (geblokkeerd) {
      return res.status(422).json({ error: 'Toegang geblokkeerd', geblokkeerd: true });
    }

    const data = parseHtml(html);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message ?? 'Kon pagina niet ophalen' });
  }
}
