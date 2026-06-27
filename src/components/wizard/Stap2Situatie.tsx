import { User, Users } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { Button } from '../ui/Button';
import { FormField, OptionCard } from '../ui/FormField';

export function Stap2Situatie() {
  const { situatie, updateSituatie, volgende, vorige } = useWizard();
  const isValid = situatie.leeftijd !== undefined && situatie.leeftijd >= 18 &&
    situatie.metPartner !== undefined && situatie.isStarter !== undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0D1F3C]">Jouw situatie</h2>
        <p className="text-gray-400 mt-1 text-sm">Dit bepaalt hoe we de berekening opbouwen.</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[#0D1F3C]">Koop je samen of alleen?</p>
        <div className="grid grid-cols-2 gap-3">
          <OptionCard selected={situatie.metPartner === false} onClick={() => updateSituatie({ metPartner: false })}>
            <User className={`w-7 h-7 mb-2 ${situatie.metPartner === false ? 'text-[#99248F]' : 'text-gray-300'}`} />
            <p className={`text-sm font-medium ${situatie.metPartner === false ? 'text-[#0D1F3C]' : 'text-gray-500'}`}>Alleen</p>
          </OptionCard>
          <OptionCard selected={situatie.metPartner === true} onClick={() => updateSituatie({ metPartner: true })}>
            <Users className={`w-7 h-7 mb-2 ${situatie.metPartner === true ? 'text-[#99248F]' : 'text-gray-300'}`} />
            <p className={`text-sm font-medium ${situatie.metPartner === true ? 'text-[#0D1F3C]' : 'text-gray-500'}`}>Met partner</p>
          </OptionCard>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[#0D1F3C]">Ben je een starter?</p>
        <p className="text-xs text-gray-400">Starter = eerste koopwoning, nooit eerder startersvrijstelling gebruikt.</p>
        <div className="grid grid-cols-2 gap-3">
          <OptionCard selected={situatie.isStarter === true} onClick={() => updateSituatie({ isStarter: true })}>
            <p className={`text-sm font-medium ${situatie.isStarter === true ? 'text-[#0D1F3C]' : 'text-gray-500'}`}>Ja, ik ben starter</p>
          </OptionCard>
          <OptionCard selected={situatie.isStarter === false} onClick={() => updateSituatie({ isStarter: false })}>
            <p className={`text-sm font-medium ${situatie.isStarter === false ? 'text-[#0D1F3C]' : 'text-gray-500'}`}>Nee, doorstromer</p>
          </OptionCard>
        </div>
      </div>

      <FormField
        label="Jouw leeftijd"
        tooltip="Relevant voor de startersvrijstelling (moet onder de 35 zijn)"
        type="number"
        min={18}
        max={99}
        placeholder="bijv. 28"
        suffix="jaar"
        value={situatie.leeftijd ?? ''}
        onChange={e => updateSituatie({ leeftijd: Number(e.target.value) })}
      />

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={vorige}>← Terug</Button>
        <Button onClick={volgende} disabled={!isValid} className="flex-1">Volgende →</Button>
      </div>
    </div>
  );
}
