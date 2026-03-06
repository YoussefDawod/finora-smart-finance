# Finora – Branding, Auth, E-Mail & Export Redesign Plan

> **Status:** 📋 Geplant  
> **Datum:** 05.03.2026  
> **Branch:** main  
> **Scope:** BrandingBackground-Komponente · Auth-Seiten · E-Mail-Header · PDF-Export · i18n

---

## Übersicht

In **7 Phasen** wird die `BrandingBackground`-Komponente als wiederverwendbare Basis extrahiert, die Auth-Seiten auf ein Full-Screen-Glassmorphism-Design umgebaut, alle E-Mail-Header und PDF-Exporte mit dem Branding-Hintergrund + Logo versehen und i18n vollständig bereinigt. Parallel werden **10 versteckte Bugs und Regelverletzungen** behoben.

---

## 🔍 Gefundene versteckte Probleme

| # | Problem | Datei(en) | Schwere |
|---|---------|-----------|---------|
| **P1** | **Duplizierte Auth-Layout-Architektur** – `AuthLayout.jsx` (für VerifyEmailPage) und `AuthPage.jsx` sind zwei vollständig separate Layout-Systeme mit nahezu identischer Logik. `AuthLayout` rendert beide Layouts (Desktop + Mobile) via CSS-Visibility statt `useIsDesktop`-Hook → Performance-Issue, potenzielle doppelte DOM-IDs | `AuthLayout.jsx` / `AuthPage.jsx` | 🔴 Hoch |
| **P2** | **Spring-Konfiguration verletzt MOTION_GLOW_RULES.md** – `AuthPage.jsx`: `stiffness:50, damping:15, mass:1` / `AuthLayout.jsx`: `stiffness:80, damping:20` — **Pflicht laut Regelwerk: `stiffness:420, damping:34`** | `AuthPage.jsx` / `AuthLayout.jsx` | 🔴 Hoch |
| **P3** | **BrandingPanel CTA-Button nahezu unsichtbar** – `background: var(--primary)` auf einem `var(--primary)`-Gradient-Hintergrund → Kontrast nahe 1:1, WCAG-Verletzung | `BrandingPanel.module.scss` | 🟠 Mittel |
| **P4** | **Dead i18n-Keys `auth.layout.*`** – In allen 4 Sprachen (de/en/ar/ka) definiert aber nirgends im Code verwendet; `BrandingPanel` nutzt `auth.branding.*`, nicht `auth.layout.*` | `public/locales/*/translation.json` | 🟠 Mittel |
| **P5** | **E-Mail-Header-Gradient inkonsistent mit App-Branding** – `colors.js` definiert `headerBrand: secondary(Cyan) → accent(Neon-Pink)`, während die App `primary → secondary` nutzt → zwei verschiedene Branding-Sprachen | `emailTemplates/colors.js` | 🟠 Mittel |
| **P6** | **PDF-Export-Header ohne visuelles Branding** – Nur `#f8fafc → #f1f5f9` Hellgrau + blauer Border-Bottom — kein Gradient, keine Kreise, kein Finora-Branding | `ExportSection.jsx` | 🟠 Mittel |
| **P7** | **Hex-Werte in `ExportSection.jsx` (COLOR_USAGE_RULES verletzt)** – `LOGO_COLORS.light.primary` etc. als hardcodierte Hex-Strings. Ausnahme wegen Print-Window-Kontext akzeptierbar, aber Synchronisierung mit `light.scss` nicht dokumentiert/garantiert | `ExportSection.jsx` / `logoSvgStrings.js` | 🟡 Niedrig |
| **P8** | **Mobile Branding-Panel Höhe 40% statt gewünschter 30%** – `brandingPanelMobile: flex: 0 0 40%` — Form-Bereich zu klein auf kleinen Displays | `AuthPage.module.scss` | 🟡 Klar |
| **P9** | **`data-auth-branding-bottom` HTML-Attribut-Leak** – Wird auf `document.documentElement` gesetzt, bei schneller Navigation kann der Cleanup-useEffect fehlen → globaler DOM-State bleibt hängen | `AuthPage.jsx` | 🟡 Niedrig |
| **P10** | **Floating-Shapes `scale`-Animation verletzt MOTION_GLOW_RULES** – `scale: [1, 1.02, 1]` im Endlos-Loop; `--motion-scale-hover: 1.02` ist laut Regelwerk ausschließlich für Micro-Feedback (einmalig), nicht für kontinuierliche Dekorations-Loops | `BrandingPanel.jsx` | 🟡 Niedrig |

---

## Phase 1 — BrandingBackground (Neue Basis-Komponente)

> **Abhängigkeiten:** Keine – muss als Erstes fertiggestellt werden  
> **Ziel:** Wiederverwendbare, regelkonforme Hintergrund-Komponente als Single Source of Truth für Branding-Visuals

### Schritte

**1.1** Neue Komponente `BrandingBackground.jsx` erstellen unter `src/components/common/BrandingBackground/`
- Props: `withBlur?: boolean` (für E-Mail/PDF-Kontext, fügt Blur-Overlay hinzu)
- Ausschließlich visueller Hintergrund — keine Texte, kein Logo, keine interaktiven Elemente
- `aria-hidden="true"`, `position: absolute; inset: 0; z-index: 0`

**1.2** `BrandingBackground.module.scss` erstellen
- Backdrop-Gradient: `var(--primary)` → `color-mix(in srgb, var(--primary) 60%, var(--secondary) 40%)` → `var(--secondary)` — **ausschließlich CSS-Token, KEINE Hex-Werte** (COLOR_USAGE_RULES)
- Floating Circles: `border-radius: var(--r-full)`, transparente radial-Gradients via `color-mix(in srgb, white 16%, transparent)`
- Animation: Nur `y` (max ±12px) + `rotate` — **`scale`-Loop entfernt** (P10-Fix, MOTION_GLOW_RULES)
- `useMotion()` → `shouldAnimate` wird geprüft, `prefers-reduced-motion` vollständig respektiert
- `withBlur=true` → zusätzliches Overlay-Div: `backdrop-filter: blur(8px); filter: brightness(0.85)`

**1.3** Export in `src/components/common/index.js` einpflegen

---

## Phase 2 — Auth-Seiten Komplettes Redesign

> **Abhängigkeiten:** Phase 1 abgeschlossen  
> **Ziel:** Minimalistisches, professionelles Full-Screen-Glassmorphism-Design auf ALLEN Auth-Seiten

### Schritte

**2.1** `AuthPage.jsx` komplett auf neue Architektur umstellen
- Entfernt: 50/50-Split-Layout, `<BrandingPanel>`-Verwendung, `isPanelRight`/`isPanelTop`-Logik, `data-auth-branding-bottom`-useEffect (**P9-Fix**)
- Neu: `<BrandingBackground />` füllt gesamten Viewport als `position: fixed; inset: 0`

**2.2** Glassmorphism-Container für Auth-Content (Login / Register / Forgot / Reset)
```scss
background: color-mix(in srgb, var(--surface-3) 80%, transparent);
backdrop-filter: blur(16px) saturate(150%);
border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
border-radius: var(--r-2xl);
box-shadow: var(--glow-md); // NUR --primary-basiert, kein --accent (COLOR_USAGE_RULES)
```
- Inhalt-Reihenfolge: **Logo** → **kurze App-Tagline** (neuer i18n-Key `auth.page.tagline`) → **Form**
- Kein Branding-Split-Panel — alle Infos im Card

**2.3** Responsive Sizing (`AuthPage.module.scss` komplett neu)

| Breakpoint | Card | BrandingBackground |
|-----------|------|-------------------|
| Desktop ≥1024px | `max-width: 480px`, horizontal + vertikal zentriert | Voller Viewport |
| Tablet 768–1023px | `max-width: 420px` | Voller Viewport |
| Mobile <768px | Flex-Column, untere 70% | Obere 30% (**P8-Fix**) |

**2.4** Mobile Form-Elemente verkleinern (kein Scrollen, kein Abschneiden)
- Input-Höhe: `var(--input-height-sm)` statt `md`
- Font-Size in Form-Feldern: `var(--fs-xs)` statt `var(--fs-sm)` via Media Query
- Padding: `var(--space-xs)` statt `var(--space-sm)`

**2.5** AnimatePresence Form-Wechsel (fade 200ms) beibehalten — Spring-Slide-Animation entfernen (kein 50/50-Panel mehr)
- **P2-Fix**: Falls noch Spring-Animations notwendig → `stiffness: 420, damping: 34` (MOTION_GLOW_RULES)

**2.6** `AuthLayout.jsx` (für VerifyEmailPage) identisch umbauen
- Gleiches Full-Screen-BrandingBackground + Glassmorphism-Card
- **P2-Fix**: `panelVariants.transition → stiffness: 420, damping: 34`
- `AuthLayout.module.scss` vollständig überarbeiten
- **P1-Fix**: Beide Layouts (Desktop + Mobile) via `useIsDesktop`-Hook steuern statt CSS-Only

---

## Phase 3 — E-Mail-Header Neugestaltung

> **Abhängigkeiten:** Keine (parallel zu Phase 2 möglich)  
> **Ziel:** Einheitlicher Branding-Header in ALLEN E-Mails — Gradient-Hintergrund + Logo, kein Text

### Schritte

**3.1** `baseLayout.js` Header-Block ersetzen
- Neues `.header`-CSS (inline, da E-Mail-Clients CSS-Custom-Properties nicht unterstützen):
  - Multi-Layer `background`: primärer Gradient (`primary → color-mix → secondary`) + radial-gradient Circles
  - Kein `backdrop-filter` (E-Mail-Client-Inkompatibilität) → **stattdessen** `filter: brightness(0.85)` auf dem Header-Container
  - Inhalt: **Ausschließlich Logo** (`getEmailLogoImg()`, zentriert, `display:block; margin:0 auto`)
  - Kein `<h1>Finora</h1>` mehr
  - Mindesthöhe: `80px`, Logo-Größe: `44px`

**3.2** `colors.js` Gradient-Korrektur (**P5-Fix**)
```js
// Vorher (falsch):
headerBrand: `linear-gradient(135deg, ${EMAIL_COLORS.secondary}, ${EMAIL_COLORS.accent})`
// Nachher (korrekt, entspricht App-Branding):
headerBrand: `linear-gradient(135deg, ${EMAIL_COLORS.primary}, color-mix..., ${EMAIL_COLORS.secondary})`
```

**3.3** E-Mail-Kompatibilität sicherstellen
- Nur inline CSS, keine CSS-Variables, keine CSS-Klassen via externem Stylesheet
- Radial-Gradient-Circles als gestapelte `background-image`-Layer (inline im `style=""`)
- SVG als Data-URI in `<img>` (bestehende `getEmailLogoImg()`-Funktion, korrekt)
- Wirkung: Betrifft **alle** Templates (auth, password, financial, account, admin, newsletter, lifecycle) da alle `baseLayout()` verwenden

---

## Phase 4 — PDF/CSV Export Header Neugestaltung

> **Abhängigkeiten:** Keine (parallel zu Phase 2 möglich)  
> **Ziel:** Sauberer Branding-Header mit Gradient + Logo — konsistent mit App und E-Mails

### Schritte

**4.1** `ExportSection.jsx` → `generatePDFContent()` Header-CSS ersetzen
- Neues `.header`-CSS:
  - Multi-Layer-Gradient (via `LOGO_COLORS`): identisch zu E-Mail-Header-Ansatz
  - Floating-Circles via gestapelten `radial-gradient()`-Layern (CSS-only, kein JS)
  - Logo-Lesbarkeit: Zusätzliches Overlay-`<div>` mit `filter: blur(4px) brightness(0.80)` oder `background: rgba` Overlay
  - **Ausschließlich Logo** (`svgToDataURI(logoSVG)` als `<img>`, `width:48px`)
  - Username / Datum: Separater Info-Bereich **unterhalb** des Gradient-Headers (weißer Hintergrund, kleine Schrift)
  - Mindesthöhe Header: `88px`

**4.2** LOGO_COLORS Sync-Dokumentation (**P7-Fix**)
- Kommentar in `logoSvgStrings.js` ergänzen: muss mit `src/styles/themes/light.scss` `$light-palette` synchronisiert bleiben
- Werte prüfen und ggf. angleichen

**4.3** CSV-Export: keine visuellen Änderungen möglich → kein Handlungsbedarf

---

## Phase 5 — BrandingPanel Bereinigung

> **Abhängigkeiten:** Phase 2 vollständig abgeschlossen  
> **Ziel:** Toten Code entfernen

### Schritte

**5.1** Alle `BrandingPanel`-Imports im gesamten Projekt prüfen
- Nach Phase 2: weder `AuthLayout.jsx` noch `AuthPage.jsx` importieren `BrandingPanel` mehr
- Vollständige Suche vor Löschung

**5.2** Wenn keine aktiven Imports mehr: Dateien löschen
- `src/components/auth/BrandingPanel/BrandingPanel.jsx`
- `src/components/auth/BrandingPanel/BrandingPanel.module.scss`

**5.3** Barrel-Export aus `src/components/auth/index.js` entfernen

---

## Phase 6 — i18n Bereinigung & Erweiterung

> **Abhängigkeiten:** Phase 5 abgeschlossen (für Dead-Key-Entfernung)  
> **Ziel:** Vollständige, konsistente i18n in allen 4 Sprachen ohne tote Keys

### Schritte

**6.1** Neuen Key `auth.page.tagline` hinzufügen in **allen 4 Sprachen**

| Sprache | Wert |
|---------|------|
| DE | `"Behalten Sie Ihre Finanzen im Blick – klar und sicher."` |
| EN | `"Track your finances – clear and secure."` |
| AR | `"راقب شؤونك المالية – بوضوح وأمان."` |
| KA | `"აკონტროლეთ თქვენი ფინანსები – მარტივად და უსაფრთხოდ."` |

**6.2** Dead Keys `auth.layout.*` entfernen (**P4-Fix**) aus allen 4 Sprachen
- `auth.layout.login.*`, `auth.layout.register.*`, `auth.layout.forgot.*`, `auth.layout.verify.*`
- `auth.layout.features.*` (realtime, secure, dark, track, charts)

**6.3** Dead Keys `auth.branding.*` entfernen (nach BrandingPanel-Entfernung in Phase 5)
- `auth.branding.badge`, `auth.branding.kicker`
- `auth.branding.login/register/forgot/default.*`
- `auth.branding.highlights.*`
- `auth.branding.footer`

**6.4** Konsistenz-Check: alle 4 Sprachen (de/en/ar/ka) auf gleiche Key-Struktur bringen
- Fehlende Keys in ar/ka identifizieren und nachziehen

---

## Phase 7 — Begleitende Bugfixes

> Diese Fixes werden in die jeweiligen Phasen inline eingebaut

| Fix | Eingebaut in | Beschreibung |
|-----|-------------|-------------|
| **P2** | Phase 2 | Spring `stiffness: 420, damping: 34` in `AuthPage.jsx` + `AuthLayout.jsx` |
| **P3** | Phase 5 | BrandingPanel CTA-Button: `background: var(--surface)` + `color: var(--primary)` — obsolet wenn BrandingPanel entfernt, sonst direkt fixen |
| **P9** | Phase 2 | `data-auth-branding-bottom`-useEffect aus `AuthPage.jsx` entfernen |
| **P10** | Phase 1 | `scale`-Loop aus Floating-Shapes-Animation entfernen |

---

## Relevante Dateien

### Frontend (`finora-smart-finance-frontend/src/`)

| Datei | Aktion | Phase |
|---|---|---|
| `components/common/BrandingBackground/` (**NEU**) | Erstellen | 1 |
| `components/common/index.js` | Export hinzufügen | 1 |
| `pages/AuthPage/AuthPage.jsx` | Komplett umbauen | 2 |
| `pages/AuthPage/AuthPage.module.scss` | Komplett neu schreiben | 2 |
| `components/layout/AuthLayout/AuthLayout.jsx` | Umbauen | 2 |
| `components/layout/AuthLayout/AuthLayout.module.scss` | Komplett neu schreiben | 2 |
| `components/auth/BrandingPanel/BrandingPanel.jsx` | Entfernen | 5 |
| `components/auth/BrandingPanel/BrandingPanel.module.scss` | Entfernen | 5 |
| `components/auth/index.js` | BrandingPanel-Export entfernen | 5 |
| `components/settings/ExportSection/ExportSection.jsx` | PDF-Header redesign | 4 |
| `utils/logoSvgStrings.js` | Sync-Kommentar ergänzen | 4 |
| `public/locales/de/translation.json` | Keys hinzufügen/entfernen | 6 |
| `public/locales/en/translation.json` | Keys hinzufügen/entfernen | 6 |
| `public/locales/ar/translation.json` | Keys hinzufügen/entfernen | 6 |
| `public/locales/ka/translation.json` | Keys hinzufügen/entfernen | 6 |
| `e2e/auth.spec.js` | Selektoren auf neue DOM-Struktur anpassen | 2 |

### Backend (`finora-smart-finance-api/src/utils/emailTemplates/`)

| Datei | Aktion | Phase |
|---|---|---|
| `baseLayout.js` | Header-HTML komplett neu | 3 |
| `colors.js` | `headerBrand`-Gradient korrigieren | 3 |

---

## Verifikation nach Abschluss

### 1. Visuell (alle Breakpoints)
- [ ] Auth Login, Register, Forgot, Reset, VerifyEmail — Desktop / Tablet / Mobile
- [ ] Glassmorphism-Card in Light- **und** Dark-Theme lesbar
- [ ] Mobile: BrandingBackground 30% oben, kein Scrollen, kein Abschneiden

### 2. E-Mail-Templates
- [ ] `authEmails.sendVerification()`, `passwordEmails.sendReset()` → HTML-Output im Browser testen
- [ ] Header visuell korrekt: Gradient-Hintergrund + Logo, kein Text
- [ ] Kompatibilität: Gmail / Outlook / Apple Mail (nur inline CSS, kein `backdrop-filter`)

### 3. PDF-Export
- [ ] ExportSection → PDF öffnen → neuer Branding-Header sichtbar
- [ ] Logo lesbar vor Gradient-Hintergrund (Blur-Overlay wirkt)
- [ ] Print-Dialog: Farben korrekt (`print-color-adjust: exact`)

### 4. i18n
- [ ] Alle 4 Sprachen — keine missing-key Warnings in Browser-DevTools
- [ ] `auth.layout.*`-Keys entfernt (Phase 6)
- [ ] `auth.branding.*`-Keys entfernt (nach Phase 5)
- [ ] Neuer Key `auth.page.tagline` in allen 4 Sprachen vorhanden

### 5. MOTION_GLOW_RULES.md
- [ ] `prefers-reduced-motion` aktiv → `shouldAnimate=false` → keine Animationen
- [ ] Spring-Konfiguration überall `stiffness:420, damping:34`
- [ ] Floating-Shapes: kein `scale`-Loop (`y` + `rotate` only)

### 6. COLOR_USAGE_RULES.md
- [ ] Keine Hex-Werte in SCSS-Komponentendateien
- [ ] `--accent` ausschließlich dekorativ (Hero/BG), nicht in Buttons/Forms
- [ ] Focus-Ring: `2px solid`, `--primary 40%` opacity, überall konsistent
- [ ] `--surface-3` nur für Glassmorphism-Overlays (korrekte Verwendung)

### 7. E2E Playwright
- [ ] `e2e/auth.spec.js` Selektoren auf neue DOM-Struktur angepasst
- [ ] Alle bestehenden Tests grün

---

## Entscheidungen & Ausschlüsse

| Thema | Entscheidung |
|-------|-------------|
| E-Mail Blur-Effekt | Kein `backdrop-filter` (E-Mail-Client-Inkompatibel) → Blur via CSS `filter: brightness()` + Radial-Gradient-Overlay simuliert |
| CSV-Exporte | Kein visueller Header möglich → außerhalb Scope |
| `LOGO_COLORS` in ExportSection | Bleibt als Einzelfall-Ausnahme (kein CSS-Token-Kontext im Print-Window), muss aber mit `light.scss` dokumentiert synchron sein |
| Admin-CSV-Exports | Reiner Daten-Download, kein UI-Header → außerhalb Scope |
| Neue E2E-Tests | Keine neuen Test-Cases — nur bestehende Selektoren anpassen |
| `auth.branding.*`-Keys | Erst in Phase 6 entfernen, NACHDEM BrandingPanel in Phase 5 entfernt wurde |
