import { useWizard } from '../../context/WizardContext';
import { Button } from '../ui/Button';
import { FormField, SelectField } from '../ui/FormField';
import type { Energielabel, Hypotheekvorm, RentevastePeriode } from '../../types/wizard';

const energielabels: Energielabel[] = ['A++++','A+++','A++','A+','A','B','C','D','E','F','G'];

export function Stap6Woning() {
  const { woning, updateWoning, volgende, vorige, rol, actueleRentes } = useWizard();
  const adv = rol === 'adviseur';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#0D1F3C]">
          {adv ? 'De woning' : 'Heb je al een woning op het oog?'}
        </h2>
        <p className="text-gray-400 mt-1 text-sm">
          {adv ? 'Vul de woninggegevens in.' : 'Optioneel — je kunt dit ook overslaan.'}
        </p>
      </div>

      <FormField
        label={adv ? 'Koopsom / vraagprijs' : 'Vraagprijs woning (optioneel)'}
        tooltip="Voor NHG-check en startersvrijstelling"
        type="number" min={0} prefix="€" placeholder="0"
        value={woning.koopsom ?? ''}
        onChange={e => updateWoning({ koopsom: Number(e.target.value) })}
      />

      <FormField
        label={adv ? 'In te brengen eigen geld' : 'Spaargeld dat je inbrengt (optioneel)'}
        tooltip="Spaargeld, schenking of overwaarde vorige woning"
        type="number" min={0} prefix="€" placeholder="0"
        value={woning.eigenGeld ?? ''}
        onChange={e => updateWoning({ eigenGeld: Number(e.target.value) })}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-[#0D1F3C]">Rentevaste periode</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {([1, 5, 10, 15, 20, 30] as RentevastePeriode[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => updateWoning({ rentevastePeriode: p })}
              className={`py-2 px-2 text-sm rounded-lg border transition cursor-pointer
                ${(woning.rentevastePeriode ?? 10) === p
                  ? 'bg-[#0D1F3C] text-white border-[#0D1F3C]'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              <span className="font-semibold">{p}jr</span>
              <br />
              <span className="text-xs opacity-70">{((actueleRentes[p] ?? 0) * 100).toFixed(1)}%</span>
            </button>
          ))}
        </div>
      </div>

      <SelectField
        label={adv ? 'Energielabel woning' : 'Energielabel (optioneel)'}
        tooltip={adv
          ? 'A++ of hoger geeft recht op extra leenruimte (TRHK 2026)'
          : 'Bij label A++ of hoger mag je tot €15.000–€40.000 extra lenen'}
        options={energielabels.map(l => ({ value: l, label: l }))}
        value={woning.energielabel ?? 'C'}
        onChange={e => updateWoning({ energielabel: e.target.value as Energielabel })}
      />

      {adv && (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#0D1F3C]">Hypotheekvorm</p>
            <div className="space-y-2">
              {([
                ['annuitair',     'Annuïtair',      'Gelijke maandlasten (verplicht voor NHG)'],
                ['lineair',       'Lineair',         'Afnemende maandlasten'],
                ['aflossingsvrij','Aflossingsvrij',  'Alleen rente — max 50% woningwaarde'],
              ] as [Hypotheekvorm, string, string][]).map(([val, lbl, desc]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateWoning({ hypotheekvorm: val })}
                  className={`w-full p-3.5 rounded-xl border-2 text-left transition cursor-pointer
                    ${(woning.hypotheekvorm ?? 'annuitair') === val
                      ? 'border-[#8B35C0] bg-[#8B35C0]/5'
                      : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <p className={`text-sm font-medium ${(woning.hypotheekvorm ?? 'annuitair') === val ? 'text-[#0D1F3C]' : 'text-gray-500'}`}>{lbl}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <SelectField
            label="Looptijd"
            options={[
              { value: 20, label: '20 jaar' },
              { value: 25, label: '25 jaar' },
              { value: 30, label: '30 jaar (standaard)' },
            ]}
            value={woning.looptijdJaar ?? 30}
            onChange={e => updateWoning({ looptijdJaar: Number(e.target.value) })}
          />
        </>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={vorige}>← Terug</Button>
        <Button onClick={volgende} className="flex-1">Bereken →</Button>
      </div>
    </div>
  );
}
