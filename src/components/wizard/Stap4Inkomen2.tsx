import { useState, useRef } from 'react';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { Button } from '../ui/Button';
import { FormField, Toggle } from '../ui/FormField';

type UploadStatus = 'idle' | 'laden' | 'succes' | 'fout';

export function Stap4Inkomen2() {
  const { inkomen2, updateInkomen2, rol, volgende, vorige } = useWizard();
  const [toonExtra, setToonExtra] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const fileRef = useRef<HTMLInputElement>(null);
  const isValid = (inkomen2.brutoSalaris ?? 0) > 0;
  const adv = rol === 'adviseur';

  async function verwerkBestand(file: File) {
    setUploadStatus('laden');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/loonstrook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mediaType: file.type }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      updateInkomen2({ brutoSalaris: data.brutoMaandSalaris });
      setUploadStatus('succes');
    } catch {
      setUploadStatus('fout');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#0D1F3C]">
          {adv ? 'Inkomen aanvrager 2' : 'Wat verdient je partner?'}
        </h2>
        <p className="text-gray-400 mt-1 text-sm">
          {adv ? 'Gebruik altijd bruto bedragen.' : 'Vul de bruto bedragen van je partner in.'}
        </p>
      </div>

      {!adv && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) verwerkBestand(f); }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadStatus === 'laden'}
            className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed transition cursor-pointer
              ${uploadStatus === 'succes' ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-[#8B35C0] hover:bg-[#8B35C0]/5'}`}
          >
            {uploadStatus === 'laden' && <Loader2 className="w-5 h-5 text-[#8B35C0] animate-spin" />}
            {uploadStatus === 'succes' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            {(uploadStatus === 'idle' || uploadStatus === 'fout') && <Upload className="w-5 h-5 text-[#8B35C0]" />}
            <div className="text-left">
              <p className={`text-sm font-medium ${uploadStatus === 'succes' ? 'text-emerald-700' : 'text-[#0D1F3C]'}`}>
                {uploadStatus === 'laden' && 'Loonstrook lezen...'}
                {uploadStatus === 'succes' && 'Salaris partner ingevuld!'}
                {uploadStatus === 'fout'   && 'Niet gelukt — probeer opnieuw'}
                {uploadStatus === 'idle'   && 'Loonstrook partner uploaden (optioneel)'}
              </p>
              <p className="text-xs text-gray-400">PDF of foto — we lezen het bedrag automatisch uit</p>
            </div>
          </button>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-[#0D1F3C]">{adv ? 'Uitbetalingsfrequentie' : 'Hoe ontvangt je partner het salaris?'}</p>
        <div className="flex gap-2">
          {(['maand', 'vierWeken'] as const).map(val => (
            <button key={val} type="button" onClick={() => updateInkomen2({ frequentie: val })}
              className={`flex-1 py-2 px-3 text-sm rounded-lg border transition cursor-pointer
                ${(inkomen2.frequentie ?? 'maand') === val ? 'bg-[#0D1F3C] text-white border-[#0D1F3C]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              {val === 'maand' ? 'Per maand' : 'Per 4 weken'}
            </button>
          ))}
        </div>
      </div>

      <FormField
        label={adv ? `Bruto salaris (per ${inkomen2.frequentie === 'vierWeken' ? '4 weken' : 'maand'})` : `Salaris partner (per ${inkomen2.frequentie === 'vierWeken' ? '4 weken' : 'maand'})`}
        tooltip={adv ? 'Exclusief vakantiegeld en toeslagen' : 'Het bedrag op de loonstrook, vóór belasting'}
        type="number" min={0} prefix="€" placeholder="0"
        value={inkomen2.brutoSalaris ?? ''}
        onChange={e => updateInkomen2({ brutoSalaris: Number(e.target.value) })}
      />

      <div className="space-y-2">
        <Toggle
          label={adv ? 'Vakantiegeld (8%)' : 'Partner ontvangt vakantiegeld'}
          checked={inkomen2.heeftVakantiegeld ?? true}
          onChange={v => updateInkomen2({ heeftVakantiegeld: v })}
        />
        <Toggle
          label={adv ? '13e maand' : 'Partner ontvangt een 13e maand'}
          checked={inkomen2.heeftDertiendeMaand ?? false}
          onChange={v => updateInkomen2({ heeftDertiendeMaand: v })}
        />
      </div>

      {adv ? (
        <div className="space-y-4">
          <FormField label="ORT / onregelmatigheidstoeslag"
            type="number" min={0} prefix="€" placeholder="0" suffix="/mnd"
            value={inkomen2.ortPerMaand ?? ''} onChange={e => updateInkomen2({ ortPerMaand: Number(e.target.value) })} />
          <FormField label="Vaste jaarbonus / winstuitkering"
            type="number" min={0} prefix="€" placeholder="0" suffix="/jaar"
            value={inkomen2.vasterJaarbonus ?? ''} onChange={e => updateInkomen2({ vasterJaarbonus: Number(e.target.value) })} />
          <FormField label="Alimentatie ontvangen" tooltip="Mits vastgelegd en resterende looptijd ≥ 10 jaar"
            type="number" min={0} prefix="€" placeholder="0" suffix="/mnd"
            value={inkomen2.alimentatieOntvangen ?? ''} onChange={e => updateInkomen2({ alimentatieOntvangen: Number(e.target.value) })} />
        </div>
      ) : (
        <div className="space-y-3">
          <Toggle
            label="Partner heeft toeslagen of extra inkomen"
            tooltip="Zoals ORT, overwerk, bonus of alimentatie"
            checked={toonExtra}
            onChange={v => { setToonExtra(v); if (!v) updateInkomen2({ ortPerMaand: 0, vasterJaarbonus: 0, alimentatieOntvangen: 0 }); }}
          />
          {toonExtra && (
            <div className="space-y-3 pl-1">
              <FormField label="Toeslagen / ORT" tooltip="Gemiddeld per maand"
                type="number" min={0} prefix="€" placeholder="0" suffix="/mnd"
                value={inkomen2.ortPerMaand ?? ''} onChange={e => updateInkomen2({ ortPerMaand: Number(e.target.value) })} />
              <FormField label="Vaste jaarbonus"
                type="number" min={0} prefix="€" placeholder="0" suffix="/jaar"
                value={inkomen2.vasterJaarbonus ?? ''} onChange={e => updateInkomen2({ vasterJaarbonus: Number(e.target.value) })} />
              <FormField label="Alimentatie ontvangen"
                type="number" min={0} prefix="€" placeholder="0" suffix="/mnd"
                value={inkomen2.alimentatieOntvangen ?? ''} onChange={e => updateInkomen2({ alimentatieOntvangen: Number(e.target.value) })} />
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
