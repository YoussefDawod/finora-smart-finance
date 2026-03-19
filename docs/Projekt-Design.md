# Finora Smart-Finance — Projekt-Design

> **Design-System:** Aurora Flow  
> **Motto:** „Tiefe spüren. Finanzen erleben."  
> **Stand:** Vollständig implementiert (2026)

---

## Inhaltsverzeichnis

1. [Design-Vision](#1-design-vision)
2. [Farb-System](#2-farb-system)
3. [Glass-System (Dashboard)](#3-glass-system-dashboard)
4. [Typografie](#4-typografie)
5. [Layout & Grid](#5-layout--grid)
6. [Komponenten-Übersicht](#6-komponenten-übersicht)
7. [Animationen & Motion](#7-animationen--motion)
8. [SCSS-Architektur](#8-scss-architektur)
9. [Farb-Regeln (Global)](#9-farb-regeln-global)
10. [Motion & Glow Regeln](#10-motion--glow-regeln)
11. [Lessons Learned](#11-lessons-learned)

---

## 1. Design-Vision

Aurora Flow ist ein **immersives, atmosphärisches Dashboard**, das Finanzdaten in eine räumliche Erfahrung verwandelt. Inspiriert von Apple Vision Pro, macOS Sonoma-Wallpapers und Glassmorphism-Interfaces — aber mit der nötigen Disziplin für eine Finanz-App.

Das Schlüsselelement ist **Tiefe**: Schwebende Glass-Panels auf einem animierten Gradient-Hintergrund erzeugen das Gefühl von Layering und Dimension.

### Leitprinzipien

| Prinzip | Bedeutung |
|---------|-----------|
| **Depth as information** | Z-Achsen-Position kommuniziert Hierarchie (wichtig = vorne) |
| **Glass, not ice** | Frosted Panels sind warm und einladend, nie kalt |
| **Gradient is ambient** | Der Gradient ist Atmosphäre, keine Ablenkung |
| **Smooth is premium** | Jede Interaktion fühlt sich physisch an (Spring-Physik, 60fps) |
| **Restraint in richness** | Visuell reich, aber nie auf Kosten von Lesbarkeit |
| **Token-Driven** | Keine hardcodierten Farben/Effekte — alles via CSS Custom Properties |

---

## 2. Farb-System

### 2.1 Übergeordnete Leitregel

```
┌─────────────────────────────────────────────────────────────────┐
│  --accent ist KEIN Funktions-Token.                             │
│                                                                 │
│  --accent = rein visuell (Glow, Highlight, Hero, Decor)        │
│  Er darf NIRGENDWO Status oder Logik ausdrücken.               │
└─────────────────────────────────────────────────────────────────┘
```

**`--accent` NUR für:** Hero-Hintergründe, Logo-Elemente, dekorative Glows, Branding  
**`--accent` NIEMALS für:** Buttons, Status-Badges, Alerts, Form-Validierung, funktionale UI-Elemente

### 2.2 Brand Color Priority

| Priorität | Token | Zweck | Beispiele |
|-----------|-------|-------|-----------|
| **1** | `--primary` | Brand Anchor | Buttons, Links, Focus, Aktionen |
| **2** | `--secondary` | Glow, Motion, Effects | Gradienten, Animationen |
| **3** | `--accent` | Highlight only | Hero-BG, Logo-Details, Glows |

### 2.3 Standard-Token-Palette

#### Light Theme
```scss
$light-palette: (
  background: #f5f7fb,   // Kühles Off-White
  text:       #0b1220,   // Deep Navy
  primary:    #5b6cff,   // Neon Indigo  → Dashboard: #6366F1 (Indigo-500)
  secondary:  #2dd4ff,   // Soft Cyan
  accent:     #f472d0,   // Neon Pink
  success:    #22c55e,   // Green-500
  warning:    #fbbf24,   // Amber-400
  error:      #f43f5e,   // Rose-500
  info:       #38bdf8    // Sky-400
);
```

#### Dark Theme
```scss
$dark-palette: (
  background: #070b1a,   // Deep Navy
  text:       #e9edff,   // Kühles Weiß   → Dashboard: #EDE9FE (Lavendel-Weiß)
  primary:    #7c83ff,   // Neon Violet   → Dashboard: #818CF8 (Indigo-400)
  secondary:  #32e1ff,   // Cyan Glow
  accent:     #ff6ec7,   // Neon Pink
  success:    #22c55e,   // Green-500     → Dashboard: #34D399 (Emerald-400)
  warning:    #facc15,   // Yellow-400    → Dashboard: #FBBF24 (Amber-400)
  error:      #fb7185,   // Rose-400
  info:       #60a5fa    // Blue-400      → Dashboard: #93C5FD (Blue-300)
);
```

### 2.4 Semantische Farbnutzung

Farben kommunizieren **Bedeutung** — nicht Dekoration:

| Token | Semantik |
|-------|----------|
| `--success` | Einnahmen, Erfolg, Bestätigung |
| `--error` | Ausgaben, Fehler, Warnung kritisch |
| `--warning` | Achtung, Limit erreicht |
| `--info` | Neutral, Balance, Information |
| `--primary` | Marke, Actions, Focus |
| `--secondary` | Unterstützend, Sekundär-Actions |
| `--accent` | Highlight, Hero-Bereiche |

### 2.5 System-Tokens

#### Backgrounds
| Token | Verwendung |
|-------|------------|
| `--bg` | Haupt-Hintergrund der Seite |
| `--surface` | Container, Cards (1. Ebene) |
| `--surface-2` | Nested Container, Hover-States, Progress-Track |
| `--surface-3` | **NUR** Modals, Overlays, Floating Panels |

#### Borders
| Token | Opacity | Verwendung |
|-------|---------|------------|
| `--border` | 12% | Standard Borders |
| `--border-light` | 6% | Subtile Trennlinien |
| `--border-strong` | 18% | Hover-States, Emphasis |

#### Text
| Token | Verwendung |
|-------|------------|
| `--tx` | Primärtext |
| `--tx-muted` | Sekundärtext, Beschreibungen |
| `--text-disabled` | Deaktivierte Elemente |

#### Contrast (auf farbigen Hintergründen)
Alle `--on-*` Tokens MÜSSEN WCAG AA Kontrast erfüllen (≥ 4.5:1):
`--on-primary` · `--on-secondary` · `--on-success` · `--on-error` · `--on-warning`

### 2.6 Opacity-Regeln mit `color-mix()`

```scss
// Single Source of Truth: KEINE Hex/RGBA in Komponenten
background: color-mix(in srgb, var(--success) 10%, transparent);  // Background-Overlay
border-color: color-mix(in srgb, var(--primary) 20%, transparent); // Border-Highlight
box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 40%, transparent); // Focus-Ring
background: color-mix(in srgb, var(--primary) 8%, var(--surface)); // Hover-State
```

### 2.7 Aurora-Akzentfarben (Dashboard)

| Token | Light | Dark | Rolle |
|-------|-------|------|-------|
| `--aurora-1` | `#A78BFA` | `#C4B5FD` | Lila — Balance/Savings |
| `--aurora-2` | `#60A5FA` | `#93C5FD` | Blau — Charts/Trends |
| `--aurora-3` | `#34D399` | `#6EE7B7` | Mintgrün — Einnahmen/Positive Trends |
| `--aurora-warn` | `#F87171` | `#FCA5A5` | Sanftes Rot — Ausgaben/Negative Trends |

> `--aurora-3` ≈ `--success`, `--aurora-warn` ≈ `--error`. Die Aurora-Töne sind weichere Varianten passend zur Glassmorphism-Ästhetik.

---

## 3. Glass-System (Dashboard)

### 3.1 Glass-Surface-Tokens

| Token | Light | Dark | Rolle |
|-------|-------|------|-------|
| `--glass-bg` | `rgba(255,255,255,0.40)` | `rgba(15,18,35,0.40)` | Panel-Hintergrund |
| `--glass-bg-hover` | `rgba(255,255,255,0.55)` | `rgba(15,18,35,0.55)` | Hover + neutrale Badges |
| `--glass-border` | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.08)` | 1px Panel-Border |
| `--glass-border-light` | `rgba(255,255,255,0.04)` | `rgba(255,255,255,0.04)` | Innere Trennlinien |
| `--glass-blur` | `28px` | `28px` | Desktop `backdrop-filter` |
| `--glass-blur-reduced` | `16px` | `16px` | Tablet Blur |
| `--glass-blur-minimal` | `10px` | `10px` | Mobile Blur |
| `--glass-shadow` | `0 8px 32px rgba(0,0,0,0.35)` | — | Panel-Schatten (Tiefe) |
| `--glass-shadow-elevated` | `0 16px 48px rgba(0,0,0,0.45)` | — | Hover-Shadow |

> Light und Dark verwenden bewusst **gleiche Alpha-Werte** für konsistentes Glass-Feeling.

### 3.2 Glass-Panel-Mixin

```scss
@mixin glass-panel($variant: 'standard') {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--r-xl);
  box-shadow: var(--glass-shadow);
  padding: var(--space-xl);

  @if $variant == 'hero'    { padding: var(--space-2xl); border-radius: var(--r-2xl); }
  @if $variant == 'compact' { padding: var(--space-md);  border-radius: var(--r-lg); }

  @include tablet { backdrop-filter: blur(var(--glass-blur-reduced)); }
  @include mobile { backdrop-filter: blur(var(--glass-blur-minimal)); padding: var(--space-lg); }

  @supports not (backdrop-filter: blur(1px)) { background: var(--surface); }
}
```

### 3.3 Dashboard-Token-Regel

**Innerhalb aller Dashboard-Komponenten gilt:**
- Ausschließlich `--glass-*` Tokens für Hintergründe, Borders, Shadows
- `--surface`, `--surface-2`, `--border`, `--bg-secondary` sind für **Nicht-Dashboard-Seiten** reserviert
- Blur immer via Token: `var(--glass-blur)` — nie `blur(20px)` direkt
- `-webkit-backdrop-filter` ist Pflicht (immer zusammen mit `backdrop-filter`)

### 3.4 Aurora-Gradient (Dashboard-Hintergrund)

Der Gradient sitzt auf `html.page-dashboard`, nicht auf dem Layout-Container:

```scss
// themes/dark.scss + light.scss
--aurora-gradient: linear-gradient(
  var(--aurora-angle, 135deg),   // scroll-animiert via JS
  var(--aurora-stop-1) 0%,
  var(--aurora-stop-2) 35%,
  var(--aurora-stop-3) 70%,
  var(--aurora-stop-4) 100%
);

html.page-dashboard {
  background: var(--aurora-gradient);
  background-attachment: fixed;
}
```

**Dark:** `#0C0A1F → #1A1145 → #0D1B2A → #0A1628` (tiefes Violett-Navy)  
**Light:** `#EDE9FE → #DBEAFE → #F0F9FF → #FDF4FF` (sanftes Lavendel-Himmelblau)

Der Gradient-Winkel verschiebt sich beim Scrollen von 135° auf ~160° (scroll-basiert, `requestAnimationFrame`-throttled, deaktiviert bei `prefers-reduced-motion`).

---

## 4. Typografie

### 4.1 Font-Pairing

| Rolle | Font | Gewicht | Einsatz |
|-------|------|---------|---------|
| **Headlines / Panel-Titel** | Plus Jakarta Sans | 600–700 | Weich geometrisch, Glassmorphism-Ästhetik |
| **Body / UI** | Inter Variable | 400–500 | Optimale Lesbarkeit auf Glass |
| **Display / Hero-Zahlen** | Plus Jakarta Sans | 700–800 | Große Beträge — weich, mit Gewicht |
| **Mono / Daten** | Fira Code | 400 | Beträge in Listen, Prozent-Werte |

### 4.2 Display-Größen (via `variables.scss`)

| Token | Wert | Verwendung |
|-------|------|-----------|
| `--fs-display` | `clamp(2.25rem, 4vw, 3.5rem)` | Hero-Betrag (Balance) |
| `--fs-metric-lg` | `clamp(1.5rem, 2.5vw, 2rem)` | Panel-Metriken (Income, Expense) |

Alle anderen Sizes via Token-System: `--fs-xs` `--fs-sm` `--fs-md` `--fs-lg` `--fs-xl` `--fs-2xl` `--fs-3xl`

### 4.3 Icon-Größen (vereinheitlicht)

| Kontext | Größe |
|---------|-------|
| Dashboard-Widgets (Budget, Kategorie, Transaktion, Quota) | `30px` |
| DashboardFilter Button-Icon | `14px` |
| SummaryCard Icon-Wrapper | `var(--fs-xl)` |

### 4.4 Typografie-Regeln

- **Text auf Glass:** `@include glass-text` → `text-shadow: 0 1px 2px rgba(0,0,0,0.1)` (Dark: `0 1px 3px rgba(0,0,0,0.3)`)
- **Hero-Zahlen:** Plus Jakarta Sans ExtraBold (`font-weight: 800`)
- **Tabular Numbers:** `font-variant-numeric: tabular-nums` auf **allen Beträgen**
- **Panel-Header-Standard:** `font-size: var(--fs-sm); font-weight: var(--fw-sb); color: var(--tx-muted); text-transform: uppercase; letter-spacing: 0.06em; @include glass-text`

---

## 5. Layout & Grid

### 5.1 Dashboard-Struktur

```
html.page-dashboard (Aurora-Gradient, background-attachment: fixed)
└── MainLayout (.mainLayout, background: transparent via --layout-bg)
    └── DashboardPage (.auroraLayout, max-width: 1200px, flex column)
        ├── AuroraCanvas (fixed, z-index: var(--z-below))
        ├── headerSection (flex row, z-index: 2)
        │   ├── greeting (h1 + p, glass-text)
        │   └── headerActions (DashboardFilter + Add-Button)
        ├── HeroMetricPanel (grid: repeat(3, 1fr))
        │   ├── Balance Card (--info)
        │   ├── Income Card (--success)
        │   └── Expense Card (--error)
        ├── panelRow (grid: 1fr 1fr)
        │   ├── GlassPanel > OrbitalSavingsRing
        │   └── GlassPanel > FlowAreaChart
        ├── panelRow (grid: 1fr 1fr)
        │   ├── GlassPanel > GlassCategoryList
        │   └── GlassPanel > FlowTransactionList
        └── CompactWidgetRow
            ├── widgetRow (grid: 1fr 1fr)
            │   ├── GlassPanel compact > AuroraBudgetBar
            │   └── GlassPanel compact > QuotaIndicator
            └── [optional] GlassPanel compact > RetentionBanner
```

### 5.2 Grid-Spezifikation

```css
.auroraLayout  { display: flex; flex-direction: column; gap: var(--space-xl); max-width: 1200px; margin: 0 auto; padding: var(--space-2xl); }
.heroGrid      { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-lg); }
.panelRow      { display: grid; grid-template-columns: 1fr 1fr;        gap: var(--space-lg); }
.widgetRow     { display: grid; grid-template-columns: 1fr 1fr;        gap: var(--space-lg); }
```

### 5.3 Responsive Breakpoints

#### Tablet (768px – 1023px) — `@include tablet`
- Padding: `var(--space-xl)` (32px), Gap: `var(--space-lg)`
- Alle Grids → 1 Spalte
- Blur: `var(--glass-blur-reduced)` (16px)

#### Mobile (< 640px) — `@include mobile`
- Padding: `var(--space-md)` (16px), Gap: `var(--space-md)`
- Alle Grids → 1 Spalte, volle Breite
- Blur: `var(--glass-blur-minimal)` (10px)
- `border-radius: var(--r-lg)`, Padding: `var(--space-lg)`
- Header-Buttons: `flex: 1` (50/50 Split)
- Ambient Mesh: deaktiviert

### 5.4 Z-Index Stack

| Token | Wert | Verwendung |
|-------|------|-----------|
| `--z-below` | -1 | AuroraCanvas (hinter allem) |
| `--z-dropdown` | 1000 | Filter-Dropdown |
| `--z-sticky` | 1100 | Sticky-Elemente |
| `--z-header` | 1150 | App-Header |
| `--z-overlay` | 1200 | Overlays |
| `--z-modal` | 1300 | Modals / Bottom-Sheet-Backdrop |
| `--z-popover` | 1400 | Popovers / Bottom-Sheet-Panel |
| `--z-toast` | 1500 | Toast-Notifications |
| `--z-tooltip` | 1600 | Tooltips / DateInput-Kalender |

---

## 6. Komponenten-Übersicht

### 6.1 Dashboard-Komponenten

| Komponente | Pfad | Beschreibung |
|------------|------|-------------|
| `AuroraCanvas` | `dashboard/AuroraCanvas/` | Fixed-Position Gradient-Hintergrund mit 3 animierten Mesh-Blobs. JS-animierte CSS-Custom-Properties auf `<html>`. |
| `GlassPanel` | `ui/GlassPanel/` | Basis-Baustein. Props: `variant` (`standard`\|`hero`\|`compact`), `elevated`. Nutzt `glass-panel()` Mixin. |
| `HeroMetricPanel` | `dashboard/HeroMetricPanel/` | 3 Cards in `repeat(3,1fr)`. Balance=`--info`, Income=`--success`, Expense=`--error`. Farbige Borders (30%) + `color-mix` Box-Shadow. |
| `FloatingMetric` | `dashboard/FloatingMetric/` | Einzelne KPI-Anzeige. Props: `label`, `value`, `trendVariant`, `dataTrend`, `trendLabel`, `hero`. Trend-Badge mit `--aurora-3`/`--aurora-warn`. Trend-Icon zeigt **tatsächliche Datenrichtung** (`dataTrend`). |
| `OrbitalSavingsRing` | `dashboard/OrbitalSavingsRing/` | SVG 360°-Ring, animierter Stroke, `color-mix`-Drop-Shadow. |
| `FlowAreaChart` | `dashboard/FlowAreaChart/` | Recharts AreaChart, Aurora-Gradient-Fills, Glass-Tooltip. |
| `GlassCategoryList` | `dashboard/GlassCategoryList/` | Kategorie-Breakdown mit horizontalen Bars, Tab-Switcher (Expense/Income), Timeline-Gruppierung. Icon: 30px. |
| `FlowTransactionList` | `dashboard/FlowTransactionList/` | Transaktionsliste, Stagger-Animation, Timeline-Gruppierung, Icon: 30px. |
| `AuroraBudgetBar` | `dashboard/AuroraBudgetBar/` | Gradient-Fortschrittsbalken, Statusfarben, Icon: 30px. In GlassPanel compact. |
| `CompactWidgetRow` | `dashboard/CompactWidgetRow/` | Flex-Column-Wrapper: 2-Spalten widgetRow + optionales RetentionBanner (nur wenn `phase !== 'active'`). |
| `QuotaIndicator` | `dashboard/QuotaIndicator/` | Kein eigenes Glass-Styling — parent GlassPanel liefert Background/Blur/Border. |
| `RetentionBanner` | `dashboard/RetentionBanner/` | `background: transparent` — verhindert doppelten Glass-Effekt. |
| `DashboardFilter` | `dashboard/DashboardFilter/` | Glass-Dropdown + Mobile Bottom-Sheet (via `createPortal` zu `document.body`). Glass-Tokens durchgängig. |
| `DateInput` | `ui/DateInput/` | Kalender-Panel vollständig auf Glass-Tokens. Mobile: öffnet **über** dem Trigger (`top = rect.top - panelH - gap`). |
| `SummaryCard` | `dashboard/SummaryCard/` | Legacy KPI-Cards. Shimmer + neutral Badge auf Glass-Tokens. |

### 6.2 Hooks (Dashboard)

| Hook | Verwendung |
|------|-----------|
| `useDashboardChartData()` | `trendData` → FlowAreaChart, `categoryData` → GlassCategoryList, `savingsRate` → OrbitalSavingsRing |
| `useBudget()` | → AuroraBudgetBar |
| `useLifecycle()` | → CompactWidgetRow (Quota + Retention) |
| `useMotion()` | Steuert alle Animationen, prüft `prefers-reduced-motion` |
| `useCssVariables()` | Farben für Recharts-Komponenten |

### 6.3 Komponentenspezifische Farb-Regeln

#### Button
| Variante | Token | Wann |
|----------|-------|------|
| Primary | `--primary` | Hauptaktionen (Speichern, Login, Submit) |
| Secondary | `--surface-2` | Alternative Aktionen |
| Ghost | `transparent` | Tertiäre Aktionen |
| Danger | `--error` | Destruktive Aktionen (Löschen) |
| Success | `--success` | **NUR** Status-Bestätigungen (`"Saved"`, `"Verified"`) — nie für Actions! |

#### Input / Select / Textarea
| Zustand | Border | Background |
|---------|--------|------------|
| Default | `--border` | `--surface` |
| Focus | `--primary` | transparent |
| Error | `--error` | **Nur nach Submit** (nicht beim Tippen) |
| Success | `--success` | transparent |

#### Alerts & Notifications
Alle Typen: Border `1px` (immer), Icon-BG bei 15% Opacity, Border bei 25-30% Opacity.  
`--accent` ist in Toasts/Alerts **verboten**.

#### Badges / Tags
| Typ | Background | Text | Border |
|-----|------------|------|--------|
| Info | `--info` (18%) | `--info` | `--info` (30%) |
| Success | `--success` (18%) | `--success` | `--success` (30%) |
| Warning | `--warning` (18%) | `--warning` | `--warning` (30%) |
| Danger | `--error` (18%) | `--error` | `--error` (30%) |

#### Navigation & Sidebar
| Element | Default | Hover | Active |
|---------|---------|-------|--------|
| Nav Item | `--tx-muted` | `--tx` | `--primary` |
| Nav Icon | `--tx-muted` | `--tx` | `--primary` |
| Logout | `--tx-muted` | `--error` | — |
| Active Indicator | — | — | `::before` mit `--primary` (kein farbiger Hintergrund) |

#### Progress-Bars & Quota
| Aspekt | Token |
|--------|-------|
| Track-BG | `var(--surface-2)` (**nicht** `--border`!) |
| 0–50% | `--success` |
| 50–70% | `--info` |
| 70–90% | `--warning` |
| 90–100% | `--error` |

#### Finanzdaten (immer)
```scss
.positive  { color: var(--success); }  // Einnahmen
.negative  { color: var(--error); }    // Ausgaben
.neutral   { color: var(--info); }     // Balance
.trendUp   { color: var(--success); }
.trendDown { color: var(--error); }
.trendNeutral { color: var(--tx-muted); }
```
`--primary`, `--secondary`, `--accent` sind auf Geldbeträgen **verboten**.

#### Charts
| Serie | Farbe |
|-------|-------|
| Einnahmen | `--success` |
| Ausgaben | `--error` |
| Balance | `--info` |
| Forecast / Projektion | `--primary` (einzige erlaubte Verwendung) |

#### Admin Stat Cards
Farben NUR als: Accent-Stripe (`border-left: 4px`), Icon, Header-Text. **Nie vollflächig.**

---

## 7. Animationen & Motion

### 7.1 Motion-Philosophie

**Motion ist funktional — nicht dekorativ.**

✅ Erlaubt: Orientierung (Page Transitions), Feedback (Button Press), Statuswechsel, Kontextwechsel  
❌ Verboten: Deko-Animation auf Finanzdaten, Aufmerksamkeitseffekte auf Beträgen

**Glow ist Branding — kein Informationsträger.**

### 7.2 Accessibility-Pflicht

Alle Motion-Komponenten müssen `useMotion()` nutzen:

```jsx
const { shouldAnimate } = useMotion();

<motion.div
  initial={shouldAnimate ? 'hidden' : false}
  animate={shouldAnimate ? 'visible' : false}
/>
```

`prefers-reduced-motion` ist **immer bindend**.

### 7.3 Motion-Tokens

```scss
// Glow Tokens
--glow-blur-sm: 6px;   --glow-spread-sm: 0;
--glow-blur-md: 12px;  --glow-spread-md: 0;
--glow-blur-lg: 20px;  --glow-spread-lg: 2px;
--glow-primary: color-mix(in srgb, var(--primary) 70%, transparent);
--glow-accent:  color-mix(in srgb, var(--accent)  70%, transparent);
--glow-success: color-mix(in srgb, var(--success) 70%, transparent);
--glow-sm: 0 0 var(--glow-blur-sm) var(--glow-spread-sm) var(--glow-primary);
--glow-md: 0 0 var(--glow-blur-md) var(--glow-spread-md) var(--glow-primary);
--glow-lg: 0 0 var(--glow-blur-lg) var(--glow-spread-lg) var(--glow-primary);

// Motion Tokens
--motion-entrance-duration: var(--duration-normal);  // 250ms
--motion-exit-duration:     var(--duration-fast);    // 150ms
--motion-entrance-ease:     var(--ease-decelerate);
--motion-exit-ease:         var(--ease-accelerate);
--motion-stagger-delay:     0.04s;
--motion-spring-stiffness:  420;
--motion-spring-damping:    34;
--motion-scale-hover:       1.02;
--motion-scale-active:      0.98;
--motion-entrance-y:        12px;
--motion-exit-y:            8px;
```

### 7.4 Entrance-Animationen (Dashboard)

| Element | Effekt | Duration | Delay |
|---------|--------|----------|-------|
| AuroraCanvas | `opacity: 0→1` | 600ms | 0ms |
| HeroMetricPanel | `opacity:0, y:24px, scale:0.98 → 1` | 600ms spring | 100ms |
| FloatingMetrics | Stagger: `opacity:0, y:12px → 1` | 400ms | 60ms je |
| Chart Panels | `opacity:0, y:16px → 1` | 500ms spring | 200ms |
| OrbitalSavingsRing | Stroke 0% → Wert | 800ms spring | 300ms |
| Detail Panels | `opacity:0, y:12px → 1` | 500ms | 500ms |
| Category Bars | Width `0% → X%` | 600ms | 50ms Stagger |
| Transaction Rows | `opacity:0, x:-10px → 1` | 300ms | 40ms Stagger |
| Widget Row | `opacity:0, y:8px → 1` | 400ms | 700ms |

### 7.5 Framer Motion Configs

```jsx
const panelSpring  = { stiffness: 260, damping: 25, mass: 1 };
const gentleSpring = { stiffness: 180, damping: 22, mass: 0.8 };

const panelVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring', ...panelSpring } }
};
const floatVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0,  transition: { type: 'spring', ...gentleSpring } }
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};
```

### 7.6 Interaction-Animationen

| Trigger | Effekt |
|---------|--------|
| Panel Hover | `translateY(-4px)`, `--glass-shadow-elevated`, `--glass-bg-hover`. Spring: `300/25`. ~300ms |
| Panel Press | `scale: 0.99`. 150ms |
| Transaction Row Hover | `--glass-bg-hover`. 200ms ease |
| Chart Tooltip | `y: -4px → 0`. 150ms fade |
| Filter Change | Crossfade `opacity 0.7 → 1`. 350ms |
| Scroll parallax | Mesh-Blobs Faktor 0.3. Deaktiviert bei `prefers-reduced-motion`. |

### 7.7 Page-Transitions

```jsx
const PageTransition = ({ children }) => {
  const { shouldAnimate } = useMotion();
  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1 }}
      exit={shouldAnimate ? { opacity: 0, y: -8 } : { opacity: 1 }}
      transition={shouldAnimate ? { duration: 0.28 } : { duration: 0 }}
    >
      {children}
    </motion.div>
  );
};
```

Limits: y maximal ±10px, duration max 0.32s.

### 7.8 Glow-Regeln (wo erlaubt)

| Kontext | Erlaubt | Begründung |
|---------|---------|-----------|
| AuroraCanvas Mesh-Blobs | ✅ | Hintergrund-Dekoration |
| OrbitalSavingsRing | ✅ | Chart-Container |
| Glass-Panel-Shadow | ✅ | Container-Effekte freigegeben |
| Logo (`.glow-logo`) | ✅ | Branding |
| Auth / Landing Hero | ✅ | Branding |
| Primary Button (Hover, Desktop) | ✅ | `--glow-md` |
| Toast Icon-Wrapper (success) | ✅ | Minimal |
| Beträge / Zahlen | ❌ | Finanz-kritisch |
| BudgetBar | ❌ | Explizit ausgeschlossen |
| Inputs | ❌ | Verboten |
| Text | ❌ | Verboten |

### 7.9 Finanz-kritische Komponenten (GESPERRT)

| Komponente | Glow | Attention Motion | Scale/Bounce |
|------------|------|------------------|--------------|
| SummaryCard | ❌ | ❌ | ❌ |
| QuotaIndicator | ❌ | ❌ | ❌ |
| TransactionList | ❌ | ❌ | ❌ |
| TransactionForm | ❌ | ❌ | ❌ |
| RecentTransactions | ❌ | ❌ | ❌ |
| AdminStatCard | ❌ | ❌ | ❌ |
| AdminTransactionTable | ❌ | ❌ | ❌ |
| AdminCharts | ❌ | ❌ | ❌ |

### 7.10 Verbotene Kombinationen

Glow + Motion auf demselben Element · Glow auf Text · Glow auf Zahlen · Glow auf Inputs · Pulse auf Buttons · Bounce auf Modals · Wiggle auf Navigation

### 7.11 Performance-Regeln

```jsx
// VERBOTEN auf Zeilenebene (Performance-Problem):
<AnimatePresence mode="popLayout">
  <motion.div layout />
</AnimatePresence>

// ERLAUBT: Container-Animation, einzelne Row-Entrance nur beim initialen Mount
```

---

## 8. SCSS-Architektur

### 8.1 Datei-Übersicht

| Datei | Rolle |
|-------|-------|
| `variables.scss` | Globale Tokens: Spacing, Breakpoints, Z-Index, Transitions, Radii, Glass-Blur, Display-Typography |
| `themes/light.scss` | Light-Theme: Color-Palette, Glass-Tokens, Aurora-Accent-Tokens, Aurora-Gradient |
| `themes/dark.scss` | Dark-Theme: identische Struktur, angepasste Farben |
| `mixins.scss` | `glass-panel()`, `glass-hover()`, `aurora-canvas()`, `aurora-mesh-blob()`, `glass-text()`, `focus-ring`, responsive Breakpoints |
| `globals.scss` | Reset + Base Typography. `--surface`/`--border` für Nicht-Dashboard-Seiten |
| `accessibility.scss` | WCAG-Compliance, `prefers-reduced-motion` |
| `animations.scss` | Basis-Keyframes: `fadeIn`, `shimmer`, `auroraMeshDrift` |

### 8.2 Token-Hierarchie

```
variables.scss (globale base)
├── --glass-blur / --glass-blur-reduced / --glass-blur-minimal
├── --fs-display / --fs-metric-lg
└── --depth-0/1/2/3 (Shadow-Stufen)
│
themes/light.scss | themes/dark.scss
├── --glass-bg / --glass-bg-hover / --glass-border / --glass-border-light
├── --glass-shadow / --glass-shadow-elevated
├── --aurora-1/2/3/warn
├── --aurora-stop-1/2/3/4 + --aurora-gradient
└── --primary / --success / --error / --warning / --info / --tx / --tx-muted
│
mixins.scss
├── glass-panel($variant)  → Panel-Stile
├── glass-hover()          → Lift + Shadow-Deepening
├── glass-text()           → Text-Shadow für Lesbarkeit auf Glass
└── aurora-mesh-blob($s)   → Ambient-Blob-Stile
│
*.module.scss (Komponenten)
└── NUR Token-Referenzen via var(--token) — keine hardcodierten Werte
```

### 8.3 SCSS-Module (Dashboard)

| Datei | Inhalt |
|-------|--------|
| `AuroraCanvas.module.scss` | Fixed Gradient, Mesh-Blob-Positionierung |
| `GlassPanel.module.scss` | 3 Varianten via Mixin, elevated + focus-ring |
| `HeroMetricPanel.module.scss` | 3-Col Grid, farbige Variants, Skeleton |
| `FloatingMetric.module.scss` | Metrik-Layout, glass-text, Hero-Variante, trendBadge, trendIcon |
| `OrbitalSavingsRing.module.scss` | SVG Ring, Center-Label, Meta-Section |
| `FlowAreaChart.module.scss` | Chart-Container, Glass-Tooltip, Legend |
| `GlassCategoryList.module.scss` | Kategorie-Bars, Icon-Wrap (30px), Tab-Switcher, Timeline-Groups |
| `FlowTransactionList.module.scss` | Transaktions-Rows, Category-Icon (30px), Timeline-Groups |
| `AuroraBudgetBar.module.scss` | Progress-Bar, Status-Icons (30px) |
| `CompactWidgetRow.module.scss` | flex-col Wrapper + widgetRow (1fr 1fr) |
| `QuotaIndicator.module.scss` | Transparenter Root |
| `RetentionBanner.module.scss` | Transparente Varianten-Backgrounds |
| `DashboardFilter.module.scss` | Glass-Dropdown, Bottom-Sheet, Glass-DateInput |
| `DashboardPage.module.scss` | Aurora-Layout, panelRow, headerSection (z-index: 2) |

### 8.4 SCSS-Regeln (Pflicht)

1. **Keine Hex/RGBA/HSL in Komponenten** — nur `var(--token)` und `color-mix()`
2. **Kein `@use variables` ohne Bedarf** — nur importieren wenn Sass-$-Variablen oder Sass-Funktionen gebraucht werden (vermeidet `:root`-Duplikation und Theme-Override-Bugs durch Cascade-Reihenfolge)
3. **`-webkit-backdrop-filter` Pflicht** — immer zusammen mit `backdrop-filter`
4. **`@supports not (backdrop-filter)` Fallback** — in `glass-panel` Mixin integriert
5. **Blur immer via Token** — `var(--glass-blur)`, nie `blur(20px)` direkt
6. **Dashboard-Tokens:** `--glass-*` ausschließlich — kein `--surface`, `--border` etc.

### 8.5 Responsive Mixins

```scss
@include mobile  { ... }  // max-width: 640px
@include tablet  { ... }  // max-width: 768px
@include desktop { ... }  // min-width: 1024px
```

### 8.6 Focus-Ring Standard

```scss
@mixin focus-ring {
  &:focus { outline: none; }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 40%, transparent);
  }
}
// Ring-Breite: 2px · Opacity: 40% (nicht 12%!) · Farbe: --primary
```

---

## 9. Farb-Regeln (Global)

### 9.1 Quick Reference

```scss
// ✅ DO
color: var(--tx);
background: var(--surface);
border-color: var(--border);
background: color-mix(in srgb, var(--primary) 10%, transparent);
box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 40%, transparent);

// ❌ DON'T
color: #1A2B3C;
background: rgba(74, 144, 164, 0.1);
border-color: hsl(195, 42%, 47%);
box-shadow: 0 0 0 2px rgba(74, 144, 164, 0.12);  // 12% zu schwach!
```

### 9.2 Gradientenregeln

✅ In Gradienten erlaubt: `--primary` · `--secondary` · `--accent` · `--info`  
❌ In Gradienten verboten: `--success` · `--error` (semantisch für Geld/Fehler reserviert)  
Max. 3 Farben pro Gradient.

### 9.3 SCSS-Import-Pflicht

Jede neue `.module.scss` muss:
```scss
@use '../../styles/mixins' as *;
// @use '../../styles/variables' as *;  // nur wenn $sass-Variablen gebraucht werden
```

### 9.4 Lifecycle-Farben

| Phase | Farbe |
|-------|-------|
| Active | `--success` / `--info` |
| At Risk | `--warning` |
| Critical | `--error` |
| Exported | `--tx-muted` (Icon: `--success`) |

---

## 10. Motion & Glow Regeln

### 10.1 Entscheidungsbaum: Darf hier Motion sein?

```
Ist es auf Finanzdaten (Beträge, %, Trends)?  → NEIN (immer verboten)
  Ist es ein Aufmerksamkeitseffekt?            → NEIN (immer verboten)
    Ist es funktionales Feedback?              → JA (erlaubt)
    Ist es ein Entrance/Exit?                  → JA (erlaubt, max. ±12px)
    Ist es Atmosphäre (Container, Canvas)?     → JA (erlaubt)
```

### 10.2 Entscheidungsbaum: Darf hier Glow sein?

```
Ist es auf Text, Zahlen, Inputs, Badges?  → NEIN (immer verboten)
  Ist es auf einem Finanz-Widget?          → NEIN (gesperrt)
    Ist es Logo / Auth / Landing?          → JA (Branding erlaubt)
    Ist es ein Chart-Container?            → JA (Container-Glow erlaubt)
    Ist es ein Primary Button (Hover)?     → JA (--glow-md erlaubt)
```

### 10.3 Attention-Animationen

Erlaubt nur bei: Formular-Validierung, fehlgeschlagene Aktionen  
Verboten bei: Dashboard, Admin, Transaktionen, Charts

### 10.4 Listen Performance

**VERBOTEN auf Zeilenebene:** `<motion.div layout />` in `AnimatePresence mode="popLayout"` → Performance-Problem  
**ERLAUBT:** Container-Animation, einmaliger Row-Entrance beim initialen Mount

---

## 11. Lessons Learned

### 11.1 Chrome Mobile UA-Stylesheet `min-height: 44px`

**Problem:** Chrome Mobile erzwingt `min-height: 44px` auf `<button>`-Elementen. `appearance: none` hebt dies **nicht** auf.

**Fix:**
```scss
// globals.scss — schützt alle Buttons projekt-weit
button { min-height: 0; }

// Und explizit auf Custom-Height-Buttons
.segmentButton { min-height: 0; }
```

**Regel:** Jeder Custom-Height-Button braucht `min-height: 0` explizit.

### 11.2 SCSS `@use variables` und Theme-Override-Bug

**Problem:** `@use '@/styles/variables' as *;` in SCSS-Modules veranlasst Vite, den gesamten `:root`-Block (mit Light-Defaults) in jedem lazy-geladenen CSS-Chunk zu wiederholen. Da `DashboardPage-xxx.css` nach `index.css` im Cascade steht, gewinnt der Light-`:root` über den `[data-theme="dark"]` Override.

**Fix:** `@use variables` aus allen Dashboard-SCSS-Modules entfernen. Theme-spezifische Tokens (`--glass-*`, `--aurora-*`) exklusiv in den Theme-Dateien definieren.

**Regel:** `@use variables` nur importieren wenn Sass-`$`-Variablen oder Sass-Funktionen gebraucht werden. Für `var(--token)` ist kein Import nötig.

### 11.3 VS Code Simple Browser vs. echtes Chrome

VS Code Simple Browser emuliert keine Mobile-Viewports mit Touch-Events. Immer in echtem Chrome DevTools (Geräte-Emulation mit Touch) verifizieren.

### 11.4 DateInput: Kalender öffnet auf Mobile nach oben

Kalender-Panel öffnet auf Mobile (`< 640px`) immer **über** dem Trigger-Button, nicht darunter — da in Bottom-Sheet-Kontext der Platz unterhalb begrenzt ist:

```js
// Mobile: über dem Button
top = rect.top - panelH - gap;
const available = rect.top - gap - margin;
if (available < panelH) { maxH = Math.max(200, available); top = margin; }
```

### 11.5 FloatingMetric Trend-Icon: trendVariant vs. dataTrend

`trendVariant` ist die **semantische** Richtung (gut/schlecht für den Nutzer) — für Ausgaben invertiert. `dataTrend` ist die **tatsächliche** Datenrichtung (Wert gestiegen/gesunken). Das Icon muss `dataTrend` nutzen, nicht `trendVariant`.

```jsx
// DashboardPage.jsx
const getDataTrend = (percent) => {
  if (!percent || percent === 0) return 'neutral';
  return percent > 0 ? 'up' : 'down';
};
// → unabhängig vom mode ('standard'/'expense')

// FloatingMetric.jsx
{dataTrend === 'up' ? <FiTrendingUp /> : dataTrend === 'down' ? <FiTrendingDown /> : <FiMinus />}
```

### 11.6 Aurora-Gradient auf `<html>` statt Layout-Div

Der Gradient muss auf `html.page-dashboard` sitzen (nicht auf `.auroraLayout`), damit er die gesamte Seite füllt und sich beim Scrollen nicht mit dem Content verschiebt. `background-attachment: fixed` ist dabei Pflicht.
