import { createClient } from '@supabase/supabase-js';

// Handmatig rentes updaten in Supabase via dit endpoint.
// Aanroepen met: POST /api/sync-normen
// Header: x-sync-secret: <SYNC_SECRET>
// Body: { "rentes": { "10": 0.0385, "15": 0.0395, "20": 0.0405, "30": 0.042 }, "afmRente": 0.05 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const secret = req.headers['x-sync-secret'];
  if (secret !== process.env.SYNC_SECRET) {
    return res.status(401).json({ error: 'Niet geautoriseerd' });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase env vars ontbreken' });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { rentes, afmRente } = req.body ?? {};
  const bijgewerkt = [];
  const fouten = [];

  // Marktrenties updaten (10, 15, 20, 30 jaar)
  if (rentes && typeof rentes === 'object') {
    for (const [periode, rente] of Object.entries(rentes)) {
      const p = Number(periode);
      const r = Number(rente);
      if (!p || !r || r < 0.005 || r > 0.20) continue;
      const { error } = await supabase
        .from('rentestand')
        .update({ rente: r, geldig_vanaf: new Date().toISOString().slice(0, 10) })
        .eq('periode', p)
        .eq('actief', true);
      if (error) fouten.push(`periode ${p}: ${error.message}`);
      else bijgewerkt.push(`${p}jr → ${(r * 100).toFixed(2)}%`);
    }
  }

  // AFM minimale toetsrente updaten (periodes < 10 jaar)
  if (afmRente && Number(afmRente) > 0.01) {
    const r = Number(afmRente);
    const { error } = await supabase
      .from('rentestand')
      .update({ rente: r, geldig_vanaf: new Date().toISOString().slice(0, 10) })
      .lt('periode', 10)
      .eq('actief', true);
    if (error) fouten.push(`AFM rente: ${error.message}`);
    else bijgewerkt.push(`AFM (<10jr) → ${(r * 100).toFixed(2)}%`);
  }

  return res.status(200).json({
    bijgewerkt,
    fouten: fouten.length ? fouten : undefined,
    tip: bijgewerkt.length === 0
      ? 'Geef rentes mee in body: { "rentes": { "10": 0.0385, "15": 0.0395 }, "afmRente": 0.05 }'
      : undefined,
  });
}
