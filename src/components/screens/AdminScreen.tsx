import { useState, useEffect } from 'react';
import { Settings, Users, TrendingUp, ShieldCheck, Save, RefreshCw, ExternalLink, Home, GitMerge, CheckCircle2, Clock } from 'lucide-react';
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
  aantal_scenarios: number;
}

export function AdminScreen() {
  const [rentes, setRentes]         = useState<Rentestand[]>([]);
  const [bewerkt, setBewerkt]       = useState<Record<number, string>>({});
  const [opslaan, setOpslaan]       = useState(false);
  const [bericht, setBericht]       = useState('');
  const [actieveTab, setActieveTab] = useState<'dashboard' | 'rentes' | 'gebruikers' | 'versies'>('dashboard');

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
          ['versies',    'Versies'],
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
                        <Home className="w-3 h-3" /> {u.aantal_woningen} {u.aantal_woningen === 1 ? 'woning' : 'woningen'}
                      </span>
                    )}
                    {u.aantal_scenarios > 0 && (
                      <span className="flex items-center gap-1">
                        <GitMerge className="w-3 h-3" /> {u.aantal_scenarios} {u.aantal_scenarios === 1 ? 'scenario' : "scenario's"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Versies changelog */}
      {actieveTab === 'versies' && <VersiesTab />}
    </div>
  );
}

interface Release {
  versie: string;
  datum: string;
  label?: string;
  items: { tekst: string; nieuw?: boolean }[];
}

const RELEASES: Release[] = [
  {
    versie: '1.0',
    datum: '29 jun 2026',
    label: 'Huidige versie',
    items: [
      { tekst: 'Wizard state + loonstrook resultaat gecacht in Supabase', nieuw: true },
      { tekst: 'Funda AI-analyse gecacht per woning — geen dubbele API-calls', nieuw: true },
      { tekst: 'Analyse terug te zien op opgeslagen woningkaartjes', nieuw: true },
      { tekst: 'Admin changelog / versie-overzicht', nieuw: true },
    ],
  },
  {
    versie: '0.9',
    datum: '28 jun 2026',
    items: [
      { tekst: 'AOW-leeftijdbeperking: looptijd gecapped op 67 − leeftijd' },
      { tekst: '"Wist je dat..." voordelen op resultatenpagina (energielabel, studieschuld, nieuwbouw, NHG)' },
      { tekst: 'Gebruikers logboek in admin panel via service role endpoint' },
      { tekst: 'Loonstrook: betere detectie 13e maand, EJU, vakantiegeld' },
    ],
  },
  {
    versie: '0.8',
    datum: '27 jun 2026',
    items: [
      { tekst: 'Supabase database: profielen + woningen tabellen met RLS' },
      { tekst: 'Volledige async migratie van localStorage naar Supabase' },
      { tekst: 'Admin panel: dashboard, rentestand beheer, gebruikers' },
      { tekst: 'ConsumentenZaken exacte merkkleuren (#99248F, #619C30, #3094C6)' },
      { tekst: 'Privacy tekst eerlijk over gegevensopslag in account' },
    ],
  },
  {
    versie: '0.7',
    datum: '26 jun 2026',
    items: [
      { tekst: 'WOZ analyser: adreszoeker + BAG/EP-online integratie' },
      { tekst: 'Funda URL parser + AI woninganalyse (Claude)' },
      { tekst: 'Huispedia verkoophistorie per woning' },
      { tekst: 'Biedadvies op basis van WOZ vs vraagprijs' },
      { tekst: 'Loonstrook AI-analyse via Claude (bruto, vakantiegeld, 13e maand)' },
    ],
  },
  {
    versie: '0.6',
    datum: '25 jun 2026',
    items: [
      { tekst: 'Supabase Auth: inloggen, registreren, e-mailbevestiging' },
      { tekst: 'Profielpagina met opgeslagen berekening en woningen' },
      { tekst: 'Dynamische rentes en LTI-normen vanuit Supabase database' },
      { tekst: 'Rentestand bewerken in admin panel' },
    ],
  },
  {
    versie: '0.5',
    datum: '24 jun 2026',
    items: [
      { tekst: 'NHG 2026 sneltoets (grens €470k, premie 0,6%)' },
      { tekst: 'Energielabel bonus (TRHK 2026, max €40k voor A++++)' },
      { tekst: 'Studieschuld: GHF berekening oud/nieuw stelsel' },
      { tekst: 'Bijkomende kosten: overdrachtsbelasting, notaris, taxatie, advies' },
      { tekst: 'Startersvrijstelling overdrachtsbelasting (< 35 jaar, < €525k)' },
    ],
  },
  {
    versie: '0.4',
    datum: '23 jun 2026',
    items: [
      { tekst: 'Scenario vergelijker: 10/15/20/30 jaar rentevast' },
      { tekst: 'Hypotheekvorm keuze: annuïtair, lineair, aflossingsvrij' },
      { tekst: 'Netto maandlast berekening met HRA en EWF' },
      { tekst: 'ZZP-inkomen: gemiddelde 3 jaar winst' },
    ],
  },
  {
    versie: '0.3',
    datum: '22 jun 2026',
    items: [
      { tekst: 'Consument vs Adviseur modus (verschillende taal + detailniveau)' },
      { tekst: 'Partner inkomen (stap 4 conditioneel)' },
      { tekst: 'ORT, jaarbonus, alimentatie als extra inkomen' },
    ],
  },
  {
    versie: '0.1',
    datum: '21 jun 2026',
    items: [
      { tekst: 'Wizard: 8 stappen van situatie tot resultaat' },
      { tekst: 'Nibud LTI-normen 2026 + AFM toetsrente' },
      { tekst: 'Maximale hypotheek op inkomen + LTV-grens' },
      { tekst: 'Annuïtaire maandlast berekening' },
    ],
  },
];

const ROADMAP = [
  'Vergelijken van meerdere berekeningen naast elkaar',
  'PDF rapport exporteren voor de adviseur',
  'Notificatie als woning van prijs verandert',
  'Nieuwbouw configurator (erfpacht, VvE, stelpost)',
  'Koppeling met hypotheekverstrekkers (oriëntatie)',
];

function VersiesTab() {
  return (
    <div className="space-y-6">
      {/* Roadmap */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-[#99248F]" />
          <p className="text-sm font-semibold text-[#0D1F3C]">Binnenkort</p>
        </div>
        <ul className="space-y-2">
          {ROADMAP.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Releases */}
      <div className="relative">
        <div className="absolute left-[11px] top-0 bottom-0 w-px bg-gray-100" />
        <div className="space-y-6">
          {RELEASES.map(release => (
            <div key={release.versie} className="relative flex gap-4">
              <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center z-10
                ${release.label ? 'bg-[#99248F] border-[#99248F]' : 'bg-white border-gray-200'}`}>
                {release.label
                  ? <GitMerge className="w-3 h-3 text-white" />
                  : <CheckCircle2 className="w-3 h-3 text-gray-300" />
                }
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                    ${release.label ? 'bg-[#99248F] text-white' : 'bg-gray-100 text-gray-600'}`}>
                    v{release.versie}
                  </span>
                  <span className="text-xs text-gray-400">{release.datum}</span>
                  {release.label && (
                    <span className="text-xs text-[#99248F] font-medium">{release.label}</span>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {release.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${item.nieuw ? 'text-[#619C30]' : 'text-gray-300'}`} />
                      {item.tekst}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
