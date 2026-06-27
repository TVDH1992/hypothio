# Hypothio — Ontwerp Bijbel

> Versie 1.1 · Juni 2026 · Van der Hel Design

---

## 1. Merkidentiteit

**Hypothio** is een hypotheekrekentool die consumenten en hypotheekadviseurs ondersteunt. De tone-of-voice is **professioneel maar toegankelijk** — geen bankjargon, wel betrouwbaar.

### Kernwaarden
| Waarde | Vertaling in design |
|--------|-------------------|
| Snel | Minimale stappen, directe feedback |
| Accuraat | Correcte normen, duidelijke disclaimers |
| Begrijpelijk | Gewone taal voor consumenten, detail voor adviseurs |
| Vertrouwd | Navy kleurpalet, rustige layout, geen overdaad |

---

## 2. Kleuren

| Token | Hex | Gebruik |
|-------|-----|---------|
| `primary` | `#0D1F3C` | Headers, knoppen outline, donkere achtergronden |
| `accent` | `#1ABC9C` | CTA-knoppen, toggles, voortgangsbalk, checkmarks |
| `gray-50` | `#F9FAFB` | Pagina-achtergrond |
| `gray-100` | `#F3F4F6` | Card borders, subtiele vlakken |
| `gray-400` | `#9CA3AF` | Subtekst, tooltips |
| `emerald-50` | Tailwind | Positieve badges (NHG, startersvrijstelling) |
| `red-50` | Tailwind | Waarschuwingen (BKR, tekort) |
| `amber-50` | Tailwind | Attentiepunten |

### Gebruik in code
```tsx
// Primaire knop
bg-[#1ABC9C] text-white hover:bg-[#17a589]

// Donkere achtergrond (resultaat header)
bg-[#0D1F3C] text-white

// Accent tekst
text-[#1ABC9C]
```

---

## 3. Typografie

**Font:** Inter (Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
```

| Element | Klasse | Gewicht |
|---------|--------|---------|
| Pagina-titel (H1) | `text-3xl font-bold` | 700 |
| Stap-titel (H2) | `text-2xl font-bold` | 700 |
| Label | `text-sm font-medium` | 500 |
| Body | `text-sm` | 400 |
| Subtekst / tooltip | `text-xs text-gray-400` | 400 |
| Groot resultaat getal | `text-4xl font-bold` | 700 |

---

## 4. Iconen

**Library:** [Lucide React](https://lucide.dev/)
```bash
npm install lucide-react
```

| Gebruik | Icon |
|---------|------|
| Welkom / woning | `Home` |
| Twee aanvragers | `Users` |
| Één aanvrager | `User` |
| Adviseur | `Briefcase` |
| Groei / trends | `TrendingUp` |
| Bescherming / NHG | `Shield` |
| Succesbadge | `CheckCircle` |
| Foutbadge | `XCircle` |
| Waarschuwing | `AlertTriangle` |
| Opnieuw beginnen | `RotateCcw` |

---

## 5. Componenten

### Button
```tsx
<Button variant="primary" size="md">Volgende →</Button>
<Button variant="outline">← Terug</Button>
<Button variant="ghost">Annuleer</Button>
```
- **Primary:** `bg-[#1ABC9C]` — enige primaire actie per scherm
- **Outline:** randknop, secundaire actie
- **Ghost:** terugknop, niet-destructieve acties

### FormField
```tsx
<FormField
  label="Jouw salaris"
  tooltip="Vóór belasting, op je loonstrook"
  prefix="€"
  suffix="/mnd"
  type="number"
/>
```

### Toggle
```tsx
<Toggle
  label="Ik ontvang vakantiegeld"
  tooltip="Toelichting waarom we dit vragen"
  checked={value}
  onChange={setValue}
/>
```
Geselecteerde staat: `border-[#1ABC9C] bg-[#1ABC9C]/5`

### OptionCard
```tsx
<OptionCard selected={isSelected} onClick={handleClick}>
  <Icon />
  <p>Label</p>
</OptionCard>
```
Geselecteerde staat: `border-[#1ABC9C] bg-[#1ABC9C]/5`

### ProgressBar
- Zichtbaar in stap 2 t/m 7 (niet op welkom en resultaat)
- Hoogte: `h-1.5`, kleur: `bg-[#1ABC9C]`

---

## 6. Layout

```
max-w-xl mx-auto px-4 py-8
```

- **Maximale breedte:** 576px (xl) — wizard voelt als een formulier, niet een dashboard
- **Padding:** 16px zijkanten, 32px boven/onder
- **Header:** vast bovenaan, wit met border-bottom
- **Voortgangsbalk:** direct onder header

### Pagina-structuur
```
<header>     Logo + staplabel
<progressbar> Alleen stap 2-7
<main>       Wizard-inhoud
```

---

## 7. UX-principes

1. **Één onderwerp per scherm** — geen lange formulieren
2. **Altijd uitleg** — elke input heeft een tooltip ("Waarom vragen we dit?")
3. **Menselijke taal voor consumenten** — "Wat verdien jij?" i.p.v. "Bruto salaris"
4. **Adviseursmodus** — technische labels, alle velden direct zichtbaar
5. **Terug = data bewaard** — navigeren verliest geen invoer (via state)
6. **Waarschuwingen zijn constructief** — niet alleen "fout", maar ook wat te doen
7. **Resultaat first** — grootste getal bovenaan, details opvouwbaar

---

## 8. Wizard-flow

```
Stap 1 — Welkom + rolkeuze
    ↓
Stap 2 — Situatie (alleen/partner, starter/doorstromer, leeftijd)
    ↓
Stap 3 — Inkomen aanvrager 1
    ↓ (alleen bij partner)
Stap 4 — Inkomen aanvrager 2
    ↓
Stap 5 — Financiële verplichtingen
    ↓
Stap 6 — De woning
    ↓
Stap 7 — Laadscherm (1,8s simulatie → later echte API)
    ↓
Stap 8 — Resultaat
```

**Conditionele stap 4:** wordt overgeslagen als `situatie.metPartner === false`

---

## 9. Resultaatpagina — hiërarchie

```
[Donkere hero] Maximale hypotheek — groot getal

[Budgetcheck]  Past de woning? Groen / rood banner

[Maandlasten]  Bruto + netto naast elkaar

[Badges]       NHG  ·  Startersvrijstelling

[Kosten koper] Uitklapbaar overzicht

[Details]      <details> element — standaard dicht (consument) / open (adviseur)

[Waarschuwingen] BKR · studieschuld · alimentatie

[CTA]          Nieuwe berekening
```

---

## 10. Tone of voice

### Consument
| Technisch | Consumentvriendelijk |
|-----------|---------------------|
| Bruto jaarsalaris | Wat verdien je per jaar? |
| Toetsinkomen | Wat telt mee voor de bank? |
| LTI-norm | Hoeveel keer je inkomen mag je lenen |
| Maandlast annuïtair | Je vaste maandelijkse hypotheekbedrag |
| Eigenwoningforfait | Belasting op het bezitten van je huis |
| NHG | Veiligheidsnet als je de hypotheek niet meer kunt betalen |

### Adviseur
Technische termen zijn toegestaan. Labels zijn korter en preciezer.

---

## 11. Disclaimers (verplicht tonen)

Op de resultaatpagina altijd onderaan:
> "Dit is een indicatieve berekening op basis van actuele normen. Neem voor een officieel advies contact op met een hypotheekadviseur."

Op het welkomstscherm:
> "Je gegevens worden niet opgeslagen en verdwijnen bij het sluiten van de browser."
