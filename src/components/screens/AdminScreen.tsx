import { useState, useEffect } from 'react';
import { Settings, Users, TrendingUp, ShieldCheck, Save, RefreshCw, ExternalLink, Home } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { NHG_GRENS_2026, STARTER_GRENS_2026 } from '../../lib/normen';

function euro(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function datumKort(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' });
}

interface Rentestand { id: number; periode: number; rente: number; }

interface GebruikerRij {
  id: string;
  email: string;
  naam: string;
  rol: string;
  aangemaakt_op: string;
  laatste_login: string | null;
  max_hypotheek: number | null;
  berekening_op: string | null;
  aantal_woningen: number;
}

export function AdminScreen() {
  const [rentes, setRentes]         = useState<Rentestand[]>([]);
  const [bewerkt, setBewerkt]       = useState<Record<number, string>>({});
  const [opslaan, setOpslaan]       = useState(false);
  const [bericht, setBericht]       = useState('');
  const [actieveTab, setActieveTab] = useState<'dashboard' | 'rentes' | 'gebruikers'>('dashboard');

  // Gebruikers logboek
  const [logboek, setLogboek]       = useState<GebruikerRij[]>([]);
  const [logLaden, setLogLaden]     = useState(false);
  const [logFout, setLogFout]       = useState('');

  useEffect(() => { laadRentes(); }, []);

  useEffect(() => {
    if (actieveTab === 'gebruikers' && logboek.length === 0) laadLogboek();
  }, [actieveTab]);

  async function laadRentes() {
    const { data } = await supabase.from('rentestand').select('*').order('periode');
    if (data) setRentes(data);
  }

  async function laadLogboek() {
    setLogLaden(true);
    setLogFout('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLogFout('Niet ingelogd'); return; }

      const res = await fetch('/api/admin/logboek', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) { setLogFout(json.error ?? 'Fout bij ophalen'); return; }
      setLogboek(json.logboek);
    } catch {
      setLogFout('Verbindingsfout');
    } finally {
      setLogLaden(false);
    }
  }

  async function slaRentesOp() {
    setOpslaan(true);
    setBericht('');
    for (const [id, rente] of Object.entries(bewerkt)) {
      const waarde = parseFloat(rente) / 100;
      await supabase.from('rentestand').update({ rente: waarde, bijgewerkt: new Date().toISOString() }).eq('id', Number(id));
    }
    setBericht('Rentestand bijgewerkt!');
    setBewerkt({});
    await laadRentes();
    setOpslaan(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0D1F3C]">Admin panel</h1>
          <p className="text-xs text-gray-400">Instellingen en beheer</p>
        </div>
        <a href="https://supabase.com/dashboard/project/ljsdvgwdktvepwbigklm" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-[#99248F] hover:opacity-75 transition">
          <ExternalLink className="w-3.5 h-3.5" /> Supabase
        </a>
      </div>

      {/* Sub-tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {([
          ['dashboard',  'Dashboard'],
          ['rentes',     'Rentestand'],
          ['gebruikers', 'Gebruikers'],
        ] as const).map(([tab, label]) => (
          <button key={tab} type="button" onClick={() => setActieveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition cursor-pointer
              ${actieveTab === tab ? 'bg-white text-[#0D1F3C] shadow-sm' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {actieveTab === 'dashboard' && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'NHG grens 2026',  waarde: euro(NHG_GRENS_2026),    Icon: ShieldCheck },
            { label: 'AFM toetsrente',  waarde: '5,00%',                  Icon: TrendingUp  },
            { label: 'Starter grens',   waarde: euro(STARTER_GRENS_2026), Icon: Settings    },
            { label: 'Starter leeftijd',waarde: '< 35 jaar',              Icon: Users       },
          ].map(({ label, waarde, Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
              <Icon className="w-5 h-5 text-[#99248F] mb-2" />
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-bold text-[#0D1F3C] mt-0.5">{waarde}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rentestand bewerken */}
      {actieveTab === 'rentes' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Pas de indicatieve marktrentes aan. Sla op om de app bij te werken.</p>
          {rentes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-400">Nog geen rentestand tabel — voer eerst de SQL uit.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {rentes.map(r => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-medium text-[#0D1F3C]">{r.periode} jaar vast</span>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.01" min="0" max="15"
                      className="w-24 text-right py-1.5 px-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#99248F]"
                      value={bewerkt[r.id] ?? (r.rente * 100).toFixed(2)}
                      onChange={e => setBewerkt(prev => ({ ...prev, [r.id]: e.target.value }))}
                    />
                    <span className="text-sm text-gray-400">%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {Object.keys(bewerkt).length > 0 && (
            <Button onClick={slaRentesOp} disabled={opslaan} className="w-full">
              {opslaan ? <><RefreshCw className="w-4 h-4 animate-spin" /> Opslaan...</> : <><Save className="w-4 h-4" /> Rentes opslaan</>}
            </Button>
          )}
          {bericht && <p className="text-sm text-emerald-600 text-center">{bericht}</p>}
        </div>
      )}

      {/* Gebruikers logboek */}
      {actieveTab === 'gebruikers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{logboek.length > 0 ? `${logboek.length} gebruikers` : 'Gebruikersactiviteit'}</p>
            <button type="button" onClick={laadLogboek} disabled={logLaden}
              className="flex items-center gap-1.5 text-xs text-[#99248F] hover:opacity-75 transition cursor-pointer disabled:opacity-40">
              <RefreshCw className={`w-3.5 h-3.5 ${logLaden ? 'animate-spin' : ''}`} />
              Verversen
            </button>
          </div>

          {logLaden && (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-[#99248F] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {logFout && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {logFout}
              {logFout.includes('SUPABASE_SERVICE_ROLE_KEY') && (
                <p className="text-xs mt-1 opacity-75">Voeg SUPABASE_SERVICE_ROLE_KEY toe als environment variable in Vercel.</p>
              )}
            </div>
          )}

          {!logLaden && !logFout && logboek.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nog geen gebruikers gevonden.</p>
            </div>
          )}

          {logboek.length > 0 && (
            <div className="space-y-2">
              {logboek.map(u => (
                <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#0D1F3C] truncate">{u.naam}</p>
                        {u.rol === 'admin' && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">admin</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {u.max_hypotheek ? (
                        <p className="text-sm font-bold text-[#99248F]">{euro(u.max_hypotheek)}</p>
                      ) : (
                        <p className="text-xs text-gray-300">geen berekening</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 text-[11px] text-gray-400">
                    <span>Aangemeld {datumKort(u.aangemaakt_op)}</span>
                    {u.laatste_login && <span>Laatst actief {datumKort(u.laatste_login)}</span>}
                    {u.berekening_op && <span>Berekening {datumKort(u.berekening_op)}</span>}
                    {u.aantal_woningen > 0 && (
                      <span className="flex items-center gap-1">
                        <Home className="w-3 h-3" /> {u.aantal_woningen}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
