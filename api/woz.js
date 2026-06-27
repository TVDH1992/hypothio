const PDOK_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/free';
const WOZ_URL  = 'https://api.wozwaardeloket.nl/woz-waarden';
const BAG_WFS  = 'https://service.pdok.nl/lv/bag/wfs/v2_0';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { adres, nummeraanduidingId } = req.body ?? {};

  if (nummeraanduidingId) {
    return await ophalen(nummeraanduidingId, null, res);
  }
  if (adres) {
    try {
      const pdokRes = await fetch(
        `${PDOK_URL}?q=${encodeURIComponent(adres)}&fq=type:adres&rows=1`,
        { headers: { Accept: 'application/json' } }
      );
      if (!pdokRes.ok) return res.status(422).json({ error: 'Adres niet gevonden' });
      const pdokData = await pdokRes.json();
      const doc = pdokData.response?.docs?.[0];
      if (!doc?.nummeraanduiding_id) return res.status(404).json({ error: 'Geen adres gevonden' });
      return await ophalen(doc.nummeraanduiding_id, doc, res);
    } catch (e) {
      return res.status(500).json({ error: `PDOK fout: ${e?.message}` });
    }
  }
  return res.status(400).json({ error: 'Geef adres of nummeraanduidingId mee' });
}

async function ophalen(nummeraanduidingId, pdokDoc, res) {
  // WOZ en BAG parallel ophalen
  const [wozResultaat, bagResultaat] = await Promise.allSettled([
    haalWoz(nummeraanduidingId),
    pdokDoc ? haalBag(pdokDoc) : Promise.resolve(null),
  ]);

  if (wozResultaat.status === 'rejected') {
    return res.status(404).json({ error: wozResultaat.reason?.message ?? 'WOZ niet beschikbaar' });
  }

  const woz = wozResultaat.value;
  const bag = bagResultaat.status === 'fulfilled' ? bagResultaat.value : null;

  return res.status(200).json({
    wozWaarde: woz.wozWaarde,
    peildatum: woz.peildatum,
    nummeraanduidingId,
    // BAG data — gratis via PDOK BBOX query
    bouwjaar: bag?.bouwjaar ?? null,
    oppervlakte: bag?.oppervlakte ?? null,
    pandstatus: bag?.pandstatus ?? null,
  });
}

async function haalWoz(nummeraanduidingId) {
  const res = await fetch(`${WOZ_URL}/${nummeraanduidingId}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`WOZ niet beschikbaar (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('Geen WOZ gegevens');
  const latest = data.sort((a, b) => b.peildatum.localeCompare(a.peildatum))[0];
  return { wozWaarde: latest.vastgesteldeWaarde, peildatum: latest.peildatum };
}

async function haalBag(pdokDoc) {
  // Parse RD coordinaten uit centroide_rd: "POINT(x y)"
  const rdMatch = pdokDoc.centroide_rd?.match(/POINT\(([\d.]+)\s+([\d.]+)\)/);
  if (!rdMatch) return null;

  const x = parseFloat(rdMatch[1]);
  const y = parseFloat(rdMatch[2]);
  const marge = 15; // meter buffer rondom punt

  const bbox = `${x - marge},${y - marge},${x + marge},${y + marge},urn:ogc:def:crs:EPSG::28992`;
  const url = `${BAG_WFS}?${new URLSearchParams({
    service: 'WFS', version: '2.0.0', request: 'GetFeature',
    typeName: 'bag:verblijfsobject', outputFormat: 'application/json',
    bbox,
  })}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;

  const data = await res.json();
  const features = data.features ?? [];

  // Zoek exacte match op adresseerbaarobject_id (= identificatie in BAG)
  const exactMatch = features.find(f => f.properties?.identificatie === pdokDoc.adresseerbaarobject_id);
  const feature = exactMatch ?? features[0];

  return feature?.properties ?? null;
}
