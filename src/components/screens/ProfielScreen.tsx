import { RotateCcw, LogOut, User, Calculator } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { verwijderProfiel } from '../../lib/profiel';

function euro(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

interface Props {
  onUitloggen: () => void;
}

export function ProfielScreen({ onUitloggen }: Props) {
  const { resultaat, sessie, setStap } = useWizard();
  const { setTab } = useApp();

  function nieuweBerekening() {
    verwijderProfiel();
    setStap(1);
    setTab('berekenen');
  }

  return (
    <div className="space-y-6">
      {/* Account */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#0D1F3C] rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-lg font-bold">{sessie.naam.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold text-[#0D1F3C]">{sessie.naam}</p>
            <p className="text-xs text-gray-400">{sessie.email}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400">Account aangemaakt op {sessie.aangemaakt}</p>
      </div>

      {/* Berekening resultaat */}
      {resultaat ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#0D1F3C]">Jouw berekening</p>
          <div className="bg-[#0D1F3C] text-white rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-white/60">Maximale hypotheek</p>
              <p className="text-2xl font-bold">{euro(resultaat.effectieveMaxHypotheek)}</p>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between text-sm">
              <span className="text-white/60">Bruto maandlast</span>
              <span>{euro(resultaat.brutoMaandlast)}/mnd</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Netto maandlast</span>
              <span>{euro(Math.max(0, resultaat.nettoMaandlast))}/mnd</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { setTab('berekenen'); }} className="flex-1">
              <Calculator className="w-4 h-4" /> Bekijk resultaat
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
          <Calculator className="w-8 h-8 mx-auto mb-2 text-gray-200" />
          <p className="text-sm text-gray-400">Nog geen berekening gedaan.</p>
          <button type="button" onClick={() => { setStap(1); setTab('berekenen'); }}
            className="text-sm text-[#1ABC9C] mt-2 hover:opacity-75 transition cursor-pointer">
            Start een berekening →
          </button>
        </div>
      )}

      {/* Acties */}
      <div className="space-y-2">
        <button type="button" onClick={nieuweBerekening}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 py-3 border border-gray-200 rounded-xl transition cursor-pointer">
          <RotateCcw className="w-4 h-4" /> Nieuwe berekening starten
        </button>
        <button type="button" onClick={onUitloggen}
          className="w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-600 py-3 border border-red-100 rounded-xl transition cursor-pointer">
          <LogOut className="w-4 h-4" /> Uitloggen
        </button>
      </div>

      <p className="text-xs text-center text-gray-300 pb-4">
        Hypothio prototype · Gegevens opgeslagen in browser
      </p>
    </div>
  );
}
