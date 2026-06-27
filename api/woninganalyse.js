import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { adres, stad, type, wozWaarde, peildatum, oppervlakte, bouwjaar, kamers, energielabel, isNieuwbouw, prijstype, vraagprijs } = req.body ?? {};
  if (!adres || !stad) return res.status(400).json({ error: 'Ontbrekende gegevens' });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const woningInfo = [
    `Adres: ${adres}, ${stad}`,
    `Type: ${isNieuwbouw ? 'NIEUWBOUW — ' : ''}${type ?? 'woning'}`,
    wozWaarde ? `WOZ-waarde: €${wozWaarde.toLocaleString('nl-NL')}${peildatum ? ` (peildatum ${peildatum})` : ''}` : null,
    oppervlakte ? `Woonoppervlakte: ${oppervlakte} m²` : null,
    bouwjaar ? `Bouwjaar: ${bouwjaar}` : null,
    kamers ? `Kamers: ${kamers}` : null,
    energielabel ? `Energielabel: ${energielabel}` : null,
    vraagprijs ? `Vraagprijs: €${Number(vraagprijs).toLocaleString('nl-NL')} ${prijstype === 'von' ? '(v.o.n. — vrij op naam, geen overdrachtsbelasting)' : '(k.k. — koper betaalt kosten koper)'}` : null,
  ].filter(Boolean).join('\n');

  const nieuwbouwContext = isNieuwbouw ? `
Dit is een NIEUWBOUWWONING. Houd rekening met:
- Geen overdrachtsbelasting (2% van koopsom)
- Prijs is v.o.n. (vrij op naam) tenzij anders aangegeven
- Energielabel is doorgaans A of hoger
- Waardevermeerdering na oplevering vaak gunstig
- Let op: meer- en minderwerk, bouwrente, en opleveringskosten
- Startersregeling mogelijk van toepassing` : '';

  const prompt = `Je bent een Nederlandse woningmarktexpert die gewone mensen eerlijk en duidelijk helpt bij het kopen van een huis. Geef concrete, eerlijke inzichten — geen vage antwoorden.

${woningInfo}${nieuwbouwContext}

${!wozWaarde ? 'WOZ-waarde niet beschikbaar — gebruik je kennis van de lokale markt voor de schatting.' : ''}

BELANGRIJK:
- Geef ALTIJD een concrete marktwaarde schatting (positief getal). Gebruik locatie, type, m², bouwjaar en marktkennis.
- Wees eerlijk over risico\'s maar ook over kansen
- Denk vanuit de koper: wat moet hij/zij ECHT weten?

Geef je analyse in dit exacte JSON formaat (alleen JSON, geen extra tekst):
{
  "marktwaarde": <getal in euros — altijd een positief getal>,
  "biedadvies": "<concreet advies: 'Bod van €X tot €Y is reëel' of nieuwbouw-specifiek>",
  "vraagprijsOordeel": "<één van: 'Scherp geprijsd', 'Marktconform', 'Aan de hoge kant' — of voor nieuwbouw: 'Nieuwbouwprijs'>",
  "kostenKoper": <getal — geschatte kosten koper in euros (overdrachtsbelasting 2% + notaris ~€2500 + taxatie ~€800), bij VON alleen notaris + taxatie>,
  "aandachtspunten": [
    "<concreet punt 1 — bijv. 'Bouwjaar 1965: controleer dakisolatie en fundering'>",
    "<concreet punt 2>",
    "<concreet punt 3>"
  ],
  "pluspunten": [
    "<concreet pluspunt 1>",
    "<concreet pluspunt 2>"
  ],
  "samenvatting": "<2 zinnen echte, eerlijke conclusie voor de koper>"
}`;

  let message;
  try {
    message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (e) {
    return res.status(500).json({ error: `Claude API fout: ${e?.message ?? String(e)}` });
  }

  const tekst = message.content[0]?.text ?? '';
  const jsonMatch = tekst.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(422).json({ error: 'Kon analyse niet genereren' });

  try {
    const analyse = JSON.parse(jsonMatch[0]);
    if (analyse.marktwaarde) analyse.marktwaarde = Number(analyse.marktwaarde) || 0;
    if (analyse.kostenKoper) analyse.kostenKoper = Number(analyse.kostenKoper) || 0;
    res.status(200).json(analyse);
  } catch {
    res.status(422).json({ error: 'Ongeldige response' });
  }
}
