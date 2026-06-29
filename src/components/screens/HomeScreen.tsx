import { useEffect, useState } from 'react';
import { ShieldCheck, TrendingUp, ChevronRight, Plus, FileText, RotateCcw, CheckCircle, XCircle, BookmarkPlus, Gavel } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { laadWoningen, laadBerekeningen } from '../../lib/profiel';
import { drukRapportAf } from '../../lib/rapport';
import { NHG_GRENS_2026 } from '../../lib/normen';
import type { GeslaagdeWoning, Berekening } from '../../types/profiel';

function euro(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function greeting(naam: string) {
  const uur = new Date().getHours();
  const dag = uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond';
  return `${dag}, ${naam.split(' ')[0]}`;
}

const RENTE_PERIODES = [10, 20, 30] as const;

export function HomeScreen() {
  const { resultaat, sessie, setStap, actueleRentes, herstelScenario } = useWizard();
  const { setTab } = useApp();
  const [woningen, setWoningen]       = useState<GeslaagdeWoning[]>([]);
  const [berekeningen, setBerekeningen] = useState<Berekening[]>([]);
  const [laden, setLaden]             = useState(true);

  useEffect(() => {
    Promise.all([laadWoningen(), laadBerekeningen()]).then(([w, b]) => {
      setWoningen(w);
      setBerekeningen(b);
      setLaden(false);
    });
  }, []);

  const heeftData = !!resultaat;

  return (
    <div className="space-y-5">

      {/* Greeting */}
      <div className="pt-1">
        <h1 className="text-2xl font-bold text-[#0D1F3C]">{greeting(sessie.naam)}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {heeftData ? 'Hier is je hypotheek dashboard' : 'Wat kun jij lenen?'}
        </p>
      </div>

      {/* Hero — budget */}
      {heeftData ? (
        <div className="bg-[#0D1F3C] rounded-2xl p-5 text-white">
          <p className="text-xs text-white/40 mb-1">Maximale hypotheek</p>
          <p className="text-4xl font-bold tracking-tight">{euro(resultaat.effectieveMaxHypotheek)}</p>
          <div className="flex gap-5 mt-3 pt-3 border-t border-white/10">
            <div>
              <p className="text-[10px] text-white/40">Bruto/mnd</p>
              <p className="text-sm font-semibold">{euro(resultaat.brutoMaandlast)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/40">Netto/mnd</p>
              <p className="text-sm font-semibold">{euro(Math.max(0, resultaat.nettoMaandlast))}</p>
            </div>
            <div className="ml-auto flex flex-col items-end justify-center gap-1">
              {resultaat.nhgMogelijk && (
                <span className="text-[10px] bg-[#99248F]/30 text-[#99248F] px-2 py-0.5 rounded-full font-semibold">NHG</span>
              )}
              {resultaat.startersvrijstelling && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">Starter</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button type="button" onClick={() => setStap(8)}
              className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2.5 rounded-xl transition cursor-pointer">
              Bekijk resultaat
            </button>
            <button type="button" onClick={() => setStap(1)}
              className="bg-[#99248F] hover:bg-[#99248F]/90 text-white text-sm font-medium py-2.5 rounded-xl transition cursor-pointer">
              Herbereken
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#0D1F3C] rounded-2xl p-6 text-white text-center space-y-4">
          <div className="w-14 h-14 bg-[#99248F]/20 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7 text-[#99248F]" />
          </div>
          <div>
            <p className="text-lg font-bold">Hoeveel kun jij lenen?</p>
            <p className="text-sm text-white/50 mt-1">Gratis berekening conform Nibud 2026 — duurt ±3 minuten</p>
          </div>
          <Button size="lg" onClick={() => setStap(1)} className="w-full">
            Start berekening →
          </Button>
        </div>
      )}

      {/* Opgeslagen woningen */}
      {!laden && woningen.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#0D1F3C]">Mijn woningen</p>
            <button type="button" onClick={() => setTab('woningen')}
              className="text-xs text-[#99248F] hover:opacity-75 transition cursor-pointer flex items-center gap-1">
              Alles zien <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {woningen.slice(0, 3).map(w => {
              const benodigdHypotheek = w.vraagprijs - (resultaat ? 0 : 0);
              const past = resultaat ? benodigdHypotheek <= resultaat.effectieveMaxHypotheek : null;
              return (
                <div key={w.id} className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    past === null ? 'bg-gray-200' : past ? 'bg-emerald-400' : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0D1F3C] truncate">{w.adres}</p>
                    <p className="text-xs text-gray-400">{w.stad} · {euro(w.vraagprijs)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {past !== null && (
                      past
                        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                        : <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    {w.analyseData?.fundaAnalyse && (
                      <div className="flex items-center gap-1">
                        <Gavel className="w-3.5 h-3.5 text-gray-300" />
                        <span className="text-[10px] text-gray-400">{euro(w.analyseData.fundaAnalyse.marktwaarde)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scenario's */}
      {!laden && berekeningen.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#0D1F3C]">Opgeslagen scenario's</p>
            <BookmarkPlus className="w-4 h-4 text-gray-300" />
          </div>
          <div className="grid grid-cols-1 gap-2">
            {berekeningen.slice(0, 3).map(b => (
              <button key={b.id} type="button"
                onClick={() => { herstelScenario(b.wizardInvoer, b.resultaat); setStap(8); }}
                className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3 hover:border-[#99248F]/30 transition cursor-pointer text-left group">
                <div className="w-8 h-8 bg-[#99248F]/10 rounded-lg flex items-center justify-center shrink-0">
                  <BookmarkPlus className="w-4 h-4 text-[#99248F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0D1F3C] truncate">{b.naam}</p>
                  <p className="text-xs text-gray-400">{euro(b.maxHypotheek)} · {b.aangemaakt}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-[#99248F] transition shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Snelle acties */}
      {heeftData && (
        <div>
          <p className="text-sm font-semibold text-[#0D1F3C] mb-3">Snelle acties</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: TrendingUp, label: 'Woning analyseren', actie: () => setTab('woningen') },
              { icon: Plus,       label: 'Woning toevoegen',  actie: () => setTab('woningen') },
              { icon: FileText,   label: 'PDF rapport',       actie: () => drukRapportAf(resultaat, sessie.naam) },
            ].map(({ icon: Icon, label, actie }) => (
              <button key={label} type="button" onClick={actie}
                className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col items-center gap-2 hover:border-[#99248F]/30 transition cursor-pointer">
                <div className="w-8 h-8 bg-[#99248F]/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#99248F]" />
                </div>
                <p className="text-[10px] text-gray-500 text-center leading-tight">{label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rentestand — compact */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#0D1F3C]">Actuele rentestand</p>
          <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">indicatief</span>
        </div>
        <div className="space-y-1.5">
          {RENTE_PERIODES.map(p => {
            const rente = actueleRentes[p];
            if (!rente) return null;
            return (
              <div key={p} className={`flex justify-between items-center px-3 py-2 rounded-lg ${p === 10 ? 'bg-[#99248F]/5' : 'bg-gray-50'}`}>
                <span className="text-sm text-gray-600">{p} jaar vast</span>
                <span className={`text-sm font-bold ${p === 10 ? 'text-[#99248F]' : 'text-[#0D1F3C]'}`}>
                  {(rente * 100).toFixed(2).replace('.', ',')}%
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-400 mt-2">Toetsrente &lt;10 jaar: 5,0% (AFM)</p>
      </div>

      {/* Hoe werkt het — alleen zonder resultaat */}
      {!heeftData && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#0D1F3C]">Hoe werkt het?</p>
          {[
            { nr: '1', label: 'Vul je situatie in',   sub: 'Inkomen, verplichtingen en woning' },
            { nr: '2', label: 'Directe berekening',    sub: 'Nibud 2026 & AFM normen' },
            { nr: '3', label: 'Vergelijk woningen',    sub: 'Check of een woning past' },
          ].map(s => (
            <div key={s.nr} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3.5">
              <div className="w-8 h-8 bg-[#0D1F3C] rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{s.nr}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#0D1F3C]">{s.label}</p>
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reset knop — alleen met data */}
      {heeftData && (
        <button type="button" onClick={() => setStap(1)}
          className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 py-2 transition cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" /> Nieuwe berekening starten
        </button>
      )}

    </div>
  );
}
