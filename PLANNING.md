# Hypothio — Planning & Voortgang

> Gebouwd door Van der Hel Design · vanderheldesign.nl  
> Bijgewerkt: 30 juni 2026 (v1.4)

---

## Status overzicht

| Fase | Status | Doel |
|------|--------|------|
| Fase 1 — MVP | ✅ Live | Werkende tool op hypothio.nl via ConsumentenZaken |
| Fase 2 — UX verdieping | 🟡 In uitvoering | Eigen geld slider ✅, naam fix ✅, jij/jullie ✅ |
| Fase 3 — Verrijking | ⬜ Gepland | ZZP uitbreiding, adviseursprofiel, deelbare links |
| Fase 4 — SaaS | ⬜ Gepland | Abonnementen, embed widget, Chrome Extension |

---

## Wat er nu live staat (v1.4 — 30 jun 2026)

### Core berekening
- [x] Rekenmodule conform Nibud 2026 + AFM toetsrente
- [x] Toetsinkomen: loondienst, ORT, jaarbonus, vakantiegeld, 13e maand, ZZP (3-jaarsgemiddelde), pensioen, alimentatie
- [x] Verplichtingen: persoonlijke lening, doorlopend krediet, creditcard, private lease, studieschuld (oud/nieuw stelsel), alimentatie betalen, BKR-melding
- [x] NHG-check (grens €470.000, premie 0,6%)
- [x] Startersvrijstelling (< 35 jaar, koopsom < €510.000)
- [x] Energielabel bonus (A+++ t/m A+)
- [x] AOW-leeftijdbeperking: looptijd gecapped op 67 − leeftijd
- [x] Bijkomende kosten: overdrachtsbelasting, notaris, taxatie, advies, NHG-premie

### Wizard UI — 8 stappen
- [x] Stap 1: Welkom + rolkeuze (consument / adviseur)
- [x] Stap 2: Situatie (alleen/partner, starter/doorstromer, leeftijd)
- [x] Stap 3: Inkomen aanvrager 1 (incl. loonstrook-upload via Claude AI)
- [x] Stap 4: Inkomen aanvrager 2 (conditioneel) + live partner indicatie
- [x] Stap 5: Financiële verplichtingen
- [x] Stap 6: De woning (koopsom, energielabel, eigen geld, rentevaste periode, hypotheekvorm, looptijd)
- [x] Stap 7: Laadscherm
- [x] Stap 8: Resultaatpagina (PDF, scenario's opslaan, schuldverloop grafiek)

### Dataopslag & authenticatie
- [x] Supabase Auth (magic link + email/wachtwoord)
- [x] Supabase RLS — gebruikers zien alleen eigen data
- [x] `profielen` tabel — wizard invoer + resultaat gecacht (auto-save na berekening)
- [x] `woningen` tabel — opgeslagen Funda woningen incl. AI-analyse cache
- [x] `berekeningen` tabel — opgeslagen scenario's (max 5 per gebruiker)
- [x] `rentestand` tabel — indicatieve marktrentes beheerbaar via admin panel

### Dashboard & navigatie
- [x] Bottom nav: Dashboard · Woningen · Profiel · Admin
- [x] Dashboard (lege staat): donkere hero banner met "Start berekening"
- [x] Dashboard (met resultaat): gradiënt hero, initialen avatar, status badges (NHG/Starter/Hypotheekvorm), uitklapbare bijkomende kosten, woning-overzicht, scenario's, snelle acties
- [x] Auto-herstel dashboard na page reload (vanuit Supabase profiel)

### Woning analyse
- [x] Adreszoeker (PDOK/BAG API — gratis, geen key nodig)
- [x] WOZ-waarde ophalen + geschatte marktwaarde (WOZ × 1,10)
- [x] Biedadvies (groen/oranje/rood op basis van vraagprijs vs marktwaarde)
- [x] Budget check: past woning binnen max hypotheek?
- [x] Funda URL analyse via Claude AI (marktwaarde, biedadvies, plus/aandachtspunten)
- [x] Huispedia verkoophistorie (laatste transacties)
- [x] AI-analyse gecacht per woning in Supabase (geen dubbele API-calls)
- [x] Woningen scherm: budget-banner, gekleurde topbalk, visuele budget-balk per kaart

### PDF & scenario's
- [x] PDF rapport (nieuwe tab + window.print()) — ConsumentenZaken branding
- [x] Scenario's opslaan (max 5, naam invoeren, laadbaar vanuit dashboard + profiel)
- [x] Schuldverloop grafiek (SVG, annuïtair vs lineair, halvering-marker)

### Admin panel
- [x] Dashboard: KPI tiles (gebruikers, berekeningen, woningen), KPI grafiek
- [x] Rentestand beheer (alle periodes, live aanpasbaar)
- [x] Gebruikers logboek (via service role endpoint — veilig server-side)
- [x] Versie-changelog met tijdlijn + roadmap "Binnenkort"
- [x] Beveiliging: service role key alleen in `api/admin/logboek.js` (Vercel server-side)

### Technisch
- [x] React 18 + Vite 5 + TypeScript + Tailwind CSS v4
- [x] React.lazy code splitting — hoofdbundle 374kB (was 501kB)
- [x] Vercel serverless API routes
- [x] ConsumentenZaken huisstijl (#99248F paars, #0D1F3C navy)

---

## Fase 2 — UX verdieping (lopend)

### Hoog prioriteit
- [x] **Eigen geld slider** — live koopbudget op dashboard: hypotheek + eigen geld − bijkomende kosten
- [x] **Naam fix** — weergavenaam bewerkbaar in Profiel via potloodknop, opgeslagen in Supabase auth
- [ ] **Budget gap visualisatie** — balk die toont hoe ver woning van budget zit (al deels in Woningen-kaart)

### Midden prioriteit
- [ ] **Eigen geld slider op Stap 6** — live herberekening tijdens invullen
- [ ] **Rentevergelijker** — alle vaste periodes naast elkaar op resultaatpagina
- [ ] **Wist je dat…** tips contextueel op dashboard (NHG voordeel, startersvrijstelling etc.)
- [ ] **Notificatie** als rente significant veranderd is sinds laatste berekening

### Laag prioriteit
- [ ] **Deelbare resultaatlink** — unieke URL voor je berekening
- [ ] **Meerdere profielen** — "Scenario 1" en "Scenario 2" naast elkaar vergelijken
- [ ] **Animaties** — fade-in dashboard metrics, countup animatie op groot bedrag

---

## Fase 3 — Verrijking

- [ ] ZZP-module uitbreiden (nu basisondersteuning — uitbreiden met VOF, DGA, freelance)
- [ ] Adviseursprofiel (eigen klanten beheren, whitelabel huisstijl)
- [ ] Berekening voor klant opslaan + sturen (adviseur → consument)
- [ ] Loonstrook upload verbeteren (meer loonstrook-formaten herkennen)
- [ ] Hypotheekvormen uitbreiden (combinatiehypotheek)
- [ ] Koppeling met echte rente-aanbieders (affiliate)

---

## Fase 4 — SaaS

- [ ] Abonnementsmodel via Stripe (adviseurs: maandelijks/jaarlijks)
- [ ] Beheerportaal adviseur (dashboard, klanten, rapporten)
- [ ] Embed widget (snippet voor op eigen website adviseur)
- [ ] Chrome Extension (Funda integratie — budget check direct op listingpagina)
- [ ] Meerdere talen (NL + EN)
- [ ] API voor third-party integraties

---

## Technische schuld / open punten

| Punt | Status | Prioriteit |
|------|--------|-----------|
| Zustand ipv React Context | ⬜ Optioneel | Laag — Context werkt prima |
| React Hook Form + Zod validatie | ⬜ Optioneel | Midden |
| LTI-normen + toetsrentes live uit Supabase | 🟡 Deels — rentes live, normen hardcoded | Midden |
| AFM-toetsrente mechanisme verifiëren | ⬜ | Hoog |
| Unit tests rekenmodule | ⬜ | Midden |
| E2E tests wizard flow | ⬜ | Laag |

---

## Admin acties (beheer)

**Admin role toekennen** via Supabase → SQL Editor:
```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'email@voorbeeld.com';
```

**Rente bijwerken:** Admin panel → Rentestand tab → aanpassen → Opslaan  
**Nieuwe versie toevoegen:** `src/components/screens/AdminScreen.tsx` → `RELEASES` array bovenaan
