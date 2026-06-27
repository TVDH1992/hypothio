# Hypothio — Planning & Voortgang

> Gebouwd door Van der Hel Design · vanderheldesign.nl

---

## Status overzicht

| Fase | Status | Doel |
|------|--------|------|
| Fase 1 — MVP | 🟡 In uitvoering | Werkende tool, livegang hypothio.nl |
| Fase 2 — Verrijking | ⬜ Gepland | ZZP, PDF, adviseursprofiel |
| Fase 3 — SaaS | ⬜ Gepland | Abonnementen, embed widget, Chrome Extension |

---

## Fase 1 — MVP

### Week 1-2 (fundament)

- [x] Project opzetten (Vite + React + TypeScript + Tailwind CSS)
- [x] Rekenmodule bouwen (`src/lib/berekening.ts`)
  - [x] Toetsinkomen berekening (loondienst)
  - [x] Verplichtingen (leningen, studieschuld, alimentatie)
  - [x] LTI-norm berekening (Nibud 2026, hardcoded)
  - [x] NHG-check (grens €435.000, premie 0,6%)
  - [x] Energielabel bonus (A+++ t/m A+)
  - [x] Startersvrijstelling check (< 35 jaar, < €510.000)
  - [x] AFM-toetsrente principe (< 10 jaar → 5%, ≥ 10 jaar → werkelijke rente)
  - [x] Maandlasten bruto/netto (annuïtair, lineair, aflossingsvrij)
- [x] Wizard UI — 8 stappen
  - [x] Stap 1: Welkom + rolkeuze (consument / adviseur)
  - [x] Stap 2: Situatie (alleen/partner, starter/doorstromer, leeftijd)
  - [x] Stap 3: Inkomen aanvrager 1
  - [x] Stap 4: Inkomen aanvrager 2 (conditioneel bij partner)
  - [x] Stap 5: Financiële verplichtingen
  - [x] Stap 6: De woning (koopsom, energielabel, eigen geld, rentevaste periode)
  - [x] Stap 7: Laadscherm
  - [x] Stap 8: Resultaatpagina
- [x] Consument / adviseur modus (taal + detailniveau)

### Week 2-3 (afronden & koppelen)

- [ ] Supabase project aanmaken
  - [ ] Normentabellen aanmaken en vullen
    - [ ] `toetsrentes` (per rentevaste periode)
    - [ ] `nhg_grenzen` (grens + premiepercent)
    - [ ] `lti_normen` (Nibud tabel per inkomenscategorie)
    - [ ] `energielabel_bonus` (per labelklasse)
    - [ ] `afm_toetsrente` (wettelijke toetsrente)
- [ ] Vercel API endpoint (`/api/bereken`)
  - [ ] Normen ophalen uit Supabase
  - [ ] Rekenlogica draaien op backend
  - [ ] JSON-response terug naar frontend
- [ ] Upstash Redis rate limiter op de API

### Week 3-4 (testen & live)

- [ ] Testen met echte cases (samen met adviseur)
  - [ ] Testcase: €50k inkomen, geen verplichtingen, €350k woning → ~€219k
  - [ ] Testcase: 2 aanvragers, studieschuld, NHG
  - [ ] Testcase: starter < 35 jaar, koopsom €400k
- [ ] Privacy Policy opstellen
- [ ] Deploy op Vercel
- [ ] Domein koppelen (hypothio.nl)
- [ ] **Livegang Fase 1** 🚀

---

## Fase 2 — Verrijking

- [ ] ZZP-module (gemiddelde winst 3 jaar)
- [ ] Rentevergelijker (alle periodes naast elkaar)
- [ ] PDF-rapport generatie (Puppeteer / jsPDF)
- [ ] Adviseursprofiel (login via Supabase Auth)
- [ ] Whitelabel huisstijl (logo + kleur per adviseur)
- [ ] Deelbare resultaatlink (unieke URL)

---

## Fase 3 — SaaS

- [ ] Abonnementsmodel via Stripe
- [ ] Beheerportaal adviseur
- [ ] WOZ-waarde ophalen (PDOK / BAG API)
- [ ] Chrome Extension wrapper
- [ ] Embed widget (snippet voor op eigen website)
- [ ] Meerdere talen (NL + EN)

---

## Open punten / beslissingen

| Punt | Status |
|------|--------|
| ZZP naar Fase 2 verschoven | ✅ Besloten |
| Zustand ipv React Context | ⬜ Nog te migreren |
| React Hook Form + Zod per stap | ⬜ Nog te implementeren |
| Consument/adviseur modus | 🟡 In uitvoering |
| Berekening client-side (tijdelijk) | 🟡 Verplaatsen naar API in week 2-3 |

---

## Technische schuld / refactors

- [ ] Migrate van React Context → Zustand (zie ontwerp §8.1)
- [ ] Validatie per stap via React Hook Form + Zod
- [ ] LTI-normen en toetsrentes uit Supabase halen (nu hardcoded in `src/lib/normen.ts`)
