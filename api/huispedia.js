const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
  'Referer': 'https://www.huispedia.nl/',
};

function slugify(s) {
  return s.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function haalHtml(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function parseNextData(html) {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

function vindTransacties(obj, gevonden = []) {
  if (gevonden.length >= 10) return gevonden;
  if (!obj || typeof obj !== 'object') return gevonden;
  if (Array.isArray(obj)) {
    for (const item of obj) vindTransacties(item, gevonden);
    return gevonden;
  }

  // Herken een transactie-object aan datum + bedrag combinatie
  const heeftDatum = obj.transactiedatum || obj.datum || obj.verkoopDatum || obj.saleDate || obj.date;
  const heeftBedrag = obj.transactiebedrag || obj.bedrag || obj.koopsom || obj.price || obj.koopprijs || obj.verkoopprijs;
  if (heeftDatum && heeftBedrag) {
    const bedrag = Number(String(heeftBedrag).replace(/[^0-9]/g, ''));
    if (bedrag > 20000 && bedrag < 10_000_000) {
      gevonden.push({ datum: String(heeftDatum), bedrag });
    }
  }

  for (const v of Object.values(obj)) vindTransacties(v, gevonden);
  return gevonden;
}

function vindEigenaarSinds(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (Array.isArray(obj)) {
    for (const item of obj) { const r = vindEigenaarSinds(item); if (r) return r; }
    return null;
  }
  const v = obj.eigenaarSinds || obj.ownerSince || obj.inBezitSinds;
  if (v) return String(v);
  for (const val of Object.values(obj)) { const r = vindEigenaarSinds(val); if (r) return r; }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { adres, stad } = req.body ?? {};
  if (!adres || !stad) return res.status(400).json({ error: 'Geef adres en stad mee' });

  // Bouw directe property URL
  const stadSlug = slugify(stad);
  const adresSlug = slugify(adres);
  const directUrl = `https://www.huispedia.nl/${stadSlug}/${adresSlug}/`;

  let html;
  try {
    html = await haalHtml(directUrl);
  } catch {
    // Probeer zoekpagina als direct URL mislukt
    try {
      const zoekUrl = `https://www.huispedia.nl/zoeken?q=${encodeURIComponent(`${adres} ${stad}`)}`;
      html = await haalHtml(zoekUrl);

      // Zoek de eerste property URL in de zoekresultaten
      const urlMatch = html.match(/href="(\/[a-z-]+\/[a-z0-9-]+\/)"(?=[^"]*class="[^"]*(?:result|listing|property|woning))/i)
        ?? html.match(/href="(\/${stadSlug}\/[a-z0-9-]+\/)"/i);
      if (urlMatch) {
        html = await haalHtml(`https://www.huispedia.nl${urlMatch[1]}`);
      }
    } catch (e) {
      return res.status(500).json({ error: `Huispedia niet bereikbaar: ${e.message}` });
    }
  }

  const data = {};
  const nextData = parseNextData(html);

  if (nextData) {
    const transacties = vindTransacties(nextData);
    if (transacties.length > 0) {
      // Sorteren op datum aflopend
      transacties.sort((a, b) => b.datum.localeCompare(a.datum));
      data.transacties = transacties.slice(0, 5);
    }
    const eigenaarSinds = vindEigenaarSinds(nextData);
    if (eigenaarSinds) data.eigenaarSinds = eigenaarSinds;
  }

  // HTML regex fallback als __NEXT_DATA__ geen transacties bevat
  if (!data.transacties?.length) {
    const transacties = [];
    // Patroon: datum (bijv. "15-03-2019" of "2019") gevolgd door prijs
    const re = /(?:(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})|(\d{4}))[\s\S]{0,200}?€\s*([\d.]+(?:\.\d{3})*)/g;
    let m;
    while ((m = re.exec(html)) !== null && transacties.length < 5) {
      const datum = m[1] ?? m[2];
      const bedrag = Number(m[3].replace(/\./g, ''));
      if (bedrag > 20000 && bedrag < 10_000_000) {
        transacties.push({ datum, bedrag });
      }
    }
    if (transacties.length) data.transacties = transacties;
  }

  // Bereken jaren in bezit op basis van laatste bekende transactie
  if (data.transacties?.length) {
    const laatste = data.transacties[0];
    const jaarMatch = laatste.datum.match(/\d{4}/);
    if (jaarMatch) {
      const jaar = Number(jaarMatch[0]);
      data.laasteVerkoopJaar = jaar;
      data.laasteVerkoopPrijs = laatste.bedrag;
      data.jarenInBezit = new Date().getFullYear() - jaar;
    }
  }

  return res.status(200).json(data);
}
