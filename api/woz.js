const PDOK_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/free';
const WOZ_URL  = 'https://api.wozwaardeloket.nl/woz-waarden';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { adres, nummeraanduidingId } = req.body ?? {};

  // Direct opzoeken via nummeraanduidingId
  if (nummeraanduidingId) {
    return await haalWoz(nummeraanduidingId, res);
  }

  // Of eerst adres zoeken via PDOK, dan WOZ ophalen
  if (adres) {
    try {
      const pdokRes = await fetch(
        `${PDOK_URL}?q=${encodeURIComponent(adres)}&fq=type:adres&rows=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!pdokRes.ok) return res.status(422).json({ error: 'Adres niet gevonden' });
      const pdokData = await pdokRes.json();
      const doc = pdokData.response?.docs?.[0];
      if (!doc?.nummeraanduiding_id) return res.status(404).json({ error: 'Geen adres gevonden' });
      return await haalWoz(doc.nummeraanduiding_id, res);
    } catch (e) {
      return res.status(500).json({ error: `PDOK fout: ${e?.message}` });
    }
  }

  return res.status(400).json({ error: 'Geef adres of nummeraanduidingId mee' });
}

async function haalWoz(nummeraanduidingId, res) {
  try {
    const wozRes = await fetch(`${WOZ_URL}/${nummeraanduidingId}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!wozRes.ok) return res.status(404).json({ error: `WOZ niet beschikbaar (${wozRes.status})` });
    const data = await wozRes.json();
    if (!Array.isArray(data) || data.length === 0) return res.status(404).json({ error: 'Geen WOZ gegevens' });
    const latest = data.sort((a, b) => b.peildatum.localeCompare(a.peildatum))[0];
    return res.status(200).json({
      wozWaarde: latest.vastgesteldeWaarde,
      peildatum: latest.peildatum,
      nummeraanduidingId,
    });
  } catch (e) {
    return res.status(500).json({ error: `WOZ fout: ${e?.message}` });
  }
}
