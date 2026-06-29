import { useEffect, useState } from 'react';
import { ShieldCheck, TrendingUp, Plus, FileText, ChevronRight, CheckCircle, XCircle, BookmarkPlus, Users, User } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { laadWoningen, laadBerekeningen } from '../../lib/profiel';
import { drukRapportAf } from '../../lib/rapport';
import type { GeslaagdeWoning, Berekening } from '../../types/profiel';

function euro(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function greeting(naam: string) {
  const uur = new Date().getHours();
  const prefix = uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond';
  return `${prefix}, ${naam.split(' ')[0]}`;
}

export function HomeScreen() {
  const { resultaat, sessie, situatie, setStap, actueleRentes, herstelScenario } = useWizard();
  const { setTab } = useApp();
  const [woningen, setWoningen]         = useState<GeslaagdeWoning[]>([]);
  const [berekeningen, setBerekeningen] = useState<Berekening[]>([]);

  useEffect(() => {
    Promise.all([laadWoningen(), laadBerekeningen()]).then(([w, b]) => {
      setWoningen(w);
      setBerekeningen(b);
    });
  }, []);

  if (!resultaat) {
    return (
      <div className="space-y-5">
        <div className="pt-1">
          <h1 className="text-2xl font-bold text-[#0D1F3C]">{greeting(sessie.naam)}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Wat kun jij lenen?</p>
        </div>
        <div className="bg-[#0D1F3C] rounded-2xl p-6 text-white text-center space-y-4">
          <ShieldCheck className="w-10 h-10 text-[#99248F] mx-auto" />
          <div>
            <p className="text-lg font-bold">Gratis hypotheek berekening</p>
            <p className="text-sm text-white/50 mt-1">Conform Nibud 2026 — duurt ±3 minuten</p>
          </div>
          <Button size="lg" onClick={() => setStap(1)} className="w-full">Start berekening →</Button>
        </div>
        <div className="space-y-2">
          {[
            { nr: '1', tekst: 'Vul inkomen en situatie in' },
            { nr: '2', tekst: 'Berekening conform Nibud 2026 & AFM' },
            { nr: '3', tekst: 'Vergelijk woningen op budget' },
          ].map(s => (
            <div key={s.nr} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3.5">
              <div className="w-7 h-7 bg-[#0D1F3C] rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{s.nr}</span>
              </div>
              <p className="text-sm text-gray-600">{s.tekst}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const metPartner = situatie.metPartner;
  const rente10 = actueleRentes[10];
  const woningenPassen = woningen.filter(w => w.vraagprijs <= resultaat.effectieveMaxHypotheek);

  return (
    <div className="space-y-4">

      {/* Greeting */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-bold text-[#0D1F3C]">{greeting(sessie.naam)}</h1>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            {metPartner ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {metPartner ? 'Berekening met partner' : 'Berekening alleen'}
          </p>
        </div>
        <button type="button" onClick={() => setStap(8)}
          className="text-xs text-[#99248F] hover:opacity-75 flex items-center gap-1 cursor-pointer">
          Detail <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Max hypotheek — hero */}
      <div className="bg-[#0D1F3C] rounded-2xl p-5 text-white">
        <p className="text-xs text-white/40">Maximale hypotheek</p>
        <p className="text-4xl font-bold tracking-tight mt-1">{euro(resultaat.effectieveMaxHypotheek)}</p>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-[10px] text-white/40">Bruto/mnd</p>
            <p className="text-sm font-semibold mt-0.5">{euro(resultaat.brutoMaandlast)}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40">Netto/mnd</p>
            <p className="text-sm font-semibold mt-0.5">{euro(Math.max(0, resultaat.nettoMaandlast))}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40">Toetsinkomen</p>
            <p className="text-sm font-semibold mt-0.5">{euro(resultaat.toetsinkomen)}</p>
          </div>
        </div>
      </div>

      {/* Metrieken grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl border border-gray-100 p-3.5">
          <p className="text-[10px] text-gray-400">NHG</p>
          <p className={`text-sm font-bold mt-1 ${resultaat.nhgMogelijk ? 'text-emerald-600' : 'text-gray-400'}`}>
            {resultaat.nhgMogelijk ? '✓ Mogelijk' : '✗ Niet van toepassing'}
          </p>
          {resultaat.nhgMogelijk && <p className="text-[10px] text-gray-400 mt-0.5">Lagere rente + zekerheid</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3.5">
          <p className="text-[10px] text-gray-400">Startersvrijstelling</p>
          <p className={`text-sm font-bold mt-1 ${resultaat.startersvrijstelling ? 'text-emerald-600' : 'text-gray-400'}`}>
            {resultaat.startersvrijstelling ? '✓ Van toepassing' : '✗ Niet van toepassing'}
          </p>
          {resultaat.startersvrijstelling && <p className="text-[10px] text-gray-400 mt-0.5">Geen overdrachtsbelasting</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3.5">
          <p className="text-[10px] text-gray-400">Bijkomende kosten</p>
          <p className="text-sm font-bold text-[#0D1F3C] mt-1">{euro(resultaat.bijkomendeKosten.totaal)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Incl. notaris & taxatie</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3.5">
          <p className="text-[10px] text-gray-400">Rente (10jr vast)</p>
          <p className="text-sm font-bold text-[#99248F] mt-1">
            {rente10 ? `${(rente10 * 100).toFixed(2).replace('.', ',')}%` : '—'}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Indicatief marktgemiddelde</p>
        </div>
      </div>

      {/* Woningen */}
      {woningen.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[#0D1F3C]">
              Woningen
              <span className="ml-2 text-xs font-normal text-gray-400">
                {woningenPassen.length}/{woningen.length} binnen budget
              </span>
            </p>
            <button type="button" onClick={() => setTab('woningen')}
              className="text-xs text-[#99248F] hover:opacity-75 cursor-pointer flex items-center gap-0.5">
              Alles <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {woningen.slice(0, 5).map(w => {
              const past = w.vraagprijs <= resultaat.effectieveMaxHypotheek;
              return (
                <div key={w.id} className="bg-white rounded-xl border border-gray-100 p-3 shrink-0 w-40">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {past
                      ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    }
                    <p className="text-xs font-medium text-[#0D1F3C] truncate">{w.adres}</p>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{w.stad}</p>
                  <p className="text-sm font-bold text-[#0D1F3C] mt-1.5">{euro(w.vraagprijs)}</p>
                  {w.marktwaarde && (
                    <p className={`text-[10px] mt-0.5 font-medium ${w.vraagprijs <= w.marktwaarde ? 'text-emerald-600' : 'text-amber-600'}`}>
                      WOZ: {euro(w.marktwaarde)}
                    </p>
                  )}
                </div>
              );
            })}
            <button type="button" onClick={() => setTab('woningen')}
              className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-3 shrink-0 w-40 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[#99248F]/40 transition">
              <Plus className="w-5 h-5 text-gray-300" />
              <p className="text-xs text-gray-400">Woning toevoegen</p>
            </button>
          </div>
        </div>
      )}

      {woningen.length === 0 && (
        <button type="button" onClick={() => setTab('woningen')}
          className="w-full bg-white rounded-xl border border-dashed border-gray-200 p-4 flex items-center gap-3 hover:border-[#99248F]/40 transition cursor-pointer">
          <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-[#0D1F3C]">Woning toevoegen</p>
            <p className="text-xs text-gray-400">Funda link → direct budget check</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-200 ml-auto" />
        </button>
      )}

      {/* Scenario's */}
      {berekeningen.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-[#0D1F3C] mb-2">Scenario's</p>
          <div className="space-y-2">
            {berekeningen.slice(0, 3).map(b => (
              <button key={b.id} type="button"
                onClick={() => { herstelScenario(b.wizardInvoer, b.resultaat); setStap(8); }}
                className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 hover:border-[#99248F]/30 transition cursor-pointer group">
                <BookmarkPlus className="w-4 h-4 text-[#99248F] shrink-0" />
                <div className="flex-1 min-w-0 text-left">
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
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: TrendingUp, label: 'Analyseer woning', actie: () => setTab('woningen') },
          { icon: FileText,   label: 'PDF rapport',      actie: () => drukRapportAf(resultaat, sessie.naam) },
          { icon: ShieldCheck,label: 'Herbereken',       actie: () => setStap(1) },
        ].map(({ icon: Icon, label, actie }) => (
          <button key={label} type="button" onClick={actie}
            className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col items-center gap-2 hover:border-[#99248F]/30 transition cursor-pointer">
            <div className="w-8 h-8 bg-[#99248F]/8 rounded-lg flex items-center justify-center">
              <Icon className="w-4 h-4 text-[#99248F]" />
            </div>
            <p className="text-[10px] text-gray-500 text-center leading-tight">{label}</p>
          </button>
        ))}
      </div>

    </div>
  );
}
