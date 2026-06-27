import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { base64, mediaType } = req.body ?? {};
  if (!base64 || !mediaType) return res.status(400).json({ error: 'Geen bestand meegestuurd' });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const isAfbeelding = mediaType.startsWith('image/');
  const bestandsBlok = isAfbeelding
    ? { type: 'image',    source: { type: 'base64', media_type: mediaType, data: base64 } }
    : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } };

  const prompt = `Dit is een Nederlandse loonstrook. Extraheer de inkomensgegevens zo nauwkeurig mogelijk.

Geef ALLEEN dit JSON terug, geen andere tekst:
{
  "brutoMaandSalaris": <getal — bruto maandsalaris excl. vakantiegeld>,
  "frequentie": "<'maand' of 'vierWeken'>",
  "heeftVakantiegeld": <true of false>,
  "heeftDertiendeMaand": <true of false>,
  "ortPerMaand": <getal — ORT/onregelmatigheidstoeslag per maand, 0 als niet aanwezig>,
  "vasterJaarbonus": <getal — vaste jaarbonus, 0 als niet aanwezig>,
  "werkgever": "<naam werkgever als zichtbaar, anders null>",
  "periode": "<loonperiode als zichtbaar, bijv. 'mei 2026', anders null>"
}

Regels:
- brutoMaandSalaris is het maandbedrag VOOR belasting, ZONDER vakantiegeld
- Als de loonstrook per 4 weken is, stel frequentie in op 'vierWeken'
- ORT alleen invullen als er een structurele toeslag is, niet incidenteel overwerk
- Als iets niet zichtbaar is, gebruik 0 of false`;

  let message;
  try {
    message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: [bestandsBlok, { type: 'text', text: prompt }] }],
    });
  } catch (e) {
    return res.status(500).json({ error: `Claude fout: ${e?.message}` });
  }

  const tekst = message.content[0]?.text ?? '';
  const jsonMatch = tekst.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(422).json({ error: 'Kon loonstrook niet lezen' });

  try {
    const data = JSON.parse(jsonMatch[0]);
    data.brutoMaandSalaris = Number(data.brutoMaandSalaris) || 0;
    data.ortPerMaand       = Number(data.ortPerMaand) || 0;
    data.vasterJaarbonus   = Number(data.vasterJaarbonus) || 0;
    return res.status(200).json(data);
  } catch {
    return res.status(422).json({ error: 'Ongeldige response van Claude' });
  }
}
