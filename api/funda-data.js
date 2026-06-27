export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { url } = req.body ?? {};
  if (!url || !url.includes('funda.nl')) return res.status(400).json({ error: 'Ongeldige URL' });

  let html;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
    });
    if (!response.ok) return res.status(422).json({ error: `Pagina niet beschikbaar (${response.status})` });
    html = await response.text();
  } catch (e) {
    return res.status(500).json({ error: 'Kon pagina niet ophalen' });
  }

  const data = {};

  // --- JSON-LD structured data (meest betrouwbaar) ---
  const jsonLdBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of jsonLdBlocks) {
    try {
      const json = JSON.parse(block.replace(/<script[^>]*>|<\/script>/gi, ''));
      // Prijs
      const prijs = json.offers?.price ?? json.price;
      if (prijs && Number(prijs) > 10000 && !data.prijs) data.prijs = Number(prijs);
      // Oppervlakte
      const m2 = json.floorSize?.value ?? json.floorArea?.value;
      if (m2 && !data.oppervlakte) data.oppervlakte = Number(m2);
      // Kamers
      if (json.numberOfRooms && !data.kamers) data.kamers = Number(json.numberOfRooms);
      // Bouwjaar
      if (json.yearBuilt && !data.bouwjaar) data.bouwjaar = Number(json.yearBuilt);
    } catch { /* doorgaan */ }
  }

  // --- Next.js __NEXT_DATA__ (Funda gebruikt Next.js) ---
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      // Zoek diep naar listing data
      const str = JSON.stringify(nextData);

      // Prijs
      if (!data.prijs) {
        const prijsMatch = str.match(/"koopprijs"\s*:\s*(\d+)/) ?? str.match(/"price"\s*:\s*(\d+)/);
        if (prijsMatch && Number(prijsMatch[1]) > 10000) data.prijs = Number(prijsMatch[1]);
      }
      // Bouwjaar
      if (!data.bouwjaar) {
        const bouwjaarMatch = str.match(/"bouwjaar"\s*:\s*(\d{4})/) ?? str.match(/"yearBuilt"\s*:\s*(\d{4})/);
        if (bouwjaarMatch) data.bouwjaar = Number(bouwjaarMatch[1]);
      }
      // Oppervlakte
      if (!data.oppervlakte) {
        const m2Match = str.match(/"woonoppervlakte"\s*:\s*(\d+)/) ?? str.match(/"livingArea"\s*:\s*(\d+)/);
        if (m2Match) data.oppervlakte = Number(m2Match[1]);
      }
      // Kamers
      if (!data.kamers) {
        const kamersMatch = str.match(/"aantalKamers"\s*:\s*(\d+)/) ?? str.match(/"numberOfRooms"\s*:\s*(\d+)/);
        if (kamersMatch) data.kamers = Number(kamersMatch[1]);
      }
      // Energielabel
      if (!data.energielabel) {
        const labelMatch = str.match(/"energieklasse"\s*:\s*"([A-G][+]{0,2})"/) ?? str.match(/"energyLabel"\s*:\s*"([A-G][+]{0,2})"/i);
        if (labelMatch) data.energielabel = labelMatch[1].toUpperCase();
      }
    } catch { /* doorgaan */ }
  }

  // --- HTML fallback patronen ---
  if (!data.prijs) {
    const prijsPatterns = [
      /€\s*([\d.]+)\s*(?:k\.k\.|v\.o\.n\.)/gi,
      /"koopprijs"\s*:\s*(\d+)/,
      /"price"\s*:\s*"?(\d+)"?/,
    ];
    for (const pattern of prijsPatterns) {
      const match = pattern.exec(html);
      if (match) {
        const p = Number(match[1].replace(/\./g, ''));
        if (p > 50000 && p < 5000000) { data.prijs = p; break; }
      }
    }
  }

  if (!data.bouwjaar) {
    const m = html.match(/[Bb]ouwjaar[^>]*>\s*(\d{4})|(\d{4})\s*<\/span>\s*<\/dt>/) ??
              html.match(/"bouwjaar"[^>]*>(\d{4})/);
    if (m) data.bouwjaar = Number(m[1] ?? m[2]);
  }

  if (!data.oppervlakte) {
    const m = html.match(/(\d+)\s*m²/) ?? html.match(/woonoppervlak[^>]*>\s*(\d+)/i);
    if (m) data.oppervlakte = Number(m[1]);
  }

  if (!data.energielabel) {
    const m = html.match(/energieklasse[^>]*>\s*([A-G][+]{0,2})/i) ??
              html.match(/energie(?:label|klasse)["\s:]+([A-G][+]{0,2})/i);
    if (m) data.energielabel = m[1].toUpperCase();
  }

  // Nieuwbouw detectie
  data.isNieuwbouw = url.includes('/nieuwbouw/') ||
    /nieuwbouw|v\.o\.n\.|vrij\s+op\s+naam|bouwgrond/i.test(html);

  // Prijstype (k.k. of v.o.n.)
  data.prijstype = /v\.o\.n\./i.test(html) ? 'von' : 'kk';

  // Aangeboden sinds
  const aangeboden = html.match(/aangeboden\s+(?:per|op|sinds)[^>]*>\s*([^<]{5,30})/i) ??
                     html.match(/(?:listed|available)\s+(?:since|from)[^>]*>\s*([^<]{5,30})/i);
  if (aangeboden) data.aangeboden = aangeboden[1].trim();

  return res.status(200).json(data);
}
