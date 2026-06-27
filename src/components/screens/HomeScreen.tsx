import { ShieldCheck, TrendingUp, Clock, ChevronRight, Home, Star } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { NHG_GRENS_2026 } from '../../lib/normen';

function euro(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

const STAPPEN = [
  { nr: '1', label: 'Vul je situatie in', sub: 'Inkomen, verplichtingen, woning' },
  { nr: '2', label: 'Directe berekening',  sub: 'Conform Nibud 2026 & AFM normen'  },
  { nr: '3', label: 'Vergelijk woningen',  sub: 'Check of een woning past in je budget' },
];

const RENTE_PERIODES = [
  { p: 10, label: '10 jaar', highlight: true  },
  { p: 20, label: '20 jaar', highlight: false },
  { p: 30, label: '30 jaar', highlight: false },
] as const;

export function HomeScreen() {
  const { resultaat, sessie, setStap, actueleRentes } = useWizard();
  const { setTab } = useApp();

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="text-center space-y-3 pt-2">
        <div className="w-16 h-16 bg-[#8B35C0]/10 rounded-2xl flex items-center justify-center mx-auto">
          <Home className="w-8 h-8 text-[#8B35C0]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0D1F3C] leading-tight">
          Hoeveel hypotheek<br />kun jij krijgen?
        </h1>
        <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
          Gratis berekening conform officiële Nibud 2026 normen — identiek aan de methode van erkende hypotheekadviseurs.
        </p>
      </div>

      {/* Resultaat kaart — als berekening gedaan */}
      {resultaat ? (
        <div className="bg-[#0D1F3C] rounded-2xl p-5 text-white">
          <p className="text-xs text-white/50 mb-1">Jouw berekening, {sessie.naam}</p>
          <p className="text-3xl font-bold mb-3">{euro(resultaat.effectieveMaxHypotheek)}</p>
          <div className="flex gap-4 text-sm border-t border-white/10 pt-3">
            <div>
              <p className="text-white/50 text-xs">Bruto/mnd</p>
              <p className="font-semibold">{euro(resultaat.brutoMaandlast)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Netto/mnd</p>
              <p className="font-semibold">{euro(Math.max(0, resultaat.nettoMaandlast))}</p>
            </div>
            <div className="ml-auto flex items-end">
              {resultaat.nhgMogelijk && (
                <span className="text-xs bg-[#8B35C0]/20 text-[#8B35C0] px-2 py-1 rounded-full font-medium">NHG</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button"
              onClick={() => setStap(8)}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2.5 rounded-xl transition cursor-pointer">
              Bekijk resultaat
            </button>
            <button type="button"
              onClick={() => setStap(1)}
              className="flex-1 bg-[#8B35C0] hover:bg-[#8B35C0]/90 text-white text-sm font-medium py-2.5 rounded-xl transition cursor-pointer">
              Herbereken
            </button>
          </div>
        </div>
      ) : (
        <Button size="lg" onClick={() => setStap(1)} className="w-full">
          Start mijn berekening →
        </Button>
      )}

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: ShieldCheck, label: 'Nibud 2026',  sub: 'Officiële normen'   },
          { icon: TrendingUp,  label: 'AFM conform', sub: 'Toetsrente regels'  },
          { icon: Star,        label: 'NHG 2026',    sub: `Grens ${euro(NHG_GRENS_2026)}` },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <Icon className="w-5 h-5 text-[#8B35C0] mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-[#0D1F3C]">{label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Actuele rentestand — live uit Supabase */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#0D1F3C]">Actuele rentestand</p>
          <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">indicatief</span>
        </div>
        <div className="space-y-2">
          {RENTE_PERIODES.map(({ p, label, highlight }) => {
            const rente = actueleRentes[p];
            if (!rente) return null;
            return (
              <div key={p}
                className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${highlight ? 'bg-[#8B35C0]/5 border border-[#8B35C0]/20' : 'bg-gray-50'}`}>
                <span className={`text-sm ${highlight ? 'font-semibold text-[#0D1F3C]' : 'text-gray-600'}`}>{label} vast</span>
                <span className={`text-sm font-bold ${highlight ? 'text-[#8B35C0]' : 'text-[#0D1F3C]'}`}>
                  {(rente * 100).toFixed(2).replace('.', ',')}%
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
          Periodes korter dan 10 jaar: AFM toetsrente 5,0% van toepassing.
          Actuele rente bij jouw geldverstrekker kan afwijken — vraag een adviseur.
        </p>
      </div>

      {/* Hoe werkt het */}
      {!resultaat && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#0D1F3C]">Hoe werkt het?</p>
          {STAPPEN.map(s => (
            <div key={s.nr} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3.5">
              <div className="w-8 h-8 bg-[#0D1F3C] rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{s.nr}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#0D1F3C]">{s.label}</p>
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 ml-auto" />
            </div>
          ))}
        </div>
      )}

      {/* Woningen shortcut */}
      {resultaat && (
        <button type="button"
          onClick={() => setTab('woningen')}
          className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 hover:border-[#8B35C0]/30 transition cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8B35C0]/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#8B35C0]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#0D1F3C]">Woning analyseren</p>
              <p className="text-xs text-gray-400">WOZ-waarde opzoeken + biedadvies</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#8B35C0] transition" />
        </button>
      )}

      {/* Privacy note */}
      <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 rounded-xl">
        <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-600 leading-relaxed">
          <strong>Privacy:</strong> Jouw ingevulde gegevens en berekeningen worden veilig opgeslagen in jouw persoonlijke account en nooit gedeeld met derden. Hypothio is een rekentool — geen financieel advies.
        </p>
      </div>

      <div className="flex items-center gap-2 justify-center">
        <Clock className="w-3.5 h-3.5 text-gray-300" />
        <p className="text-xs text-gray-400">Berekening duurt circa 3 minuten</p>
      </div>

    </div>
  );
}
