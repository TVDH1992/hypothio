import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { adres, stad, type, wozWaarde, peildatum } = req.body ?? {};
  if (!adres || !stad) return res.status(400).json({ error: 'Ontbrekende gegevens' });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Je bent een Nederlandse woningmarktexpert. Analyseer deze woning voor een koper:

Adres: ${adres}, ${stad}
Type: ${type ?? 'woning'}
WOZ-waarde: €${wozWaarde ? wozWaarde.toLocaleString('nl-NL') : 'onbekend'}${peildatum ? ` (peildatum ${peildatum})` : ''}

Geef een praktische analyse in dit exacte JSON formaat (geen extra tekst):
{
  "marktwaarde": <getal in euros, schatting op basis van WOZ × marktcorrectie>,
  "biedadvies": "<concreet advies, bijv. 'Bod van €X tot €Y is reëel'>",
  "vraagprijsOordeel": "<'Scherp geprijsd', 'Marktconform' of 'Aan de hoge kant'>",
  "aandachtspunten": [
    "<specifiek punt 1>",
    "<specifiek punt 2>",
    "<specifiek punt 3>"
  ],
  "pluspunten": [
    "<plus punt 1>",
    "<plus punt 2>"
  ],
  "samenvatting": "<2 zinnen praktisch advies voor de koper>"
}`;

  let message;
  try {
    message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (e) {
    const msg = e?.message ?? String(e);
    return res.status(500).json({ error: `Claude API fout: ${msg}` });
  }

  const tekst = message.content[0]?.text ?? '';
  const jsonMatch = tekst.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(422).json({ error: 'Kon analyse niet genereren' });

  try {
    const analyse = JSON.parse(jsonMatch[0]);
    res.status(200).json(analyse);
  } catch {
    res.status(422).json({ error: 'Ongeldige response' });
  }
}
