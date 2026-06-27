import { Home, Briefcase } from 'lucide-react';
import { useWizard, type Rol } from '../../context/WizardContext';
import { Button } from '../ui/Button';

export function Stap1Welkom() {
  const { rol, setRol, volgende, setStap } = useWizard();

  return (
    <div className="text-center space-y-8">
      <div>
        <div className="w-20 h-20 bg-[#99248F]/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <Home className="w-10 h-10 text-[#99248F]" />
        </div>
        <h1 className="text-3xl font-bold text-[#0D1F3C]">Wat zijn jouw hypotheekmogelijkheden?</h1>
        <p className="text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">
          Ontdek in 3 minuten hoeveel je kunt lenen, wat je maandlasten zijn en of je recht hebt op NHG of startersvrijstelling.
        </p>
      </div>

      <div className="space-y-3 text-left">
        <p className="text-sm font-medium text-[#0D1F3C] text-center">Wie ben jij?</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            ['consument', 'Ik wil weten wat ik kan lenen', Home,       'Voor jezelf — simpele taal, stap voor stap'],
            ['adviseur',  'Ik reken voor een klant',       Briefcase,  'Alle velden zichtbaar, technische details'],
          ] as [Rol, string, typeof Home, string][]).map(([val, lbl, Icon, sub]) => (
            <button
              key={val}
              type="button"
              onClick={() => setRol(val)}
              className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition cursor-pointer
                ${rol === val
                  ? 'border-[#99248F] bg-[#99248F]/5'
                  : 'border-gray-200 hover:border-gray-300'}`}
            >
              <Icon className={`w-8 h-8 ${rol === val ? 'text-[#99248F]' : 'text-gray-300'}`} />
              <p className={`text-sm font-semibold leading-snug ${rol === val ? 'text-[#0D1F3C]' : 'text-gray-500'}`}>{lbl}</p>
              <p className="text-xs text-gray-400 leading-snug">{sub}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Button size="lg" onClick={volgende} className="w-full">
          Begin →
        </Button>
        <Button variant="ghost" onClick={() => setStap(0)} className="w-full text-sm">
          ← Terug
        </Button>
      </div>
    </div>
  );
}
