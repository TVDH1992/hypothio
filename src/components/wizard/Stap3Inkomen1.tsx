import { useState } from 'react';
import { useWizard } from '../../context/WizardContext';
import { Button } from '../ui/Button';
import { FormField, Toggle } from '../ui/FormField';

export function Stap3Inkomen1() {
  const { inkomen1, updateInkomen1, situatie, rol, volgende, vorige } = useWizard();
  const [toonExtra, setToonExtra] = useState(false);
  const isValid = (inkomen1.brutoSalaris ?? 0) > 0;
  const adv = rol === 'adviseur';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#0D1F3C]">
          {situatie.metPartner ? (adv ? 'Inkomen aanvrager 1' : 'Wat verdien jij?') : (adv ? 'Inkomen aanvrager' : 'Wat verdien jij?')}
        </h2>
        <p className="text-gray-400 mt-1 text-sm">
          {adv ? 'Gebruik altijd bruto bedragen.' : 'Vul je bruto bedragen in — vóór belasting.'}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-[#0D1F3C]">{adv ? 'Uitbetalingsfrequentie' : 'Hoe ontvang je je salaris?'}</p>
        <div className="flex gap-2">
          {(['maand', 'vierWeken'] as const).map(val => (
            <button key={val} type="button" onClick={() => updateInkomen1({ frequentie: val })}
              className={`flex-1 py-2 px-3 text-sm rounded-lg border transition cursor-pointer
                ${(inkomen1.frequentie ?? 'maand') === val ? 'bg-[#0D1F3C] text-white border-[#0D1F3C]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              {val === 'maand' ? 'Per maand' : 'Per 4 weken'}
            </button>
          ))}
        </div>
      </div>

      <FormField
        label={adv ? `Bruto salaris (per ${inkomen1.frequentie === 'vierWeken' ? '4 weken' : 'maand'})` : `Jouw salaris (per ${inkomen1.frequentie === 'vierWeken' ? '4 weken' : 'maand'})`}
        tooltip={adv ? 'Exclusief vakantiegeld en toeslagen' : 'Het bedrag op je loonstrook, vóór belasting'}
        type="number" min={0} prefix="€" placeholder="0"
        value={inkomen1.brutoSalaris ?? ''}
        onChange={e => updateInkomen1({ brutoSalaris: Number(e.target.value) })}
      />

      <div className="space-y-2">
        <Toggle
          label={adv ? 'Vakantiegeld (8%)' : 'Ik ontvang vakantiegeld'}
          tooltip={adv ? undefined : 'Wordt elke mei uitbetaald — meestal 8% van je jaarsalaris'}
          checked={inkomen1.heeftVakantiegeld ?? true}
          onChange={v => updateInkomen1({ heeftVakantiegeld: v })}
        />
        <Toggle
          label={adv ? '13e maand' : 'Ik ontvang een 13e maand'}
          tooltip={adv ? 'Vaste uitkering gelijk aan één maandsalaris per jaar' : 'Een extra maandsalaris aan het einde van het jaar'}
          checked={inkomen1.heeftDertiendeMaand ?? false}
          onChange={v => updateInkomen1({ heeftDertiendeMaand: v })}
        />
      </div>

      {adv ? (
        <div className="space-y-4">
          <FormField label="ORT / onregelmatigheidstoeslag" tooltip="Gemiddeld per maand over de afgelopen 12 maanden"
            type="number" min={0} prefix="€" placeholder="0" suffix="/mnd"
            value={inkomen1.ortPerMaand ?? ''} onChange={e => updateInkomen1({ ortPerMaand: Number(e.target.value) })} />
          <FormField label="Vaste jaarbonus / winstuitkering"
            type="number" min={0} prefix="€" placeholder="0" suffix="/jaar"
            value={inkomen1.vasterJaarbonus ?? ''} onChange={e => updateInkomen1({ vasterJaarbonus: Number(e.target.value) })} />
          <FormField label="Alimentatie ontvangen" tooltip="Mits vastgelegd en resterende looptijd ≥ 10 jaar"
            type="number" min={0} prefix="€" placeholder="0" suffix="/mnd"
            value={inkomen1.alimentatieOntvangen ?? ''} onChange={e => updateInkomen1({ alimentatieOntvangen: Number(e.target.value) })} />
          <FormField label="Pensioen / AOW"
            type="number" min={0} prefix="€" placeholder="0" suffix="/jaar"
            value={inkomen1.pensioen ?? ''} onChange={e => updateInkomen1({ pensioen: Number(e.target.value) })} />
        </div>
      ) : (
        <div className="space-y-3">
          <Toggle
            label="Ik heb toeslagen of extra inkomen"
            tooltip="Zoals ORT, overwerk, bonus of alimentatie"
            checked={toonExtra}
            onChange={v => { setToonExtra(v); if (!v) updateInkomen1({ ortPerMaand: 0, vasterJaarbonus: 0, alimentatieOntvangen: 0 }); }}
          />
          {toonExtra && (
            <div className="space-y-3 pl-1">
              <FormField label="Toeslagen / ORT" tooltip="Gemiddeld per maand"
                type="number" min={0} prefix="€" placeholder="0" suffix="/mnd"
                value={inkomen1.ortPerMaand ?? ''} onChange={e => updateInkomen1({ ortPerMaand: Number(e.target.value) })} />
              <FormField label="Vaste jaarbonus"
                type="number" min={0} prefix="€" placeholder="0" suffix="/jaar"
                value={inkomen1.vasterJaarbonus ?? ''} onChange={e => updateInkomen1({ vasterJaarbonus: Number(e.target.value) })} />
              <FormField label="Alimentatie ontvangen" tooltip="Structureel, resterende looptijd ≥ 10 jaar"
                type="number" min={0} prefix="€" placeholder="0" suffix="/mnd"
                value={inkomen1.alimentatieOntvangen ?? ''} onChange={e => updateInkomen1({ alimentatieOntvangen: Number(e.target.value) })} />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={vorige}>← Terug</Button>
        <Button onClick={volgende} disabled={!isValid} className="flex-1">Volgende →</Button>
      </div>
    </div>
  );
}
