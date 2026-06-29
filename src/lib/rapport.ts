import type { Resultaat } from '../types/wizard';

function euro(n: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function pct(n: number) {
  return (n * 100).toFixed(2).replace('.', ',') + '%';
}

export function drukRapportAf(resultaat: Resultaat, naam: string, scenarioNaam?: string) {
  const datum = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  const {
    effectieveMaxHypotheek, brutoMaandlast, nettoMaandlast,
    toetsinkomen, nhgMogelijk, startersvrijstelling,
    energielabelBonus, bijkomendeKosten, effectieveLooptijd,
    maxHypotheekOpInkomen,
  } = resultaat;

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <title>Hypotheek rapport — ${naam}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0D1F3C; background: #fff; padding: 40px; max-width: 720px; margin: 0 auto; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #99248F; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-box { width: 36px; height: 36px; background: #99248F; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; }
    .logo-text { font-size: 20px; font-weight: 800; color: #0D1F3C; }
    .datum { font-size: 12px; color: #9ca3af; text-align: right; }
    .hero { background: #0D1F3C; color: white; border-radius: 16px; padding: 28px 32px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .hero-label { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 4px; }
    .hero-bedrag { font-size: 42px; font-weight: 800; letter-spacing: -1px; }
    .hero-sub { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 6px; }
    .hero-right { text-align: right; }
    .hero-right .label { font-size: 11px; color: rgba(255,255,255,0.5); }
    .hero-right .waarde { font-size: 20px; font-weight: 700; color: #99248F; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: 700; color: #99248F; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .rij { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
    .rij:last-child { border-bottom: none; }
    .rij .label { color: #6b7280; }
    .rij .waarde { font-weight: 600; }
    .rij.vet .label, .rij.vet .waarde { color: #0D1F3C; font-weight: 700; font-size: 14px; }
    .badges { display: flex; gap: 10px; flex-wrap: wrap; }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge.groen { background: #d1fae5; color: #065f46; }
    .badge.rood { background: #fee2e2; color: #991b1b; }
    .badge.blauw { background: #dbeafe; color: #1e40af; }
    .disclaimer { margin-top: 32px; padding: 14px 16px; background: #f9fafb; border-radius: 10px; font-size: 11px; color: #9ca3af; line-height: 1.6; }
    .scenario-tag { background: #f3e8ff; color: #7c3aed; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; margin-left: 8px; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-box">H</div>
      <span class="logo-text">Hypothio</span>
      ${scenarioNaam ? `<span class="scenario-tag">${scenarioNaam}</span>` : ''}
    </div>
    <div class="datum">
      <div style="font-weight:600">${naam}</div>
      <div>${datum}</div>
    </div>
  </div>

  <div class="hero">
    <div>
      <div class="hero-label">Maximale hypotheek</div>
      <div class="hero-bedrag">${euro(effectieveMaxHypotheek)}</div>
      <div class="hero-sub">Op basis van inkomen · normen 2026</div>
    </div>
    <div class="hero-right">
      <div class="label">Bruto maandlast</div>
      <div class="waarde">${euro(brutoMaandlast)}/mnd</div>
      <div class="label" style="margin-top:10px">Netto maandlast (indicatief)</div>
      <div class="waarde">${euro(nettoMaandlast)}/mnd</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Berekening</div>
    <div class="card">
      <div class="rij"><span class="label">Toetsinkomen</span><span class="waarde">${euro(toetsinkomen)}/jaar</span></div>
      <div class="rij"><span class="label">Max op inkomen (Nibud LTI 2026)</span><span class="waarde">${euro(maxHypotheekOpInkomen)}</span></div>
      ${energielabelBonus > 0 ? `<div class="rij"><span class="label">Energielabel bonus</span><span class="waarde">+ ${euro(energielabelBonus)}</span></div>` : ''}
      <div class="rij vet"><span class="label">Maximale hypotheek</span><span class="waarde">${euro(effectieveMaxHypotheek)}</span></div>
      <div class="rij"><span class="label">Looptijd</span><span class="waarde">${effectieveLooptijd} jaar</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Bijkomende kosten</div>
    <div class="card">
      <div class="rij"><span class="label">Overdrachtsbelasting (2%)</span><span class="waarde">${euro(bijkomendeKosten.overdrachtsbelasting)}</span></div>
      <div class="rij"><span class="label">Notariskosten</span><span class="waarde">${euro(bijkomendeKosten.notarisKosten)}</span></div>
      <div class="rij"><span class="label">Taxatiekosten</span><span class="waarde">${euro(bijkomendeKosten.taxatieKosten)}</span></div>
      <div class="rij"><span class="label">Advieskosten</span><span class="waarde">${euro(bijkomendeKosten.adviesKosten)}</span></div>
      ${bijkomendeKosten.nhgPremie > 0 ? `<div class="rij"><span class="label">NHG-premie (0,6%)</span><span class="waarde">${euro(bijkomendeKosten.nhgPremie)}</span></div>` : ''}
      <div class="rij vet"><span class="label">Totaal kosten koper</span><span class="waarde">${euro(bijkomendeKosten.totaal)}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Regelingen</div>
    <div class="badges">
      <div class="badge ${nhgMogelijk ? 'groen' : 'rood'}">${nhgMogelijk ? '✓ NHG mogelijk' : '✗ NHG niet van toepassing'}</div>
      <div class="badge ${startersvrijstelling ? 'groen' : 'rood'}">${startersvrijstelling ? '✓ Startersvrijstelling' : '✗ Geen startersvrijstelling'}</div>
      ${energielabelBonus > 0 ? `<div class="badge blauw">⚡ Energielabel bonus ${euro(energielabelBonus)}</div>` : ''}
    </div>
  </div>

  <div class="disclaimer">
    <strong>Disclaimer:</strong> Dit rapport is een indicatieve berekening op basis van de door u opgegeven gegevens en de Nibud LTI-normen 2026. Aan dit rapport kunnen geen rechten worden ontleend. De werkelijke hypotheek is afhankelijk van een volledige toetsing door een erkend hypotheekadviseur en de geldende voorwaarden van de geldverstrekker. Hypothio is een product van ConsumentenZaken.com.
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}
