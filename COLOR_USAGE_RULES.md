# 🎨 Color Usage Rules – Finora Smart-Finance

> **Version:** 2.0  
> **Status:** ✅ Implementiert  
> **Ziel:** Konsistenz, Barrierefreiheit, semantische Klarheit  
> **Siehe auch:** [MOTION_GLOW_RULES.md](./MOTION_GLOW_RULES.md) für Animation & Glow

---

## ⚠️ ÜBERGEORDNETE LEITREGEL

```
┌─────────────────────────────────────────────────────────────────┐
│  --accent ist KEIN Funktions-Token.                             │
│                                                                 │
│  --accent = rein visuell (Glow, Highlight, Hero, Decor)        │
│  Er darf NIRGENDWO Status oder Logik ausdrücken.               │
└─────────────────────────────────────────────────────────────────┘
```

### ❌ --accent NIEMALS verwenden für:
- Buttons
- Status-Badges
- Alerts/Notifications
- Form-Validierung
- Funktionale UI-Elemente

### ✅ --accent NUR verwenden für:
- Hero-Hintergründe & Gradienten
- Logo-Elemente (z.B. Growth-Line)
- Dekorative Glows
- Background-Akzente in Auth/Branding

---

## 🏆 Brand Color Priority

| Priorität | Token | Zweck | Beispiele |
|-----------|-------|-------|-----------|
| **1** | `--primary` | Brand Anchor | Buttons, Links, Focus, Aktionen |
| **2** | `--secondary` | Glow, Motion, Effects | Gradienten, Animationen |
| **3** | `--accent` | Highlight only | Hero-BG, Logo-Details, Glows |

---

## 1️⃣ System-Prinzipien

### Single Source of Truth

Alle Farben werden ausschließlich in den Theme-Dateien definiert:

```
src/styles/themes/light.scss  →  Helle Theme-Tokens
src/styles/themes/dark.scss   →  Dunkle Theme-Tokens
```

**✅ Erlaubt:**
- CSS Custom Properties (`var(--token)`)
- `color-mix()` für Opacity-Varianten
- Fallback-Werte in `var()`: `var(--info, var(--primary))`

**❌ Verboten:**
- Hex-Werte in Komponenten (`#4A90A4`)
- RGB/RGBA direkt (`rgba(74, 144, 164, 0.5)`)
- HSL-Werte (`hsl(195, 42%, 47%)`)

### Semantische Farbnutzung

Farben kommunizieren Bedeutung – nicht Dekoration:

| Token | Semantik |
|-------|----------|
| `--success` | Einnahmen, Erfolg, Bestätigung |
| `--error` | Ausgaben, Fehler, Warnung kritisch |
| `--warning` | Achtung, Limit erreicht |
| `--info` | Neutral, Balance, Information |
| `--primary` | Marke, Actions, Focus |
| `--secondary` | Unterstützend, Sekundär-Actions |
| `--accent` | Highlight, Hero-Bereiche |

---

## 2️⃣ Token-Set

### 📦 System-Tokens (Pflicht)

#### Backgrounds
| Token | Verwendung |
|-------|------------|
| `--bg` | Haupt-Hintergrund der Seite |
| `--surface` | Container, Cards (1. Ebene) |
| `--surface-2` | Nested Container, Hover-States, Progress-Track |
| `--surface-3` | **NUR** Modals, Overlays, Floating Panels |

> ⚠️ `--surface-3` ist reserviert für schwebende Elemente!

#### Borders
| Token | Verwendung | Opacity |
|-------|------------|---------|
| `--border` | Standard Borders | 12% |
| `--border-light` | Subtile Trennlinien | 6% |
| `--border-strong` | Hover-States, Emphasis | 18% |

#### Text
| Token | Verwendung |
|-------|------------|
| `--tx` | Primärtext |
| `--tx-muted` | Sekundärtext, Beschreibungen |
| `--text-disabled` | Deaktivierte Elemente |

#### Contrast (auf farbigen Hintergründen)
| Token | Verwendung |
|-------|------------|
| `--on-primary` | Text auf `--primary` Hintergrund |
| `--on-secondary` | Text auf `--secondary` Hintergrund |
| `--on-success` | Text auf `--success` Hintergrund |
| `--on-error` | Text auf `--error` Hintergrund |
| `--on-warning` | Text auf `--warning` Hintergrund |

> ⚠️ Alle `--on-*` Tokens MÜSSEN WCAG AA Kontrast erfüllen (≥4.5:1)

### 🎨 Farbpalette

#### Light Theme
```scss
$light-palette: (
  background: #f5f7fb,   // Kühles Off-White
  text: #0b1220,         // Deep Navy
  primary: #5b6cff,      // Neon Indigo
  secondary: #2dd4ff,    // Soft Cyan
  accent: #f472d0,       // Neon Pink
  success: #22c55e,
  warning: #fbbf24,
  error: #f43f5e,
  info: #38bdf8
);
```

#### Dark Theme
```scss
$dark-palette: (
  background: #070b1a,   // Deep Navy
  text: #e9edff,         // Kühles Weiß
  primary: #7c83ff,      // Neon Violet
  secondary: #32e1ff,    // Cyan Glow
  accent: #ff6ec7,       // Neon Pink
  success: #22c55e,
  warning: #facc15,
  error: #fb7185,
  info: #60a5fa
);
```

### Opacity-Regeln mit `color-mix()`

```scss
// Background-Overlays (10% für subtile Effekte)
background: color-mix(in srgb, var(--success) 10%, transparent);

// Border-Highlights (20% für sichtbare Grenzen)
border-color: color-mix(in srgb, var(--primary) 20%, transparent);

// Focus-Rings (40% für klare Sichtbarkeit)
box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 40%, transparent);

// Hover-States (8-15% für subtile Interaktion)
background: color-mix(in srgb, var(--primary) 8%, var(--surface));
```

---

## 3️⃣ Focus & Accessibility

### Focus-Ring Standard

**Alle interaktiven Elemente müssen:**

```scss
&:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 40%, transparent);
}
```

| Aspekt | Wert |
|--------|------|
| Ring-Breite | 2px |
| Opacity | **40%** (nicht 12%!) |
| Farbe | `--primary` |

### Mixins (mixins.scss)

```scss
@mixin focus-ring {
  &:focus { outline: none; }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 40%, transparent);
  }
}
```

---

## 4️⃣ Component-Spezifische Regeln

### 🔘 Button

| Variante | Token | Wann verwenden |
|----------|-------|----------------|
| **Primary** | `--primary` | Hauptaktionen (Speichern, Login, Submit) |
| **Secondary** | `--surface-2` | Alternative Aktionen |
| **Ghost** | `transparent` | Tertiäre Aktionen |
| **Outline** | `--primary` border | Alternative Primary |
| **Danger** | `--error` | Destruktive Aktionen (Löschen) |
| **Success** | `--success` | **NUR Status-Bestätigungen!** |

> 🎬 **Motion/Glow:** Primary Button darf Glow haben (nur Hover, nur Desktop). Siehe [MOTION_GLOW_RULES.md](./MOTION_GLOW_RULES.md#-button)

#### ⚠️ Success Button Regel

```
┌─────────────────────────────────────────────────────────────────┐
│  Primary Button = Aktion                                        │
│  Success Button = Status-Bestätigung / Abschluss               │
│                                                                 │
│  ❌ "Save"         → Primary Button                            │
│  ❌ "Submit"       → Primary Button                            │
│  ✅ "Saved"        → Success Button (Status)                   │
│  ✅ "Completed"    → Success Button (Status)                   │
│  ✅ "Verified"     → Success Button (Status)                   │
└─────────────────────────────────────────────────────────────────┘
```

| Aspekt | Regel |
|--------|-------|
| Border | `border-color: transparent` |
| Hover | `filter: brightness(1.05)` oder `color-mix()` |

### 🧾 Input / Select / Textarea

| Zustand | Border | Background |
|---------|--------|------------|
| Default | `--border` | `--surface` |
| Focus | `--primary` | transparent |
| Error | `--error` | **Nur nach Submit!** |
| Success | `--success` | transparent |
| Warning | `--warning` | transparent |

#### ⚠️ Error Background Regel

```
┌─────────────────────────────────────────────────────────────────┐
│  Error Background NUR bei:                                      │
│  • Formular-Validierung nach Submit                            │
│  • NICHT beim Tippen (live validation)                         │
│                                                                 │
│  Grund: Vermeidet visuelles Rauschen während der Eingabe       │
└─────────────────────────────────────────────────────────────────┘
```

### 🚨 Alerts & Notifications

| Typ | Border | Icon-BG | Regel |
|-----|--------|---------|-------|
| Info | `--primary` (25%) | `--primary` (15%) | Border: **immer 1px** |
| Success | `--success` (30%) | `--success` (15%) | Border: **immer 1px** |
| Warning | `--warning` (30%) | `--warning` (15%) | Border: **immer 1px** |
| Error | `--error` (30%) | `--error` (15%) | Border: **immer 1px** |

> ⚠️ Border-Width: Immer 1px, nicht variabel!

### 🃏 Card (SummaryCard, StatCard)

| Aspekt | Regel |
|--------|-------|
| Background | `var(--surface)` |
| Border | Semantische Farben nur für Border, **nicht Background!** |
| Gradient | Subtil (max 10% Opacity), nur für Branding |

> 🎬 **Glow:** Nur Container-Outline erlaubt, kein innerer Glow. Siehe [MOTION_GLOW_RULES.md](./MOTION_GLOW_RULES.md#-card)

**Income/Expense/Balance Cards:**
```scss
.income { border-color: color-mix(in srgb, var(--success) 20%, transparent); }
.expense { border-color: color-mix(in srgb, var(--error) 20%, transparent); }
.balance { border-color: color-mix(in srgb, var(--info) 20%, transparent); }
```

### 🔔 Toast

| Aspekt | Regel |
|--------|-------|
| Border | Semantische Farbe (`--success`, `--error`, `--warning`, `--info`) |
| Icon | Farbe = Semantische Farbe |
| Progress-Bar | **currentColor** oder semantische Farbe |
| Verboten | `--accent` niemals in Toasts! |

> 🎬 **Glow:** Nur Icon-Wrapper für `success` Toast darf Glow haben. Siehe [MOTION_GLOW_RULES.md](./MOTION_GLOW_RULES.md#-toast)

### 📊 Progress-Bars & Quota

| Aspekt | Regel |
|--------|-------|
| Track-BG | `var(--surface-2)` (**nicht** `--border`!) |
| Fill | Semantische Farbe (`--success`, `--warning`, `--error`) |

#### Quota-Stufen

| Stufe | Prozent | Farbe |
|-------|---------|-------|
| Niedrig | 0-50% | `--success` |
| Mittel | 50-70% | `--info` |
| Hoch | 70-90% | `--warning` |
| Kritisch | 90-100% | `--error` |

```scss
.progressBar {
  background: var(--surface-2);  // ✅ Richtig
  // background: var(--border);  // ❌ Falsch
}
```

### 📂 Sidebar

| Aspekt | Regel |
|--------|-------|
| Active State | `background: transparent` |
| Active Indicator | `::before` Pseudo-Element mit `var(--primary)` |
| Text Active | `color: var(--primary)` |

**Kein farbiger Hintergrund für Active-State!**

### 🧭 Navigation

| Element | Default | Hover | Active |
|---------|---------|-------|--------|
| Nav Item | `--tx-muted` | `--tx` | `--primary` |
| Nav Icon | `--tx-muted` | `--tx` | `--primary` |
| Logout | `--tx-muted` | `--error` | - |

> ⚠️ Active: Icon UND Text = `--primary`

### 🏷️ Badges / Tags

| Typ | Background | Text | Border |
|-----|------------|------|--------|
| Info | `--info` (18%) | `--info` | `--info` (30%) |
| Success | `--success` (18%) | `--success` | `--success` (30%) |
| Warning | `--warning` (18%) | `--warning` | `--warning` (30%) |
| Danger | `--error` (18%) | `--error` | `--error` (30%) |

> ⚠️ Badge Border = gleiche Farbe wie Text (30% opacity) für bessere Lesbarkeit im Dark Mode

### 🔗 Links

| Zustand | Farbe | Formel |
|---------|-------|--------|
| Default | `--primary` | - |
| Hover | `--pri-hover` | - |
| Visited | Gemischt | `color-mix(in srgb, var(--primary) 70%, var(--tx))` |

> ⚠️ Visited: Kein separates Hard-Token, sondern color-mix verwenden

---

## 5️⃣ Finanz-kritische Komponenten

### Beträge & Transaktionen

| Typ | Farbe | Token |
|-----|-------|-------|
| Einnahme/Positiv | Grün | `--success` |
| Ausgabe/Negativ | Rot | `--error` |
| Neutral/Balance | Blau | `--info` |
| Saldo positiv | Grün | `--success` (wenn Balance > 0) |
| Saldo negativ | Rot | `--error` (wenn Balance < 0) |

**❌ Verboten für Geldbeträge:**
- `--primary`
- `--secondary`
- `--accent`

### Trend-Indikatoren

```scss
.trendUp { color: var(--success); }
.trendDown { color: var(--error); }
.trendNeutral { color: var(--tx-muted); }
```

### 📊 Charts

| Serie | Farbe | Verwendung |
|-------|-------|------------|
| Einnahmen | `--success` | Income-Serien |
| Ausgaben | `--error` | Expense-Serien |
| Balance | `--info` | Aktuelle Daten |
| **Forecast** | `--primary` | Vorhersage/Projektion |

> ⚠️ `--primary` in Charts NUR für Vorhersage/Fokus-Serie

### 📱 Admin-Bereich (Stat Cards)

```
┌─────────────────────────────────────────────────────────────────┐
│  Farben NUR als:                                                │
│  • Accent-Stripe (border-left: 4px)                            │
│  • Icon                                                         │
│  • Header-Text                                                  │
│                                                                 │
│  ❌ NICHT vollflächig!                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 📅 Lifecycle / Retention

| Phase | Farbe |
|-------|-------|
| Active | `--success` / `--info` |
| At Risk | `--warning` |
| Critical | `--error` |
| Exported | `--tx-muted` (Icon: `--success`) |

> ⚠️ Exported: NICHT voll grün, nur Icon grün

---

## 6️⃣ Auth & Hero-Bereiche

### Gradienten

**✅ Erlaubt in Gradienten:**
- `--primary`
- `--secondary`
- `--accent`
- `--info`

**❌ Verboten in Gradienten:**
- `--success` (semantisch für Geld reserviert)
- `--error` (semantisch für Fehler reserviert)

#### Max 3 Farben pro Gradient

```scss
// ✅ Empfohlener Standard (2-3 Farben)
background: linear-gradient(135deg, var(--primary), var(--secondary), var(--accent));

// ⚠️ --info nur wenn absolut nötig (4. Farbe vermeiden)
```

```scss
// ✅ Auth Hero Gradient
background: linear-gradient(90deg, var(--primary), var(--secondary));

// ❌ Falsch
background: linear-gradient(90deg, var(--success), var(--primary));
```

### 🔐 Password Strength Indicator

| Stärke | Bar-Farbe | Text-Farbe |
|--------|-----------|------------|
| Weak | `--error` | `--error` |
| Fair | `--warning` | `--warning` |
| Good | `--success` | `--success` |
| Strong | Gradient | `--success` |

> ⚠️ Gradient nur im Balken, NIEMALS im Text!

---

## 7️⃣ Dark Mode Kompatibilität

Alle Farben müssen in beiden Themes funktionieren:

```scss
// light.scss
@include generate-theme(
  $primary: #4A90A4,
  $surface: #FFFFFF,
  // ...
);

// dark.scss
@include generate-theme(
  $primary: #5BA4B8,
  $surface: #1A1F24,
  // ...
);
```

**Niemals hardcoded Dark-Mode-Farben!**

---

## 8️⃣ Quick Reference

### ✅ DO

```scss
color: var(--tx);
background: var(--surface);
border-color: var(--border);
background: color-mix(in srgb, var(--primary) 10%, transparent);
box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 40%, transparent);
```

### ❌ DON'T

```scss
color: #1A2B3C;
background: rgba(74, 144, 164, 0.1);
border-color: hsl(195, 42%, 47%);
box-shadow: 0 0 0 2px rgba(74, 144, 164, 0.12);  // 12% zu schwach!
```

---

## 🔧 Pflicht-Imports für neue SCSS-Dateien

**Jede neue `.module.scss` Datei MUSS die Basis-Dateien importieren:**

```scss
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;
```

### Basis-Dateien Übersicht

| Datei | Import | Inhalt |
|-------|--------|--------|
| `variables.scss` | `@use` Pflicht | Alle CSS Custom Properties, Spacing, Typography, Radii, Shadows |
| `mixins.scss` | `@use` Pflicht | Focus-Ring, Responsive Breakpoints, Button-Base, Card-Base |
| `animations.scss` | Optional | Keyframes für Shimmer, Fade, Slide |

### Was jede Basis-Datei bereitstellt

**variables.scss:**
```scss
// Spacing: var(--space-xs), var(--space-sm), var(--space-md), ...
// Typography: var(--fs-sm), var(--fs-md), var(--fw-sb), ...
// Radii: var(--r-sm), var(--r-md), var(--r-lg), var(--r-full)
// Shadows: var(--shadow-sm), var(--shadow-md), var(--shadow-lg)
// Transitions: var(--tr-fast), var(--tr-normal), var(--duration-fast)
// Colors: var(--primary), var(--success), var(--error), var(--surface), ...
```

**mixins.scss:**
```scss
// Responsive
@include mobile { ... }      // max-width: 480px
@include tablet { ... }      // max-width: 768px
@include desktop { ... }     // min-width: 1024px

// Focus & Accessibility
@include focus-ring;         // Standard 40% Focus-Ring
@include focus-ring-inset;   // Für Inputs mit Border
@include focus-ring-custom($color);

// Component Bases
@include button-base;
@include card-base;
@include input-base;

// Utilities
@include truncate;
@include visually-hidden;
```

### ❌ Niemals hardcoden

```scss
// ❌ FALSCH - Hardcoded Werte
.myComponent {
  padding: 16px;              // ❌ Hardcoded
  font-size: 14px;            // ❌ Hardcoded
  border-radius: 8px;         // ❌ Hardcoded
  color: #1A2B3C;             // ❌ Hardcoded
  transition: all 0.2s ease;  // ❌ Hardcoded
}

// ✅ RICHTIG - Token-basiert
.myComponent {
  padding: var(--space-md);           // ✅ Token
  font-size: var(--fs-sm);            // ✅ Token
  border-radius: var(--r-md);         // ✅ Token
  color: var(--tx);                   // ✅ Token
  transition: all var(--tr-fast);     // ✅ Token
}
```

### Beispiel: Neue Komponente erstellen

```scss
// src/components/MyFeature/MyFeature.module.scss

@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.container {
  padding: var(--space-md);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
}

.button {
  @include button-base;
  @include focus-ring;
  
  background: var(--primary);
  color: var(--on-primary);
}

.input {
  @include input-base;
  @include focus-ring-inset;
}

@include mobile {
  .container {
    padding: var(--space-sm);
  }
}
```

---

## 9️⃣ Checkliste für Code-Reviews

### Imports & Tokens
- [ ] `@use` Import für `variables` und `mixins` vorhanden
- [ ] Keine hardcoded Spacing/Font-Size/Radius Werte
- [ ] Keine Hex/RGB/HSL-Werte in Komponenten
- [ ] Responsive Breakpoints nutzen `@include mobile/tablet/desktop`

### Accessibility & Focus
- [ ] Focus-Ring verwendet 40% Opacity (oder `@include focus-ring`)
- [ ] Alle interaktiven Elemente haben `:focus-visible`
- [ ] Alle `--on-*` Tokens erfüllen WCAG AA Kontrast

### Components
- [ ] Progress-Bar Track verwendet `--surface-2`
- [ ] Sidebar Active State ist `background: transparent`
- [ ] Toasts verwenden keine `--accent` Farbe
- [ ] Alert/Badge Border immer 1px
- [ ] `--surface-3` nur für Modals/Overlays/Floating

### Semantische Farben
- [ ] `--accent` nur für Glow, Gradient-Highlights, Hero-BG, Deko
- [ ] `--accent` NICHT für Buttons, Status, Badges, Alerts
- [ ] Beträge nutzen nur `--success`/`--error`/`--info`
- [ ] Keine `--success`/`--error` in dekorativen Gradienten
- [ ] Success Button nur für Status, nicht für Aktionen
- [ ] Error Background nur nach Submit, nicht beim Tippen

---

## 📁 Relevante Dateien

### Pflicht-Imports (jede Komponente)

| Datei | Import | Zweck |
|-------|--------|-------|
| `src/styles/variables.scss` | `@use` ✅ | Tokens: Spacing, Colors, Typography, Radii, Shadows |
| `src/styles/mixins.scss` | `@use` ✅ | Mixins: Focus-Ring, Breakpoints, Component-Bases |

### Optionale Imports

| Datei | Import | Zweck |
|-------|--------|-------|
| `src/styles/animations.scss` | `@use` | Keyframes: Shimmer, Fade, Slide |

### Theme-Dateien (nur bearbeiten für globale Farb-Änderungen)

| Datei | Zweck |
|-------|-------|
| `src/styles/themes/light.scss` | Light Theme Token-Definitionen |
| `src/styles/themes/dark.scss` | Dark Theme Token-Definitionen |

### Globale Styles (nicht importieren, automatisch geladen)

| Datei | Zweck |
|-------|-------|
| `src/styles/index.scss` | Entry Point, lädt alle globalen Styles |
| `src/styles/globals.scss` | Base Element Styles (html, body, a, etc.) |
| `src/styles/accessibility.scss` | Globale Focus-Styles, Skip-Links |

---

## ✅ Checkliste für neue Komponenten

Bei jeder neuen Komponente prüfen:

1. **Zeigt sie Geld?** → Nur `--success`/`--error`/`--info`
2. **Ist sie interaktiv?** → Focus-Ring mit 40% Opacity
3. **Ist sie ein Button?** → Primary für Aktionen, Success nur für Status
4. **Hat sie Progress?** → Track = `--surface-2`
5. **Ist sie ein Modal?** → `--surface-3` für Background
6. **Hat sie Gradienten?** → Kein `--success`/`--error` erlaubt

> ⚠️ Für Motion/Glow-Regeln siehe [MOTION_GLOW_RULES.md](./MOTION_GLOW_RULES.md)

---

## 📊 Implementierungs-Status

| Bereich | Status |
|---------|--------|
| Theme-Tokens (light/dark.scss) | ✅ |
| Focus-Ring 40% (mixins.scss) | ✅ |
| Progress-Bar --surface-2 | ✅ |
| Sidebar transparent Active | ✅ |
| Auth Gradienten (ohne success/error) | ✅ |
| Finanz-Komponenten semantisch | ✅ |
| Badge/Alert Borders 1px | ✅ |
| WCAG AA Kontrast (--on-*) | ✅ |

**Build:** ✅ 70 precache entries  
**Audit:** ✅ Alle Violations behoben

---

**Letzte Aktualisierung:** Juni 2025
