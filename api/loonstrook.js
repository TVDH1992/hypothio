import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64, mediaType } = req.body ?? {};
  if (!base64 || !mediaType) {
    return res.status(400).json({ error: 'Missing base64 or mediaType' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const isPdf = mediaType === 'application/pdf';

  const contentBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } }
    : { type: 'image',    source: { type: 'base64', media_type: mediaType, data: base64 } };

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 50,
    messages: [
      {
        role: 'user',
        content: [
          contentBlock,
          {
            type: 'text',
            text: 'Kijk naar dit loonstrook. Geef ALLEEN het bruto maandsalaris terug als geheel getal (zonder euroteken, punt of komma). Alleen het getal. Voorbeeld: 3500',
          },
        ],
      },
    ],
  });

  const tekst = message.content[0]?.text?.trim() ?? '';
  const bedrag = parseInt(tekst.replace(/[^\d]/g, ''), 10);

  if (isNaN(bedrag) || bedrag <= 0) {
    return res.status(422).json({ error: 'Kon bedrag niet lezen uit document' });
  }

  res.status(200).json({ brutoMaandSalaris: bedrag });
}
