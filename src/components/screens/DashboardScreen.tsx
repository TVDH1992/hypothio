import { useEffect, useState } from 'react';
import { FileText, RefreshCw, Users, User, ShieldCheck, Sparkles, Plus, Home, ChevronRight } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { laadWoningen } from '../../lib/profiel';
import { drukRapportAf } from '../../lib/rapport';
import type { GeslaagdeWoning } from '../../types/profiel';

const euro = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

function greeting(naam: string) {
  const uur = new Date().getHours();
  const prefix = uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond';
  const voornaam = naam.split(' ')[0];
  return `${prefix}, ${voornaam.charAt(0).toUpperCase() + voornaam.slice(1)}`;
}

function initialen(naam: string) {
  const delen = naam.trim().split(' ');
  if (delen.length >= 2) return (delen[0][0] + delen[delen.length - 1][0]).toUpperCase();
  return naam.slice(0, 2).toUpperCase();
}

/* ── Budget ring ── */
function BudgetRing({ bedrag, pct }: { bedrag: number; pct: number }) {
  const R = 70, SW = 11;
  const circ = 2 * Math.PI * R;
  return (
    <div className="relative w-48 h-48 flex items-center justify-center mx-auto">
      <svg className="absolute inset-0 -rotate-90" width="192" height="192" viewBox="0 0 192 192">
        <circle cx="96" cy="96" r={R} fill="none" stroke="#f3f4f6" strokeWidth={SW} />
        <circle cx="96" cy="96" r={R} fill="none" stroke="#99248F" strokeWidth={SW}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.min(Math.max(pct, 0.05), 1))}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="text-center z-10 px-4">
        <p className="text-2xl font-bold text-[#0D1F3C] leading-tight">{euro(bedrag)}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest">max hypotheek</p>
      </div>
    </div>
  );
}

/* ── Voortgang tracker ── */
function VoortgangTracker({ heeftResultaat, heeftWoning }: { heeftResultaat: boolean; heeftWoning: boolean }) {
  const stappen = [
    { label: 'Berekend',  done: heeftResultaat },
    { label: 'Woning',    done: heeftWoning },
    { label: 'Bod',       done: false },
    { label: 'Aanvraag',  done: false },
    { label: 'Sleutels',  done: false },
  ];
  const huidigeStap = stappen.findLastIndex(s => s.done);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
      <p className="text-xs font-semibold text-[#0D1F3C] mb-3">Jouw voortgang</p>
      <div className="flex items-center">
        {stappen.map((stap, i) => (
          <div key={stap.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors
                ${stap.done
                  ? 'bg-[#99248F] border-2 border-[#99248F]'
                  : i === huidigeStap + 1
                  ? 'bg-white border-2 border-[#99248F]'
                  : 'bg-white border-2 border-gray-200'
                }`}>
                {stap.done && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <p className={`text-[9px] font-medium whitespace-nowrap
                ${stap.done ? 'text-[#99248F]' : i === huidigeStap + 1 ? 'text-[#0D1F3C]' : 'text-gray-300'}`}>
                {stap.label}
              </p>
            </div>
            {i < stappen.length - 1 && (
              <div className={`flex-1 h-px mx-1 mb-4 ${stap.done ? 'bg-[#99248F]' : 'bg-gray-100'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Woning kaartje ── */
function WoningKaart({ woning, maxBudget, onClick }: {
  woning: GeslaagdeWoning;
  maxBudget: number;
  onClick: () => void;
}) {
  const pct = maxBudget > 0 ? Math.round((woning.vraagprijs / maxBudget) * 100) : 0;
  const past = woning.vraagprijs <= maxBudget;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 shrink-0 w-44 cursor-pointer"
      onClick={onClick}>
      <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mb-2
        ${past ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
        {pct}% van budget
      </div>
      <p className="text-xs font-semibold text-[#0D1F3C] truncate">{woning.adres}</p>
      <p className="text-[10px] text-gray-400 truncate">{woning.stad}</p>
      <p className="text-sm font-bold text-[#0D1F3C] mt-1.5">{euro(woning.vraagprijs)}</p>
      <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${past ? 'bg-emerald-400' : 'bg-red-400'}`}
          style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */

export function DashboardScreen() {
  const { resultaat, sessie, situatie, setStap } = useWizard();
  const { setTab } = useApp();
  const [woningen, setWoningen] = useState<GeslaagdeWoning[]>([]);

  useEffect(() => {
    laadWoningen().then(setWoningen);
  }, []);

  /* ── Lege staat ── */
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

  /* ── Dashboard staat ── */
  const ringPct = resultaat.maxHypotheekOpInkomen > 0
    ? resultaat.effectieveMaxHypotheek / resultaat.maxHypotheekOpInkomen
    : 1;

  return (
    <div className="space-y-4">

      {/* ── Greeting ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-bold text-[#0D1F3C]">{greeting(sessie.naam)}</h1>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            {situatie.metPartner ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {situatie.metPartner ? 'Aanvraag met partner' : 'Aanvraag alleen'}
          </p>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#99248F] flex items-center justify-center shrink-0 cursor-pointer"
          onClick={() => setTab('profiel')}>
          <span className="text-white text-xs font-bold">{initialen(sessie.naam)}</span>
        </div>
      </div>

      {/* ── Budget hero ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <BudgetRing bedrag={resultaat.effectieveMaxHypotheek} pct={ringPct} />

        {/* Maandlasten */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-50">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Bruto/mnd</p>
            <p className="text-base font-bold text-[#0D1F3C] mt-0.5">{euro(resultaat.brutoMaandlast)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Netto/mnd</p>
            <p className="text-base font-bold text-[#0D1F3C] mt-0.5">{euro(Math.max(0, resultaat.nettoMaandlast))}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
          {resultaat.nhgMogelijk && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3" /> NHG
            </span>
          )}
          {resultaat.startersvrijstelling && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
              <Sparkles className="w-3 h-3" /> Startersvrijstelling
            </span>
          )}
          {resultaat.eigenGeldTekort > 0 && (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
              ⚠ Tekort {euro(resultaat.eigenGeldTekort)}
            </span>
          )}
        </div>

        <button type="button" onClick={() => setStap(8)}
          className="w-full text-xs text-[#99248F] mt-3 pt-3 border-t border-gray-50 flex items-center justify-center gap-1 hover:opacity-75 transition cursor-pointer">
          Volledige berekening bekijken <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Voortgang ── */}
      <VoortgangTracker heeftResultaat={!!resultaat} heeftWoning={woningen.length > 0} />

      {/* ── Woningen ── */}
      {woningen.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[#0D1F3C]">
              Woningen
              <span className="ml-2 text-xs font-normal text-gray-400">
                {woningen.filter(w => w.vraagprijs <= resultaat.effectieveMaxHypotheek).length}/{woningen.length} binnen budget
              </span>
            </p>
            <button type="button" onClick={() => setTab('woningen')}
              className="text-xs text-[#99248F] hover:opacity-75 cursor-pointer flex items-center gap-0.5">
              Alles <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {woningen.slice(0, 5).map(w => (
              <WoningKaart key={w.id} woning={w}
                maxBudget={resultaat.effectieveMaxHypotheek}
                onClick={() => setTab('woningen')} />
            ))}
            <button type="button" onClick={() => setTab('woningen')}
              className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-3 shrink-0 w-44 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[#99248F]/40 transition">
              <Plus className="w-5 h-5 text-gray-300" />
              <p className="text-xs text-gray-400">Toevoegen</p>
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setTab('woningen')}
          className="w-full bg-white rounded-xl border border-dashed border-gray-200 p-4 flex items-center gap-3 hover:border-[#99248F]/40 transition cursor-pointer">
          <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
            <Home className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-[#0D1F3C]">Woning toevoegen</p>
            <p className="text-xs text-gray-400">Funda link → direct budget check</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-200 ml-auto" />
        </button>
      )}

      {/* ── Acties (alleen niet-nav acties) ── */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => drukRapportAf(resultaat, sessie.naam)}
          className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:border-[#99248F]/30 transition cursor-pointer">
          <div className="w-8 h-8 bg-[#99248F]/8 rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-[#99248F]" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-[#0D1F3C]">PDF rapport</p>
            <p className="text-[10px] text-gray-400">Download overzicht</p>
          </div>
        </button>
        <button type="button" onClick={() => setStap(1)}
          className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:border-[#99248F]/30 transition cursor-pointer">
          <div className="w-8 h-8 bg-[#99248F]/8 rounded-lg flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4 text-[#99248F]" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-[#0D1F3C]">Herberekenen</p>
            <p className="text-[10px] text-gray-400">Pas gegevens aan</p>
          </div>
        </button>
      </div>

    </div>
  );
}
