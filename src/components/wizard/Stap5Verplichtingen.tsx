import { AlertTriangle } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { Button } from '../ui/Button';
import { FormField, Toggle, SelectField } from '../ui/FormField';
import type { StudieschuldStelsel } from '../../types/wizard';

export function Stap5Verplichtingen() {
  const { verplichtingen, updateVerplichtingen, volgende, vorige } = useWizard();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#0D1F3C]">Financiële verplichtingen</h2>
        <p className="text-gray-400 mt-1 text-sm">Laat alles op 0 staan als het niet van toepassing is.</p>
      </div>

      <FormField
        label="Persoonlijke lening (maandlast)"
        tooltip="Vul het maandelijkse termijnbedrag in"
        type="number" min={0} prefix="€" placeholder="0" suffix="/mnd"
        value={verplichtingen.persoonlijkeLening ?? ''}
        onChange={e => updateVerplichtingen({ persoonlijkeLening: Number(e.target.value) })}
      />

      <FormField
        label="Doorlopend krediet — limiet"
        tooltip="We rekenen 2% van de kredietlimiet per maand als last (ook bij €0 saldo)"
        type="number" min={0} prefix="€" placeholder="0"
        value={verplichtingen.doorlopendKredietLimiet ?? ''}
        onChange={e => updateVerplichtingen({ doorlopendKredietLimiet: Number(e.target.value) })}
      />

      <FormField
        label="Creditcard — limiet"
        tooltip="We rekenen 2% van de kaartlimiet per maand als last"
        type="number" min={0} prefix="€" placeholder="0"
        value={verplichtingen.creditcardLimiet ?? ''}
        onChange={e => updateVerplichtingen({ creditcardLimiet: Number(e.target.value) })}
      />

      <FormField
        label="Private lease (maandtermijn)"
        type="number" min={0} prefix="€" placeholder="0" suffix="/mnd"
        value={verplichtingen.privateLease ?? ''}
        onChange={e => updateVerplichtingen({ privateLease: Number(e.target.value) })}
      />

      <FormField
        label="Alimentatie betalen"
        tooltip="Partner- én kinderalimentatie bij elkaar opgeteld"
        type="number" min={0} prefix="€" placeholder="0" suffix="/mnd"
        value={verplichtingen.alimentatieBetalen ?? ''}
        onChange={e => updateVerplichtingen({ alimentatieBetalen: Number(e.target.value) })}
      />

      <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
        <SelectField
          label="Studieschuld (DUO)"
          tooltip="Oud stelsel = geleend vóór 2015 (15 jaar terugbetalen). Nieuw stelsel = ná 2015 (35 jaar)."
          options={[
            { value: 'geen',  label: 'Geen studieschuld' },
            { value: 'oud',   label: 'Oud stelsel (vóór 2015)' },
            { value: 'nieuw', label: 'Nieuw stelsel (ná 2015)' },
          ]}
          value={verplichtingen.studieschuldStelsel ?? 'geen'}
          onChange={e => updateVerplichtingen({ studieschuldStelsel: e.target.value as StudieschuldStelsel })}
        />
        {verplichtingen.studieschuldStelsel && verplichtingen.studieschuldStelsel !== 'geen' && (
          <FormField
            label="Resterende studieschuld"
            tooltip="Actuele restschuld bij DUO (niet de oorspronkelijke schuld)"
            type="number" min={0} prefix="€" placeholder="0"
            value={verplichtingen.studieschuldRestant ?? ''}
            onChange={e => updateVerplichtingen({ studieschuldRestant: Number(e.target.value) })}
          />
        )}
      </div>

      <Toggle
        label="BKR-melding aanwezig"
        tooltip="Een achterstandscodering (A-code) maakt een hypotheek in de meeste gevallen onmogelijk"
        checked={verplichtingen.bkrMelding ?? false}
        onChange={v => updateVerplichtingen({ bkrMelding: v })}
      />

      {verplichtingen.bkrMelding && (
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            Een BKR-melding kan de hypotheekaanvraag bemoeilijken of blokkeren. Bespreek dit met je hypotheekadviseur.
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={vorige}>← Terug</Button>
        <Button onClick={volgende} className="flex-1">Volgende →</Button>
      </div>
    </div>
  );
}
