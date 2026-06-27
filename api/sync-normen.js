import { createClient } from '@supabase/supabase-js';

// AFM publiceert de wettelijke minimale toetsrente op hun website
async function haalAfmToetsrente() {
  const res = await fetch(
    'https://www.afm.nl/nl-nl/professionals/sectoren/hypotheekadviseurs/hypotheekverstrekking/toetsrente',
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; hypothio-normen/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    }
  );
  if (!res.ok) throw new Error(`AFM HTTP ${res.status}`);
  const html = await res.text();

  // AFM toont bijv. "2,50%" of "5,00%" op de pagina
  const patronen = [
    /toetsrente[^<]{0,200}?(\d{1,2}[,.]\d{1,2})\s*%/i,
    /(\d{1,2}[,.]\d{1,2})\s*%[^<]{0,100}?toetsrente/i,
    /minimale\s+toetsrente[^<]{0,100}?(\d{1,2}[,.]\d{1,2})/i,
  ];

  for (const p of patronen) {
    const m = html.match(p);
    if (m) {
      const rente = parseFloat(m[1].replace(',', '.')) / 100;
      if (rente > 0.01 && rente < 0.20) return rente;
    }
  }
  return null;
}

export default async function handler(req, res) {
  const secret = req.headers['x-sync-secret'];
  if (secret !== process.env.SYNC_SECRET) {
    return res.status(401).json({ error: 'Niet geautoriseerd' });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase env vars ontbreken', supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const resultaat = { afm: null, fout: null };

  try {
    const afmRente = await haalAfmToetsrente();
    if (afmRente) {
      resultaat.afm = afmRente;
      // Bijwerken in rentestand tabel voor periodes < 10 jaar
      await supabase
        .from('rentestand')
        .update({ rente: afmRente, geldig_vanaf: new Date().toISOString().slice(0, 10) })
        .lt('periode', 10)
        .eq('actief', true);
    } else {
      resultaat.fout = 'Kon AFM toetsrente niet parsen';
    }
  } catch (e) {
    resultaat.fout = e.message;
  }

  return res.status(200).json(resultaat);
}
