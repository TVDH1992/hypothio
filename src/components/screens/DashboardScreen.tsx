import { useEffect, useState } from 'react';
import { TrendingUp, Plus, FileText, ChevronRight, CheckCircle, XCircle,
         BookmarkPlus, Users, User, RefreshCw, Home, ChevronDown, ChevronUp,
         ShieldCheck, Sparkles, Clock } from 'lucide-react';
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
  const voornaam = naam.split(' ')[0];
  const netjes = voornaam.charAt(0).toUpperCase() + voornaam.slice(1);
  return `${prefix}, ${netjes}`;
}

function initialen(naam: string) {
  const delen = naam.trim().split(' ');
  if (delen.length >= 2) return (delen[0][0] + delen[delen.length - 1][0]).toUpperCase();
  return naam.slice(0, 2).toUpperCase();
}

export function DashboardScreen() {
  const { resultaat, sessie, situatie, woning, setStap, actueleRentes, herstelScenario } = useWizard();
  const { setTab } = useApp();
  const [woningen, setWoningen]             = useState<GeslaagdeWoning[]>([]);
  const [berekeningen, setBerekeningen]     = useState<Berekening[]>([]);
  const [kostenUitgeklapt, setKostenUitgeklapt] = useState(false);

  useEffect(() => {
    Promise.all([laadWoningen(), laadBerekeningen()]).then(([w, b]) => {
      setWoningen(w);
      setBerekeningen(b);
    });
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
  const metPartner = situatie.metPartner;
  const rente10 = actueleRentes[10];
  const woningenPassen = woningen.filter(w => w.vraagprijs <= resultaat.effectieveMaxHypotheek);
  const hypotheekvorm = woning.hypotheekvorm ?? 'annuitair';
  const hypotheekvormLabel = hypotheekvorm === 'annuitair' ? 'Annuïtair' : hypotheekvorm === 'lineair' ? 'Lineair' : 'Aflossingsvrij';

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-bold text-[#0D1F3C]">{greeting(sessie.naam)}</h1>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            {metPartner ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {metPartner ? 'Berekening met partner' : 'Berekening alleen'}
          </p>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#99248F] flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{initialen(sessie.naam)}</span>
        </div>
      </div>

      {/* ── Hero card ── */}
      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D1F3C 0%, #1a1a4e 50%, #2d0f3d 100%)' }}
      >
        {/* Decoratieve cirkels */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #99248F, transparent)' }} />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #99248F, transparent)' }} />

        <div className="relative">
          <p className="text-xs text-white/50 uppercase tracking-widest">Maximale hypotheek</p>
          <p className="text-4xl font-bold tracking-tight mt-1 leading-none">
            {euro(resultaat.effectieveMaxHypotheek)}
          </p>
          {resultaat.eigenGeldTekort > 0 && (
            <p className="text-[11px] text-amber-300 mt-1.5 flex items-center gap-1">
              ⚠ Eigen geld tekort: {euro(resultaat.eigenGeldTekort)}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/10">
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

        <button type="button" onClick={() => setStap(8)}
          className="absolute top-4 right-4 text-[10px] text-white/40 hover:text-white/70 flex items-center gap-0.5 transition cursor-pointer">
          Detail <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* ── Status badges ── */}
      <div className="flex gap-2">
        <div className={`flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 border ${resultaat.nhgMogelijk ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
          <ShieldCheck className={`w-4 h-4 shrink-0 ${resultaat.nhgMogelijk ? 'text-emerald-500' : 'text-gray-300'}`} />
          <div>
            <p className={`text-[10px] font-semibold ${resultaat.nhgMogelijk ? 'text-emerald-700' : 'text-gray-400'}`}>NHG</p>
            <p className={`text-[10px] ${resultaat.nhgMogelijk ? 'text-emerald-600' : 'text-gray-400'}`}>
              {resultaat.nhgMogelijk ? 'Van toepassing' : 'Niet van toepassing'}
            </p>
          </div>
        </div>
        <div className={`flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 border ${resultaat.startersvrijstelling ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
          <Sparkles className={`w-4 h-4 shrink-0 ${resultaat.startersvrijstelling ? 'text-emerald-500' : 'text-gray-300'}`} />
          <div>
            <p className={`text-[10px] font-semibold ${resultaat.startersvrijstelling ? 'text-emerald-700' : 'text-gray-400'}`}>Starter</p>
            <p className={`text-[10px] ${resultaat.startersvrijstelling ? 'text-emerald-600' : 'text-gray-400'}`}>
              {resultaat.startersvrijstelling ? 'Vrijstelling' : 'Niet van toepassing'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 border bg-[#99248F]/5 border-[#99248F]/10">
          <Clock className="w-4 h-4 shrink-0 text-[#99248F]" />
          <div>
            <p className="text-[10px] font-semibold text-[#99248F]">{hypotheekvormLabel}</p>
            <p className="text-[10px] text-gray-400">{woning.looptijdJaar ?? 30} jaar</p>
          </div>
        </div>
      </div>

      {/* ── Financieel overzicht ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <p className="text-sm font-semibold text-[#0D1F3C]">Financieel overzicht</p>
        </div>

        {/* Rente */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <p className="text-xs text-gray-500">Rente (10 jaar vast)</p>
          <p className="text-sm font-bold text-[#99248F]">
            {rente10 ? `${(rente10 * 100).toFixed(2).replace('.', ',')}%` : '—'}
          </p>
        </div>

        {/* Bijkomende kosten — uitklapbaar */}
        <button
          type="button"
          onClick={() => setKostenUitgeklapt(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
        >
          <p className="text-xs text-gray-500">Bijkomende kosten</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[#0D1F3C]">{euro(resultaat.bijkomendeKosten.totaal)}</p>
            {kostenUitgeklapt
              ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
              : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            }
          </div>
        </button>

        {kostenUitgeklapt && (
          <div className="px-4 pb-3 space-y-2 bg-gray-50">
            {[
              { label: 'Overdrachtsbelasting', bedrag: resultaat.bijkomendeKosten.overdrachtsbelasting },
              { label: 'Notariskosten',         bedrag: resultaat.bijkomendeKosten.notarisKosten },
              { label: 'Taxatiekosten',         bedrag: resultaat.bijkomendeKosten.taxatieKosten },
              { label: 'Advieskosten',          bedrag: resultaat.bijkomendeKosten.adviesKosten },
              ...(resultaat.bijkomendeKosten.nhgPremie > 0
                ? [{ label: 'NHG-premie', bedrag: resultaat.bijkomendeKosten.nhgPremie }]
                : []),
            ].map(({ label, bedrag }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xs font-medium text-[#0D1F3C]">{euro(bedrag)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Woningen ── */}
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
                <div key={w.id} className={`rounded-xl border p-3 shrink-0 w-44 ${past ? 'bg-white border-gray-100' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {past
                      ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    }
                    <p className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${past ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {past ? 'Binnen budget' : 'Boven budget'}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-[#0D1F3C] truncate mt-1.5">{w.adres}</p>
                  <p className="text-[10px] text-gray-400 truncate">{w.stad}</p>
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
              className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-3 shrink-0 w-44 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[#99248F]/40 transition">
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
            <Home className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-[#0D1F3C]">Woning toevoegen</p>
            <p className="text-xs text-gray-400">Funda link → direct budget check</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-200 ml-auto" />
        </button>
      )}

      {/* ── Scenario's ── */}
      {berekeningen.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-[#0D1F3C] mb-2">Opgeslagen scenario's</p>
          <div className="space-y-2">
            {berekeningen.slice(0, 3).map(b => (
              <button key={b.id} type="button"
                onClick={() => { herstelScenario(b.wizardInvoer, b.resultaat); setStap(8); }}
                className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 hover:border-[#99248F]/30 transition cursor-pointer group">
                <div className="w-8 h-8 bg-[#99248F]/8 rounded-lg flex items-center justify-center shrink-0">
                  <BookmarkPlus className="w-4 h-4 text-[#99248F]" />
                </div>
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

      {/* ── Snelle acties ── */}
      <div>
        <p className="text-sm font-semibold text-[#0D1F3C] mb-2">Snelle acties</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: TrendingUp, label: 'Analyseer\nwoning',      actie: () => setTab('woningen') },
            { icon: FileText,   label: 'PDF\nrapport',           actie: () => drukRapportAf(resultaat, sessie.naam) },
            { icon: RefreshCw,  label: 'Nieuwe\nberekening',     actie: () => setStap(1) },
          ].map(({ icon: Icon, label, actie }) => (
            <button key={label} type="button" onClick={actie}
              className="bg-white rounded-xl border border-gray-100 p-3.5 flex flex-col items-center gap-2 hover:border-[#99248F]/30 hover:bg-[#99248F]/[0.02] transition cursor-pointer">
              <div className="w-9 h-9 bg-[#99248F]/8 rounded-xl flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#99248F]" />
              </div>
              <p className="text-[10px] text-gray-500 text-center leading-tight whitespace-pre-line">{label}</p>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
