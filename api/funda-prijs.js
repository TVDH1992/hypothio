export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { url } = req.body ?? {};
  if (!url || !url.includes('funda.nl')) return res.status(400).json({ error: 'Ongeldige URL' });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!response.ok) return res.status(422).json({ error: 'Pagina niet beschikbaar' });

    const html = await response.text();

    // Probeer prijs uit JSON-LD te halen
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatch) {
      for (const block of jsonLdMatch) {
        try {
          const json = JSON.parse(block.replace(/<script[^>]*>|<\/script>/gi, ''));
          const prijs = json.offers?.price ?? json.price;
          if (prijs && Number(prijs) > 10000) {
            return res.json({ prijs: Number(prijs), bron: 'json-ld' });
          }
        } catch { /* doorgaan */ }
      }
    }

    // Probeer uit meta description of title
    const prijsPatterns = [
      /€\s*([\d.]+)/g,
      /"price":\s*"?([\d]+)"?/g,
      /askingPrice["\s:]+(\d+)/gi,
      /koopprijs["\s:]+(\d+)/gi,
    ];

    for (const pattern of prijsPatterns) {
      const match = pattern.exec(html);
      if (match) {
        const prijs = Number(match[1].replace('.', ''));
        if (prijs > 50000 && prijs < 5000000) {
          return res.json({ prijs, bron: 'html' });
        }
      }
    }

    return res.status(404).json({ error: 'Prijs niet gevonden in pagina' });
  } catch (e) {
    return res.status(500).json({ error: 'Kon pagina niet ophalen' });
  }
}
