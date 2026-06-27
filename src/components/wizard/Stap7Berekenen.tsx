import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { berekenResultaat } from '../../lib/berekening';

const STAPPEN = [
  'Toetsinkomen berekenen',
  'Verplichtingen verwerken',
  'NHG & startersvrijstelling checken',
  'Maandlasten berekenen',
];

export function Stap7Berekenen() {
  const { situatie, inkomen1, inkomen2, verplichtingen, woning, setResultaat, volgende, actueleRentes, actueleNormen } = useWizard();
  const [gereed, setGereed] = useState(0);

  useEffect(() => {
    const timers = STAPPEN.map((_, i) =>
      setTimeout(() => setGereed(i + 1), 250 + i * 380)
    );
    const done = setTimeout(() => {
      const resultaat = berekenResultaat(situatie, inkomen1, inkomen2, verplichtingen, woning, actueleRentes, actueleNormen);
      setResultaat(resultaat);
      volgende();
    }, 1900);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, []);

  const pct = Math.round((gereed / STAPPEN.length) * 100);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8 text-center">
      {/* Cirkel met voortgang */}
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
          <circle
            cx="48" cy="48" r="40" fill="none"
            stroke="#8B35C0" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#0D1F3C]">
          {pct}%
        </span>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#0D1F3C]">Berekening loopt...</h2>
        <p className="text-gray-400 mt-1 text-sm">We halen de actuele normen op en rekenen voor jou.</p>
      </div>

      <div className="space-y-2.5 text-left w-full max-w-xs">
        {STAPPEN.map((label, i) => {
          const done = i < gereed;
          const active = i === gereed;
          return (
            <div
              key={label}
              className={`flex items-center gap-3 transition-all duration-300
                ${done ? 'opacity-100' : active ? 'opacity-60' : 'opacity-20'}`}
            >
              <CheckCircle className={`w-4 h-4 shrink-0 transition-colors duration-300 ${done ? 'text-[#8B35C0]' : 'text-gray-300'}`} />
              <span className={`text-sm transition-colors duration-300 ${done ? 'text-[#0D1F3C] font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
