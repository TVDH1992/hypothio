import { useState, useRef, useEffect } from 'react';
import {
  Search, CheckCircle, XCircle, AlertTriangle, ExternalLink,
  Trash2, Plus, TrendingUp, Gavel, Info, Loader2,
} from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import {
  zoekAdres, haalWozWaarde, schatMarktwaarde, biedadvies,
  type AdresSuggestie, type WozResultaat,
} from '../../lib/woz';
import {
  laadWoningen, voegWoningToe, verwijderWoning,
  parseFundaUrl, laadProfiel,
} from '../../lib/profiel';
import type { GeslaagdeWoning } from '../../types/profiel';

function euro(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

type WozStatus = 'idle' | 'zoeken' | 'laden' | 'klaar' | 'fout';

interface WozAnalyse {
  adres: string;
  woz: WozResultaat;
  marktwaarde: number;
  vraagprijs: number | null;
}

export function WoningenScreen() {
  const { resultaat } = useWizard();
  const profiel = laadProfiel();
  const maxHypotheek = profiel?.maxHypotheek ?? resultaat?.effectieveMaxHypotheek ?? 0;

  // --- WOZ analyse ---
  const [zoekterm, setZoekterm] = useState('');
  const [suggesties, setSuggesties] = useState<AdresSuggestie[]>([]);
  const [geselecteerd, setGeselecteerd] = useState<AdresSuggestie | null>(null);
  const [wozVraagprijs, setWozVraagprijs] = useState('');
  const [wozStatus, setWozStatus] = useState<WozStatus>('idle');
  const [wozAnalyse, setWozAnalyse] = useState<WozAnalyse | null>(null);
  const [wozFout, setWozFout] = useState('');
  const zoekTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Opgeslagen woningen ---
  const [woningen, setWoningen] = useState<GeslaagdeWoning[]>(laadWoningen);
  const [toonFundaForm, setToonFundaForm] = useState(false);
  const [fundaUrl, setFundaUrl] = useState('');
  const [fundaPrijs, setFundaPrijs] = useState('');
  const [fundaFout, setFundaFout] = useState('');
  const [fundaLaden, setFundaLaden] = useState(false);
  const [fundaGevonden, setFundaGevonden] = useState<{ adres: string; stad: string; type?: string } | null>(null);
  const [fundaAnalyse, setFundaAnalyse] = useState<{
    marktwaarde: number;
    biedadvies: string;
    vraagprijsOordeel: string;
    aandachtspunten: string[];
    pluspunten: string[];
    samenvatting: string;
  } | null>(null);

  useEffect(() => {
    if (!geselecteerd && zoekterm.length >= 4) {
      if (zoekTimeout.current) clearTimeout(zoekTimeout.current);
      setWozStatus('zoeken');
      zoekTimeout.current = setTimeout(async () => {
        try {
          const results = await zoekAdres(zoekterm);
          setSuggesties(results);
          setWozStatus('idle');
        } catch {
          setSuggesties([]);
          setWozStatus('idle');
        }
      }, 350);
    } else if (zoekterm.length < 4) {
      setSuggesties([]);
      setWozStatus('idle');
    }
    return () => { if (zoekTimeout.current) clearTimeout(zoekTimeout.current); };
  }, [zoekterm, geselecteerd]);

  async function analyseer() {
    if (!geselecteerd) return;
    setWozStatus('laden');
    setWozFout('');
    setWozAnalyse(null);
    try {
      const woz = await haalWozWaarde(geselecteerd.nummeraanduidingId);
      const marktwaarde = schatMarktwaarde(woz.wozWaarde);
      const vp = wozVraagprijs ? Number(wozVraagprijs) : null;
      setWozAnalyse({ adres: geselecteerd.weergavenaam, woz, marktwaarde, vraagprijs: vp });
      setWozStatus('klaar');
    } catch (e) {
      setWozFout((e as Error).message ?? 'Onbekende fout');
      setWozStatus('fout');
    }
  }

  function kiesAdres(s: AdresSuggestie) {
    setGeselecteerd(s);
    setZoekterm(s.weergavenaam);
    setSuggesties([]);
  }

  function resetWoz() {
    setGeselecteerd(null);
    setZoekterm('');
    setWozVraagprijs('');
    setWozStatus('idle');
    setWozAnalyse(null);
    setWozFout('');
  }

  async function verwerkFundaUrl(url: string) {
    setFundaUrl(url);
    setFundaFout('');
    setFundaGevonden(null);
    setFundaAnalyse(null);
    setFundaPrijs('');
    const parsed = parseFundaUrl(url);
    if (!parsed.geldig || !url.includes('funda.nl')) return;
    setFundaLaden(true);

    const type = url.includes('/appartement') ? 'appartement' : 'huis';
    let wozWaarde: number | undefined;
    let peildatum: string | undefined;

    // Probeer prijs direct van Funda pagina te halen
    try {
      const fundaRes = await fetch('/api/funda-prijs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (fundaRes.ok) {
        const { prijs } = await fundaRes.json();
        if (prijs) setFundaPrijs(String(prijs));
      }
    } catch { /* niet beschikbaar */ }

    // WOZ lookup voor marktwaarde context
    try {
      const suggesties = await zoekAdres(`${parsed.adres} ${parsed.stad}`);
      if (suggesties.length > 0) {
        const woz = await haalWozWaarde(suggesties[0].nummeraanduidingId);
        wozWaarde = woz.wozWaarde;
        peildatum = woz.peildatum;
        if (!fundaPrijs) setFundaPrijs(String(schatMarktwaarde(woz.wozWaarde)));
      }
    } catch { /* WOZ niet beschikbaar */ }

    setFundaGevonden({ adres: parsed.adres, stad: parsed.stad, type });

    // Claude analyse — apart zodat WOZ falen het niet blokkeert
    try {
      const analyseRes = await fetch('/api/woninganalyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adres: parsed.adres, stad: parsed.stad, type, wozWaarde, peildatum }),
      });
      if (analyseRes.ok) {
        const analyse = await analyseRes.json();
        setFundaAnalyse(analyse);
        if (analyse.marktwaarde && !wozWaarde) setFundaPrijs(String(analyse.marktwaarde));
      }
    } catch { /* Claude niet beschikbaar */ }

    setFundaLaden(false);
  }

  function voegFundaToe() {
    const parsed = fundaGevonden ?? parseFundaUrl(fundaUrl);
    if (!parsed.adres) { setFundaFout('Geen geldige Funda URL.'); return; }
    const prijs = Number(fundaPrijs) || fundaAnalyse?.marktwaarde || 0;
    voegWoningToe({
      id: Date.now().toString(),
      fundaUrl: fundaUrl.trim(),
      adres: parsed.adres,
      stad: parsed.stad,
      vraagprijs: prijs,
      marktwaarde: fundaGevonden ? Number(fundaPrijs) : undefined,
      toegevoegd: new Date().toLocaleDateString('nl-NL'),
    });
    setWoningen(laadWoningen());
    setFundaUrl(''); setFundaPrijs(''); setFundaFout('');
    setFundaGevonden(null); setToonFundaForm(false);
  }

  function verwijder(id: string) {
    verwijderWoning(id);
    setWoningen(laadWoningen());
  }

  const advies = wozAnalyse?.vraagprijs
    ? biedadvies(wozAnalyse.vraagprijs, wozAnalyse.marktwaarde)
    : null;

  const kleurMap = { groen: 'emerald', oranje: 'amber', rood: 'red' } as const;

  return (
    <div className="space-y-6 pb-4">

      {/* WOZ Analyser */}
      <div>
        <h2 className="text-xl font-bold text-[#0D1F3C] mb-1">Woning analyseren</h2>
        <p className="text-sm text-gray-400 mb-4">Zoek een adres op en zie de WOZ-waarde, geschatte marktwaarde en biedadvies.</p>

        {/* Zoekbalk */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-[#0D1F3C] bg-white focus:outline-none focus:ring-2 focus:ring-[#1ABC9C] focus:border-transparent transition placeholder:text-gray-300 text-sm"
              placeholder="bijv. Dorpsstraat 1 Amsterdam"
              value={zoekterm}
              onChange={e => { setZoekterm(e.target.value); setGeselecteerd(null); setWozAnalyse(null); }}
            />
            {geselecteerd && (
              <button type="button" onClick={resetWoz}
                className="absolute right-3 text-gray-400 hover:text-gray-600 text-xs cursor-pointer">
                ✕
              </button>
            )}
          </div>

          {/* Suggesties dropdown */}
          {suggesties.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-100 shadow-lg z-20 overflow-hidden">
              {suggesties.map(s => (
                <button key={s.pdokId} type="button" onClick={() => kiesAdres(s)}
                  className="w-full text-left px-4 py-3 text-sm text-[#0D1F3C] hover:bg-gray-50 border-b border-gray-50 last:border-0 transition cursor-pointer">
                  {s.weergavenaam}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Optionele vraagprijs + knop */}
        {geselecteerd && (
          <div className="mt-3 space-y-3">
            <FormField
              label="Vraagprijs (optioneel)"
              tooltip="Vul de vraagprijs in voor biedadvies"
              type="number" min={0} prefix="€" placeholder="350000"
              value={wozVraagprijs}
              onChange={e => setWozVraagprijs(e.target.value)}
            />
            <Button onClick={analyseer} disabled={wozStatus === 'laden'} className="w-full">
              {wozStatus === 'laden' ? 'Bezig met ophalen...' : 'Analyseer woning'}
            </Button>
          </div>
        )}

        {/* Foutmelding */}
        {wozStatus === 'fout' && (
          <div className="mt-3 flex gap-2 items-start p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-sm">{wozFout}</p>
          </div>
        )}

        {/* Resultaat */}
        {wozStatus === 'klaar' && wozAnalyse && (
          <div className="mt-4 space-y-3">
            {/* Header */}
            <div className="bg-[#0D1F3C] text-white rounded-2xl p-5">
              <p className="text-xs text-white/50 mb-0.5 truncate">{wozAnalyse.adres}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-white/60 mt-3">WOZ-waarde {new Date(wozAnalyse.woz.peildatum).getFullYear()}</p>
                  <p className="text-3xl font-bold">{euro(wozAnalyse.woz.wozWaarde)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#1ABC9C]/80">Geschatte marktwaarde</p>
                  <p className="text-xl font-bold text-[#1ABC9C]">{euro(wozAnalyse.marktwaarde)}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">WOZ × 1,10 (indicatief)</p>
                </div>
              </div>
            </div>

            {/* Biedadvies */}
            {advies && wozAnalyse.vraagprijs && (
              <div className={`p-4 rounded-xl bg-${kleurMap[advies.kleur]}-50 border border-${kleurMap[advies.kleur]}-200`}>
                <div className="flex items-start gap-3">
                  <Gavel className={`w-5 h-5 shrink-0 mt-0.5 text-${kleurMap[advies.kleur]}-600`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-semibold text-${kleurMap[advies.kleur]}-800`}>{advies.label}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-${kleurMap[advies.kleur]}-100 text-${kleurMap[advies.kleur]}-700`}>
                        Vraagprijs {euro(wozAnalyse.vraagprijs)}
                      </span>
                    </div>
                    <p className={`text-xs text-${kleurMap[advies.kleur]}-700`}>{advies.toelichting}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Budget check */}
            {maxHypotheek > 0 && wozAnalyse.vraagprijs && (
              <div className={`flex items-center gap-3 p-3.5 rounded-xl ${wozAnalyse.vraagprijs <= maxHypotheek ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                {wozAnalyse.vraagprijs <= maxHypotheek
                  ? <CheckCircle className="w-5 h-5 shrink-0" />
                  : <XCircle className="w-5 h-5 shrink-0" />
                }
                <p className="text-sm font-medium">
                  {wozAnalyse.vraagprijs <= maxHypotheek
                    ? `Past binnen jouw budget (max ${euro(maxHypotheek)})`
                    : `Boven jouw budget van ${euro(maxHypotheek)} — tekort ${euro(wozAnalyse.vraagprijs - maxHypotheek)}`}
                </p>
              </div>
            )}

            {/* Info disclaimer */}
            <div className="flex gap-2 p-3 bg-gray-50 rounded-xl">
              <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400">
                WOZ-waarde is de officiële belastinggrondslag (peildatum {new Date(wozAnalyse.woz.peildatum).toLocaleDateString('nl-NL')}). Marktwaarde is een indicatie — laat een taxatie uitvoeren voor zekerheid.
              </p>
            </div>

            <button type="button" onClick={resetWoz}
              className="text-xs text-[#1ABC9C] hover:opacity-75 transition cursor-pointer">
              ← Nieuw adres zoeken
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100" />

      {/* Opgeslagen woningen */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#0D1F3C]">Opgeslagen woningen</h2>
            {maxHypotheek > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">Budget: {euro(maxHypotheek)}</p>
            )}
          </div>
          <button type="button" onClick={() => setToonFundaForm(v => !v)}
            className="flex items-center gap-1.5 text-xs text-[#1ABC9C] font-medium hover:opacity-75 transition cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Toevoegen
          </button>
        </div>

        {/* Funda form */}
        {toonFundaForm && (
          <div className="bg-white rounded-2xl border border-[#1ABC9C]/30 p-5 space-y-4 mb-4">
            <FormField label="Funda link" placeholder="https://www.funda.nl/koop/..."
              tooltip="Plak de Funda URL — we halen de waarde automatisch op"
              value={fundaUrl} onChange={e => verwerkFundaUrl(e.target.value)} />

            {fundaLaden && (
              <div className="flex items-center gap-2 py-2 text-sm text-[#1ABC9C]">
                <Loader2 className="w-4 h-4 animate-spin" /> Woning analyseren...
              </div>
            )}

            {fundaGevonden && !fundaLaden && (
              <div className="bg-emerald-50 rounded-xl px-3 py-2 text-xs text-emerald-700">
                Gevonden: <span className="font-medium">{fundaGevonden.adres}, {fundaGevonden.stad}</span>
              </div>
            )}

            {fundaAnalyse && !fundaLaden && (
              <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-[#0D1F3C]">Woninganalyse</p>

                <div className="bg-white rounded-lg p-3 space-y-1">
                  <p className="text-xs text-gray-400">Geschatte marktwaarde</p>
                  <p className="text-lg font-bold text-[#0D1F3C]">{euro(fundaAnalyse.marktwaarde)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block
                    ${fundaAnalyse.vraagprijsOordeel === 'Scherp geprijsd' ? 'bg-emerald-100 text-emerald-700'
                    : fundaAnalyse.vraagprijsOordeel === 'Marktconform' ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700'}`}>
                    {fundaAnalyse.vraagprijsOordeel}
                  </span>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs font-medium text-[#0D1F3C] mb-1 flex items-center gap-1">
                    <Gavel className="w-3.5 h-3.5 text-[#1ABC9C]" /> Biedadvies
                  </p>
                  <p className="text-sm text-gray-700">{fundaAnalyse.biedadvies}</p>
                </div>

                {fundaAnalyse.pluspunten?.length > 0 && (
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-emerald-800 mb-1">Pluspunten</p>
                    <ul className="space-y-0.5">
                      {fundaAnalyse.pluspunten.map((p, i) => (
                        <li key={i} className="text-xs text-emerald-700 flex gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {fundaAnalyse.aandachtspunten?.length > 0 && (
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-800 mb-1">Let op</p>
                    <ul className="space-y-0.5">
                      {fundaAnalyse.aandachtspunten.map((p, i) => (
                        <li key={i} className="text-xs text-amber-700 flex gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-gray-500 italic">{fundaAnalyse.samenvatting}</p>
              </div>
            )}

            <FormField label={fundaGevonden ? 'Vraagprijs / marktwaarde (aanpasbaar)' : 'Vraagprijs'}
              type="number" min={0} prefix="€" placeholder="Typ vraagprijs..."
              value={fundaPrijs} onChange={e => setFundaPrijs(e.target.value)} />
            {fundaGevonden && !fundaPrijs && !fundaLaden && (
              <p className="text-xs text-amber-600">WOZ niet beschikbaar — typ de vraagprijs handmatig of sla op zonder prijs.</p>
            )}

            {fundaFout && <p className="text-xs text-red-500">{fundaFout}</p>}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setToonFundaForm(false); setFundaGevonden(null); setFundaUrl(''); setFundaPrijs(''); }}>Annuleer</Button>
              <Button size="sm" onClick={voegFundaToe} disabled={!fundaUrl || fundaLaden} className="flex-1">
                Opslaan
              </Button>
            </div>
          </div>
        )}

        {woningen.length === 0 && !toonFundaForm && (
          <div className="text-center py-10 text-gray-400">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nog geen woningen opgeslagen.</p>
            <p className="text-xs mt-1">Voeg een Funda link toe om bij te houden of een woning past.</p>
          </div>
        )}

        <div className="space-y-3">
          {woningen.map(w => {
            const past = maxHypotheek > 0 && w.vraagprijs <= maxHypotheek;
            const verschil = maxHypotheek > 0 ? Math.abs(w.vraagprijs - maxHypotheek) : 0;
            return (
              <div key={w.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {maxHypotheek > 0 && (past
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <p className="text-sm font-semibold text-[#0D1F3C] truncate">{w.adres}</p>
                    </div>
                    <p className="text-xs text-gray-400 ml-6">{w.stad} · {w.toegevoegd}</p>
                    <div className="ml-6 mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#0D1F3C]">{euro(w.vraagprijs)}</span>
                      {maxHypotheek > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${past ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {past ? `${euro(verschil)} onder budget` : `${euro(verschil)} boven budget`}
                        </span>
                      )}
                    </div>
                    {w.marktwaarde && (() => {
                      const adv = biedadvies(w.vraagprijs, w.marktwaarde);
                      const besteBod = w.vraagprijs > w.marktwaarde ? w.marktwaarde : w.vraagprijs;
                      const kleur = { groen: 'emerald', oranje: 'amber', rood: 'red' }[adv.kleur];
                      return (
                        <div className="ml-6 mt-2 space-y-1">
                          <p className="text-xs text-gray-400">Marktwaarde: <span className="font-medium text-[#0D1F3C]">{euro(w.marktwaarde)}</span></p>
                          <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg bg-${kleur}-50 text-${kleur}-700 font-medium`}>
                            <Gavel className="w-3 h-3" />
                            {adv.label} · Beste bod: ~{euro(besteBod)}
                          </div>
                        </div>
                      );
                    })()}
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
      </div>
    </div>
  );
}
