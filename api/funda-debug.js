const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'nl-NL,nl;q=0.9',
  'Referer': 'https://www.funda.nl/',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Upgrade-Insecure-Requests': '1',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { url } = req.body ?? {};

  const html = await fetch(url, { headers: HEADERS }).then(r => r.text()).catch(e => `ERROR: ${e.message}`);

  // __NEXT_DATA__ eerste 8000 tekens (bevat alle property data)
  const nextMatch = html.match ? html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/) : null;
  const nextDataSnippet = nextMatch ? nextMatch[1].substring(0, 8000) : null;

  // Alle JSON-LD scripts
  const ldScripts = html.match ? [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)] : [];
  const ldData = ldScripts.map(m => { try { return JSON.parse(m[1]); } catch { return m[1].substring(0, 500); } });

  return res.status(200).json({
    htmlLength: html.length,
    hasNextData: !!nextMatch,
    ldScriptCount: ldScripts.length,
    ldData,
    nextDataSnippet,
  });
}
