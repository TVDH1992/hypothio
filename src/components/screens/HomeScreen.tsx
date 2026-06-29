import { ShieldCheck } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

export function HomeScreen() {
  const { setStap, sessie } = useWizard();
  const { setTab } = useApp();

  function greeting(naam: string) {
    const uur = new Date().getHours();
    const prefix = uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond';
    const voornaam = naam.split(' ')[0];
    const netjes = voornaam.charAt(0).toUpperCase() + voornaam.slice(1);
    return `${prefix}, ${netjes}`;
  }

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

      <button
        type="button"
        onClick={() => setTab('dashboard')}
        className="w-full text-center text-sm text-[#99248F] hover:opacity-75 transition py-2 cursor-pointer"
      >
        Bekijk mijn dashboard →
      </button>
    </div>
  );
}
