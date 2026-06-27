import { useState, useRef } from 'react';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { Button } from '../ui/Button';
import { FormField, Toggle } from '../ui/FormField';
import { berekenToetsinkomen } from '../../lib/berekening';
import { LTI_NORMEN } from '../../lib/normen';

function euroKort(n: number) {
  if (n >= 1000) return `€ ${Math.round(n / 1000).toLocaleString('nl-NL')}.000`;
  return `€ ${n.toLocaleString('nl-NL')}`;
}

type UploadStatus = 'idle' | 'laden' | 'succes' | 'fout';

export function Stap3Inkomen1() {
  const { inkomen1, updateInkomen1, situatie, rol, volgende, vorige } = useWizard();
  const [toonExtra, setToonExtra] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadInfo, setUploadInfo] = useState<{ werkgever?: string; periode?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isValid = (inkomen1.brutoSalaris ?? 0) > 0;
  const adv = rol === 'adviseur';

  const toetsinkomen = berekenToetsinkomen(inkomen1);
  const ltiFactor = toetsinkomen > 0
    ? (LTI_NORMEN.find(r => toetsinkomen <= r.maxInkomen)?.factor ?? LTI_NORMEN[LTI_NORMEN.length - 1].factor)
    : 0;
  const liveSchatting = toetsinkomen > 0 ? Math.round(toetsinkomen * ltiFactor / 1000) * 1000 : 0;

  async function verwerkBestand(file: File) {
    setUploadStatus('laden');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/loonstrook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mediaType: file.type }),
      });

      if (!res.ok) throw new Error('Lezen mislukt');
      const data = await res.json();
      updateInkomen1({
        brutoSalaris:        data.brutoMaandSalaris || undefined,
        frequentie:          data.frequentie ?? 'maand',
        heeftVakantiegeld:   data.heeftVakantiegeld ?? true,
        heeftDertiendeMaand: data.heeftDertiendeMaand ?? false,
        ortPerMaand:         data.ortPerMaand || undefined,
        vasterJaarbonus:     data.vasterJaarbonus || undefined,
      });
      if (data.werkgever || data.periode) {
        setUploadInfo({ werkgever: data.werkgever, periode: data.periode });
      }
      setUploadStatus('succes');
    } catch {
      setUploadStatus('fout');
    }
  }

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
              ${uploadStatus === 'succes'
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-gray-200 hover:border-[#99248F] hover:bg-[#99248F]/5'}`}
          >
            {uploadStatus === 'laden' && <Loader2 className="w-5 h-5 text-[#99248F] animate-spin" />}
            {uploadStatus === 'succes' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            {(uploadStatus === 'idle' || uploadStatus === 'fout') && <Upload className="w-5 h-5 text-[#99248F]" />}
            <div className="text-left">
              <p className={`text-sm font-medium ${uploadStatus === 'succes' ? 'text-emerald-700' : 'text-[#0D1F3C]'}`}>
                {uploadStatus === 'laden' && 'Loonstrook lezen...'}
                {uploadStatus === 'succes' && 'Gegevens ingevuld!'}
                {uploadStatus === 'fout'   && 'Kon het niet lezen — probeer opnieuw'}
                {uploadStatus === 'idle'   && 'Loonstrook uploaden (optioneel)'}
              </p>
              <p className="text-xs text-gray-400">
                {uploadStatus === 'succes' && uploadInfo
                  ? [uploadInfo.werkgever, uploadInfo.periode].filter(Boolean).join(' · ')
                  : 'PDF of foto — we lezen je salaris automatisch uit'}
              </p>
            </div>
          </button>
        </div>
      )}

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

      {/* Live preview — alleen voor consument, zodra er iets ingevuld is */}
      {!adv && liveSchatting > 0 && (
        <div className="animate-fade-up flex items-center justify-between bg-[#0D1F3C]/5 rounded-xl p-3.5">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Globale schatting</p>
            <p className="text-xl font-bold text-[#0D1F3C]">{euroKort(liveSchatting)}</p>
          </div>
          <p className="text-xs text-gray-400 text-right leading-relaxed">
            op basis van<br />dit inkomen
          </p>
        </div>
      )}

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
