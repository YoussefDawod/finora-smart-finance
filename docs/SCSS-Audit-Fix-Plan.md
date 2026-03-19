# 🔍 SCSS Audit — Fix & Optimierungsplan

## Aurora Flow Glass Design System — Vollständige Konformitätsprüfung

**Projekt:** Finora Smart-Finance Frontend  
**Design-System:** Aurora Flow Glass (Dark-First, Glassmorphism)  
**Geprüfte Dateien:** 126 / 126 SCSS-Dateien (100 % Abdeckung)  
**Erstellt:** 15. März 2026  
**Abgeschlossen:** Phase A–E vollständig implementiert ✅  
**Build-Status:** `✓ built in 8.13s` — 0 Fehler, 1683 Module transformiert  
**Referenz:** Projekt-Design.md (Single Source of Truth)

---

## Inhaltsverzeichnis

1. [Audit-Ergebnis Übersicht](#1-audit-ergebnis-übersicht)
2. [Aurora Design System — Grundprinzipien](#2-aurora-design-system--grundprinzipien)
3. [Theme-Architektur Optimierung (Hell/Dunkel)](#3-theme-architektur-optimierung-helldunkel)
4. [Phase A — KRITISCH: Glass-System-Integrität](#4-phase-a--kritisch-glass-system-integrität)
5. [Phase B — HOCH: Redundante Imports entfernen](#5-phase-b--hoch-redundante-imports-entfernen)
6. [Phase C — HOCH: Token-Compliance (blur, backdrop, rgba)](#6-phase-c--hoch-token-compliance-blur-backdrop-rgba)
7. [Phase D — MITTEL: Hardcodierte Werte ersetzen](#7-phase-d--mittel-hardcodierte-werte-ersetzen)
8. [Phase E — MITTEL: Shadow/Border Aurora-Konformität](#8-phase-e--mittel-shadowborder-aurora-konformität)
9. [Phase F — NIEDRIG: Konsistenz & Klärungsbedarf](#9-phase-f--niedrig-konsistenz--klärungsbedarf)
10. [Gesamtübersicht aller Dateien](#10-gesamtübersicht-aller-dateien)
11. [Umsetzungsstrategie](#11-umsetzungsstrategie)

---

## 1. Audit-Ergebnis Übersicht

### Gesamtstatistik

| Metrik | Wert |
|--------|------|
| **SCSS-Dateien gesamt** | 126 |
| **Basis-Dateien** (variables, mixins, themes, globals…) | 16 |
| **Modul-Dateien** (.module.scss) | 101 |
| **Partials/Utilities** (_nav-items, _helpers, _glow…) | 9 |
| **Dateien mit Verstößen** | ~45 |
| **Dateien CLEAN (kein Handlungsbedarf)** | ~81 |
| **Einzelne Violations gesamt** | ~130+ |

### Verstöße nach Kategorie

| Kategorie | Anzahl | Schweregrad |
|-----------|--------|-------------|
| Light-Theme Glass-Token falsch | 2 | 🔴 KRITISCH |
| Focus-Ring Opacity falsch (12% statt 40%) | 3 | 🔴 KRITISCH |
| Redundante `@use variables` Imports | 54 | 🟠 HOCH |
| Hardcoded `blur()` Werte | 9 Dateien | 🟠 HOCH |
| Fehlende `@supports not` Fallbacks | 10 Dateien | 🟠 HOCH |
| Dark-Theme Shadows mit `rgba(0,0,0)` statt Aurora | 4 | 🟡 MITTEL |
| Hardcoded `rgba()` Overlays | 3 | 🟡 MITTEL |
| Hardcoded `#hex` direkt (ohne var-Fallback) | 4 | 🟡 MITTEL |
| Hardcoded Keyword `white`/`black` in Shadows | 5 Dateien | 🟡 MITTEL |
| Falsche/fehlende Token-Namen | 3 Dateien | 🟡 MITTEL |
| Hardcoded `font-size` in px | 7 | 🟡 MITTEL |
| Hardcoded rem-Werte statt Tokens (Auth-Forms) | ~30+ | 🟡 MITTEL |
| Hardcoded gap/padding in px (1-5px) | 13+ | 🔵 NIEDRIG |
| `!important` Nutzung | 1 (+ 6 absichtliche Base-Utilities) | 🔵 NIEDRIG |
| Fehlende `-webkit-backdrop-filter` | 1 | 🔵 NIEDRIG |
| Font-Family-Diskrepanz (Design-Entscheidung nötig) | 1 | 🔵 NIEDRIG |

---

## 2. Aurora Design System — Grundprinzipien

### 2.1 Das Aurora Flow Glass Design System

Finora Smart-Finance nutzt das **Aurora Flow Glass Design System** — ein immersives, dark-first Glassmorphism-Designsystem.

**Kernprinzipien:**
- **Dark-First:** Dark-Theme als primärer Modus, Light-Theme als gleichwertiger Zweit-Modus
- **Glassmorphism:** Semitransparente Panels mit `backdrop-filter`, Aurora-getönten Schatten, subtilen Borders
- **Aurora-Gradient:** Dynamischer Gradient-Hintergrund auf Dashboard/Product-Pages, gesteuert durch `--aurora-angle`
- **Token-basiert:** Alle visuellen Eigenschaften werden über CSS Custom Properties (`var(--token)`) gesteuert
- **Farben leiten sich ab:** Schatten, Borders, Glow-Effekte beziehen sich **ausschließlich** aus den definierten Aurora-Farben — **keine grauen, weißen oder schwarzen Stufen**

### 2.2 SCSS-Basis-Dateien = Steuerungszentrale

Die folgenden 6 Basis-Dateien bilden die **Steuerungszentrale** des gesamten Aurora Design Systems. Alle 101+ Modul-Dateien MÜSSEN sich an deren Tokens halten — **ohne Ausnahmen:**

| Datei | Rolle |
|-------|-------|
| `src/styles/variables.scss` | **Single Source of Truth** — Alle CSS Custom Properties (Spacing, Typografie, Glass-Blur, Glow, Motion, Depth, Breakpoints, Z-Index) |
| `src/styles/mixins.scss` | **Wiederverwendbare Patterns** — `generate-theme()`, `glass-panel()`, `focus-ring`, `input-base`, responsive Breakpoints, Layout-Helfer |
| `src/styles/themes/dark.scss` | **Dark-Theme Palette** — Farben, Glass-Tokens, Aurora-Gradient, Schatten-Overrides |
| `src/styles/themes/light.scss` | **Light-Theme Palette** — Farben, Glass-Tokens, Aurora-Gradient, Schatten-Overrides |
| `src/styles/globals.scss` | **CSS-Reset, Base-Typografie** — aurora-dashboard Hintergrund, RTL, Scroll-Verhalten |
| `src/styles/animations.scss` | **Keyframes-Bibliothek** — Entrance-/Exit-Animationen |

### 2.3 Null-Toleranz-Regel

> **Es gibt KEINE Ausnahmen.** Jede einzelne der 126 SCSS-Dateien muss die Basis-Dateien respektieren. Hardcodierte Werte für Farben, Schatten, Blur, Borders, Spacing, Typografie und Abstände sind **verboten**, wenn ein entsprechender Token existiert.

---

## 3. Theme-Architektur Optimierung (Hell/Dunkel)

### 3.1 Aktueller Zustand

Das Theme-System nutzt einen cleveren `generate-theme($name, $palette)` Mixin, der aus **5 Hauptfarben** automatisch alle CSS-Properties erzeugt:

```
$palette = (background, text, primary, secondary, accent, success, warning, error, info)
    ↓ generate-theme()
    ↓
[data-theme="dark/light"] {
  --background, --bg, --bg-secondary        ← abgeleitet aus $bg
  --text, --tx, --tx-muted                  ← abgeleitet aus $tx
  --surface, --surface-2, --surface-3       ← abgeleitet aus $bg (tint)
  --border, --border-light, --border-strong ← abgeleitet aus $tx (alpha)
  --primary, --pri-hover, --on-primary      ← abgeleitet aus $pri
  --secondary, --sec-hover, --on-secondary  ← abgeleitet aus $sec
  --accent, --acc-hover, --on-accent        ← abgeleitet aus $acc
  --success/warning/error/info + hover/rgb/on-* ← abgeleitet aus Status-Farben
  --sh-xs bis --sh-2xl                      ← abgeleitet aus $tx (alpha)
  --focus-ring-color                        ← abgeleitet aus $pri
}
```

**Das Prinzip ist korrekt:** Man ändert nur die 5-9 Hauptfarben im $palette-Map, und das gesamte System aktualisiert sich automatisch.

### 3.2 Probleme: Manuelle Overrides brechen die Automatik

Das Dark-Theme überschreibt die vom Mixin generierten Schatten mit **hartcodierten `rgba(0,0,0,...)`-Werten**. Dadurch wird die Automatik unterbrochen — eine Änderung der Palette-Farben hat **keinen Einfluss** auf die Schatten:

```scss
// ❌ AKTUELL in dark.scss — bricht die Automatik
--sh-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.15);           // Reines Schwarz
--sh-md: 0 4px 6px -1px rgba(0, 0, 0, 0.2), ...     // Reines Schwarz
--sh-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.25), ...   // Reines Schwarz
--sh-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.3), ...    // Reines Schwarz
```

### 3.3 SOLL: Theme-Dateien professionell optimieren

**Ziel:** Die Theme-Dateien (light.scss / dark.scss) müssen so professionell entwickelt werden, dass man **nur die Hauptfarben** im `$palette`-Map ändern muss — danach werden **alle Farben, Schatten, Effekte, Borders automatisch** im gesamten System angewendet.

**Optimierungsstrategie:**

#### A) Dark-Theme Shadow-Overrides entfernen

Die 4 Shadow-Overrides in `dark.scss` müssen **entfernt** werden. Der `generate-theme()` Mixin erzeugt bereits korrekte, Aurora-derived Schatten aus `$tx` (= `#EDE9FE` im Dark-Theme):

```scss
// ✅ generate-theme() erzeugt automatisch:
--sh-sm: 0 1px 2px 0 #{alpha($tx, 0.05)};     // rgba(237, 233, 254, 0.05)
--sh-md: 0 4px 6px -1px #{alpha($tx, 0.08)};   // rgba(237, 233, 254, 0.08)
```

Falls die generierten Werte zu schwach für Dark sind, sollte `generate-theme()` mit einem Dark-Multiplikator erweitert werden — **nicht** mit manuellen Overrides.

#### B) Glass-Shadows bleiben als Aurora-getönte Overrides

Die `--glass-shadow` und `--glass-shadow-elevated` Tokens in beiden Themes sind **korrekt** — sie verwenden `color-mix(in srgb, var(--primary) %, ...)` und sind damit automatisch Aurora-getönt.

#### C) Light-Theme Glass-Borders korrigieren (→ Phase A)

Die Light-Theme Glass-Border-Tokens weichen kritisch von der Spezifikation ab (siehe Phase A).

#### D) `--depth-1` Token Aurora-konform machen

`variables.scss` definiert `--depth-1: 0 2px 8px rgba(0, 0, 0, 0.04)` mit hartem Schwarz. Soll zu `color-mix` oder Theme-Referenz werden.

#### E) Overlay-Token prüfen

- Dark: `--overlay: rgba(0, 0, 0, 0.7)` — akzeptabel (reines Schwarz für Overlays ist Standard)
- Light: `--overlay: rgba(30, 27, 75, 0.35)` — **korrekt Aurora-tinted** (Indigo-950 Basis)

### 3.4 Zusammenfassung — automatisches Farbsystem

Nach den Fixes wird das System so funktionieren:

```
Änderung: $dark-palette → background: #1A0F2E (statt #0C0A1F)
          ↓ automatisch
          → --bg, --bg-secondary, --surface, --surface-2, --surface-3 aktualisiert
          → --border, --border-light, --border-strong aktualisiert
          → --sh-xs bis --sh-2xl aktualisiert (TEXT-basiert, Aurora-derived)
          → --glass-shadow aktualisiert (PRIMARY-tinted, color-mix)
          → --overlay, --on-*, --tx-muted etc. aktualisiert
          → KEIN manueller Override nötig
```

---

## 4. Phase A — KRITISCH: Glass-System-Integrität

### 4.1 Light-Theme Glass-Border-Tokens falsch

**Problem:** Die Glass-Borders im Light-Theme verwenden farbgetönte Werte statt der in Projekt-Design.md spezifizierten weißen Basis.

| Token | IST (light.scss L49-50) | SOLL (Projekt-Design.md) | Abweichung |
|-------|------------------------|--------------------------|------------|
| `--glass-border` | `rgba(232, 121, 249, 0.08)` | `rgba(255, 255, 255, 0.08)` | Fuchsia-Basis statt Weiß |
| `--glass-border-light` | `rgba(96, 165, 250, 0.267)` | `rgba(255, 255, 255, 0.04)` | Blau-Basis, 27% statt 4% |

**Auswirkung:** Alle Glass-Panels im Light-Mode haben sichtbar farbige Ränder. `--glass-border-light` ist **fast 7× stärker** als spezifiziert (27% vs. 4% Opacity).

**Ort:** `src/styles/themes/light.scss` Zeile 49-50

**Fix:**
```scss
// ❌ VORHER
--glass-border: rgba(232, 121, 249, 0.08);
--glass-border-light: rgba(96, 165, 250, 0.267);

// ✅ NACHHER (laut Projekt-Design.md Spezifikation)
--glass-border: rgba(255, 255, 255, 0.08);
--glass-border-light: rgba(255, 255, 255, 0.04);
```

### 4.2 Focus-Ring Opacity 12% statt 40%

**Problem:** Drei Stellen verwenden 12% Focus-Ring-Opacity statt der in Projekt-Design.md §8.6 vorgeschriebenen **40%**. Der Link-Focus-Ring (globals.scss L197) ist korrekt bei 40% — Button und Input sind inkonsistent.

| Stelle | Datei | Zeile | IST | SOLL |
|--------|-------|-------|-----|------|
| `@mixin input-base` → `&:focus-visible` | `src/styles/mixins.scss` | L410 | `color-mix(…, var(--primary) 12%, …)` | `40%` |
| `@mixin input-base` → `&:focus` | `src/styles/mixins.scss` | L405 | `rgba(…, 0.1)` (~10%) | `rgba(…, 0.25)` oder `color-mix 40%` |
| `button` → `&:focus-visible` | `src/styles/globals.scss` | L275 | `color-mix(…, var(--primary) 12%, …)` | `40%` |

**Fix mixins.scss L408-411:**
```scss
// ❌ VORHER
&:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 12%, transparent);
}

// ✅ NACHHER
&:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 40%, transparent);
}
```

**Fix globals.scss L273-276:**
```scss
// ❌ VORHER
&:focus-visible {
  outline: none;
  box-shadow: 0 0 0.5px 2px color-mix(in srgb, var(--primary) 12%, transparent);
}

// ✅ NACHHER
&:focus-visible {
  outline: none;
  box-shadow: 0 0 0.5px 2px color-mix(in srgb, var(--primary) 40%, transparent);
}
```

---

## 5. Phase B — HOCH: Redundante Imports entfernen

### 5.1 Problem

**54 Modul-Dateien** importieren `@use '@/styles/variables' as *;`, obwohl:
1. `variables.scss` **keine Sass `$`-Variablen** exportiert — nur CSS Custom Properties unter `:root`
2. Vite injiziert `variables.scss` bereits automatisch via `additionalData` in `vite.config.js`
3. Jeder `@use` dupliziert den `:root`-Block und kann Theme-Overrides stören (siehe Projekt-Design.md §11.2)

### 5.2 Betroffene Dateien (alle 54)

| # | Datei | Import-Zeile |
|---|-------|-------------|
| 1 | `src/components/transactions/TransactionQuota/TransactionQuota.module.scss` | L4 |
| 2 | `src/components/transactions/CategoryPicker/CategoryPicker.module.scss` | L4 |
| 3 | `src/components/transactions/TransactionList/TransactionList.module.scss` | L1 |
| 4 | `src/components/transactions/TransactionForm/TransactionForm.module.scss` | L4 |
| 5 | `src/components/settings/ExportSection/ExportSection.module.scss` | L6 |
| 6 | `src/pages/admin/AdminAuditLogPage.module.scss` | L4 |
| 7 | `src/pages/admin/AdminCampaignsPage.module.scss` | L4 |
| 8 | `src/pages/TransactionsPage.module.scss` | L4 |
| 9 | `src/pages/admin/AdminCampaignComposer.module.scss` | L4 |
| 10 | `src/components/settings/BudgetSettings/BudgetSettings.module.scss` | L1 |
| 11 | `src/pages/admin/AdminLifecyclePage.module.scss` | L4 |
| 12 | `src/pages/admin/AdminDashboardPage.module.scss` | L4 |
| 13 | `src/pages/admin/AdminTransactionsPage.module.scss` | L4 |
| 14 | `src/pages/admin/AdminSubscribersPage.module.scss` | L4 |
| 15 | `src/pages/admin/AdminUsersPage.module.scss` | L4 |
| 16 | `src/pages/SettingsPage/SettingsPage.module.scss` | L1 |
| 17 | `src/pages/EmailVerificationPage.module.scss` | L4 |
| 18 | `src/pages/ProfilePage/ProfilePage.module.scss` | L1 |
| 19 | `src/pages/NotFoundPage.module.scss` | L4 |
| 20 | `src/components/admin/AdminStatCard/AdminStatCard.module.scss` | L4 |
| 21 | `src/components/admin/AdminUserTable/AdminUserTable.module.scss` | L4 |
| 22 | `src/components/admin/AdminCreateUser/AdminCreateUser.module.scss` | L4 |
| 23 | `src/components/admin/AdminCampaignDetail/AdminCampaignDetail.module.scss` | L4 |
| 24 | `src/components/admin/AdminTransactionDetail/AdminTransactionDetail.module.scss` | L4 |
| 25 | `src/components/common/ToastContainer/ToastContainer.module.scss` | L4 |
| 26 | `src/components/admin/AdminRecentUsers/AdminRecentUsers.module.scss` | L4 |
| 27 | `src/components/admin/AdminCharts/AdminCharts.module.scss` | L4 |
| 28 | `src/components/admin/AdminAuditLogTable/AdminAuditLogTable.module.scss` | L4 |
| 29 | `src/components/admin/AdminSubscriberTable/AdminSubscriberTable.module.scss` | L4 |
| 30 | `src/components/admin/AdminErrorBoundary/AdminErrorBoundary.module.scss` | L1 |
| 31 | `src/components/admin/AdminSubscriberDetail/AdminSubscriberDetail.module.scss` | L4 |
| 32 | `src/components/admin/AdminUserDetail/AdminUserDetail.module.scss` | L4 |
| 33 | `src/components/common/Toast/Toast.module.scss` | L4 |
| 34 | `src/components/admin/AdminTransactionUserList/AdminTransactionUserList.module.scss` | L4 |
| 35 | `src/components/common/Modal/Modal.module.scss` | L4 |
| 36 | `src/components/common/DateInput/DateInput.module.scss` | L17 |
| 37 | `src/components/common/Textarea/Textarea.module.scss` | L4 |
| 38 | `src/components/common/CookieConsent/CookieConsent.module.scss` | L4 |
| 39 | `src/components/common/Button/Button.module.scss` | L4 |
| 40 | `src/components/layout/MainLayout/MainLayout.module.scss` | L4 |
| 41 | `src/components/common/AuthRequiredOverlay/AuthRequiredOverlay.module.scss` | L1 |
| 42 | `src/components/admin/AdminTransactionTable/AdminTransactionTable.module.scss` | L4 |
| 43 | `src/components/common/Checkbox/Checkbox.module.scss` | L8 |
| 44 | `src/components/common/Input/Input.module.scss` | L4 |
| 45 | `src/components/common/Select/Select.module.scss` | L4 |
| 46 | `src/components/common/Skeleton/Skeleton.module.scss` | L8 |
| 47 | `src/components/common/Skeleton/SkeletonTableRow.module.scss` | L4 |
| 48 | `src/components/common/Skeleton/SkeletonChart.module.scss` | L4 |
| 49 | `src/components/common/FilterDropdown/FilterDropdown.module.scss` | L6 |
| 50 | `src/components/common/Skeleton/SkeletonCard.module.scss` | L4 |
| 51 | `src/components/common/Alert/Alert.module.scss` | L4 |
| 52 | `src/components/common/Filter/Filter.module.scss` | L4 |
| 53 | `src/components/common/Search/Search.module.scss` | L4 |
| 54 | `src/components/common/Skeleton/AuthPageSkeleton.module.scss` | L4 |

### 5.3 Fix

Alle 54 Zeilen `@use '@/styles/variables' as *;` **entfernen**. CSS Custom Properties benötigen keinen Import.

**Validierung nach Fix:** `npm run build` (Vite) — muss fehlerfrei kompilieren.

---

## 6. Phase C — HOCH: Token-Compliance (blur, backdrop, rgba)

### 6.1 Hardcoded `blur()` Werte ersetzen (9 Dateien, 10 Stellen)

Alle `blur()`-Werte müssen die in `variables.scss` definierten Glass-Blur-Tokens verwenden:
- `--glass-blur: 28px` (Standard)
- `--glass-blur-reduced: 16px` (Reduziert)  
- `--glass-blur-minimal: 10px` (Minimal)

| # | Datei | Zeile | IST | SOLL |
|---|-------|-------|-----|------|
| 1 | `src/components/ui/SensitiveData/SensitiveData.module.scss` | L2 | `filter: blur(6px)` | `filter: blur(var(--glow-blur-sm, 6px))` |
| 2 | `src/components/auth/BrandingPanel/BrandingPanel.module.scss` | L201-202 | `blur(8px)` | `blur(var(--glass-blur-minimal))` |
| 3 | `src/components/dashboard/FloatingMetric/FloatingMetric.module.scss` | L84-85 | `blur(8px)` | `blur(var(--glass-blur-minimal))` |
| 4 | `src/components/dashboard/DashboardFilter/DashboardFilter.module.scss` | L333-334 | `blur(2px)` | `blur(var(--glass-blur-minimal))` |
| 5 | `src/components/common/CookieConsent/CookieConsent.module.scss` | L15-16 | `blur(8px)` | `blur(var(--glass-blur-minimal))` |
| 6 | `src/components/layout/HamburgerMenu/HamburgerMenu.module.scss` | L16-17 | `blur(4px)` | `blur(var(--glass-blur-minimal))` |
| 7 | `src/components/common/CommandBar/CommandBar.module.scss` | L16-17 | `blur(4px)` | `blur(var(--glass-blur-minimal))` |
| 8 | `src/components/layout/AdminLayout/AdminLayout.module.scss` | L271-272 | `blur(4px)` | `blur(var(--glass-blur-minimal))` |
| 9 | `src/components/common/BrandingBackground/BrandingBackground.module.scss` | L152 | `blur(8px)` | `blur(var(--glass-blur-minimal))` |

**Ausnahme:** `mixins.scss` L907 `filter: blur(80px)` in `aurora-mesh-blob` — dekoratives Element, kein Glass.

### 6.2 Fehlende `-webkit-backdrop-filter` ergänzen (1 Datei)

| Datei | Zeile | Fix |
|-------|-------|-----|
| `src/components/common/BrandingBackground/BrandingBackground.module.scss` | L152 | Vor `backdrop-filter:` die Zeile `-webkit-backdrop-filter: blur(var(--glass-blur-minimal));` einfügen |

### 6.3 `@supports not (backdrop-filter: blur())` Fallbacks ergänzen (10 Dateien)

Alle Stellen mit `backdrop-filter` benötigen einen opaken Fallback für Browser ohne Support:

| # | Datei | backdrop-filter Zeile(n) |
|---|-------|--------------------------|
| 1 | `src/components/dashboard/SummaryCard/SummaryCard.module.scss` | L16 |
| 2 | `src/components/dashboard/FloatingMetric/FloatingMetric.module.scss` | L84 |
| 3 | `src/components/auth/BrandingPanel/BrandingPanel.module.scss` | L201 |
| 4 | `src/components/auth/MultiStepRegisterForm/MultiStepRegisterForm.module.scss` | L487 |
| 5 | `src/components/dashboard/DashboardFilter/DashboardFilter.module.scss` | L36, L98, L333, L345 |
| 6 | `src/components/common/CookieConsent/CookieConsent.module.scss` | L15 |
| 7 | `src/components/common/CommandBar/CommandBar.module.scss` | L16, L30 |
| 8 | `src/components/common/BrandingBackground/BrandingBackground.module.scss` | L152 |
| 9 | `src/components/common/DateInput/DateInput.module.scss` | L152 |
| 10 | `src/pages/pricing/PricingPage.module.scss` | L119 |

**Fix-Pattern:**
```scss
@supports not (backdrop-filter: blur(1px)) {
  background: var(--glass-bg-fallback, rgba(15, 18, 35, 0.85));
}
```

### 6.4 Hardcoded `rgba()` Overlays ersetzen (3 Stellen)

| # | Datei | Zeile | IST | SOLL |
|---|-------|-------|-----|------|
| 1 | `src/components/common/CommandBar/CommandBar.module.scss` | L15 | `background: rgba(0, 0, 0, 0.45)` | `background: var(--overlay)` |
| 2 | `src/components/dashboard/DashboardFilter/DashboardFilter.module.scss` | L332 | `background: rgba(0, 0, 0, 0.45)` | `background: var(--overlay)` |
| 3 | `src/components/dashboard/DashboardFilter/DashboardFilter.module.scss` | L350 | `box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.25)` | `box-shadow: var(--sh-xl)` oder `--glass-shadow-elevated` |

---

## 7. Phase D — MITTEL: Hardcodierte Werte ersetzen

### 7.1 Direkte `#hex`-Farben ersetzen (4 Stellen)

| # | Datei | Zeile | IST | SOLL |
|---|-------|-------|-----|------|
| 1 | `src/components/admin/AdminErrorBoundary/AdminErrorBoundary.module.scss` | L75 | `color: #fff` | `color: var(--text-on-primary)` |
| 2 | `src/components/admin/AdminCreateUser/AdminCreateUser.module.scss` | L346 | `color: #fff` | `color: var(--text-on-primary)` |
| 3 | `src/components/admin/AdminCreateUser/AdminCreateUser.module.scss` | L351 | `color: #fff` | `color: var(--text-on-primary)` |
| 4 | `src/pages/admin/AdminCampaignComposer.module.scss` | L332 | `background: #fff` | `background: var(--surface)` |

### 7.2 Falsche/fehlende Token-Namen korrigieren (3 Dateien)

#### OfflineBanner — Nicht-existierende Tokens

| Datei | Zeile | IST | SOLL |
|-------|-------|-----|------|
| `src/components/common/OfflineBanner/OfflineBanner.module.scss` | L13 | `var(--color-warning, #f59e0b)` | `var(--warning)` |
| `src/components/common/OfflineBanner/OfflineBanner.module.scss` | L14 | `var(--color-warning-text, #1a1a2e)` | `var(--on-warning)` |

Die Tokens `--color-warning` und `--color-warning-text` existieren **nicht** in variables.scss. Die korrekten, vom `generate-theme()` Mixin erzeugten Tokens sind `--warning` und `--on-warning`.

#### PageFallback — Falsche Token-Kürzel

| Datei | Token-Stellen | IST | SOLL |
|-------|--------------|-----|------|
| `src/components/common/Skeleton/PageFallback.module.scss` | Gesamte Datei | `--s-lg`, `--s-sm`, `--s-md`, `--s-xl` | `--space-lg`, `--space-sm`, `--space-md`, `--space-xl` |

Die Tokens `--s-lg` etc. existieren **nicht**. Korrekt: `--space-*`.

#### _input.scss — Hardcoded `white` Keyword (Entfernt)

| Datei | Stelle | IST | SOLL |
|-------|--------|-----|------|
| `src/styles/components/_input.scss` | `.switch:checked::after` | `background: white;` | `background: var(--text-on-primary);` |

### 7.3 Hardcoded `font-size` in px ersetzen (7 Stellen)

| # | Datei | Zeile | IST | SOLL |
|---|-------|-------|-----|------|
| 1 | `src/components/layout/AdminLayout/AdminLayout.module.scss` | L381 | `font-size: 9px` | `font-size: var(--fs-2xs)` |
| 2 | `src/components/layout/AdminLayout/AdminLayout.module.scss` | L403 | `font-size: 9px` | `font-size: var(--fs-2xs)` |
| 3 | `src/components/dashboard/FloatingMetric/FloatingMetric.module.scss` | L78 | `font-size: 11px` | `font-size: var(--fs-xs)` |
| 4 | `src/components/layout/Sidebar/Sidebar.module.scss` | L160 | `font-size: 9px` | `font-size: var(--fs-2xs)` |
| 5 | `src/components/layout/Sidebar/Sidebar.module.scss` | L182 | `font-size: 9px` | `font-size: var(--fs-2xs)` |
| 6 | `src/components/layout/HamburgerMenu/HamburgerMenu.module.scss` | L124 | `font-size: 9px` | `font-size: var(--fs-2xs)` |
| 7 | `src/components/layout/HamburgerMenu/HamburgerMenu.module.scss` | L146 | `font-size: 9px` | `font-size: var(--fs-2xs)` |

**Hinweis:** `--fs-2xs: 0.625rem` (= 10px) existiert bereits in variables.scss. Für exakt 9px-Darstellung evtl. Wert anpassen auf `0.5625rem`.

### 7.4 Auth-Form rem-Werte tokenisieren (~30 Stellen)

Die Auth-Formulare (LoginForm, ForgotPasswordRequestForm, ResetPasswordForm, VerifyEmailForm) verwenden durchgängig hardcoded rem-Werte statt Design-Tokens:

| Pattern | IST (rem) | SOLL (Token) |
|---------|-----------|-------------|
| `font-size: 0.875rem` | 14px | `var(--fs-sm)` |
| `font-size: 0.8125rem` | 13px | `var(--fs-sm)` |
| `font-size: 1rem` | 16px | `var(--fs-md)` |
| `font-size: 1.125rem` | 18px | `var(--fs-lg)` |
| `font-size: 1.5rem` | 24px | `var(--fs-2xl)` |
| `font-size: 0.75rem` | 12px | `var(--fs-xs)` |
| `font-size: 0.9375rem` | 15px | `var(--fs-md)` |
| `gap: 1.5rem` | 24px | `var(--space-lg)` |
| `gap: 0.5rem` | 8px | `var(--space-xs)` |
| `gap: 0.75rem` | 12px | `var(--space-sm)` |
| `padding: 1.5rem 0` | 24px | `var(--space-lg) 0` |
| `padding-left: 0.25rem` | 4px | `var(--space-2xs)` |
| `margin-bottom: 1.5rem` | 24px | `var(--space-lg)` |
| `border-radius: 0.625rem` | 10px | `var(--r-md)` |
| `height: 3.25rem` | 52px | `var(--input-height-lg)` |

**Betroffene Dateien:**
- `src/components/auth/ForgotPasswordRequestForm/ForgotPasswordRequestForm.module.scss`
- `src/components/auth/LoginForm/LoginForm.module.scss`
- `src/components/auth/ResetPasswordForm/ResetPasswordForm.module.scss`
- `src/components/auth/VerifyEmailForm/VerifyEmailForm.module.scss`

### 7.5 Hardcoded padding/gap in px ersetzen (13+ Stellen)

| # | Datei | Zeile | IST | SOLL |
|---|-------|-------|-----|------|
| 1 | `src/pages/AuthPage/AuthPage.module.scss` | L161 | `gap: 2px` | `var(--space-3xs)` |
| 2 | `src/pages/SettingsPage/SettingsPage.module.scss` | L252 | `padding: 3px` | `var(--space-3xs)` |
| 3 | `src/components/dashboard/FlowAreaChart/FlowAreaChart.module.scss` | L75 | `gap: 2px` | `var(--space-3xs)` |
| 4 | `src/components/dashboard/FloatingMetric/FloatingMetric.module.scss` | L75 | `gap: 3px` | `var(--space-3xs)` |
| 5 | `src/components/auth/MultiStepRegisterForm/MultiStepRegisterForm.module.scss` | L523 | `gap: 4px` | `var(--space-2xs)` |
| 6 | `src/components/auth/MultiStepRegisterForm/MultiStepRegisterForm.module.scss` | L527 | `gap: 4px` | `var(--space-2xs)` |
| 7 | `src/components/auth/MultiStepRegisterForm/MultiStepRegisterForm.module.scss` | L531 | `gap: 2px` | `var(--space-3xs)` |
| 8 | `src/components/dashboard/GlassCategoryList/GlassCategoryList.module.scss` | L71 | `padding: 2px` | `var(--space-3xs)` |
| 9 | `src/components/dashboard/GlassCategoryList/GlassCategoryList.module.scss` | L72 | `gap: 2px` | `var(--space-3xs)` |
| 10 | `src/components/dashboard/OrbitalSavingsRing/OrbitalSavingsRing.module.scss` | L153 | `gap: 2px` | `var(--space-3xs)` |
| 11 | `src/components/admin/AdminRecentUsers/AdminRecentUsers.module.scss` | L101 | `padding: 1px 6px` | `1px var(--space-2xs)` |
| 12 | `src/components/common/DateInput/DateInput.module.scss` | L209 | `gap: 2px` | `var(--space-3xs)` |
| 13 | `src/components/common/DateInput/DateInput.module.scss` | L229 | `gap: 2px` | `var(--space-3xs)` |

---

## 8. Phase E — MITTEL: Shadow/Border Aurora-Konformität

### 8.1 Regel: Keine grauen, weißen oder schwarzen Stufen

> **Design-Regel:** Alle Shadows, Border-Effekte und Farbeffekte dürfen **keine grauen, weißen oder schwarzen Stufen** nutzen. Sie beziehen sich **ausschließlich** aus den definierten Aurora-Farben im Projekt (`--primary`, `--secondary`, `--accent`, `--tx`, `--bg`).

### 8.2 Dark-Theme Shadow-Overrides entfernen (4 Stellen)

Die manuellen `rgba(0, 0, 0, ...)` Overrides in `dark.scss` brechen die Aurora-Automatik:

| Token | IST (`dark.scss` L44-47) | SOLL (automatisch via `generate-theme`) |
|-------|--------------------------|----------------------------------------|
| `--sh-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.15)` | **Entfernen** — Mixin erzeugt `alpha($tx, 0.05)` = `rgba(237, 233, 254, 0.05)` |
| `--sh-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.2), …` | **Entfernen** — Mixin erzeugt `alpha($tx, 0.08)` |
| `--sh-lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.25), …` | **Entfernen** — Mixin erzeugt `alpha($tx, 0.12)` |
| `--sh-xl` | `0 20px 25px -5px rgba(0, 0, 0, 0.3), …` | **Entfernen** — Mixin erzeugt `alpha($tx, 0.16)` |

**Option:** Falls die vom Mixin generierten Opacitäten für das Dark-Theme zu schwach sind, `generate-theme()` um einen optionalen `$shadow-multiplier`-Parameter erweitern, der die Shadow-Opacitäten für Dark skaliert — so bleibt die Automatik intakt.

### 8.3 `--depth-1` Token Aurora-konform machen

| Token | IST (`variables.scss` L253) | SOLL |
|-------|---------------------------|------|
| `--depth-1` | `0 2px 8px rgba(0, 0, 0, 0.04)` | `0 2px 8px color-mix(in srgb, var(--tx) 4%, transparent)` |

Dadurch wird `--depth-1` automatisch Theme-aware: Im Dark-Theme nutzt er `--tx` (#EDE9FE), im Light-Theme `--tx` (#1E1B4B).

### 8.4 Hardcoded `white`/`black` Keywords in Shadows (5 Dateien)

**Auth-Form Submit-Buttons** (3 Dateien) verwenden `color-mix(in srgb, white ..., transparent)` für Inset-Shadows:

| # | Datei | Stellen | IST | SOLL |
|---|-------|---------|-----|------|
| 1 | `src/components/auth/ForgotPasswordRequestForm/ForgotPasswordRequestForm.module.scss` | submitButton box-shadow | `white 20%`, `white 25%`, `white 15%` | `var(--text-on-primary)` oder Aurora-Token |
| 2 | `src/components/auth/LoginForm/LoginForm.module.scss` | submitButton box-shadow | `white 20%`, `white 25%`, `white 15%` | `var(--text-on-primary)` |
| 3 | `src/components/auth/ResetPasswordForm/ResetPasswordForm.module.scss` | submitButton box-shadow | `white 20%`, `white 25%`, `white 15%` | `var(--text-on-primary)` |

**Footer.module.scss** (1 Datei) verwendet `black` in box-shadow:

| # | Datei | Stelle | IST | SOLL |
|---|-------|--------|-----|------|
| 4 | `src/components/layout/Footer/Footer.module.scss` | .footer box-shadow | `color-mix(in srgb, black 22%, transparent)` | `color-mix(in srgb, var(--tx) 22%, transparent)` |

### 8.5 Dark-Theme Glass-Borders prüfen

Die Dark-Theme Glass-Borders verwenden `rgba(255, 255, 255, 0.08/0.04)`. Laut Projekt-Design.md ist **Weiß-Basis** für Glass-Borders spezifiziert (identisch für beide Themes). Diese sind **korrekt laut Spec**, könnten aber langfristig Aurora-getönt werden (z.B. `color-mix(in srgb, var(--text) 8%, transparent)`).

---

## 9. Phase F — NIEDRIG: Konsistenz & Klärungsbedarf

### 9.1 `!important` Nutzung

**1 problematische Stelle:**
| Datei | Zeile | Regel | Empfehlung |
|-------|-------|-------|------------|
| `src/pages/AuthPage/AuthPage.module.scss` | L201 | `transition: none !important;` | Prüfen ob Spezifizität anders lösbar |

**6 absichtliche Basis-Utility-Stellen (kein Handlungsbedarf):**
- `_button.scss` → `.btn-loading` (`color: transparent !important`)
- `_skeleton.scss` → `.skeleton` (`color: transparent !important`)
- `_glow.scss` → `.no-glow` (2× `!important`)
- `_responsive.scss` → `.hide-mobile/tablet/desktop` (3× `!important`)

### 9.2 Font-Family-Diskrepanz (Design-Entscheidung nötig)

| Kontext | variables.scss (Code) | Projekt-Design.md (Spec) |
|---------|----------------------|--------------------------|
| `--ff-brand` | `'Bebas Neue', 'Space Grotesk Variable'` | `Plus Jakarta Sans` |
| Headlines/Panel-Titel | Bebas Neue | Plus Jakarta Sans 600-700 |
| Hero-Zahlen | Bebas Neue | Plus Jakarta Sans ExtraBold 800 |

**Aktion:** Design-Entscheidung treffen — welches Font wird tatsächlich gewünscht? Dann entweder Code **ODER** Spec anpassen. Beides muss konsistent sein.

### 9.3 Hex-Fallbacks in `var()` vereinheitlichen

~8 Dateien verwenden `var(--token, #fff)` als Fallback-Pattern. Diese sind technisch korrekt, sollten aber einheitlich sein. Empfehlung: Fallbacks beibehalten, aber mit korrekten Token-Referenzen.

---

## 10. Gesamtübersicht aller Dateien

### 126 SCSS-Dateien — Status

#### ✅ CLEAN (kein Handlungsbedarf) — 72 Dateien

<details>
<summary>Liste aufklappen</summary>

**Dashboard-Komponenten:**
- `AuroraBudgetBar.module.scss`
- `AuroraCanvas.module.scss`
- `CompactWidgetRow.module.scss`
- `FlowTransactionList.module.scss`
- `GlassPanel.module.scss`
- `HeroMetricPanel.module.scss`
- `QuotaIndicator.module.scss`
- `RecentTransactions.module.scss`
- `RetentionBanner.module.scss`

**Layout-Komponenten:**
- `AuthLayout.module.scss`
- `PublicLayout.module.scss`
- `PublicNav.module.scss`

**Common-Komponenten:**
- `MiniFooter.module.scss`
- `ThemeSelector.module.scss`
- `UserMenu.module.scss`

**Auth-Komponenten:**
- `ErrorBanner.module.scss`
- `PasswordInput.module.scss`

**Pages:**
- `AboutPage.module.scss`
- `BlogPage.module.scss`
- `BlogPostPage.module.scss`
- `ContactPage.module.scss`
- `DashboardPage.module.scss`
- `FaqPage.module.scss`
- `FeaturesPage.module.scss`
- `HelpPage.module.scss`
- `InfoPage.module.scss`
- `TermsPage.module.scss`
- `VerifyEmailPage/VerifyEmailPage.module.scss`

**Basis-Dateien:**
- `accessibility.scss`
- `animations.scss`
- `index.scss`
- `publicPage.module.scss`
- `partials/_nav-items.scss`
- `components/_card.scss`
- `components/_index.scss`
- `components/_modal.scss`
- `utilities/_helpers.scss`
- `utilities/_index.scss`

</details>

#### 🔧 FIX NÖTIG — 54 Dateien (nur `@use` entfernen)

Siehe [Phase B, Abschnitt 5.2](#52-betroffene-dateien-alle-54) für die vollständige Liste.

#### 🔧 FIX NÖTIG — Weitere Violations (zusätzlich zu @use)

| Datei | Violations |
|-------|-----------|
| `themes/light.scss` | Glass-Border-Tokens falsch (Phase A) |
| `themes/dark.scss` | Shadow-Overrides mit rgba(0,0,0) (Phase E) |
| `mixins.scss` | Focus-Ring 12% → 40% (Phase A) |
| `globals.scss` | Button Focus-Ring 12% → 40% (Phase A) |
| `variables.scss` | `--depth-1` hardcoded (Phase E) |
| `SensitiveData.module.scss` | Hardcoded blur() (Phase C) |
| `BrandingPanel.module.scss` | Hardcoded blur(), fehlende @supports (Phase C) |
| `FloatingMetric.module.scss` | Hardcoded blur(), font-size px, gap px, fehlende @supports (Phase C/D) |
| `DashboardFilter.module.scss` | Hardcoded blur(), rgba(), fehlende @supports (Phase C) |
| `CookieConsent.module.scss` | Hardcoded blur(), fehlende @supports (Phase C) |
| `HamburgerMenu.module.scss` | Hardcoded blur(), font-size px (Phase C/D) |
| `CommandBar.module.scss` | Hardcoded blur(), rgba() (Phase C) |
| `AdminLayout.module.scss` | Hardcoded blur(), font-size px (Phase C/D) |
| `BrandingBackground.module.scss` | Hardcoded blur(), fehlende webkit, fehlende @supports (Phase C) |
| `SummaryCard.module.scss` | Fehlende @supports (Phase C) |
| `MultiStepRegisterForm.module.scss` | Fehlende @supports, hardcoded gap px (Phase C/D) |
| `DateInput.module.scss` | Fehlende @supports, hardcoded gap px (Phase C/D) |
| `PricingPage.module.scss` | Fehlende @supports (Phase C) |
| `AdminErrorBoundary.module.scss` | Hardcoded #fff (Phase D) |
| `AdminCreateUser.module.scss` | 2× hardcoded #fff (Phase D) |
| `AdminCampaignComposer.module.scss` | Hardcoded #fff background (Phase D) |
| `OfflineBanner.module.scss` | Falsche Token-Namen (Phase D) |
| `PageFallback.module.scss` | Falsche Token-Kürzel --s-* (Phase D) |
| `_input.scss` | `background: white` im Switch (Phase D) |
| `Sidebar.module.scss` | 2× font-size 9px (Phase D) |
| `AuthPage.module.scss` | !important, hardcoded gap px (Phase D/F) |
| `SettingsPage.module.scss` | Hardcoded padding px (Phase D) |
| `FlowAreaChart.module.scss` | Hardcoded gap px (Phase D) |
| `GlassCategoryList.module.scss` | Hardcoded padding/gap px (Phase D) |
| `OrbitalSavingsRing.module.scss` | Hardcoded gap px (Phase D) |
| `AdminRecentUsers.module.scss` | Hardcoded padding px (Phase D) |
| `ForgotPasswordRequestForm.module.scss` | white keyword, rem-Werte (Phase D/E) |
| `LoginForm.module.scss` | white keyword, rem-Werte (Phase D/E) |
| `ResetPasswordForm.module.scss` | white keyword, rem-Werte (Phase D/E) |
| `VerifyEmailForm.module.scss` | rem-Werte (Phase D) |
| `Footer.module.scss` | black keyword in Shadow (Phase E) |
| `_button.scss` | !important (absichtlich — kein Fix nötig) |
| `_skeleton.scss` | !important (absichtlich — kein Fix nötig) |
| `_glow.scss` | !important (absichtlich — kein Fix nötig) |
| `_responsive.scss` | !important (absichtlich — kein Fix nötig) |

---

## 11. Umsetzungsstrategie

### Reihenfolge & Risikobewertung

| Phase | Aufgaben | Dateien | Risiko | Validierung |
|-------|----------|---------|--------|-------------|
| **A** | Light-Theme Glass-Borders + Focus-Ring 40% | 3 Dateien | Minimal | Visuell: Glass-Panel-Ränder prüfen |
| **B** | 54× `@use variables` entfernen | 54 Dateien | Mittel | `npm run build` — muss fehlerfrei kompilieren |
| **C** | blur()-Tokens + webkit + @supports + rgba() | ~15 Dateien | Minimal | Chrome DevTools: backdrop-filter aktiv |
| **D** | #hex, Token-Namen, font-size, px-Werte, rem→Token | ~25 Dateien | Minimal | Pixel-Vergleich: keine Layoutverschiebung |
| **E** | Shadow Aurora-Konformität + white/black Keywords | ~8 Dateien | Mittel | Visuell: Schatten-Farbton prüfen |
| **F** | !important, Font-Diskrepanz, Fallback-Cleanup | ~5 Dateien | Niedrig | Design-Entscheidung für Font nötig |

### Validierungsschritte nach jeder Phase

1. **Build-Test:** `npm run build` — keine SCSS-Kompilierungsfehler
2. **Visueller Test:** Dark + Light Theme im Browser prüfen
3. **Responsive Test:** Mobile (375px) → Tablet (768px) → Desktop (1440px)
4. **Accessibility Test:** Tab-Navigation → Focus-Rings sichtbar
5. **Cross-Browser:** Chrome + Firefox + Safari (backdrop-filter)

### Langfristige Empfehlungen

1. **Stylelint-Regel** einführen: `no-hardcoded-colors`, `no-important`, `use-design-tokens`
2. **CI-Check:** Automatische Prüfung auf `@use variables` in Modul-Dateien  
3. **SCSS-Konvention** dokumentieren: Nur `@use mixins` in Modul-Dateien, nie `@use variables`
4. **Theme-Test:** Automatisierter Visual Regression Test mit Dark/Light-Toggle

---

*Dieser Plan deckt alle 126 SCSS-Dateien ab. Keine Datei ist ausgenommen.*  
*Alle Violations beziehen sich auf das Aurora Flow Glass Design System (Projekt-Design.md).*
