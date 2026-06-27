import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RotateCcw, ShieldCheck, TrendingUp, Lightbulb, ArrowRight, Home } from 'lucide-react';
import { useWizard } from '../../context/WizardContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { berekenResultaat } from '../../lib/berekening';
import { TOETSRENTES, NHG_GRENS_2026, STARTER_GRENS_2026 } from '../../lib/normen';
import { laadWoningen } from '../../lib/profiel';
import type { RentevastePeriode } from '../../types/wizard';

function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

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
  const { resultaat, situatie, inkomen1, inkomen2, woning, verplichtingen, rol, setStap, actueleRentes, actueleNormen } = useWizard();
  const { setTab } = useApp();
  const [woningen, setWoningen] = useState<import('../../types/profiel').GeslaagdeWoning[]>([]);

  useEffect(() => {
    laadWoningen().then(setWoningen);
  }, []);

  if (!resultaat) return null;

  const {
    effectieveMaxHypotheek, brutoMaandlast, nettoMaandlast,
    nhgMogelijk, startersvrijstelling, energielabelBonus,
    bijkomendeKosten, toetsinkomen, maandlastenVerplichtingen,
    maxHypotheekOpInkomen, maxHypotheekOpWoning, eigenGeldTekort,
  } = resultaat;

  const scenarios = SCENARIO_PERIODES.map(p => {
    const r = berekenResultaat(situatie, inkomen1, inkomen2, verplichtingen, { ...woning, rentevastePeriode: p }, actueleRentes, actueleNormen);
    return { periode: p, rente: actueleRentes[p] ?? TOETSRENTES[p]!, max: r.effectieveMaxHypotheek, maandlast: r.brutoMaandlast };
  });

  const adv = rol === 'adviseur';
  const animatedMax = useCountUp(effectieveMaxHypotheek);

  const koopsom = woning.koopsom ?? 0;
  const eigenGeld = woning.eigenGeld ?? 0;
  const pasWoning = koopsom > 0 && effectieveMaxHypotheek >= koopsom - eigenGeld;

  // Tips voor consument om meer te lenen
  const heeftVerplichtingen = (resultaat.maandlastenVerplichtingen ?? 0) > 0;
  const heeftPartner = situatie.metPartner;

  return (
    <div className="space-y-5">

      {/* Hoofduitkomst */}
      <div className="bg-[#0D1F3C] text-white rounded-2xl p-6 text-center">
        <p className="text-sm text-white/60 mb-1">{adv ? 'Maximale hypotheek' : 'Jij kunt maximaal lenen'}</p>
        <p className="text-4xl font-bold tracking-tight">{euro(adv ? effectieveMaxHypotheek : animatedMax)}</p>
        {energielabelBonus > 0 && (
          <p className="text-xs text-[#8B35C0] mt-1">Inclusief {euro(energielabelBonus)} energielabel bonus</p>
        )}
        {!adv && koopsom === 0 && (
          <>
            <div className="border-t border-white/10 mt-4 pt-4">
              <p className="text-xs text-white/50 mb-0.5">Dit betekent een huis tot ca.</p>
              <p className="text-2xl font-bold text-[#8B35C0]">
                {euro(effectieveMaxHypotheek + eigenGeld)}
              </p>
              {eigenGeld > 0 && (
                <p className="text-xs text-white/40 mt-0.5">hypotheek + {euro(eigenGeld)} eigen geld</p>
              )}
              <p className="text-[10px] text-white/30 mt-1">bijkomende kosten (ca. €6.000–€15.000) hier nog niet in</p>
            </div>
          </>
        )}
        {!adv && koopsom > 0 && (
          <p className="text-xs text-white/50 mt-3">
            Op basis van jouw inkomen van {euro(toetsinkomen)} per jaar · normen 2026
          </p>
        )}
      </div>

      {/* Budget check */}
      {koopsom > 0 && (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${pasWoning ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
          {pasWoning ? <CheckCircle className="w-6 h-6 shrink-0" /> : <AlertTriangle className="w-6 h-6 shrink-0" />}
          <div>
            <p className="font-semibold text-sm">
              {pasWoning
                ? `Woning van ${euro(koopsom)} past binnen je budget`
                : `${euro(koopsom)} gaat net boven je budget`}
            </p>
            {!pasWoning && eigenGeldTekort > 0 && (
              <p className="text-xs opacity-80 mt-0.5">
                {adv
                  ? `Tekort (incl. kosten koper): ${euro(eigenGeldTekort)}`
                  : `Je hebt nog ca. ${euro(eigenGeldTekort)} extra nodig — dit kan extra spaargeld zijn of een hogere hypotheek.`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Maandlasten */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-[#0D1F3C] mb-1">{adv ? 'Maandlasten' : 'Wat betaal je per maand?'}</p>
        {!adv && (
          <p className="text-xs text-gray-400 mb-3">Bij een hypotheek van {euro(effectieveMaxHypotheek)}</p>
        )}
        <Rij
          label={adv ? 'Bruto maandlast' : 'Bruto maandbedrag'}
          waarde={euro(brutoMaandlast)}
          sub={`${woning.hypotheekvorm ?? 'annuïtair'}, ${woning.looptijdJaar ?? 30} jaar`}
          vet
        />
        <Rij
          label={adv ? 'Netto maandlast (indicatief)' : 'Wat je netto betaalt'}
          waarde={euro(Math.max(0, nettoMaandlast))}
          sub={adv
            ? 'Na hypotheekrenteaftrek, incl. eigenwoningforfait'
            : 'Na belastingvoordeel — dit is wat je écht elke maand kwijt bent'}
        />
        {!adv && (
          <div className="mt-3 p-3 bg-[#8B35C0]/5 rounded-xl">
            <p className="text-xs text-gray-500">
              <span className="font-medium text-[#0D1F3C]">Wat betekent dit?</span> Je betaalt rente en lost af. De rente is deels aftrekbaar van de belasting, waardoor je netto minder betaalt dan het brutobedrag. Dit is een indicatie — de werkelijke maandlast hangt af van de actuele rente.
            </p>
          </div>
        )}
      </div>

      {/* NHG & Starter */}
      <div className="space-y-2">
        <Badge
          ok={nhgMogelijk}
          label={nhgMogelijk
            ? (adv ? 'NHG van toepassing' : 'Goed nieuws: je hebt recht op NHG!')
            : (adv ? 'Geen NHG' : 'NHG is niet van toepassing')}
          sub={nhgMogelijk
            ? (adv
                ? `Premie: 0,6% van lening (${euro(bijkomendeKosten.nhgPremie)}). Lagere rente, achtervang bij betalingsproblemen.`
                : `NHG staat voor Nationale Hypotheek Garantie. Voordelen: je krijgt een lagere rente (meestal 0,3–0,6% korting) en er is een vangnet als je de hypotheek niet meer kunt betalen door ontslag of scheiding.`)
            : koopsom === 0
              ? 'Vul een koopsom in om de NHG-check te doen'
              : (adv
                  ? `Koopsom boven NHG-grens van ${euro(NHG_GRENS_2026)}`
                  : `De woning is te duur voor NHG. De grens in 2026 is ${euro(NHG_GRENS_2026)}.`)}
        />
        {situatie.isStarter && (
          <Badge
            ok={startersvrijstelling}
            label={startersvrijstelling
              ? (adv ? 'Startersvrijstelling van toepassing' : 'Je betaalt geen overdrachtsbelasting!')
              : (adv ? 'Geen startersvrijstelling' : 'Geen startersvrijstelling van toepassing')}
            sub={startersvrijstelling
              ? (adv
                  ? `Besparing: ${euro(koopsom * 0.02)} (2% van koopsom)`
                  : `Dit scheelt je direct ${euro(koopsom * 0.02)}. Als starter betaal je 0% overdrachtsbelasting — dit is een cadeau van de overheid om het voor jou makkelijker te maken.`)
              : (adv
                  ? `Voldoet niet aan voorwaarden (leeftijd < 35, koopsom < ${euro(STARTER_GRENS_2026)})`
                  : `Voorwaarden: jonger dan 35 jaar én koopsom onder ${euro(STARTER_GRENS_2026)}.`)}
          />
        )}
      </div>

      {/* Bijkomende kosten */}
      {koopsom > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-[#0D1F3C] mb-1">{adv ? 'Bijkomende kosten koper' : 'Wat komt er nog bij?'}</p>
          {!adv && <p className="text-xs text-gray-400 mb-3">Dit zijn éénmalige kosten bovenop de koopsom</p>}
          <Rij label="Overdrachtsbelasting" waarde={euro(bijkomendeKosten.overdrachtsbelasting)} sub={startersvrijstelling ? '0% — startersvrijstelling' : '2% van koopsom'} />
          <Rij label="Notariskosten" waarde="ca. €1.500 – €3.000" sub={adv ? undefined : 'Leveringsakte + hypotheekakte'} />
          <Rij label="Taxatiekosten" waarde="ca. €500 – €900" sub={adv ? undefined : 'Verplicht voor hypotheekaanvraag'} />
          <Rij label={adv ? 'Advies- en bemiddelingskosten' : 'Hypotheekadviseur'} waarde="ca. €2.500 – €4.000" sub={adv ? undefined : 'Onafhankelijk advies is het waard'} />
          {nhgMogelijk && <Rij label="NHG-premie" waarde={euro(bijkomendeKosten.nhgPremie)} sub="Fiscaal aftrekbaar in jaar 1" />}
          <Rij label="Totaal bijkomende kosten" waarde={`ca. ${euro(bijkomendeKosten.totaal)}`} vet />
          {!adv && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl">
              <p className="text-xs text-amber-800">
                <span className="font-medium">Let op:</span> Deze kosten kun je niet meefinancieren in je hypotheek — dit heb je echt als spaargeld nodig. Zorg dat je minimaal {euro(bijkomendeKosten.totaal)} achter de hand hebt.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tips voor consument */}
      {!adv && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-[#8B35C0]" />
            <p className="text-sm font-semibold text-[#0D1F3C]">Wil je meer lenen?</p>
          </div>
          <div className="space-y-2.5">
            {heeftVerplichtingen && (
              <div className="flex gap-2.5 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8B35C0] mt-1.5 shrink-0" />
                <p className="text-xs text-gray-600">
                  <span className="font-medium text-[#0D1F3C]">Lossen leningen af.</span> Je hebt lopende verplichtingen van {euro(maandlastenVerplichtingen)}/mnd die je maximale hypotheek verlagen. Aflossen vóór de aanvraag kan helpen.
                </p>
              </div>
            )}
            {!heeftPartner && (
              <div className="flex gap-2.5 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8B35C0] mt-1.5 shrink-0" />
                <p className="text-xs text-gray-600">
                  <span className="font-medium text-[#0D1F3C]">Met een partner leen je meer.</span> Bij twee inkomens wordt het tweede inkomen voor een groot deel meegenomen.
                </p>
              </div>
            )}
            <div className="flex gap-2.5 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8B35C0] mt-1.5 shrink-0" />
              <p className="text-xs text-gray-600">
                <span className="font-medium text-[#0D1F3C]">Kies een energiezuinige woning.</span> Bij label A++ of hoger mag je tot €40.000 extra lenen bovenop het normale maximum.
              </p>
            </div>
            <div className="flex gap-2.5 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8B35C0] mt-1.5 shrink-0" />
              <p className="text-xs text-gray-600">
                <span className="font-medium text-[#0D1F3C]">Salaris verwacht te stijgen?</span> Sommige geldverstrekkers nemen een toekomstig hoger inkomen mee bij een vaste aanstelling of stijgende schaal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Technische details */}
      <details open={adv} className="bg-gray-50 rounded-2xl p-5 cursor-pointer">
        <summary className="text-sm font-medium text-[#0D1F3C] select-none">
          {adv ? 'Berekeningsdetails' : 'Hoe is dit berekend? (klik voor uitleg)'}
        </summary>
        <div className="mt-3">
          <Rij label={adv ? 'Toetsinkomen' : 'Jouw toetsinkomen'} waarde={euro(toetsinkomen)} sub={adv ? undefined : 'Bruto jaarsalaris inclusief vakantiegeld, bonus etc.'} />
          {maandlastenVerplichtingen > 0 && (
            <Rij label={adv ? 'Maandlasten verplichtingen' : 'Bestaande maandlasten'} waarde={`${euro(maandlastenVerplichtingen)}/mnd`} sub={adv ? undefined : 'Leningen, lease etc. — verlagen je maximum'} />
          )}
          <Rij label={adv ? 'Max op basis van inkomen' : 'Max op basis van wat je verdient'} waarde={euro(maxHypotheekOpInkomen)} sub={adv ? undefined : 'Nibud LTI-norm 2026'} />
          {koopsom > 0 && <Rij label={adv ? 'Max op basis van woning (100% LTV)' : 'Max op basis van de woning'} waarde={euro(maxHypotheekOpWoning)} sub={adv ? undefined : 'Maximaal 100% van de woningwaarde'} />}
        </div>
      </details>

      {/* Scenario vergelijker */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#8B35C0]" />
          <p className="text-sm font-semibold text-[#0D1F3C]">
            {adv ? 'Vergelijk rentevaste periodes' : 'Kies je rentevaste periode'}
          </p>
        </div>
        {!adv && (
          <p className="text-xs text-gray-400 mb-3">Hoe langer je rente vastzet, hoe zekerder — maar ook hoe hoger de rente</p>
        )}
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
                  <tr key={s.periode} className={isHuidig ? 'bg-[#8B35C0]/5' : ''}>
                    <td className={`py-2.5 pr-2 font-medium ${isHuidig ? 'text-[#8B35C0]' : 'text-[#0D1F3C]'}`}>
                      {s.periode}j {isHuidig && <span className="text-[10px] font-normal ml-1">(jouw keuze)</span>}
                    </td>
                    <td className="py-2.5 text-right text-gray-500">{(s.rente * 100).toFixed(1)}%</td>
                    <td className={`py-2.5 text-right font-semibold ${isHuidig ? 'text-[#8B35C0]' : 'text-gray-700'}`}>{euro(s.max)}</td>
                    <td className="py-2.5 text-right text-gray-500">{euro(s.maandlast)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-gray-400 mt-3">
          {adv
            ? 'Hogere rente bij langere periode = meer zekerheid, lagere max hypotheek. Korte periode: AFM toetsrente 5% van toepassing.'
            : 'Let op: dit zijn toetsrentes. De werkelijke rente die je betaalt kan lager zijn — vergelijk altijd meerdere aanbieders.'}
        </p>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Nibud 2026',  sub: 'LTI-normtabel' },
          { label: 'AFM conform', sub: 'Toetsrente regels' },
          { label: 'NHG 2026',   sub: `Grens ${euro(NHG_GRENS_2026)}` },
        ].map(b => (
          <div key={b.label} className="bg-gray-50 rounded-xl p-3 text-center">
            <ShieldCheck className="w-4 h-4 text-[#8B35C0] mx-auto mb-1" />
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
              : 'Je hebt een BKR-melding. Dit kan het moeilijker maken om een hypotheek te krijgen. Niet het einde van de wereld — bespreek dit eerlijk met een adviseur.'}
          </p>
        </div>
      )}

      {/* Opgeslagen Funda woningen */}
      {(() => {
        if (woningen.length === 0) return null;
        const eigenGeld = woning.eigenGeld ?? 0;
        return (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-[#8B35C0]" />
                <p className="text-sm font-semibold text-[#0D1F3C]">Jouw woningen op Funda</p>
              </div>
              <button type="button" onClick={() => setTab('woningen')} className="text-xs text-[#8B35C0] hover:underline cursor-pointer">
                Alles zien →
              </button>
            </div>
            <div className="space-y-2">
              {woningen.map(w => {
                const benodigdHypotheek = w.vraagprijs - eigenGeld;
                const past = benodigdHypotheek <= effectieveMaxHypotheek;
                const delta = effectieveMaxHypotheek - benodigdHypotheek;
                return (
                  <a key={w.id} href={w.fundaUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#8B35C0]/30 transition">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${past ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0D1F3C] truncate">{w.adres}</p>
                      <p className="text-xs text-gray-400">{w.stad} · {euro(w.vraagprijs)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-semibold ${past ? 'text-emerald-600' : 'text-red-500'}`}>
                        {past ? 'past ✓' : 'past niet'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {past
                          ? `${euro(delta)} ruimte`
                          : `${euro(Math.abs(delta))} te duur`}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="pt-2 space-y-3">
        <Button onClick={() => setTab('woningen')} className="w-full">
          {adv ? 'Woningen checken →' : 'Bekijk woningen binnen dit budget →'}
        </Button>
        <Button variant="outline" onClick={() => setStap(1)} className="w-full">
          <RotateCcw className="w-4 h-4" /> Nieuwe berekening
        </Button>
        {!adv && (
          <div className="flex gap-2 p-4 bg-[#0D1F3C]/5 rounded-xl items-start">
            <ArrowRight className="w-4 h-4 text-[#8B35C0] shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">
              <span className="font-medium text-[#0D1F3C]">Volgende stap:</span> Sla je berekening op via je profiel en deel hem met een hypotheekadviseur. Deze berekening is een indicatie — een adviseur kan precies uitzoeken wat in jouw situatie mogelijk is.
            </p>
          </div>
        )}
        <p className="text-xs text-gray-400 text-center">
          Indicatieve berekening op basis van Nibud 2026 normen. Geen rechten aan te ontlenen.
        </p>
      </div>
    </div>
  );
}
