# Public Pages — Vollständige Optimierung (Aurora Flow Glass)

> **Scope:** 10 bestehende + 1 neue Seite + neues PublicLayout
> **Gruppen:** Produkt (About, Features, Pricing) · Ressourcen (Blog, Help, FAQ) · Kontakt · Rechtliches (Impressum, AGB, Datenschutzerklärung, Datenschutzhinweis NEU)
> **Stand:** 14. März 2026
> **Implementierung:** Multi-Agent — 1 Haupt-Agent koordiniert 4 Fachagenten
> **Philo:** Kein Neubau um des Neubaus willen — Logik bleibt, Design & Architektur werden angehoben

---

## Inhaltsverzeichnis

1. [Skills & Richtlinien — PFLICHTLEKTÜRE](#1-skills--richtlinien--pflichtlektüre)
2. [Multi-Agent-Architektur & Phasen](#2-multi-agent-architektur--phasen)
3. [Bestandsaufnahme — Vollständiger Ist-Zustand](#3-bestandsaufnahme--vollständiger-ist-zustand)
4. [Theme A — PublicLayout (neues Layout)](#4-theme-a--publiclayout-neues-layout)
5. [Theme B — SCSS-Upgrade: Glass + Aufteilung](#5-theme-b--scss-upgrade-glass--aufteilung)
6. [Theme C — Blog-Implementierung & Datenschutzhinweis-Seite](#6-theme-c--blog-implementierung--datenschutzhinweis-seite)
7. [Theme D — JSX-Anpassungen (PublicLayout-Integration & Inputs)](#7-theme-d--jsx-anpassungen-publiclayout-integration--inputs)
8. [Theme E — Tests (alle Public-Seiten)](#8-theme-e--tests-alle-public-seiten)
9. [AppRoutes.jsx — Routing-Updates](#9-approutesjsx--routing-updates)
10. [Implementierungs-Checkliste](#10-implementierungs-checkliste)

---

## 1. Skills & Richtlinien — PFLICHTLEKTÜRE

**Alle Agents MÜSSEN diese Skills VOR BEGINN lesen:**

| Skill | Pfad | Zweck |
|-------|------|-------|
| **frontend-design** | `~/.agents/skills/frontend-design/SKILL.md` | Aurora Flow: atmospheric, dark-first, marketing-quality |
| **vercel-react-best-practices** | `~/.agents/skills/vercel-react-best-practices/SKILL.md` | React Performance, Lazy Loading, Memo |

### Non-Negotiable-Regeln

1. **Kein `--surface-2` oder `--border`** in Public-Page-SCSS — ausschließlich `--glass-*` oder `color-mix()`
2. **`-webkit-backdrop-filter` immer** zusammen mit `backdrop-filter`
3. **`@supports not (backdrop-filter: blur(1px))`** auf jede Glass-Fläche als Fallback
4. **`BrandingBackground`** auf allen Produkt-Seiten (About, Features, Pricing, Blog, FAQ, Help)
5. **`100svh` + `100vh` Fallback** — nie `100vh` allein in Layout-Containern
6. **`clamp()`** für Headline-Typografie auf Marketing-Seiten
7. **Lazy Loading** — alle Public-Seiten sind bereits lazy-loaded in AppRoutes (`React.lazy`) — beibehalten
8. **Legal-Seiten (Impressum, AGB, Privacy, PrivacyNotice)** — bewusst einfachere Glass-Behandlung: nur Content-Container + MiniHeader. KEIN überwältigendes Glassmorphism auf rechtlichen Texten — Lesbarkeit first.

---

## 2. Multi-Agent-Architektur & Phasen

```
HAUPT-AGENT (Koordinator)
├── Plan vollständig lesen  
├── AppRoutes.jsx lesen + vorbereiten
├── Fachagenten in Reihenfolge koordinieren
├── Nach jeder Phase: vitest run + visuelle Prüfung
└── Finale Validierung

FACHAGENT 1 — Layout (Theme A)
├── PublicLayout.jsx (neues Layout)
├── PublicLayout.module.scss
├── PublicNav.jsx (öffentliche Navigation)
└── PublicNav.module.scss

FACHAGENT 2 — SCSS (Theme B)
├── InfoPage.module.scss → aufteilen in 6 Seiten-SCSS
├── Glass-Upgrade auf allen 10 bestehenden Seiten
├── PublicPage.module.scss (neues Basis-Modul)
└── ContactPage.module.scss — Inputs auf Glass umstellen

FACHAGENT 3 — Content (Theme C)
├── BlogPage.jsx → echte Artikel-Implementierung
├── PrivacyNoticePage.jsx (neue Seite)
├── PrivacyNoticePage.module.scss
└── i18n: neue Keys für Blog + PrivacyNotice

FACHAGENT 4 — Tests (Theme E)
└── 11 neue Testdateien
```

### Ausführungs-Reihenfolge

```
Phase 1: Agent 1 (PublicLayout) — kein Dependency
Phase 2: Agent 2 (SCSS) + Agent 3 (Content) — parallel, nach Phase 1
Phase 3: Agent 4 (Tests) — nach Phase 2
Phase 4: Haupt-Agent Validierung
```

---

## 3. Bestandsaufnahme — Vollständiger Ist-Zustand

### 3.1 Seiten-Inventar

| Seite | Route | Status | SCSS-Datei | Zeilen | Defizite |
|-------|-------|--------|-----------|--------|---------|
| Über uns | `/about` | ✅ Production | InfoPage.module.scss | ~78 JSX | D2, D3, D7 |
| Blog | `/blog` | ⚠️ Stub | InfoPage.module.scss | ~37 JSX | D5 (Stub), D2, D3 |
| Kontakt | `/contact` | ✅ Production | ContactPage.module.scss | ~155 JSX, ~270 SCSS | D4, D2 |
| Funktionen | `/features` | ✅ Production | InfoPage.module.scss | ~52 JSX | D2, D3, D7 |
| Preise | `/pricing` | ✅ Production | InfoPage.module.scss | ~110 JSX | D2, D3, D7 |
| Hilfe | `/help` | ✅ Production | InfoPage.module.scss | ~66 JSX | D1, D2, D3 |
| FAQ | `/faq` | ✅ Production | InfoPage.module.scss | ~61 JSX | D1, D2, D3 |
| Impressum | `/impressum` | ✅ Production | TermsPage.module.scss | ~50 JSX | D1 |
| AGB | `/terms` | ✅ Production | TermsPage.module.scss | ~54 JSX | D1 |
| Datenschutzerklärung | `/privacy` | ✅ Production | TermsPage.module.scss | ~54 JSX | D1 |
| **Datenschutzhinweis** | `/privacy-notice` | ❌ FEHLT | — | — | NEU zu erstellen |

**Gemeinsam genutzte SCSS:**
- `InfoPage.module.scss` (~720 Zeilen) — verwendet von 6 Seiten (About, Blog, Features, Pricing, Help, FAQ)
- `TermsPage.module.scss` (~150 Zeilen) — verwendet von 3 Seiten (Impressum, AGB, Privacy)
- `ContactPage.module.scss` (~270 Zeilen) — exklusiv

### 3.2 Vollständige Defizit-Liste

#### 🔴 Kritisch

| Nr. | Betrifft | Problem |
|-----|---------|---------|
| D1 | Alle 10 Seiten | Kein gemeinsames PublicLayout — keine Navigationsleiste für Besucher |
| D5 | BlogPage | Stub-Placeholder — kein echter Content |
| D6 | `/privacy-notice` | Route fehlt, Seite fehlt |

#### 🟠 Hoch — Design

| Nr. | Betrifft | Problem |
|-----|---------|---------|
| D2 | About, Features, Pricing, Blog, FAQ, Help | `BrandingBackground` wird nicht genutzt — kein atmosphärisches Aurora-Hintergrunddesign |
| D3 | InfoPage.module.scss | 720 Zeilen für 6+ unterschiedliche Seitenlayouts — unwartbar, keine per-Seite-Kontexte |
| D4 | ContactPage.module.scss | Inputs/Textarea: `background: var(--bg)` — keine Glass-Tokens |
| D7 | Alle Info-Seiten | Content-Container: `background: var(--surface)` (flach) — kein glassmorphes Treatment |

#### 🟡 Mittel — Code/UX

| Nr. | Betrifft | Problem |
|-----|---------|---------|
| Q1 | Alle Seiten | `MiniFooter` allein ist für Marketing-Seiten unzureichend — kein Weg zum Blog, Features etc. |
| Q2 | PricingPage | "Popular"-Badge: `--primary` solide Hintergrund — kein Glass |
| Q3 | FeaturesPage | Feature-Icons: `--primary` solid bg — sollte glass-tinted sein |
| Q4 | AboutPage | Entwickler-Avatar-Card: `--primary` als Hintergrund — kein Glass-Muster |
| T1 | Alle Public-Seiten | 0 Unit-Tests für 10 Seiten |

#### ✅ Was NICHT geändert wird

| Element | Begründung |
|---------|------------|
| Gesamte JSX-Logik aller fertigen Seiten | FAQ-Accordion, Pricing-Expand, Contact-Honeypot, Help-Trans — alle korrekt |
| `TermsPage.module.scss` Lesbarkeit | Legal-Seiten brauchen klares, ruhiges Layout |
| `i18n` Schlüssel-Struktur | Alle bestehenden Keys bleiben unverändert |
| `MiniFooter` (bleibt erhalten) | Wird für Legal-Seiten weiterhin verwendet |
| `CookieConsent` Modal (`/` → Banner) | Bleibt als Erstbesuch-Hinweis, Datenschutzhinweis-Seite ist ZUSÄTZLICH |
| Lazy Loading in AppRoutes | Alle Imports bleiben `React.lazy()` |

---

## 4. Theme A — PublicLayout (neues Layout)

### 4.1 Architektur

```
PublicLayout/
├── PublicLayout.jsx        — Wrapper mit Nav + BrandingBackground-Slot + Footer
├── PublicLayout.module.scss
├── PublicNav.jsx           — Navigationsleiste für öffentliche Seiten
└── PublicNav.module.scss
```

**Pfad:** `src/components/layout/PublicLayout/`

### 4.2 PublicLayout.jsx — Struktur

```jsx
import PropTypes from 'prop-types';
import PublicNav from './PublicNav';
import Footer from '@/components/layout/Footer/Footer';
import BrandingBackground from '@/components/common/BrandingBackground/BrandingBackground';

// Konstante AUSSERHALB des Renders:
const LAYOUT_VARIANTS = {
  // 'product' = mit BrandingBackground (About, Features, Pricing, Blog, FAQ, Help)
  // 'legal'   = kein Background (Impressum, AGB, Privacy, PrivacyNotice, Contact)
};

export default function PublicLayout({ children, variant = 'product', showBackground = true }) {
  return (
    <div className={clsx(styles.layout, styles[variant])}>
      {showBackground && <BrandingBackground />}
      <PublicNav />
      <main className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

**Props:**
- `variant`: `'product'` (Standard, mit Background) | `'legal'` (ohne Background, flache Seiten)
- `showBackground`: boolean, default `true` für product, `false` für legal

### 4.3 PublicNav.jsx — Navigation

**Inhalt:**
```jsx
// Links: Logo (→ Home /), Features, Preise, Blog
// Rechts: Sprachauswahl (bestehende LanguageSelector Komponente?), Login-Button, Register-Button
// Mobile: Hamburger oder kompakt-Links
```

**Zustand:**
- `isScrolled` via `useEffect + window.scroll` — Nav wird bei Scroll glassmorphisch (`--glass-bg`)
- `isMenuOpen` für Mobile-Dropdown
- `isMobile` via `useMediaQuery(MEDIA_QUERIES.mobile)` (bestehender Hook!)

**Nav-Links (Desktop, L→R):**
```
[Logo]   Funktionen · Preise · Blog · Hilfe   [Login] [Registrieren]
```

**Nav-Links (Mobile):**
```
[Logo]   [Hamburger →] Slide-Out-Menu mit allen Links
```

**Konstanten außerhalb Komponente:**
```jsx
const NAV_LINKS = [
  { labelKey: 'nav.features', path: '/features' },
  { labelKey: 'nav.pricing',  path: '/pricing' },
  { labelKey: 'nav.blog',     path: '/blog' },
  { labelKey: 'nav.help',     path: '/help' },
];
```

**SCSS-Regeln für PublicNav:**
```scss
// Scrolled-State: Glass-Nav
.nav.scrolled {
  background: color-mix(in srgb, var(--glass-bg) 85%, transparent);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--glass-border);
  @supports not (backdrop-filter: blur(1px)) { background: var(--surface); }
}

// Initial: transparent oder sehr leicht
.nav {
  position: sticky;
  top: 0;
  z-index: var(--z-header); // bestehendes Token
  transition: background var(--tr), border-color var(--tr), backdrop-filter var(--tr);
}
```

**Login/Register Buttons:**
```scss
.loginBtn {
  // Outlined — Glass tint
  background: color-mix(in srgb, var(--glass-bg) 40%, transparent);
  border: 1px solid var(--glass-border);
}
.registerBtn {
  // Filled — Primary
  background: var(--primary);
  color: var(--text-on-primary);
}
```

### 4.4 PublicLayout.module.scss

```scss
.layout {
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  position: relative;
}

// BrandingBackground ist position: fixed/absolute mit z-index: 0
// main hat z-index: 1, relative
.main {
  flex: 1;
  position: relative;
  z-index: 1;
}

// Legal-Variante: kein Background-Blur — ruhige Lesbarkeit
.legal {
  background: var(--bg);
}

// Product-Variante: Background greift durch
.product { /* keine eigene Hintergrundfarbe — BrandingBackground übernimmt */ }
```

### 4.5 i18n — Neue Keys für PublicNav

Neue Keys in allen 4 Sprachen (`de/`, `en/`, `ar/`, `ka/`):
```
nav.features, nav.pricing, nav.blog, nav.help,
nav.login, nav.register, nav.menuOpen, nav.menuClose
```

---

## 5. Theme B — SCSS-Upgrade: Glass + Aufteilung

### 5.1 InfoPage.module.scss aufteilen — Neue Dateistruktur

**Aktuell:** Eine 720-Zeilen-Datei für 6+ Seiten
**Neu:** Gemeinsames Basis-Modul + per-Seite-Module

```
src/styles/
└── publicPage.module.scss  — NEUES Basis-Modul (page-level shared styles)

src/pages/
├── about/
│   ├── AboutPage.jsx        (unverändert)
│   └── AboutPage.module.scss  (NEU — aus InfoPage extrahiert)
├── blog/
│   ├── BlogPage.jsx         (neu implementiert)
│   └── BlogPage.module.scss   (NEU)
├── faq/
│   ├── FaqPage.jsx          (unverändert)
│   └── FaqPage.module.scss    (NEU — aus InfoPage extrahiert)
├── features/
│   ├── FeaturesPage.jsx     (unverändert)
│   └── FeaturesPage.module.scss  (NEU — aus InfoPage extrahiert)
├── help/
│   ├── HelpPage.jsx         (unverändert)
│   └── HelpPage.module.scss   (NEU — aus InfoPage extrahiert)
└── pricing/
    ├── PricingPage.jsx      (unverändert)
    └── PricingPage.module.scss  (NEU — aus InfoPage extrahiert)
```

**Hinweis zu `InfoPage.module.scss`:**
Nach der Migration kann sie gelöscht oder als leere Datei mit dem Import-Hinweis behalten werden. Alle JSX-Dateien importieren stattdessen ihre eigene SCSS.

### 5.2 publicPage.module.scss — Gemeinsames Basis-Modul

```scss
// Basisstile für alle Public-Seiten (Product-Variante)
// Importiert von: AboutPage, FeaturesPage, PricingPage, FaqPage, HelpPage, BlogPage

.pageContainer {
  max-width: var(--mw-xl);
  margin: 0 auto;
  padding: var(--space-3xl) var(--space-xl);

  @include md { padding: var(--space-2xl) var(--space-lg); }
  @include mobile { padding: var(--space-xl) var(--space-md); }
}

.pageHeader {
  text-align: center;
  margin-bottom: var(--space-3xl);
  @include mobile { margin-bottom: var(--space-2xl); }
}

.pageTitle {
  font-size: clamp(var(--fs-2xl), 5vw, var(--fs-4xl));
  font-family: var(--ff-brand);
  font-weight: var(--fw-b);
  background: linear-gradient(135deg, var(--tx) 30%, var(--primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--space-sm);
}

.pageSubtitle {
  font-size: clamp(var(--fs-sm), 2vw, var(--fs-lg));
  color: var(--tx-muted);
  max-width: 60ch;
  margin: 0 auto;
}
```

### 5.3 Glass-Upgrade: Feature Cards

```scss
// FeaturesPage.module.scss
.featureCard {
  // VORHER: background: var(--surface); border: 1px solid var(--glass-border);
  // NACHHER:
  background: color-mix(in srgb, var(--glass-bg) 65%, transparent);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur-minimal));
  -webkit-backdrop-filter: blur(var(--glass-blur-minimal));
  border-radius: var(--r-xl);
  transition: border-color var(--tr), box-shadow var(--tr), transform var(--tr);

  @supports not (backdrop-filter: blur(1px)) {
    background: var(--surface);
  }

  &:hover {
    border-color: var(--primary);
    box-shadow: var(--glass-shadow-elevated);
    transform: translateY(-2px);
  }
}

.featureIcon {
  // VORHER: background: var(--primary)
  // NACHHER: Glass-tinted mit Primary-Akzent
  background: color-mix(in srgb, var(--primary) 15%, color-mix(in srgb, var(--glass-bg) 70%, transparent));
  border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
  border-radius: var(--r-lg);
}
```

### 5.4 Glass-Upgrade: Pricing Cards

```scss
// PricingPage.module.scss
.pricingCard {
  background: color-mix(in srgb, var(--glass-bg) 65%, transparent);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur-minimal));
  -webkit-backdrop-filter: blur(var(--glass-blur-minimal));
  @supports not (backdrop-filter: blur(1px)) { background: var(--surface); }
}

.pricingPopular {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 8%, color-mix(in srgb, var(--glass-bg) 65%, transparent));
  box-shadow: 0 0 0 1px var(--primary), var(--glass-shadow-elevated);
}

.popularBadge {
  // Glass-Variante statt solider Primary-Hintergrund
  background: color-mix(in srgb, var(--primary) 20%, color-mix(in srgb, var(--glass-bg) 60%, transparent));
  border: 1px solid color-mix(in srgb, var(--primary) 40%, transparent);
  backdrop-filter: blur(var(--glass-blur-minimal));
  -webkit-backdrop-filter: blur(var(--glass-blur-minimal));
  color: var(--primary);
  font-weight: var(--fw-sb);
}
```

### 5.5 Glass-Upgrade: About Developer Card

```scss
// AboutPage.module.scss
.developerCard {
  background: color-mix(in srgb, var(--glass-bg) 65%, transparent);
  border: 1px solid var(--glass-border-light);
  backdrop-filter: blur(var(--glass-blur-reduced));
  -webkit-backdrop-filter: blur(var(--glass-blur-reduced));
  @supports not (backdrop-filter: blur(1px)) { background: var(--surface); }
}

.developerAvatar {
  // VORHER: background: var(--primary)
  background: color-mix(in srgb, var(--primary) 20%, color-mix(in srgb, var(--glass-bg) 60%, transparent));
  border: 2px solid color-mix(in srgb, var(--primary) 40%, transparent);
  color: var(--primary);
}

.valueItem {
  // Checkmark-Zeile
  background: color-mix(in srgb, var(--success) 5%, transparent);
  border-left: 3px solid color-mix(in srgb, var(--success) 60%, transparent);
  padding-left: var(--space-sm);
}
```

### 5.6 Glass-Upgrade: FAQ Items

```scss
// FaqPage.module.scss
.faqItem {
  // VORHER: background: var(--bg); border: 1px solid var(--glass-border)
  background: color-mix(in srgb, var(--glass-bg) 55%, transparent);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur-minimal));
  -webkit-backdrop-filter: blur(var(--glass-blur-minimal));
  @supports not (backdrop-filter: blur(1px)) { background: var(--surface); }

  &.open {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--primary) 5%, color-mix(in srgb, var(--glass-bg) 55%, transparent));
  }
}
```

### 5.7 Glass-Upgrade: Help Sections

```scss
// HelpPage.module.scss
.helpSection {
  background: color-mix(in srgb, var(--glass-bg) 50%, transparent);
  border: 1px solid var(--glass-border-light);
  backdrop-filter: blur(var(--glass-blur-minimal));
  -webkit-backdrop-filter: blur(var(--glass-blur-minimal));
  border-radius: var(--r-xl);
  padding: var(--space-xl);
  @supports not (backdrop-filter: blur(1px)) { background: var(--surface); }
}
```

### 5.8 ContactPage.module.scss — Inputs auf Glass

```scss
// VORHER: Inputs mit background: var(--bg)
// NACHHER:
.inputWrapper, .textareaWrapper {
  background: color-mix(in srgb, var(--glass-bg) 70%, transparent);
  border: 1px solid var(--glass-border);

  input, textarea {
    background: transparent; // in Glass-Wrapper
    color: var(--tx);
  }

  &:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
  }

  &.hasError {
    border-color: var(--error);
    background: color-mix(in srgb, var(--error) 5%, color-mix(in srgb, var(--glass-bg) 70%, transparent));
  }
}

// Autofill — Glass-kompatibel
input:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 1000px
    color-mix(in srgb, var(--glass-bg) 95%, transparent) inset;
}
```

### 5.9 TermsPage.module.scss — Minimale Glass-Anpassung

Legal-Seiten brauchen ruhige Lesbarkeit — nur der Content-Container bekommt sanftes Glass:

```scss
.termsContent {
  // VORHER: background: var(--surface); border: 1px solid var(--glass-border-light)
  // NACHHER: sanftere Glass-Fläche, kein starker Blur
  background: color-mix(in srgb, var(--glass-bg) 50%, var(--surface));
  border: 1px solid var(--glass-border-light);
  backdrop-filter: blur(8px); // minimal — kein var(--glass-blur)
  -webkit-backdrop-filter: blur(8px);
  @supports not (backdrop-filter: blur(1px)) { background: var(--surface); }
}
```

---

## 6. Theme C — Blog-Implementierung & Datenschutzhinweis-Seite

### 6.1 Blog-Implementierung — Artikel aus i18n

**Neues Schema in i18n (`blog.posts` Array):**
```json
{
  "blog": {
    "title": "Blog",
    "subtitle": "Tipps, Neuigkeiten und Finanz-Know-how",
    "readMore": "Weiterlesen",
    "comingSoonLabel": "In Kürze",
    "posts": [
      {
        "id": "budget-basics",
        "title": "Budgetieren leicht gemacht: 5 Regeln für Einsteiger",
        "excerpt": "Finanzielle Kontrolle beginnt mit einem einfachen Budget...",
        "date": "2026-01-15",
        "tags": ["Budget", "Tipps"],
        "readingTime": "4",
        "available": true
      },
      {
        "id": "dark-mode-finance",
        "title": "Warum dunkle Themes in Finance-Apps populär werden",
        "excerpt": "Dark Mode ist mehr als Ästhetik — er verändert wie wir Zahlen wahrnehmen...",
        "date": "2026-02-08",
        "tags": ["Design", "UX"],
        "available": true
      },
      {
        "id": "coming-soon-1",
        "title": "Finora Premium: Was kommt als nächstes?",
        "excerpt": "",
        "date": "",
        "tags": [],
        "available": false
      }
    ]
  }
}
```

**BlogPage.jsx — neue Struktur:**
```jsx
// Karten-Grid: posts.filter(p => p.available) → BlogPostCard
// Keine verfügbaren Posts (available: false) → "Demnächst"-Badge auf Karte
// Kein separates "Coming Soon" mehr — integriert in Grid
```

**BlogPostCard — Inline-Komponente in BlogPage.jsx:**
```jsx
// Karte zeigt: Datum, Tags, Titel, Excerpt (gekürzt), "Weiterlesen"-Link
// "Weiterlesen" → deaktiviert für noch nicht verfügbare Posts (coming: true)
// Karten haben Glass-Behandlung analog FeaturesPage
```

**BlogPage.module.scss (NEU):**
```scss
.blogGrid  { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-xl); }
.postCard  { /* Glass — analog featureCard */ }
.postTags  { display: flex; gap: var(--space-xs); flex-wrap: wrap; }
.postTag   { background: color-mix(in srgb, var(--primary) 12%, transparent); border: 1px solid ... }
.postDate  { font-size: var(--fs-xs); color: var(--tx-muted); }
.readLink  { color: var(--primary); }
.comingBadge { /* glass-tinted, muted */ }
```

### 6.2 Datenschutzhinweis-Seite (NEU)

**Pfad:** `src/pages/PrivacyNoticePage.jsx` + (kein eigenes SCSS → `TermsPage.module.scss` wiederverwenden wie Impressum/AGB/Privacy)

**PrivacyNoticePage.jsx:**
```jsx
// Analoges Muster zu PrivacyPage.jsx:
// - Selbe Sektionsstruktur: title, paragraphs[], list[], additionalParagraphs[]
// - Verwendet PublicLayout variant="legal"
// - Importiert TermsPage.module.scss
// - i18n: t('privacyNotice.sections') — bereits teilweise in i18n vorhanden!
```

**i18n-Status:** `privacyNotice.*` Keys existieren BEREITS (CookieConsent nutzt sie)!
- Prüfen welche Keys schon da sind: `privacyNotice.title`, `privacyNotice.description`, `privacyNotice.close`
- Ergänzen: `privacyNotice.sections[]` mit vollständigem Dokument-Inhalt

**Route in AppRoutes:** `/privacy-notice` → `PrivacyNoticePage` (lazy)

**Footer-Link:** Im Footer `Rechtliches`-Sektion Link zu `/privacy-notice` hinzufügen.

**CookieConsent-Dialog:** Unverändert — einfach intern Link zu `/privacy-notice` hinzufügen:
```jsx
// In CookieConsent.jsx bestehender "Mehr erfahren"-Link:
<Link to="/privacy-notice">{t('privacyNotice.learnMore')}</Link>
```

---

## 7. Theme D — JSX-Anpassungen (PublicLayout-Integration & Inputs)

### 7.1 Alle Seiten → PublicLayout einbinden

**Muster (gilt für alle 11 Seiten):**
```jsx
// VORHER:
return (
  <div className={styles.someContainer}>
    {/* content */}
    <MiniFooter />
  </div>
);

// NACHHER:
import PublicLayout from '@/components/layout/PublicLayout/PublicLayout';

return (
  <PublicLayout variant="product"> {/* oder "legal" */}
    <div className={styles.pageContainer}>
      {/* content — MiniFooter entfernen (Footer ist im PublicLayout) */}
    </div>
  </PublicLayout>
);
```

**Varianten:**
| Seite | variant |
|-------|---------|
| About, Features, Pricing, Blog, FAQ, Help | `product` |
| Kontakt | `product` (BrandingBackground macht Sinn) |
| Impressum, AGB, Privacy, PrivacyNotice | `legal` |

**Was ENTFERNT wird (aus jedem JSX):**
- `import MiniFooter from '...'`
- `<MiniFooter />` am Ende
- `import { useNavigate } from 'react-router-dom'` (wenn nur für Back-Button)
- `<button onClick={() => navigate(-1)}>` (Back-Button) — Nav übernimmt das

**Was BLEIBT:**
- Alle imports für react-icons
- Alle import für i18n hooks
- Alle Komponenten-Logik
- Alle JSX-Strukturen innerhalb des Containers

### 7.2 ContactPage.jsx — Keine Logik-Änderungen

Nur Layout-Wrapper ändern, Honeypot + Validierung + API-Integration komplett unverändert.

### 7.3 SCSS-Imports aktualisieren

Jede JSX-Datei importiert nach InfoPage.module.scss-Aufteilung ihre eigene SCSS:
```jsx
// VORHER: import styles from '../InfoPage.module.scss'
// NACHHER: import styles from './FeaturesPage.module.scss'
```

---

## 8. Theme E — Tests (alle Public-Seiten)

### 8.1 Standard Mock-Setup (geteilt, analog Auth-Tests)

```jsx
// Wiederverwendung des etablierten Mock-Patterns aus Auth-Tests:
// - Framer Motion Mock
// - react-i18next Mock: t(key) => key, Trans => <span>
// - useMotion Mock: shouldAnimate: false
// - useNavigate Mock: vi.fn()
// - MemoryRouter wrapper
```

### 8.2 Test-Dateien (11 NEU)

```
src/pages/__tests__/
├── AboutPage.test.jsx
├── BlogPage.test.jsx
├── ContactPage.test.jsx
├── FaqPage.test.jsx
├── FeaturesPage.test.jsx
├── HelpPage.test.jsx
├── ImpressumPage.test.jsx
├── PricingPage.test.jsx
├── PrivacyNoticePage.test.jsx
├── PrivacyPage.test.jsx
└── TermsPage.test.jsx
```

### 8.3 Test-Coverage je Seite

**AboutPage** — rendert Mission, Values-Liste, Developer-Card, kein Crash

**BlogPage** — rendert Grid, Artikel aus posts, Tags, Coming-Badge auf unavailable

**ContactPage** (tiefste Tests weil Logik):
```
├── rendert alle Felder (Name, Email, Kategorie, Nachricht)
├── Submit bei fehlenden Feldern → Validierungsfehler
├── DSGVO-Checkbox Pflicht → zeigt Fehler
├── Honeypot ausgefüllt → kein API-Call
├── Erfolgreicher Submit → Success-State
├── API-Fehler → Error-State
└── Formular-Reset nach Fehler möglich
```

**FaqPage** — rendert Fragen, click auf Frage → Answer sichtbar, zweiter click → klappt zu

**FeaturesPage** — rendert alle Feature-Cards (Icons vorhanden), Grid korrekt

**HelpPage** — rendert Sektionen, Links vorhanden (mailto + /contact + /faq)

**ImpressumPage / PrivacyPage / TermsPage / PrivacyNoticePage** — rendert Titel, Sektionen aus i18n, MiniFooter ersetzt durch Footer

**PricingPage:**
```
├── rendert Plan-Karten
├── Popular-Badge auf korrekter Karte
├── ShowMore-Button klappt extraFeatures auf
├── ShowLess-Button klappt wieder zu
├── CTA Popular → href="/register"
└── CTA andere → href="/login"
```

### 8.4 Test-Kommandos

```bash
npx vitest run src/pages/__tests__/
npx vitest run src/components/layout/PublicLayout/
# Ziel: alle 11 Tests grün, Coverage > 70%
```

---

## 9. AppRoutes.jsx — Routing-Updates

### 9.1 Neue Route hinzufügen

```jsx
// Neue lazy imports:
const PrivacyNoticePage = lazy(() => import('./pages/PrivacyNoticePage'));

// Neue Route im JSX:
<Route path="/privacy-notice" element={<PrivacyNoticePage />} />
```

### 9.2 Bestehende Routen — keine Änderung

Alle 10 bestehenden Routen bleiben unverändert (same paths, same lazy components).

---

## 10. Implementierungs-Checkliste

### Haupt-Agent — Vor Start (Pflicht)

- [ ] Plan vollständig gelesen (alle 10 Abschnitte)
- [ ] `frontend-design` Skill gelesen
- [ ] `vercel-react-best-practices` Skill gelesen
- [ ] `AppRoutes.jsx` vollständig gelesen — Routing-Struktur verstanden
- [ ] Alle 10 Seiten-JSX fluchtartig gelesen — Muster verstanden
- [ ] `InfoPage.module.scss` vollständig gelesen — was wird wo verwendet
- [ ] `TermsPage.module.scss` vollständig gelesen
- [ ] Baseline-Test: `npx vitest run src/pages/__tests__/` (sollte 0 Tests = leer sein)

### Phase 1 — PublicLayout (Agent 1)

- [ ] `src/components/layout/PublicLayout/` Verzeichnis erstellen
- [ ] `PublicLayout.jsx` implementieren (product + legal variant)
- [ ] `PublicLayout.module.scss` (svh, Flexbox, BrandingBackground-Slot)
- [ ] `PublicNav.jsx` implementieren (Desktop + Mobile, Scroll-State)
- [ ] `PublicNav.module.scss` (Glass on scroll, Login/Register Buttons)
- [ ] `NAV_LINKS` Konstante außerhalb Render-Funktion
- [ ] `isScrolled` via useEffect — kein Inline-Handler
- [ ] i18n neue Keys in allen 4 Sprachen: `nav.features`, `nav.pricing`, `nav.blog`, `nav.help`, `nav.login`, `nav.register`
- [ ] `index.js` Barrel-Export aus Layout-Verzeichnis aktualisieren

### Phase 2a — SCSS-Aufteilung (Agent 2)

- [ ] `publicPage.module.scss` erstellen (Basis-Styles: pageContainer, pageHeader, pageTitle, pageSubtitle)
- [ ] `AboutPage.module.scss` extrahieren aus InfoPage (About-spezifische Styles + Glass Developer Card)
- [ ] `FeaturesPage.module.scss` extrahieren (Feature Grid + Glass Cards + Glass Icons)
- [ ] `PricingPage.module.scss` extrahieren (Pricing Grid + Glass Cards + Popular Badge)
- [ ] `FaqPage.module.scss` extrahieren (FAQ Accordion + Glass Items)
- [ ] `HelpPage.module.scss` extrahieren (Help Sections + Glass)
- [ ] `BlogPage.module.scss` erstellen (Blog Grid + PostCard + Tags)
- [ ] `ContactPage.module.scss` Glass-Inputs implementieren (autofill fix)
- [ ] `TermsPage.module.scss` sanfte Glass auf termsContent
- [ ] Alle Glass-Flächen: `@supports not (backdrop-filter: blur(1px))` Fallback vorhanden
- [ ] Grep-Check: `var(--surface-2)` in Public-Seiten-SCSS → 0 Treffer
- [ ] Grep-Check: `border: 1px solid var(--border)` in Public-Seiten-SCSS → 0 Treffer

### Phase 2b — Blog + PrivacyNotice (Agent 3)

- [ ] i18n `blog.posts[]` Array in allen 4 Sprachen implementieren (2 verfügbare + 1 coming-soon)
- [ ] `BlogPage.jsx` neu implementieren (Grid, PostCard, Tags, readingTime, Coming-Badge)
- [ ] `PrivacyNoticePage.jsx` erstellen (analog PrivacyPage, nutzt TermsPage.module.scss)
- [ ] i18n `privacyNotice.sections[]` in allen 4 Sprachen ergänzen
- [ ] i18n `privacyNotice.learnMore` Key in allen 4 Sprachen
- [ ] `AppRoutes.jsx` — `/privacy-notice` Route (lazy)
- [ ] Footer `Rechtliches`-Sektion — Link zu `/privacy-notice` hinzufügen
- [ ] CookieConsent.jsx — "Mehr erfahren"-Link zu `/privacy-notice`

### Phase 2c — JSX PublicLayout-Integration (Agent 3 oder Agent 2, wenn parallel)

- [ ] `AboutPage.jsx` — PublicLayout einbinden, MiniFooter entfernen, SCSS-Import aktualisieren
- [ ] `BlogPage.jsx` — PublicLayout (bereits bei Neuimplementierung)
- [ ] `ContactPage.jsx` — PublicLayout einbinden, MiniFooter entfernen
- [ ] `FaqPage.jsx` — PublicLayout einbinden, MiniFooter entfernen, SCSS-Import aktualisieren
- [ ] `FeaturesPage.jsx` — PublicLayout einbinden, MiniFooter entfernen, SCSS-Import aktualisieren
- [ ] `HelpPage.jsx` — PublicLayout einbinden, MiniFooter entfernen, SCSS-Import aktualisieren
- [ ] `ImpressumPage.jsx` — PublicLayout variant="legal", MiniFooter entfernen
- [ ] `PricingPage.jsx` — PublicLayout einbinden, MiniFooter entfernen, SCSS-Import aktualisieren
- [ ] `PrivacyPage.jsx` — PublicLayout variant="legal", MiniFooter entfernen
- [ ] `TermsPage.jsx` — PublicLayout variant="legal", MiniFooter entfernen

### Phase 3 — Tests (Agent 4)

- [ ] `pages/__tests__/AboutPage.test.jsx`
- [ ] `pages/__tests__/BlogPage.test.jsx`
- [ ] `pages/__tests__/ContactPage.test.jsx` (ausführlichste Tests, voller Submit-Test)
- [ ] `pages/__tests__/FaqPage.test.jsx`
- [ ] `pages/__tests__/FeaturesPage.test.jsx`
- [ ] `pages/__tests__/HelpPage.test.jsx`
- [ ] `pages/__tests__/ImpressumPage.test.jsx`
- [ ] `pages/__tests__/PricingPage.test.jsx`
- [ ] `pages/__tests__/PrivacyNoticePage.test.jsx`
- [ ] `pages/__tests__/PrivacyPage.test.jsx`
- [ ] `pages/__tests__/TermsPage.test.jsx`
- [ ] `components/layout/__tests__/PublicLayout.test.jsx`
- [ ] `components/layout/__tests__/PublicNav.test.jsx`

### Haupt-Agent — Finale Validierung

- [ ] `npx vitest run src/pages/__tests__/ src/components/layout/` → alle Tests grün
- [ ] Grep: `var(--surface-2)` in Public-SCSS → 0 Treffer
- [ ] Grep: `from '../InfoPage.module.scss'` in JSX → 0 Treffer (alle migriert)
- [ ] DevTools: iPhone SE (375×667) → PublicNav korrekt, Seiten kein Overflow
- [ ] DevTools: Tablet (768px) → Nav kollabiert korrekt
- [ ] BrandingBackground sichtbar auf About, Features, Pricing, Blog, FAQ, Help
- [ ] Kein BrandingBackground auf Impressum, AGB, Privacy, PrivacyNotice
- [ ] `/privacy-notice` Route erreichbar → PrivacyNoticePage rendert
- [ ] Footer hat Link zu `/privacy-notice`
- [ ] CookieConsent-Dialog hat Link zu `/privacy-notice`
- [ ] Alle 4 Sprachen (de, en, ar, ka): neue i18n-Keys vorhanden
- [ ] RTL (Arabisch): PublicNav Links/Rechts korrekt gespiegelt
- [ ] Reduced Motion: PublicNav-Transitions korrekt deaktiviert