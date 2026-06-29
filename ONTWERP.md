# Hypothio — Ontwerp Bijbel

> Versie 1.3 · 30 juni 2026 · Van der Hel Design  
> Gebouwd voor ConsumentenZaken.com

---

## 1. Merkidentiteit

**Hypothio** is een hypotheekrekentool voor consumenten en hypotheekadviseurs. Gebouwd in opdracht van ConsumentenZaken.com — de onafhankelijke consumentenorganisatie.

Tone-of-voice: **professioneel maar toegankelijk** — geen bankjargon, wel betrouwbaar. Consumenten lezen simpele taal, adviseurs zien technische detail.

### Kernwaarden
| Waarde | Vertaling in design |
|--------|-------------------|
| Snel | Minimale stappen, directe feedback, auto-save |
| Accuraat | Nibud 2026 normen, duidelijke disclaimers |
| Begrijpelijk | Gewone taal voor consumenten, detail voor adviseurs |
| Vertrouwd | Navy kleurpalet, ConsumentenZaken branding |

---

## 2. Kleuren

Primaire huisstijl: ConsumentenZaken exacte merkkleuren.

| Token | Hex | Gebruik |
|-------|-----|---------|
| `navy` | `#0D1F3C` | Headers, hero achtergronden, primaire tekst |
| `paars` | `#99248F` | CTA-knoppen, accenten, actieve tabs, iconen |
| `groen` | `#619C30` | Positief (NHG, startersvrijstelling, binnen budget) — gebruik Tailwind emerald als alternatief |
| `blauw` | `#3094C6` | Informatief — gebruik spaarzaam |
| `gray-50` | `#F9FAFB` | Pagina-achtergrond |
| `gray-100` | `#F3F4F6` | Card borders, subtiele vlakken |
| `gray-400` | `#9CA3AF` | Subtekst, tooltips, placeholders |
| `emerald` | Tailwind | Positieve badges, budget-binnen indicators |
| `red` | Tailwind | Fouten, boven-budget, BKR-melding |
| `amber` | Tailwind | Waarschuwingen, attentiepunten |

### Gebruik in code
```tsx
// Primaire knop (paars)
bg-[#99248F] text-white hover:opacity-80

// Donkere achtergrond (hero, dashboard)
bg-[#0D1F3C] text-white

// Gradiënt hero (dashboard)
style={{ background: 'linear-gradient(135deg, #0D1F3C 0%, #1a1a4e 50%, #2d0f3d 100%)' }}

// Accent tekst
text-[#99248F]

// Actieve nav-item
text-[#99248F] // + indicator lijn
```

---

## 3. Typografie

**Font:** Inter (Google Fonts — geladen via index.html)

| Element | Klasse | Gewicht |
|---------|--------|---------|
| Pagina-titel (H1) | `text-2xl font-bold` | 700 |
| Sectie-titel (H2) | `text-base font-bold` | 700 |
| Card label klein | `text-[10px] text-gray-400 uppercase tracking-widest` | 400 |
| Body | `text-sm` | 400 |
| Subtekst | `text-xs text-gray-400` | 400 |
| Groot resultaat getal | `text-4xl font-bold tracking-tight` | 700 |
| Badge tekst | `text-xs font-semibold` | 600 |

---

## 4. Iconen

**Library:** Lucide React

| Gebruik | Icon |
|---------|------|
| Dashboard tab | `LayoutDashboard` |
| Woningen tab | `Building2` |
| Profiel tab | `User` |
| Admin tab | `Settings` |
| NHG / bescherming | `ShieldCheck` |
| Starter / nieuw | `Sparkles` |
| Hypotheekvorm / tijd | `Clock` |
| Bookmark scenario | `BookmarkPlus` |
| Woning toevoegen | `Plus` / `Home` |
| Budget OK | `CheckCircle` |
| Budget over | `XCircle` |
| PDF | `FileText` |
| Herberekenen | `RefreshCw` |
| Woning analyse | `TrendingUp` |
| Zoeken | `Search` |
| Verwijderen | `Trash2` |
| Extern openen | `ExternalLink` |
| Biedadvies | `Gavel` |
| Waarschuwing | `AlertTriangle` |
| Info | `Info` |
| Laden | `Loader2` (animate-spin) |
| Klap uit | `ChevronDown` / `ChevronUp` |
| Navigeer | `ChevronRight` |

---

## 5. Componenten

### Button (`src/components/ui/Button.tsx`)
```tsx
<Button variant="primary" size="lg">Start berekening →</Button>
<Button variant="outline">← Terug</Button>
<Button variant="ghost" size="sm">Annuleer</Button>
```
- **Primary:** `bg-[#99248F]` — enige primaire actie per scherm
- **Outline:** randknop, secundaire actie
- **Ghost:** terugknop, niet-destructieve acties
- **Sizes:** `sm` · `md` (default) · `lg`

### FormField (`src/components/ui/FormField.tsx`)
```tsx
<FormField
  label="Jouw salaris"
  tooltip="Vóór belasting, op je loonstrook"
  prefix="€"
  suffix="/mnd"
  type="number"
  value={value}
  onChange={e => setValue(e.target.value)}
/>
```

### ProgressBar (`src/components/ui/ProgressBar.tsx`)
- Zichtbaar in stap 2 t/m 7 (sticky onder header)
- Kleur: `bg-[#99248F]`

### BottomNav (`src/components/nav/BottomNav.tsx`)
- Vast onderaan, `max-w-xl` gecentreerd
- Tabs: Dashboard · Woningen · Profiel · (Admin — alleen voor admins)
- Actief icoon: `text-[#99248F]` + lijn indicator onderaan

### SchuldGrafiek (`src/components/SchuldGrafiek.tsx`)
- Pure SVG, geen externe library
- Props: `hypotheek`, `jaarsrente`, `looptijdJaar`
- Annuïtair (paars) vs lineair (blauw) lijnen
- Halvering-marker bij 50% afbetaald

---

## 6. Layout

```
max-w-xl mx-auto px-4 py-8
paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))'
```

- **Maximale breedte:** 576px (xl) — mobile-first, werkt ook op desktop
- **Header:** sticky bovenaan, wit met border-bottom, logo + admin badge
- **Voortgangsbalk:** sticky direct onder header (alleen wizard stap 2-7)
- **Bottom nav:** fixed onderaan, safe-area-aware (notch support)

### Scherm-structuur
```
<header>      Logo · Admin badge
<progressbar> Alleen wizard stap 2-7
<main>        Actieve tab content
<BottomNav>   Dashboard · Woningen · Profiel · (Admin)
```

---

## 7. Schermen

### Dashboard (`src/components/screens/DashboardScreen.tsx`)

**Lege staat** (geen resultaat):
```
Goedemorgen, [Naam]
Wat kun jij lenen?

[Donkere hero] Gratis hypotheek berekening
               Conform Nibud 2026 — duurt ±3 minuten
               [Start berekening →]

[Stap 1] Vul inkomen en situatie in
[Stap 2] Berekening conform Nibud 2026 & AFM
[Stap 3] Vergelijk woningen op budget
```

**Dashboard staat** (met resultaat):
```
Goedemorgen, [Naam]          [TH] ← initialen avatar
Berekening alleen/met partner

[Gradiënt hero]  MAXIMALE HYPOTHEEK       Detail >
                 € 363.274
                 Bruto/mnd  Netto/mnd  Toetsinkomen

[NHG badge] [Starter badge] [Annuïtair/30jr badge]

[Financieel overzicht kaart]
  Rente (10 jaar vast)          3,85%
  Bijkomende kosten    € 16.200  ∨  ← uitklapbaar
    ↳ Overdrachtsbelasting
    ↳ Notaris / Taxatie / Advies / NHG-premie

[Woningen] X/Y binnen budget          Alles >
  [Kaart] [Kaart] [Kaart] [+ Toevoegen]  ← horizontaal scroll

[Opgeslagen scenario's]
  [Scenario A] [Scenario B]

[Snelle acties]
  Analyseer woning | PDF rapport | Nieuwe berekening
```

### Woningen (`src/components/screens/WoningenScreen.tsx`)

```
[Zoek kaart]
  🔍 Woning analyseren
  [Zoekbalk adres] → dropdown suggesties → [Analyseer]
  → WOZ resultaat + biedadvies + budget check

[Budget banner]  Jouw budget: € 363.274    X/Y
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Opgeslagen woningen              [+ Toevoegen]

[Woning kaart]
  ══ groene/rode topbalk ══
  ✓ Adres                        ↗ 🗑
    Stad · datum
    € 389.000  [€ 25.726 boven budget]
    ████████████░░  107% van jouw budget
    Marktwaarde: € 385.000
    🔨 Reële prijs · Beste bod: ~€ 385.000
    ▼ Analyse bekijken ← cached AI analyse
```

### Profiel (`src/components/screens/ProfielScreen.tsx`)
- Gebruikersgegevens + uitloggen
- Opgeslagen scenario's (laden / verwijderen)
- Opgeslagen woningen overzicht

### Admin (`src/components/screens/AdminScreen.tsx`)
- Tabs: Dashboard · Rentestand · Gebruikers · Versies
- Service role authenticatie via `/api/admin/logboek.js`
- **Versies tab:** timeline changelog + roadmap "Binnenkort"

### Wizard stappen
- Stap 1-8: `src/components/wizard/Stap*.tsx`
- Worden lazy-loaded via `React.lazy` in `App.tsx`
- State in `WizardContext` — auto-save naar Supabase bij resultaat

---

## 8. Data architectuur

### Supabase tabellen
| Tabel | Kolommen | RLS |
|-------|---------|-----|
| `profielen` | user_id, naam, max_hypotheek, resultaat (JSONB), wizard_invoer (JSONB), bijgewerkt_op | Eigen rij |
| `woningen` | id, user_id, funda_url, adres, stad, vraagprijs, marktwaarde, analyse_data (JSONB), toegevoegd_op | Eigen rijen |
| `berekeningen` | id, user_id, naam, max_hypotheek, resultaat (JSONB), wizard_invoer (JSONB), aangemaakt_op | Eigen rijen |
| `rentestand` | id, periode, rente, bijgewerkt_op | Lezen: iedereen; Schrijven: service role |

### State management
- **WizardContext** — alle wizard state + resultaat, auto-save bij resultaat change
- **AppContext** — actieve tab (`berekenen` / `woningen` / `profiel` / `admin`)
- **Supabase Auth** — sessie, rol (`admin` | `gebruiker` via `user_metadata.role`)

### API routes (Vercel serverless)
| Route | Methode | Doel |
|-------|---------|------|
| `/api/admin/logboek` | GET | Gebruikersoverzicht (service role) |
| `/api/woninganalyse` | POST | Claude AI — Funda woning analyse |
| `/api/funda-data` | POST | Funda scraper — prijs, m², kenmerken |
| `/api/huispedia` | POST | Verkoophistorie ophalen |
| `/api/loonstrook` | POST | Claude AI — loonstrook uitlezen |

### Beveiligingsregels
- **Service role key** — NOOIT in frontend code of git. Alleen in `api/admin/logboek.js` via `SUPABASE_SERVICE_KEY` Vercel env var
- **RLS** — elke tabel heeft row-level security; gebruikers zien alleen eigen data
- **Admin rol** — gezet via Supabase SQL Editor op `raw_user_meta_data`

---

## 9. UX-principes

1. **Één onderwerp per scherm** — geen lange formulieren
2. **Altijd uitleg** — elke input heeft een tooltip ("Waarom vragen we dit?")
3. **Menselijke taal voor consumenten** — "Wat verdien jij?" i.p.v. "Bruto salaris"
4. **Adviseursmodus** — technische labels, alle velden direct zichtbaar
5. **Terug = data bewaard** — navigeren verliest geen invoer (via context state)
6. **Auto-save** — resultaat wordt direct na berekening naar Supabase geschreven
7. **Dashboard first** — na login direct het dashboard, niet een lege pagina
8. **Waarschuwingen zijn constructief** — niet alleen "fout", maar ook wat te doen
9. **Mobile first** — max-w-xl, bottom nav, safe-area support

---

## 10. Wizard-flow

```
Stap 0  — Dashboard (of lege landing als geen resultaat)
    ↓ (Start berekening)
Stap 1  — Welkom + rolkeuze (consument / adviseur)
    ↓
Stap 2  — Situatie (alleen/partner, starter/doorstromer, leeftijd)
    ↓
Stap 3  — Inkomen aanvrager 1 (+ optioneel loonstrook upload)
    ↓ (alleen bij partner)
Stap 4  — Inkomen aanvrager 2 (+ live partner indicatie)
    ↓
Stap 5  — Financiële verplichtingen
    ↓
Stap 6  — De woning (koopsom, energielabel, eigen geld, rentevaste periode, hypotheekvorm, looptijd)
    ↓
Stap 7  — Laadscherm (1,8s simulatie + actuele rentes/normen ophalen)
    ↓
Stap 8  — Resultaat (PDF, scenario opslaan, schuldverloop grafiek)
    ↓ (auto-save naar Supabase)
Stap 0  — Dashboard toont nu volledig overzicht
```

**Conditionele stap 4:** wordt overgeslagen als `situatie.metPartner === false`  
**Terugnavigatie:** browser popstate + `vorige()` functie in WizardContext

---

## 11. Resultaatpagina — hiërarchie

```
[Donkere hero]       Maximale hypotheek — groot getal
                     Bruto/mnd · Netto/mnd · Toetsinkomen

[Regelingen]         NHG · Startersvrijstelling · Energielabelbonus badges

[Details tabel]      Toetsinkomen · LTI-norm · Hypotheek op inkomen / woning
                     Maandlast verplichtingen · Eigen geld tekort

[Bijkomende kosten]  Uitklapbaar — alle kostenposten

[Schuldverloop]      SVG grafiek — annuïtair vs lineair over looptijd

[Scenario opslaan]   Naam invoeren + opslaan knop

[PDF knop]           Rapport openen in nieuwe tab

[Herberekenen]       Terug naar stap 1
```

---

## 12. Disclaimers (verplicht tonen)

Op de resultaatpagina altijd onderaan:
> "Dit is een indicatieve berekening op basis van Nibud 2026 normen en actuele toetsrentes. Aan deze berekening kunnen geen rechten worden ontleend. Neem voor officieel advies contact op met een erkend hypotheekadviseur."

Op het welkomstscherm:
> "Je gegevens worden veilig opgeslagen in je account."

---

## 13. Tone of voice

### Consument
| Technisch | Consumentvriendelijk |
|-----------|---------------------|
| Bruto jaarsalaris | Wat verdien je per jaar? |
| Toetsinkomen | Wat telt mee voor de bank? |
| LTI-norm | Hoeveel keer je inkomen mag je lenen |
| Maandlast annuïtair | Je vaste maandelijkse hypotheekbedrag |
| Eigenwoningforfait | Belasting op het bezitten van je huis |
| NHG | Veiligheidsnet als je de hypotheek niet meer kunt betalen |
| Startersvrijstelling | Geen overdrachtsbelasting voor jou |

### Adviseur
Technische termen zijn toegestaan. Labels zijn korter en preciezer. Alle velden direct zichtbaar zonder toggles.
