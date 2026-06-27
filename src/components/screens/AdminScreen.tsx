import { useState, useEffect } from 'react';
import { Settings, Users, TrendingUp, ShieldCheck, Save, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

function euro(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

interface Rentestand {
  id: number;
  periode: number;
  rente: number;
}

interface Stat {
  label: string;
  waarde: string;
  icon: typeof Users;
}

export function AdminScreen() {
  const [rentes, setRentes]         = useState<Rentestand[]>([]);
  const [bewerkt, setBewerkt]       = useState<Record<number, string>>({});
  const [opslaan, setOpslaan]       = useState(false);
  const [bericht, setBericht]       = useState('');
  const [gebruikers, setGebruikers] = useState<number | null>(null);
  const [actieveTab, setActieveTab] = useState<'dashboard' | 'rentes' | 'gebruikers'>('dashboard');

  useEffect(() => {
    laadRentes();
    laadGebruikers();
  }, []);

  async function laadRentes() {
    const { data } = await supabase.from('rentestand').select('*').order('periode');
    if (data) setRentes(data);
  }

  async function laadGebruikers() {
    // Telt het aantal sessies/users via een count query
    const { count } = await supabase.from('rentestand').select('*', { count: 'exact', head: true });
    // Gebruikersaantal via auth admin is server-side only — toon placeholder
    setGebruikers(null);
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

  const STATS: Stat[] = [
    { label: 'Gebruikers',     waarde: 'Zie Supabase dashboard', icon: Users     },
    { label: 'NHG grens 2026', waarde: euro(435_000),            icon: ShieldCheck },
    { label: 'AFM toetsrente', waarde: '5,00%',                  icon: TrendingUp  },
    { label: 'Starter grens',  waarde: euro(510_000),            icon: Settings    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0D1F3C]">Admin panel</h1>
          <p className="text-xs text-gray-400">Instellingen en beheer</p>
        </div>
        <a href="https://supabase.com/dashboard/project/ljsdvgwdktvepwbigklm" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-[#1ABC9C] hover:opacity-75 transition">
          <ExternalLink className="w-3.5 h-3.5" /> Supabase
        </a>
      </div>

      {/* Sub-tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {([
          ['dashboard',   'Dashboard'],
          ['rentes',      'Rentestand'],
          ['gebruikers',  'Gebruikers'],
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {STATS.map(({ label, waarde, icon: Icon }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
                <Icon className="w-5 h-5 text-[#1ABC9C] mb-2" />
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-bold text-[#0D1F3C] mt-0.5">{waarde}</p>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Rentestand bewerken */}
      {actieveTab === 'rentes' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Pas de indicatieve marktrentes aan. Sla op om de landing page bij te werken.</p>

          {rentes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-400">Nog geen rentestand tabel.</p>
              <p className="text-xs text-gray-400 mt-1">Voer eerst de SQL uit op het Dashboard tab.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {rentes.map(r => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-medium text-[#0D1F3C]">{r.periode} jaar vast</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="15"
                      className="w-24 text-right py-1.5 px-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1ABC9C]"
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

      {/* Gebruikers */}
      {actieveTab === 'gebruikers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center space-y-3">
            <Users className="w-8 h-8 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-500">Gebruikersbeheer is beschikbaar via het Supabase dashboard.</p>
            <p className="text-xs text-gray-400">Gebruikers toevoegen, verwijderen of rollen aanpassen doe je via Authentication → Users.</p>
            <a href="https://supabase.com/dashboard/project/ljsdvgwdktvepwbigklm/auth/users"
              target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="mt-2">
                <ExternalLink className="w-4 h-4" /> Beheer in Supabase
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
