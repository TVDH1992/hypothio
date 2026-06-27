async function fetchHtml(url) {
  const scraperKey = process.env.SCRAPER_API_KEY;
  if (scraperKey) {
    const proxyUrl = `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(url)}&country_code=nl`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`ScraperAPI: ${res.status}`);
    return res.text();
  }
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'nl-NL,nl;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { adres, postcode, huisnummer } = req.body ?? {};
  if (!adres && !postcode) return res.status(400).json({ error: 'Geef adres of postcode mee' });

  // Huispedia zoek-URL bouwen
  const zoekterm = postcode
    ? `${postcode}${huisnummer ? '-' + huisnummer : ''}`
    : adres.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const huispediaUrl = `https://www.huispedia.nl/zoeken?q=${encodeURIComponent(postcode ?? adres)}`;

  let html;
  try {
    html = await fetchHtml(huispediaUrl);
  } catch (e) {
    return res.status(500).json({ error: `Kon Huispedia niet bereiken: ${e.message}` });
  }

  const data = { transacties: [] };

  // Probeer transactiedata uit JSON-LD of Next data
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const str = JSON.stringify(JSON.parse(nextDataMatch[1]));

      // Transacties
      const transactieMatches = [...str.matchAll(/"transactiedatum"\s*:\s*"([^"]+)"[\s\S]{0,200}?"transactiebedrag"\s*:\s*(\d+)/g)];
      for (const m of transactieMatches) {
        data.transacties.push({ datum: m[1], bedrag: Number(m[2]) });
      }

      // Huidige eigenaar datum
      const eigenaarMatch = str.match(/"eigenaarSinds"\s*:\s*"([^"]+)"/);
      if (eigenaarMatch) data.eigenaarSinds = eigenaarMatch[1];

    } catch { /* doorgaan */ }
  }

  // HTML fallback voor transacties
  if (data.transacties.length === 0) {
    const transRegex = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4})[\s\S]{0,100}?€\s*([\d.]+)/g;
    let m;
    while ((m = transRegex.exec(html)) !== null) {
      const bedrag = Number(m[2].replace(/\./g, ''));
      if (bedrag > 50000 && bedrag < 5000000) {
        data.transacties.push({ datum: m[1], bedrag });
      }
      if (data.transacties.length >= 5) break;
    }
  }

  // Jaren in bezit berekenen
  if (data.transacties.length > 0) {
    const laatste = data.transacties[0];
    const jaar = laatste.datum.match(/\d{4}/)?.[0];
    if (jaar) {
      data.jarenInBezit = new Date().getFullYear() - Number(jaar);
      data.laasteVerkoopJaar = Number(jaar);
      data.laasteVerkoopPrijs = laatste.bedrag;
    }
  }

  return res.status(200).json(data);
}
