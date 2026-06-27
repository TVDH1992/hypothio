import { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, CheckCircle, XCircle, RotateCcw, User } from 'lucide-react';
import { useWizard } from '../context/WizardContext';
import { Button } from './ui/Button';
import { FormField } from './ui/FormField';
import {
  laadProfiel, slaProfielOp, laadWoningen, voegWoningToe, verwijderWoning,
  parseFundaUrl, verwijderProfiel,
} from '../lib/profiel';
import type { Profiel, GeslaagdeWoning } from '../types/profiel';

function euro(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export function ProfielView() {
  const { resultaat, sessie, setStap } = useWizard();
  const [profiel, setProfiel] = useState<Profiel | null>(laadProfiel);
  const [woningen, setWoningen] = useState<GeslaagdeWoning[]>(laadWoningen);
  const [fundaUrl, setFundaUrl] = useState('');
  const [vraagprijs, setVraagprijs] = useState('');
  const [urlFout, setUrlFout] = useState('');
  const [toonWoningForm, setToonWoningForm] = useState(false);

  const maxHypotheek = profiel?.maxHypotheek ?? resultaat?.effectieveMaxHypotheek ?? 0;

  useEffect(() => {
    if (!profiel && resultaat) {
      const nieuw: Profiel = {
        id: Date.now().toString(),
        naam: sessie.naam,
        aangemaakt: new Date().toLocaleDateString('nl-NL'),
        maxHypotheek: resultaat.effectieveMaxHypotheek,
        resultaat,
      };
      slaProfielOp(nieuw);
      setProfiel(nieuw);
    }
  }, [resultaat]);

  function voegToe() {
    const parsed = parseFundaUrl(fundaUrl);
    const prijs = Number(vraagprijs);

    if (!parsed.geldig) {
      setUrlFout('Geen geldige Funda URL. Plak de volledige link van de woningpagina.');
      return;
    }
    if (!prijs || prijs < 10_000) {
      setUrlFout('Vul een geldige vraagprijs in.');
      return;
    }

    const woning: GeslaagdeWoning = {
      id: Date.now().toString(),
      fundaUrl: fundaUrl.trim(),
      adres: parsed.adres,
      stad: parsed.stad,
      vraagprijs: prijs,
      toegevoegd: new Date().toLocaleDateString('nl-NL'),
    };

    voegWoningToe(woning);
    setWoningen(laadWoningen());
    setFundaUrl('');
    setVraagprijs('');
    setUrlFout('');
    setToonWoningForm(false);
  }

  function verwijder(id: string) {
    verwijderWoning(id);
    setWoningen(laadWoningen());
  }

  function reset() {
    verwijderProfiel();
    setStap(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#1ABC9C]/10 rounded-full flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-[#1ABC9C]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0D1F3C]">Hoi {sessie.naam}</h2>
          <p className="text-xs text-gray-400">
            {profiel ? `Berekening van ${profiel.aangemaakt}` : 'Voeg woningen toe en check je budget'}
          </p>
        </div>
      </div>

      {/* Budget chip */}
      <div className="bg-[#0D1F3C] text-white rounded-xl px-5 py-4 flex justify-between items-center">
        <p className="text-sm text-white/60">Jouw maximale hypotheek</p>
        <p className="text-2xl font-bold">{euro(maxHypotheek)}</p>
      </div>

      {/* Geen resultaat nog */}
      {!resultaat && !profiel && (
        <div className="text-center py-8 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <p className="text-sm">Doe eerst een berekening om je profiel te activeren.</p>
          <button type="button" onClick={() => setStap(1)} className="text-sm text-[#1ABC9C] mt-2 hover:opacity-75 transition cursor-pointer">
            Start berekening →
          </button>
        </div>
      )}

      {/* Woningen */}
      {profiel && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0D1F3C]">Mijn woningen</p>
            <button
              type="button"
              onClick={() => setToonWoningForm(v => !v)}
              className="flex items-center gap-1.5 text-xs text-[#1ABC9C] font-medium hover:opacity-75 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Woning toevoegen
            </button>
          </div>

          {/* Woning toevoegen form */}
          {toonWoningForm && (
            <div className="bg-white rounded-2xl border border-[#1ABC9C]/30 p-5 space-y-4">
              <FormField
                label="Funda link"
                tooltip="Plak de volledige URL van de woningpagina op Funda"
                placeholder="https://www.funda.nl/koop/amsterdam/huis-..."
                value={fundaUrl}
                onChange={e => { setFundaUrl(e.target.value); setUrlFout(''); }}
              />
              <FormField
                label="Vraagprijs"
                tooltip="De vraagprijs zoals vermeld op Funda"
                prefix="€"
                type="number"
                min={0}
                placeholder="350000"
                value={vraagprijs}
                onChange={e => setVraagprijs(e.target.value)}
              />
              {urlFout && <p className="text-xs text-red-500">{urlFout}</p>}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setToonWoningForm(false)}>Annuleer</Button>
                <Button size="sm" onClick={voegToe} disabled={!fundaUrl || !vraagprijs} className="flex-1">
                  Toevoegen
                </Button>
              </div>
            </div>
          )}

          {/* Woningenlijst */}
          {woningen.length === 0 && !toonWoningForm && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Nog geen woningen toegevoegd.</p>
              <p className="text-xs mt-1">Plak een Funda link om te checken of een woning past.</p>
            </div>
          )}

          {woningen.map(w => {
            const past = w.vraagprijs <= maxHypotheek;
            const verschil = Math.abs(w.vraagprijs - maxHypotheek);
            return (
              <div key={w.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {past
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      }
                      <p className="text-sm font-semibold text-[#0D1F3C] truncate">{w.adres}</p>
                    </div>
                    <p className="text-xs text-gray-400 ml-6">{w.stad} · toegevoegd {w.toegevoegd}</p>
                    <div className="ml-6 mt-2 flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-[#0D1F3C]">{euro(w.vraagprijs)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${past ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {past ? `${euro(verschil)} onder budget` : `${euro(verschil)} boven budget`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={w.fundaUrl} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-[#0D1F3C] transition">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button type="button" onClick={() => verwijder(w.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Acties */}
      <div className="pt-2 space-y-2">
        <Button variant="ghost" onClick={() => setStap(8)} className="w-full">
          ← Terug naar resultaten
        </Button>
        <button type="button" onClick={reset}
          className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 py-2 transition cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" /> Nieuwe berekening starten
        </button>
      </div>
    </div>
  );
}
