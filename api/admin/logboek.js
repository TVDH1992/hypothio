import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Niet ingelogd' });

  // Verifieer caller via anon client
  const supabaseAnon = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
  );
  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Niet ingelogd' });
  if (user.user_metadata?.role !== 'admin') return res.status(403).json({ error: 'Geen toegang' });

  // Service role voor admin queries — nooit naar frontend sturen
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY niet geconfigureerd in Vercel' });

  const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, serviceKey);

  const [
    { data: { users }, error: usersError },
    { data: profielen },
    { data: woningen },
    { data: berekeningen },
  ] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    supabaseAdmin.from('profielen').select('user_id, naam, max_hypotheek, aangemaakt_op, bijgewerkt_op'),
    supabaseAdmin.from('woningen').select('user_id'),
    supabaseAdmin.from('berekeningen').select('user_id'),
  ]);

  if (usersError) return res.status(500).json({ error: usersError.message });

  const profielMap = Object.fromEntries((profielen ?? []).map(p => [p.user_id, p]));
  const woningenCount = (woningen ?? []).reduce((acc, w) => {
    acc[w.user_id] = (acc[w.user_id] ?? 0) + 1;
    return acc;
  }, {});

  const berekeningenCount = (berekeningen ?? []).reduce((acc, b) => {
    acc[b.user_id] = (acc[b.user_id] ?? 0) + 1;
    return acc;
  }, {});

  const logboek = (users ?? []).map(u => ({
    id: u.id,
    email: u.email ?? '—',
    naam: u.user_metadata?.naam ?? u.email?.split('@')[0] ?? '—',
    rol: u.user_metadata?.role ?? 'gebruiker',
    aangemaakt_op: u.created_at,
    laatste_login: u.last_sign_in_at ?? null,
    max_hypotheek: profielMap[u.id]?.max_hypotheek ?? null,
    berekening_op: profielMap[u.id]?.bijgewerkt_op ?? null,
    aantal_woningen: woningenCount[u.id] ?? 0,
    aantal_scenarios: berekeningenCount[u.id] ?? 0,
  })).sort((a, b) => new Date(b.aangemaakt_op).getTime() - new Date(a.aangemaakt_op).getTime());

  return res.status(200).json({ logboek });
}
