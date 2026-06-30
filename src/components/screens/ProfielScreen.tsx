import { useRef, useState } from 'react';
import { RotateCcw, LogOut, Calculator, Upload, CheckCircle, Loader2, Users, Pencil, X, Check } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { verwijderProfiel } from '../../lib/profiel';
import { supabase } from '../../lib/supabase';

type UploadStatus = 'idle' | 'laden' | 'succes' | 'fout';

function euro(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function LoonstrookUpload({
  label,
  bedrag,
  onBedrag,
}: {
  label: string;
  bedrag: number | null;
  onBedrag: (b: number) => void;
}) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  async function verwerkBestand(file: File) {
    setStatus('laden');
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
      onBedrag(data.brutoMaandSalaris);
      setStatus('succes');
    } catch {
      setStatus('fout');
    }
  }

  const isSucces = status === 'succes' || bedrag !== null;

  return (
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
        disabled={status === 'laden'}
        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition cursor-pointer text-left
          ${isSucces ? 'border-emerald-300 bg-emerald-50' : 'border-dashed border-gray-200 hover:border-[#99248F] hover:bg-[#99248F]/5'}`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          ${isSucces ? 'bg-emerald-100' : 'bg-gray-100'}`}>
          {status === 'laden'
            ? <Loader2 className="w-5 h-5 text-[#99248F] animate-spin" />
            : isSucces
            ? <CheckCircle className="w-5 h-5 text-emerald-500" />
            : <Upload className="w-5 h-5 text-gray-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${isSucces ? 'text-emerald-700' : 'text-[#0D1F3C]'}`}>{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {status === 'laden' && 'Even geduld, we lezen je loonstrook...'}
            {status === 'fout'   && 'Niet gelukt — probeer opnieuw'}
            {isSucces && bedrag  ? `Bruto salaris: ${euro(bedrag)}/mnd` : !isSucces ? 'PDF of foto uploaden' : ''}
          </p>
        </div>
        {isSucces && (
          <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg font-medium shrink-0">
            Ingevuld
          </span>
        )}
      </button>
    </div>
  );
}

interface Props {
  onUitloggen: () => void;
}

export function ProfielScreen({ onUitloggen }: Props) {
  const { resultaat, sessie, setStap, updateInkomen1, updateInkomen2, situatie } = useWizard();
  const { setTab } = useApp();
  const [salaris1, setSalaris1] = useState<number | null>(null);
  const [salaris2, setSalaris2] = useState<number | null>(null);
  const [bewerkNaam, setBewerkNaam] = useState(false);
  const [nieuweNaam, setNieuweNaam] = useState(sessie.naam);
  const [naamLaden, setNaamLaden] = useState(false);

  async function slaaNaamOp() {
    const naam = nieuweNaam.trim();
    if (!naam || naam === sessie.naam) { setBewerkNaam(false); return; }
    setNaamLaden(true);
    await supabase.auth.updateUser({ data: { naam } });
    setNaamLaden(false);
    setBewerkNaam(false);
  }

  function startMetLoonstroken() {
    if (salaris1) updateInkomen1({ brutoSalaris: salaris1 });
    if (salaris2) updateInkomen2({ brutoSalaris: salaris2 });
    setStap(salaris1 ? 2 : 1);
    setTab('berekenen');
  }

  function nieuweBerekening() {
    verwijderProfiel();
    setStap(1);
    setTab('berekenen');
  }

  return (
    <div className="space-y-6">
      {/* Account */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#0D1F3C] rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-lg font-bold">{sessie.naam.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            {bewerkNaam ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={nieuweNaam}
                  onChange={e => setNieuweNaam(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') slaaNaamOp(); if (e.key === 'Escape') setBewerkNaam(false); }}
                  className="flex-1 text-sm font-semibold text-[#0D1F3C] border-b border-[#99248F] outline-none bg-transparent pb-0.5"
                  placeholder="Jouw naam"
                />
                <button type="button" onClick={slaaNaamOp} disabled={naamLaden}
                  className="text-emerald-500 hover:text-emerald-600 cursor-pointer transition">
                  {naamLaden ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => { setBewerkNaam(false); setNieuweNaam(sessie.naam); }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-[#0D1F3C] truncate">{sessie.naam}</p>
                <button type="button" onClick={() => setBewerkNaam(true)}
                  className="text-gray-300 hover:text-[#99248F] cursor-pointer transition shrink-0">
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 truncate">{sessie.email}</p>
          </div>
        </div>
      </div>

      {/* Loonstroken uploaden */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4 text-[#99248F]" />
          <p className="text-sm font-semibold text-[#0D1F3C]">Loonstroken uploaden</p>
        </div>
        <p className="text-xs text-gray-400 -mt-2">Upload je loonstrook — we vullen je salaris automatisch in.</p>

        <LoonstrookUpload
          label="Jouw loonstrook"
          bedrag={salaris1}
          onBedrag={b => setSalaris1(b)}
        />
        <LoonstrookUpload
          label="Loonstrook partner (optioneel)"
          bedrag={salaris2}
          onBedrag={b => setSalaris2(b)}
        />

        {salaris1 && (
          <Button onClick={startMetLoonstroken} className="w-full mt-2">
            Berekening starten →
          </Button>
        )}
      </div>

      {/* Berekening resultaat */}
      {resultaat ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#0D1F3C]">Jouw berekening</p>
          <div className="bg-[#0D1F3C] text-white rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-white/60">Maximale hypotheek</p>
              <p className="text-2xl font-bold">{euro(resultaat.effectieveMaxHypotheek)}</p>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between text-sm">
              <span className="text-white/60">Bruto maandlast</span>
              <span>{euro(resultaat.brutoMaandlast)}/mnd</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Netto maandlast</span>
              <span>{euro(Math.max(0, resultaat.nettoMaandlast))}/mnd</span>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setTab('berekenen')} className="w-full">
            <Calculator className="w-4 h-4" /> Bekijk resultaat
          </Button>
        </div>
      ) : (
        <div className="text-center py-6 bg-white rounded-2xl border border-gray-100">
          <Calculator className="w-8 h-8 mx-auto mb-2 text-gray-200" />
          <p className="text-sm text-gray-400">Nog geen berekening gedaan.</p>
          <button type="button" onClick={() => { setStap(1); setTab('berekenen'); }}
            className="text-sm text-[#99248F] mt-2 hover:opacity-75 transition cursor-pointer">
            Start een berekening →
          </button>
        </div>
      )}

      {/* Acties */}
      <div className="space-y-2">
        <button type="button" onClick={nieuweBerekening}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 py-3 border border-gray-200 rounded-xl transition cursor-pointer">
          <RotateCcw className="w-4 h-4" /> Nieuwe berekening starten
        </button>
        <button type="button" onClick={onUitloggen}
          className="w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-600 py-3 border border-red-100 rounded-xl transition cursor-pointer">
          <LogOut className="w-4 h-4" /> Uitloggen
        </button>
      </div>

      <p className="text-xs text-center text-gray-300 pb-4">
        Hypothio · Gegevens veilig opgeslagen via Supabase
      </p>
    </div>
  );
}
