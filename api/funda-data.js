import Anthropic from '@anthropic-ai/sdk';

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

// Claude leest de HTML en haalt alle woningdata eruit
async function parseMetClaude(html) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Stuur alleen relevante stukken HTML mee (max ~15k chars om tokens te besparen)
  const relevantHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')   // scripts eruit
    .replace(/<style[\s\S]*?<\/style>/gi, '')      // styles eruit
    .replace(/<!--[\s\S]*?-->/g, '')               // comments eruit
    .replace(/\s{2,}/g, ' ')                       // dubbele spaties samenvoegen
    .substring(0, 15000);

  const prompt = `Dit is HTML van een Funda woningpagina. Extraheer de volgende gegevens en geef ze terug als JSON (alleen JSON, geen uitleg):

${relevantHtml}

Geef exact dit JSON formaat terug:
{
  "prijs": <vraagprijs als getal zonder punten, bijv. 425000, of null als niet gevonden>,
  "prijstype": "<'kk' voor kosten koper of 'von' voor vrij op naam>",
  "bouwjaar": <bouwjaar als getal, bijv. 1998, of null>,
  "oppervlakte": <woonoppervlakte in m² als getal, of null>,
  "slaapkamers": <aantal slaapkamers als getal, of null>,
  "kamers": <totaal aantal kamers als getal, of null>,
  "energielabel": "<letter zoals A, B, C of A+ etc., of null>",
  "isNieuwbouw": <true of false>
}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const tekst = message.content[0]?.text ?? '';
  const jsonMatch = tekst.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const data = JSON.parse(jsonMatch[0]);
  // Zorg dat getallen echte getallen zijn
  if (data.prijs) data.prijs = Number(data.prijs) || null;
  if (data.bouwjaar) data.bouwjaar = Number(data.bouwjaar) || null;
  if (data.oppervlakte) data.oppervlakte = Number(data.oppervlakte) || null;
  if (data.slaapkamers) data.slaapkamers = Number(data.slaapkamers) || null;
  if (data.kamers) data.kamers = Number(data.kamers) || null;
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
        try { html = await haalHtml(echteUrl); } catch (e2) {
          return res.status(500).json({ error: e2.message });
        }
      } else {
        return res.status(404).json({ error: 'Woning niet gevonden op Funda' });
      }
    } else {
      return res.status(500).json({ error: e.message });
    }
  }

  const geblokkeerd = html.length < 8000 && /cf-browser-verification|challenge-platform|turnstile/i.test(html);
  if (geblokkeerd) {
    return res.status(422).json({ error: 'Toegang geblokkeerd', geblokkeerd: true });
  }

  try {
    const data = await parseMetClaude(html);
    if (!data) return res.status(422).json({ error: 'Kon data niet lezen uit pagina' });
    data._url = teGebruikenUrl;
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: `Claude parse fout: ${e.message}` });
  }
}
