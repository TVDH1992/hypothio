import { CheckCircle, XCircle, AlertTriangle, RotateCcw, ShieldCheck, Info } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { berekenResultaat } from '../../lib/berekening';
import { TOETSRENTES } from '../../lib/normen';
import type { RentevastePeriode } from '../../types/wizard';

function euro(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function Rij({ label, waarde, sub, vet }: { label: string; waarde: string; sub?: string; vet?: boolean }) {
  return (
    <div className={`flex justify-between items-start py-3 border-b border-gray-100 last:border-0 ${vet ? 'font-semibold' : ''}`}>
      <div>
        <p className={`text-sm ${vet ? 'text-[#0D1F3C]' : 'text-gray-600'}`}>{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <p className={`text-sm ml-4 text-right shrink-0 ${vet ? 'text-[#0D1F3C] text-base' : 'text-gray-700'}`}>{waarde}</p>
    </div>
  );
}

function Badge({ ok, label, sub }: { ok: boolean; label: string; sub?: string }) {
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl ${ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
      {ok ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
      <div>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const SCENARIO_PERIODES: RentevastePeriode[] = [10, 15, 20, 30];

export function Stap8Resultaat() {
  const { resultaat, situatie, inkomen1, inkomen2, woning, verplichtingen, rol, setStap } = useWizard();
  const { setTab } = useApp();
  if (!resultaat) return null;

  // Scenario vergelijker — bereken snel voor andere periodes
  const scenarios = SCENARIO_PERIODES.map(p => {
    const r = berekenResultaat(situatie, inkomen1, inkomen2, verplichtingen, { ...woning, rentevastePeriode: p });
    return { periode: p, rente: TOETSRENTES[p]!, max: r.effectieveMaxHypotheek, maandlast: r.brutoMaandlast };
  });

  const adv = rol === 'adviseur';
  const {
    effectieveMaxHypotheek, brutoMaandlast, nettoMaandlast,
    nhgMogelijk, startersvrijstelling, energielabelBonus,
    bijkomendeKosten, toetsinkomen, maandlastenVerplichtingen,
    maxHypotheekOpInkomen, maxHypotheekOpWoning, eigenGeldTekort,
  } = resultaat;

  const koopsom = woning.koopsom ?? 0;
  const pasWoning = koopsom > 0 && effectieveMaxHypotheek >= koopsom - (woning.eigenGeld ?? 0);

  return (
    <div className="space-y-5">

      {/* Hoofduitkomst */}
      <div className="bg-[#0D1F3C] text-white rounded-2xl p-6 text-center space-y-1">
        <p className="text-sm text-white/60">{adv ? 'Maximale hypotheek' : 'Jij kunt maximaal lenen'}</p>
        <p className="text-4xl font-bold">{euro(effectieveMaxHypotheek)}</p>
        {energielabelBonus > 0 && (
          <p className="text-xs text-[#1ABC9C] mt-1">Inclusief {euro(energielabelBonus)} energielabel bonus</p>
        )}
      </div>

      {/* Budget check */}
      {koopsom > 0 && (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${pasWoning ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
          {pasWoning ? <CheckCircle className="w-6 h-6 shrink-0" /> : <XCircle className="w-6 h-6 shrink-0" />}
          <div>
            <p className="font-semibold text-sm">
              {pasWoning
                ? `De woning van ${euro(koopsom)} past binnen je budget`
                : `De woning van ${euro(koopsom)} past (nog) niet`}
            </p>
            {!pasWoning && eigenGeldTekort > 0 && (
              <p className="text-xs opacity-80 mt-0.5">
                {adv ? `Tekort (incl. kosten koper): ${euro(eigenGeldTekort)}` : `Je hebt nog ca. ${euro(eigenGeldTekort)} extra nodig`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Maandlasten */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-[#0D1F3C] mb-1">{adv ? 'Maandlasten' : 'Wat betaal je per maand?'}</p>
        <Rij
          label={adv ? 'Bruto maandlast' : 'Bruto maandbedrag'}
          waarde={euro(brutoMaandlast)}
          sub={`${woning.hypotheekvorm ?? 'annuïtair'}, ${woning.looptijdJaar ?? 30} jaar`}
          vet
        />
        <Rij
          label={adv ? 'Netto maandlast (indicatief)' : 'Wat je netto betaalt (indicatief)'}
          waarde={euro(Math.max(0, nettoMaandlast))}
          sub={adv ? 'Na hypotheekrenteaftrek, incl. eigenwoningforfait' : 'Na belastingvoordeel — dit is wat je echt kwijt bent'}
        />
      </div>

      {/* NHG & Starter */}
      <div className="space-y-2">
        <Badge
          ok={nhgMogelijk}
          label={nhgMogelijk
            ? (adv ? 'NHG van toepassing' : 'Je hebt recht op NHG')
            : (adv ? 'Geen NHG' : 'NHG is niet van toepassing')}
          sub={nhgMogelijk
            ? (adv ? 'Premie: 0,6% van lening. Lagere rente, achtervang bij betalingsproblemen.' : 'Dit geeft je recht op een lagere rente en een vangnet als je de hypotheek niet meer kunt betalen.')
            : koopsom === 0
              ? 'Vul een koopsom in om de NHG-check te doen'
              : (adv ? `Koopsom boven NHG-grens van €435.000` : `De woning is te duur voor NHG (grens: €435.000)`)}
        />
        {situatie.isStarter && (
          <Badge
            ok={startersvrijstelling}
            label={startersvrijstelling
              ? (adv ? 'Startersvrijstelling van toepassing' : 'Je betaalt geen overdrachtsbelasting!')
              : (adv ? 'Geen startersvrijstelling' : 'Je komt niet in aanmerking voor de startersvrijstelling')}
            sub={startersvrijstelling
              ? `Dat scheelt je ${euro(koopsom * 0.02)} aan overdrachtsbelasting`
              : adv ? 'Voldoet niet aan voorwaarden (leeftijd < 35, koopsom < €510.000)' : 'Voorwaarden: jonger dan 35 jaar en koopsom onder €510.000'}
          />
        )}
      </div>

      {/* Bijkomende kosten */}
      {koopsom > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-[#0D1F3C] mb-1">{adv ? 'Bijkomende kosten koper' : 'Wat komt er nog bij? (indicatief)'}</p>
          <Rij label="Overdrachtsbelasting" waarde={euro(bijkomendeKosten.overdrachtsbelasting)} sub={startersvrijstelling ? '0% — startersvrijstelling' : '2% van koopsom'} />
          <Rij label="Notariskosten" waarde="ca. €1.500 – €3.000" />
          <Rij label="Taxatiekosten" waarde="ca. €500 – €900" />
          <Rij label={adv ? 'Advies- en bemiddelingskosten' : 'Hypotheekadviseur'} waarde="ca. €2.500 – €4.000" />
          {nhgMogelijk && <Rij label="NHG-premie" waarde={euro(bijkomendeKosten.nhgPremie)} sub="Fiscaal aftrekbaar" />}
          <Rij label="Totaal" waarde={`ca. ${euro(bijkomendeKosten.totaal)}`} vet />
        </div>
      )}

      {/* Technische details — adviseur open, consument ingeklapt */}
      <details open={adv} className="bg-gray-50 rounded-2xl p-5 cursor-pointer">
        <summary className="text-sm font-medium text-[#0D1F3C] select-none">
          {adv ? 'Berekeningsdetails' : 'Hoe is dit berekend?'}
        </summary>
        <div className="mt-3">
          <Rij label={adv ? 'Toetsinkomen' : 'Jouw toetsinkomen'} waarde={euro(toetsinkomen)} />
          <Rij label={adv ? 'Maandlasten verplichtingen' : 'Maandelijkse lasten'} waarde={`${euro(maandlastenVerplichtingen)}/mnd`} />
          <Rij label={adv ? 'Max op basis van inkomen' : 'Max op basis van wat je verdient'} waarde={euro(maxHypotheekOpInkomen)} />
          {koopsom > 0 && <Rij label={adv ? 'Max op basis van woning (100% LTV)' : 'Max op basis van de woning'} waarde={euro(maxHypotheekOpWoning)} />}
        </div>
      </details>

      {/* Scenario vergelijker */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-[#0D1F3C] mb-3">Vergelijk rentevaste periodes</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400">
                <th className="text-left pb-2 font-medium">Periode</th>
                <th className="text-right pb-2 font-medium">Rente</th>
                <th className="text-right pb-2 font-medium">Max lening</th>
                <th className="text-right pb-2 font-medium">Mndlast</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {scenarios.map(s => {
                const isHuidig = s.periode === (woning.rentevastePeriode ?? 10);
                return (
                  <tr key={s.periode} className={isHuidig ? 'bg-[#1ABC9C]/5' : ''}>
                    <td className={`py-2.5 pr-2 font-medium ${isHuidig ? 'text-[#1ABC9C]' : 'text-[#0D1F3C]'}`}>
                      {s.periode}j {isHuidig && <span className="text-[10px] font-normal ml-1">(jouw keuze)</span>}
                    </td>
                    <td className="py-2.5 text-right text-gray-500">{(s.rente * 100).toFixed(1)}%</td>
                    <td className={`py-2.5 text-right font-semibold ${isHuidig ? 'text-[#1ABC9C]' : 'text-gray-700'}`}>{euro(s.max)}</td>
                    <td className="py-2.5 text-right text-gray-500">{euro(s.maandlast)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-gray-400 mt-3">
          Hogere rente bij langere periode = meer zekerheid, lagere max hypotheek. Korte periode: AFM toetsrente 5% van toepassing.
        </p>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Nibud 2026',  sub: 'LTI-normtabel' },
          { label: 'AFM conform', sub: 'Toetsrente regels' },
          { label: 'NHG 2026',    sub: 'Grens €435.000' },
        ].map(b => (
          <div key={b.label} className="bg-gray-50 rounded-xl p-3 text-center">
            <ShieldCheck className="w-4 h-4 text-[#1ABC9C] mx-auto mb-1" />
            <p className="text-xs font-semibold text-[#0D1F3C]">{b.label}</p>
            <p className="text-[10px] text-gray-400">{b.sub}</p>
          </div>
        ))}
      </div>

      {/* BKR waarschuwing */}
      {verplichtingen.bkrMelding && (
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            {adv
              ? 'Er is een BKR-melding opgegeven. Dit kan de hypotheekaanvraag bemoeilijken. Bespreek dit met de klant.'
              : 'Je hebt een BKR-melding aangegeven. Dit kan het moeilijker maken om een hypotheek te krijgen. Bespreek dit met een adviseur.'}
          </p>
        </div>
      )}

      <div className="pt-2 space-y-3">
        <Button onClick={() => setTab('woningen')} className="w-full">
          Woningen checken met dit budget →
        </Button>
        <Button variant="outline" onClick={() => setStap(1)} className="w-full">
          <RotateCcw className="w-4 h-4" /> Nieuwe berekening
        </Button>
        <p className="text-xs text-gray-400 text-center">
          Dit is een indicatieve berekening. Neem voor een officieel advies contact op met een hypotheekadviseur.
        </p>
      </div>
    </div>
  );
}
