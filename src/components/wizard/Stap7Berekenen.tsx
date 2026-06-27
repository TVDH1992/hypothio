import { useEffect } from 'react';
import { useWizard } from '../../context/WizardContext';
import { berekenResultaat } from '../../lib/berekening';

export function Stap7Berekenen() {
  const { situatie, inkomen1, inkomen2, verplichtingen, woning, setResultaat, volgende, actueleRentes } = useWizard();

  useEffect(() => {
    const timer = setTimeout(() => {
      const resultaat = berekenResultaat(situatie, inkomen1, inkomen2, verplichtingen, woning, actueleRentes);
      setResultaat(resultaat);
      volgende();
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
      <div className="relative w-20 h-20">
        <div className="w-20 h-20 rounded-full border-4 border-gray-100 border-t-[#1ABC9C] animate-spin" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#0D1F3C]">Berekening loopt...</h2>
        <p className="text-gray-400 mt-1 text-sm">We halen de actuele normen op en rekenen voor jou.</p>
      </div>
      <div className="space-y-2 text-xs text-gray-400">
        <p>✓ Toetsinkomen berekenen</p>
        <p>✓ Verplichtingen verwerken</p>
        <p>✓ NHG & startersvrijstelling checken</p>
        <p>✓ Maandlasten berekenen</p>
      </div>
    </div>
  );
}
