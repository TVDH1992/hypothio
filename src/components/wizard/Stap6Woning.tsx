import { useWizard } from '../../context/WizardContext';
import { Button } from '../ui/Button';
import { FormField, SelectField } from '../ui/FormField';
import type { Energielabel, Hypotheekvorm, RentevastePeriode } from '../../types/wizard';

const energielabels: Energielabel[] = ['A++++','A+++','A++','A+','A','B','C','D','E','F','G'];

const euro = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function Stap6Woning() {
  const { woning, updateWoning, volgende, vorige, rol, actueleRentes, situatie } = useWizard();
  const isDoorstromer = situatie.isStarter === false;
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

      {/* Doorstromers: huidige woning */}
      {isDoorstromer && (
        <div className="space-y-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-[#0D1F3C]">Huidige woning</p>
          <FormField
            label="Geschatte verkoopprijs"
            tooltip="Wat verwacht je voor je huidige woning te krijgen?"
            type="number" min={0} prefix="€" placeholder="bijv. 350000"
            value={woning.huidigeWoningWaarde ?? ''}
            onChange={e => updateWoning({ huidigeWoningWaarde: Number(e.target.value) })}
          />
          <FormField
            label="Resterende hypotheek"
            tooltip="Hoeveel staat er nog open op je huidige hypotheek?"
            type="number" min={0} prefix="€" placeholder="bijv. 200000"
            value={woning.restschuldHypotheek ?? ''}
            onChange={e => updateWoning({ restschuldHypotheek: Number(e.target.value) })}
          />
          {(woning.huidigeWoningWaarde ?? 0) > 0 && (() => {
            const waarde = woning.huidigeWoningWaarde ?? 0;
            const schuld = woning.restschuldHypotheek ?? 0;
            const makelaar = Math.round(waarde * 0.015);
            const notaris = 1_000;
            const netto = Math.max(0, waarde - schuld - makelaar - notaris);
            return (
              <div className="bg-white rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Verkoopprijs</span><span>{euro(waarde)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Restschuld</span><span>−{euro(schuld)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Makelaarskosten (~1,5%)</span><span>−{euro(makelaar)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Notariskosten</span><span>−{euro(notaris)}</span>
                </div>
                <div className="flex justify-between font-semibold text-[#0D1F3C] border-t border-gray-100 pt-1.5">
                  <span>Netto overwaarde</span><span>≈ {euro(netto)}</span>
                </div>
                {netto > 0 && (
                  <button type="button"
                    className="w-full mt-1 text-[10px] text-[#99248F] hover:opacity-75 transition cursor-pointer"
                    onClick={() => updateWoning({ eigenGeld: netto })}>
                    Gebruik als eigen geld →
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      <FormField
        label={adv ? 'In te brengen eigen geld' : 'Spaargeld dat je inbrengt (optioneel)'}
        tooltip={isDoorstromer ? 'Spaargeld + netto overwaarde vorige woning' : 'Spaargeld, schenking of overwaarde vorige woning'}
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
                      ? 'border-[#99248F] bg-[#99248F]/5'
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
