# Header — Komplett-Neubau (Aurora Flow Glass)

> **Scope:** Globaler Einsatz — User-Bereich UND Admin-Bereich  
> **Design-System:** Aurora Flow Glass-Tokens (`--glass-*`)  
> **Ansatz:** Kein Repair — vollständiger Neubau von Grund auf  
> **Umfang:** Header + UserMenu (Avatar-Dropdown)  
> **Stand:** Plan erstellt am 14. März 2026

---

## Inhaltsverzeichnis

1. [Skills & Richtlinien](#1-skills--richtlinien)
2. [Bestandsaufnahme (Ist-Zustand)](#2-bestandsaufnahme-ist-zustand)
3. [Neues Design (Soll-Zustand)](#3-neues-design-soll-zustand)
4. [Komponentenarchitektur](#4-komponentenarchitektur)
5. [Responsive Spezifikation](#5-responsive-spezifikation)
6. [Animationen & Motion](#6-animationen--motion)
7. [i18n-Plan](#7-i18n-plan)
8. [RTL-Plan (Arabisch)](#8-rtl-plan-arabisch)
9. [Accessibility](#9-accessibility)
10. [SCSS-Architektur](#10-scss-architektur)
11. [Optimierung aller Elemente](#11-optimierung-aller-elemente)
12. [Test-Plan](#12-test-plan)
13. [Implementierungs-Checkliste](#13-implementierungs-checkliste)

---

## 1. Skills & Richtlinien

### Pflicht-Skills (vor Implementierung lesen)

| Skill | Datei | Zweck |
|-------|-------|-------|
| **frontend-design** | `~/.agents/skills/frontend-design/SKILL.md` | Aurora Flow Ästhetik: dark-first, Glass, Neon-Akzente, sleek & addictive UI. Jede Komponente und jedes Element muss den Frontend-Design-Regeln entsprechen. |
| **vercel-react-best-practices** | `~/.agents/skills/vercel-react-best-practices/SKILL.md` | React/Next.js Performance: Memo-Strategien, Bundle-Optimierung, Re-Render-Vermeidung. Jede Komponente muss performance-optimiert sein. |

### Projekt-Design-Referenz

| Dokument | Pfad |
|----------|------|
| **Projekt-Design.md** | `./Projekt-Design.md` |

Alle Token-Referenzen, Farb-Regeln, Motion-Regeln, SCSS-Architektur und Glass-System-Specs sind dort definiert.

### Globaler Einsatz

Der Header wird **identisch** im User-Bereich und im Admin-Bereich eingesetzt:
- Gleiche Struktur auf allen Seiten (Dashboard, Transactions, Settings, Admin, About, etc.)
- Sticky Positioning oben auf jeder Seite
- Admin/Viewer-Badge rollenbasiert eingeblendet (`admin` / `viewer`)
- HamburgerMenu-Steuerung auf Mobile für alle Bereiche
- Kein separates Header-Design für Admin — ein Header, globales Styling

---

## 2. Bestandsaufnahme (Ist-Zustand)

### 2.1 Dateien

| Datei | Pfad | Status |
|-------|------|--------|
| `Header.jsx` | `src/components/layout/Header/Header.jsx` | Komplett ersetzen |
| `Header.module.scss` | `src/components/layout/Header/Header.module.scss` | Komplett ersetzen |
| `UserMenu.jsx` | `src/components/common/UserMenu/UserMenu.jsx` | Komplett ersetzen |
| `UserMenu.module.scss` | `src/components/common/UserMenu/UserMenu.module.scss` | Komplett ersetzen |
| `Header.test.jsx` | `src/components/layout/__tests__/Header.test.jsx` | Komplett ersetzen |
| `UserMenu.test.jsx` | `src/components/common/UserMenu/__tests__/UserMenu.test.jsx` | Komplett ersetzen |

### 2.2 Architektur-Übersicht

```
Header (Sticky Top Bar)
├── HeaderLeft
│   ├── Desktop: Logo (Link → /)
│   └── Mobile: HamburgerMenu-Toggle (☰ Button)
├── HeaderRight
│   ├── Loading: Skeleton (circle 40×40)
│   ├── Authenticated:
│   │   ├── Admin/Viewer Badge (rollenbasiert)
│   │   └── UserMenu (Avatar-Dropdown)
│   │       ├── Avatar-Button (Initialen)
│   │       └── Dropdown
│   │           ├── Name + Email
│   │           ├── Profile Link (→ /profile)
│   │           └── Logout Button
│   └── Unauthenticated: Login/Register Link (→ /login)
└── HamburgerMenu (Mobile, via isHamburgerOpen state)
```

### 2.3 Header Props

Header akzeptiert **keine Props** — ist eine Root-Komponente im MainLayout.

### 2.4 UserMenu Props

| Prop | Typ | Beschreibung |
|------|-----|-------------|
| `user` | `{ name, email, role }` | User-Objekt aus `useAuth()` |
| `onLogout` | `async function` | Logout-Handler |

### 2.5 Hooks

#### Header.jsx

| Hook | Quelle | Rückgabe |
|------|--------|----------|
| `useAuth()` | `@/hooks/useAuth` | `{ user, logout, isAuthenticated, isLoading, isViewer }` |
| `useNavigate()` | `react-router-dom` | Navigation function |
| `useMediaQuery(MEDIA_QUERIES.mobile)` | `@/hooks/useMediaQuery` | `isMobile: boolean` (≤768px) |
| `useTranslation()` | `react-i18next` | `{ t }` |

#### UserMenu.jsx

| Hook | Quelle | Rückgabe |
|------|--------|----------|
| `useState(false)` | React | `[open, setOpen]` — Dropdown-Sichtbarkeit |
| `useRef(null)` | React | `menuRef` — Click-outside Detection |
| `useTranslation()` | `react-i18next` | `{ t }` |
| `useMotion()` | `@/hooks/useMotion` | `{ shouldAnimate }` |

### 2.6 Event Handler

#### Header.jsx

| Handler | Trigger | Aktion |
|---------|---------|--------|
| `handleKeyDown` (Escape) | `useEffect` global listener | `setIsHamburgerOpen(false)` |
| `handleLogout` | Übergabe an `UserMenu.onLogout` | `await logout()` → `navigate('/dashboard')` |

#### UserMenu.jsx

| Handler | Trigger | Aktion |
|---------|---------|--------|
| `onClick` (Avatar) | Klick auf Avatar-Button | `setOpen((v) => !v)` — Toggle |
| `handleClickOutside` | `mousedown`/`touchstart` auf `document` | `setOpen(false)` wenn außerhalb `menuRef` |
| `handleKeyDown` (Escape) | `keydown` auf `document` | `setOpen(false)` |
| `handleLogout` | Klick auf Logout-Item | `await onLogout()` → `setOpen(false)` |
| `onClick` (Profile) | Klick auf Profile-Link | `setOpen(false)` |

### 2.7 Skeleton Loading State

```jsx
// Während Auth-Check (isLoading = true)
<Skeleton variant="circle" width="40px" height="40px" />
```

Nutzt `Skeleton`-Komponente aus `@/components/common/Skeleton/Skeleton.jsx`:
- `variant="circle"` → `border-radius: 50%`
- Shimmer-Animation
- `role="status"`, `aria-busy="true"`

### 2.8 HamburgerMenu Integration

```jsx
// In Header.jsx
const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

// Mobile: Hamburger-Button
<motion.button
  className={styles.hamburger}
  onClick={() => setIsHamburgerOpen(true)}
  aria-label={t('common.menu')}
  aria-expanded={isHamburgerOpen ? 'true' : 'false'}
>
  <FiMenu size={24} />
</motion.button>

// HamburgerMenu (immer gerendert, via AnimatePresence in HamburgerMenu)
<HamburgerMenu isOpen={isHamburgerOpen} onClose={() => setIsHamburgerOpen(false)} />
```

### 2.9 Aktuelles Styling (Probleme)

| Problem | Detail |
|---------|--------|
| **Keine Glass-Tokens** | `background: var(--surface)` statt `var(--glass-bg)` |
| **Kein Backdrop-Filter** | Flache Oberfläche, kein Blur-Durchschein |
| **Kein Glass-Shadow** | `var(--sh-sm)` statt `var(--glass-shadow)` |
| **Border** | `var(--border)` statt `var(--glass-border)` |
| **Avatar-Button** | `var(--surface-2)` Background, `var(--border)` Border |
| **Dropdown** | `var(--surface)` + `var(--border)` + `var(--sh-lg)` — kein Glass |
| **Admin Badge** | `color-mix(--primary 10%)` — funktional okay, nicht Glass-konsistent |
| **Viewer Badge** | `color-mix(--warning 10%)` — gleich |
| **Auth Button** | `var(--primary)` Background — Standard, nicht Glass-themed |
| **Dropdown Items** | `var(--surface-2)` Hover — kein Glass-Effekt |

### 2.10 Aktuelle CSS-Variablen (Header.module.scss)

| Variable | Fallback | Beschreibung |
|----------|----------|-------------|
| `--header-height` | 56px | Header-Höhe Desktop |
| `--header-height` (mobile) | 48px | Header-Höhe Mobile |
| `--z-header` | 1100 | Z-Index |
| `--surface` | — | Background |
| `--border` | — | Border color |
| `--sh-sm` | — | Shadow |
| `--primary` | — | Primary color |
| `--pri-hover` | — | Primary hover |
| `--warning` | — | Warning color (Viewer Badge) |
| `--on-primary` | — | Text auf Primary |
| `--tx` | — | Text |
| `--tx-muted` | — | Muted Text |

### 2.11 Aktuelle CSS-Variablen (UserMenu.module.scss)

| Variable | Beschreibung |
|----------|-------------|
| `--surface`, `--surface-2` | Backgrounds |
| `--border` | Borders |
| `--primary`, `--pri-hover` | Primary + Hover |
| `--on-primary` | Text auf Primary |
| `--tx`, `--tx-muted` | Text-Farben |
| `--sh-lg` | Shadow (Dropdown) |
| `--z-dropdown` | Z-Index Dropdown |
| `--r-full`, `--r-lg` | Border-Radius |
| `--tr`, `--tr-fast` | Transitions |

---

## 3. Neues Design (Soll-Zustand)

### 3.1 Design-Vision

Der Header wird eine **schmale, schwebende Glass-Bar**, die am oberen Rand fixiert ist. Content-Seiten scheinen durch den Blur hindurch, was eine atmosphärische Tiefe erzeugt. Die Trennung zum Content erfolgt über einen subtilen Glass-Border + Downward Shadow statt einer harten Linie. Das UserMenu-Dropdown wird zur Glass-Karte mit elegantem Blur.

### 3.2 Header Surface

```scss
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-header, 1100);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height, 56px);
  padding: 0 var(--space-lg);

  // Glass Surface
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);

  color: var(--tx);
  transition: all var(--tr);

  @supports not (backdrop-filter: blur(1px)) {
    background: var(--surface);
  }

  @include below-md {
    height: var(--header-height, 48px);
    padding: 0 var(--space-md);
    gap: var(--space-sm);
    backdrop-filter: blur(var(--glass-blur-reduced));
    -webkit-backdrop-filter: blur(var(--glass-blur-reduced));
  }
}
```

### 3.3 Logo (Desktop)

```scss
.logo {
  display: flex;
  align-items: center;

  img {
    height: 2rem;
    transition: opacity var(--tr);
  }

  &:hover img {
    opacity: 0.85;
  }

  &:focus-visible {
    @include focus-ring;
    border-radius: var(--r-sm);
  }
}
```

### 3.4 Hamburger Button (Mobile, Glass-themed)

```scss
.hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  width: var(--space-xl);
  height: var(--space-xl);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--tx);
  padding: 0;
  transition: color var(--tr);

  @include below-md {
    display: flex;
  }

  &:hover {
    color: var(--primary);
  }

  &.open {
    color: var(--primary);
  }

  @include focus-ring;
  &:focus-visible {
    border-radius: var(--r-sm);
  }
}
```

### 3.5 Admin Badge (Glass-themed)

```scss
.adminBadge {
  padding: var(--space-3xs) var(--space-sm);
  font-size: var(--fs-2xs);
  font-weight: var(--fw-b);
  text-transform: uppercase;
  letter-spacing: var(--ls-n);
  border-radius: var(--r-full);

  // Glass-themed statt flat color-mix
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 10%, var(--glass-bg));
  border: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
  @include glass-text;
}

.viewerBadge {
  @extend .adminBadge;   // Gleiche Struktur
  color: var(--warning);
  background: color-mix(in srgb, var(--warning) 10%, var(--glass-bg));
  border-color: color-mix(in srgb, var(--warning) 15%, transparent);
}
```

### 3.6 Auth Button (Glass-themed)

```scss
.authBtn {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--r-sm);
  font-size: var(--fs-sm);
  font-weight: var(--fw-m);
  text-decoration: none;
  white-space: nowrap;

  // Glass-Primary statt flat Primary
  background: var(--primary);
  color: var(--on-primary);
  border: 1px solid var(--primary);
  transition: all var(--tr);

  &:hover {
    filter: brightness(1.08);
    box-shadow: var(--glow-sm);
  }

  @include focus-ring;

  @include below-md {
    min-height: 44px;
    padding: 10px 16px;
    font-size: max(var(--fs-sm), 14px);
  }
}
```

### 3.7 Avatar Button (Glass-themed)

```scss
.avatarBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-2xl);
  height: var(--space-2xl);
  border-radius: var(--r-full);
  cursor: pointer;
  transition: all var(--tr);

  // Glass Border statt flat
  border: 1px solid var(--glass-border);
  background: var(--glass-bg-hover);

  &:hover {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--primary) 8%, var(--glass-bg));
  }

  @include focus-ring;
}
```

### 3.8 Avatar Circle (Gradient beibehalten)

```scss
.avatarCircle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-xl);
  height: var(--space-xl);
  border-radius: var(--r-full);
  background: linear-gradient(135deg, var(--primary), var(--pri-hover));
  color: var(--on-primary);
  font-weight: var(--fw-b);
  font-size: var(--fs-sm);
}
```

### 3.9 Dropdown Menu (Glass-Karte)

```scss
.dropdownMenu {
  position: absolute;
  right: 0;
  top: calc(100% + var(--space-xs));
  min-width: 220px;
  z-index: var(--z-dropdown);
  overflow: hidden;

  // Glass Card
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--r-lg);
  box-shadow: var(--glass-shadow-elevated);

  @supports not (backdrop-filter: blur(1px)) {
    background: var(--surface);
    box-shadow: var(--sh-lg);
  }
}
```

### 3.10 Dropdown Header (Glass-Trennlinie)

```scss
.dropdownHeader {
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--glass-border-light);
}

.dropdownName {
  font-weight: var(--fw-b);
  color: var(--tx);
  @include glass-text;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.dropdownEmail {
  font-size: var(--fs-sm);
  color: var(--tx-muted);
  margin-top: var(--space-3xs);
  overflow-wrap: anywhere;
  word-break: break-word;
}
```

### 3.11 Dropdown Items (Glass-Hover)

```scss
.dropdownItem {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: none;
  color: var(--tx);
  text-decoration: none;
  font-weight: var(--fw-m);
  cursor: pointer;
  transition: all var(--tr-fast);

  &:hover {
    background: var(--glass-bg-hover);
    color: var(--primary);
  }

  @include focus-ring-inset;
}
```

---

## 4. Komponentenarchitektur

### 4.1 Dateistruktur (Header)

```
src/components/layout/Header/
├── Header.jsx                  // Sticky TopBar (Logo/Hamburger + Auth/Avatar)
├── Header.module.scss          // Glass-themed Styles
└── __tests__/                  // Verschoben von layout/__tests__/
    └── Header.test.jsx         // Unit-Tests
```

### 4.2 Dateistruktur (UserMenu)

```
src/components/common/UserMenu/
├── UserMenu.jsx                // Avatar-Button + Dropdown
├── UserMenu.module.scss        // Glass-themed Styles
└── __tests__/
    └── UserMenu.test.jsx       // Unit-Tests (bestehend, erweitern)
```

### 4.3 Komponenten-Hierarchie (unverändert)

```
Header
├── HeaderLeft
│   ├── Desktop: <Link to="/"><img Logo /></Link>
│   └── Mobile: <motion.button Hamburger />
├── HeaderRight
│   ├── isLoading: <Skeleton circle />
│   ├── isAuthenticated:
│   │   ├── Admin/Viewer Badge (conditional)
│   │   └── <UserMenu user={user} onLogout={handleLogout} />
│   └── !isAuthenticated: <Link to="/login" authBtn />
└── <HamburgerMenu isOpen={isHamburgerOpen} onClose={...} />
```

### 4.4 Performance-Optimierungen (vercel-react-best-practices)

| Komponente | Optimierung |
|------------|-------------|
| **Header** | Kein `React.memo` (Root-Komponente, keine Props) |
| **UserMenu** | `React.memo` — Props: `user`, `onLogout`. `useCallback` für `handleLogout` |
| **handleLogout (Header)** | `useCallback` mit `[logout, navigate]` Dependencies |
| **handleKeyDown (Header)** | `useCallback` im `useEffect` — stabil, kein Tracking nötig |
| **Initialen-Berechnung (UserMenu)** | `useMemo` mit `[user?.name]` Dependency |
| **Framer Motion** | `shouldAnimate` Guards. Motion-Configs als stabile Konstanten |
| **Skeleton** | Bereits `React.memo` — keine Änderung nötig |
| **Alle** | Kein Inline-Object in JSX (motion configs als Konstanten) |

---

## 5. Responsive Spezifikation

### 5.1 Breakpoints

| Viewport | Layout | Höhe | Blur |
|----------|--------|------|------|
| Desktop (≥1024px) | Logo links, Avatar/Auth rechts | 56px | `var(--glass-blur)` (28px) |
| Tablet (768–1023px) | Logo links, Avatar/Auth rechts | 56px | `var(--glass-blur)` (28px) |
| Mobile (<768px) | Hamburger links, Avatar/Auth rechts | 48px | `var(--glass-blur-reduced)` (16px) |

### 5.2 Desktop/Tablet Layout

```
┌──────────────────────────────────────────────────┐
│ [Finora Logo]            [Admin Badge] [Avatar ▾] │
└──────────────────────────────────────────────────┘
  padding: 0 var(--space-lg)
  gap: var(--space-lg)
  height: 56px
```

### 5.3 Mobile Layout

```
┌─────────────────────────────────────┐
│ [☰]                     [Avatar ▾]  │
└─────────────────────────────────────┘
  padding: 0 var(--space-md)
  gap: var(--space-sm)
  height: 48px
```

### 5.4 Header Responsive

```scss
.header {
  height: var(--header-height, 56px);
  padding: 0 var(--space-lg);
  gap: var(--space-lg);

  @include below-md {
    height: var(--header-height, 48px);
    padding: 0 var(--space-md);
    gap: var(--space-sm);
  }
}
```

### 5.5 HeaderLeft Responsive

```scss
.headerLeft {
  display: flex;
  align-items: center;
  flex: 1;
}
```

Logo auf Desktop, Hamburger auf Mobile — via `isMobile` conditional in JSX gesteuert.

### 5.6 HeaderRight Responsive

```scss
.headerRight {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;

  @include below-md {
    gap: var(--space-xs);
  }
}
```

### 5.7 Auth Button Responsive

```scss
.authBtn {
  @include below-md {
    min-height: 44px;           // Touch target (iOS Standard)
    padding: 10px 16px;
    font-size: max(var(--fs-sm), 14px);   // Mindestgröße
  }
}
```

### 5.8 Dropdown Responsive

```scss
.dropdownMenu {
  min-width: 220px;

  @include below-md {
    min-width: 200px;
    // Position bleibt absolute, passt sich an Viewport an
  }
}
```

---

## 6. Animationen & Motion

### 6.1 Pflicht: `useMotion()` Hook

```jsx
// UserMenu.jsx
const { shouldAnimate } = useMotion();
```

Header.jsx braucht `useMotion()` nur für den Hamburger-Button (Framer Motion).

### 6.2 Animation-Specs

| Element | Trigger | Effekt | Duration/Config |
|---------|---------|--------|-----------------|
| **Hamburger — Hover** | Mouse Enter | `scale: 1.02` | Framer `whileHover` |
| **Hamburger — Tap** | Click | `scale: 0.98` | Framer `whileTap` |
| **Avatar — Hover** | Mouse Enter | `scale: 1.02` | Framer `whileHover` |
| **Avatar — Tap** | Click | `scale: 0.98` | Framer `whileTap` |
| **Dropdown — Enter** | Menu öffnet | `opacity: 0, y: -8 → 1, 0` | AnimatePresence, 150ms |
| **Dropdown — Exit** | Menu schließt | `opacity: 1, y: 0 → 0, -8` | AnimatePresence, 150ms |

### 6.3 Stabile Motion-Konstanten

```jsx
// Header.jsx
const HAMBURGER_HOVER = { scale: 1.02 };
const HAMBURGER_TAP = { scale: 0.98 };

// UserMenu.jsx
const AVATAR_HOVER = { scale: 1.02 };
const AVATAR_TAP = { scale: 0.98 };
const DROPDOWN_INITIAL = { opacity: 0, y: -8 };
const DROPDOWN_ANIMATE = { opacity: 1, y: 0 };
const DROPDOWN_EXIT = { opacity: 0, y: -8 };
const DROPDOWN_TRANSITION = { duration: 0.15 };
```

### 6.4 Reduced Motion (SCSS)

```scss
// Header.module.scss
@include reduced-motion {
  .hamburger,
  .authBtn {
    transition: none;
  }
}

// UserMenu.module.scss
@include reduced-motion {
  .avatarBtn,
  .dropdownItem {
    transition: none;
  }
  .dropdownMenu {
    animation: none;
  }
}
```

---

## 7. i18n-Plan

### 7.1 Header Keys

| Key | Verwendung |
|-----|------------|
| `common.menu` | Hamburger Button `aria-label` |
| `admin.badge` | Admin Badge Text |
| `admin.viewerBadge` | Viewer Badge Text |
| `auth.loginOrRegister` | Auth Button Text (unauthentifiziert) |

### 7.2 UserMenu Keys

| Key | Verwendung |
|-----|------------|
| `common.userMenu` | Avatar Button `aria-label` |
| `nav.profile` | Profile-Link Text |
| `nav.logout` | Logout-Button Text |

### 7.3 Sprachen

Alle Keys in 4 Sprachen: `de`, `en`, `ar`, `ka`.

---

## 8. RTL-Plan (Arabisch)

### 8.1 Header Layout

Flexbox `justify-content: space-between` funktioniert automatisch RTL-korrekt. Der Header benötigt **keine** expliziten RTL-Overrides — `flex-direction: row` wird von `dir="rtl"` nativ gespiegelt.

### 8.2 Dropdown Position

```scss
:global([dir='rtl']) .dropdownMenu {
  right: auto;
  left: 0;
}
```

### 8.3 Dropdown Items

```scss
:global([dir='rtl']) .dropdownItem {
  flex-direction: row-reverse;
  text-align: right;
}
```

### 8.4 Dropdown Header

```scss
:global([dir='rtl']) .dropdownHeader {
  text-align: right;
}
```

### 8.5 Hamburger-Button

Keine RTL-Änderung nötig — Icon ist symmetrisch. Position links/rechts wird automatisch durch Flexbox + `dir="rtl"` gespiegelt.

### 8.6 HamburgerMenu-Integration

RTL-Handling für HamburgerMenu liegt in `HamburgerMenu.jsx` (Slide-Richtung) — nicht im Header.

---

## 9. Accessibility

### 9.1 Semantik

| Element | Attribut | Wert |
|---------|----------|------|
| `<header>` | `role` | `"banner"` (implizit via `<header>`) |
| Hamburger `<motion.button>` | `aria-label` | `t('common.menu')` |
| Hamburger `<motion.button>` | `aria-expanded` | `isHamburgerOpen ? 'true' : 'false'` |
| Avatar `<motion.button>` | `aria-label` | `t('common.userMenu')` |
| Avatar `<motion.button>` | `aria-expanded` | `open` (Dropdown-State) |
| Logo `<img>` | `alt` | `"Finora"` |
| Auth-Link | `to` | `"/login"` |
| Profile-Link | `to` | `"/profile"` |
| Skeleton | `role` | `"status"` |
| Skeleton | `aria-busy` | `"true"` |

### 9.2 Focus Management

```scss
@mixin focus-ring {
  &:focus { outline: none; }
  &:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 40%, transparent);
  }
}

@mixin focus-ring-inset {
  &:focus { outline: none; }
  &:focus-visible {
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 40%, transparent);
  }
}
```

Angewendet auf: `.hamburger`, `.logo`, `.authBtn`, `.avatarBtn`, `.dropdownItem`.

### 9.3 Keyboard Navigation

- **Escape** → Schließt HamburgerMenu + UserMenu Dropdown
- **Tab** → Navigation durch HeaderRight-Elemente
- **Enter/Space** → Aktiviert Buttons (nativ)

### 9.4 Touch Targets

| Element | Mindestgröße |
|---------|-------------|
| Hamburger | `var(--space-xl)` × `var(--space-xl)` (~36px) |
| Avatar | `var(--space-2xl)` × `var(--space-2xl)` (~40px) |
| Auth Button | `min-height: 44px` auf Mobile |
| Dropdown Items | Padding sorgt für ≥44px Touch-Area |

### 9.5 Loading State

Skeleton während Auth-Check: `role="status"` + `aria-busy="true"` informiert Screen-Reader.

---

## 10. SCSS-Architektur

### 10.1 Imports

```scss
@use '@/styles/mixins' as *;
```

### 10.2 Pflicht-Regeln (aus Projekt-Design.md)

| Regel | Detail |
|-------|--------|
| Keine Hex/RGBA in Komponenten | Nur `var(--glass-*)`, `var(--tx-*)`, `color-mix()` |
| `-webkit-backdrop-filter` Pflicht | Immer zusammen mit `backdrop-filter` |
| `@supports` Fallback | Für Glass-BG + Blur |
| Blur via Token | `var(--glass-blur)`, `var(--glass-blur-reduced)` |
| `@include reduced-motion` | Alle Transitions deaktivieren |
| `@include focus-ring` | Alle interaktiven Elemente |

### 10.3 SCSS-Struktur (Header.module.scss)

```scss
// ============================================
// HEADER — AURORA FLOW GLASS
// ============================================

// 1. HEADER ROOT
.header { ... }

// 2. HEADER LEFT
.headerLeft { ... }

// 3. LOGO
.logo { ... }

// 4. HAMBURGER BUTTON
.hamburger { ... }

// 5. HEADER RIGHT
.headerRight { ... }

// 6. ADMIN / VIEWER BADGES
.adminBadge { ... }
.viewerBadge { ... }

// 7. AUTH BUTTON
.authBtn { ... }

// 8. REDUCED MOTION
@include reduced-motion { ... }
```

### 10.4 SCSS-Struktur (UserMenu.module.scss)

```scss
// ============================================
// USER MENU — AURORA FLOW GLASS
// ============================================

// 1. BASE
.userMenu { ... }

// 2. AVATAR BUTTON
.avatarBtn { ... }

// 3. AVATAR CIRCLE
.avatarCircle { ... }

// 4. DROPDOWN MENU
.dropdownMenu { ... }

// 5. DROPDOWN HEADER
.dropdownHeader { ... }
.dropdownName { ... }
.dropdownEmail { ... }

// 6. DROPDOWN ITEMS
.dropdownItem { ... }

// 7. RTL OVERRIDES
:global([dir='rtl']) .dropdownMenu { ... }
:global([dir='rtl']) .dropdownHeader { ... }
:global([dir='rtl']) .dropdownItem { ... }

// 8. REDUCED MOTION
@include reduced-motion { ... }
```

---

## 11. Optimierung aller Elemente

Jedes Element und jede Sub-Komponente des Headers wird im Neubau einzeln optimiert:

### 11.1 Header (Container)

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `var(--surface)` | `var(--glass-bg)` |
| Blur | Keiner | `var(--glass-blur)` (Desktop), `var(--glass-blur-reduced)` (Mobile) |
| Border | `var(--border)` | `var(--glass-border)` |
| Shadow | `var(--sh-sm)` | `var(--glass-shadow)` |
| Fallback | Keiner | `@supports not → var(--surface)` |
| Webkit | Keiner | `-webkit-backdrop-filter` |

### 11.2 Logo

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Class | `.app-logo` (auf img) | `.logo` Container mit `.logo img` Child |
| Focus | Kein Focus-Ring | `@include focus-ring` auf Link |
| Hover | Keiner | `opacity: 0.85` Transition |

### 11.3 Hamburger Button

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Hover | `opacity: 0.7` | `color: var(--primary)` |
| Open State | `.open` Klasse vorbereitet | `.open` → `color: var(--primary)` |
| Motion | `whileHover/Tap` direkt in JSX | Stabile Konstanten `HAMBURGER_HOVER`, `HAMBURGER_TAP` |
| `shouldAnimate` | Nicht genutzt | Guard auf allen Motion-Props |
| Focus Ring | `@include focus-ring` | Beibehalten |

### 11.4 Admin Badge

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `color-mix(--primary 10%, transparent)` | `color-mix(--primary 10%, --glass-bg)` |
| Border | Keiner | `1px solid color-mix(--primary 15%, transparent)` |
| Text | Kein Shadow | `@include glass-text` |

### 11.5 Viewer Badge

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `color-mix(--warning 10%, transparent)` | `color-mix(--warning 10%, --glass-bg)` |
| Border | Keiner | `1px solid color-mix(--warning 15%, transparent)` |
| Text | Kein Shadow | `@include glass-text` |

### 11.6 Auth Button

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Hover | `background: var(--pri-hover)` | `filter: brightness(1.08)` + `box-shadow: var(--glow-sm)` |
| Focus | Keiner explizit | `@include focus-ring` |
| Touch | `min-height: 44px` vorhanden | Beibehalten |

### 11.7 Avatar Button (UserMenu)

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `var(--surface-2)` | `var(--glass-bg-hover)` |
| Border | `var(--border)` | `var(--glass-border)` |
| Hover BG | `var(--surface)` | `color-mix(--primary 8%, --glass-bg)` |
| Hover Border | `var(--primary)` | Beibehalten |
| Motion | `whileHover/Tap` direkt in JSX | Stabile Konstanten `AVATAR_HOVER`, `AVATAR_TAP` |
| `shouldAnimate` | Vorhanden | Beibehalten |

### 11.8 Avatar Circle

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Gradient | `linear-gradient(135deg, --primary, --pri-hover)` | Beibehalten (kein Glass nötig — bewusster Akzent) |
| Initialen | Inline-Berechnung | `useMemo` mit `[user?.name]` |

### 11.9 Dropdown Menu

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `var(--surface)` | `var(--glass-bg)` + Blur |
| Blur | Keiner | `var(--glass-blur)` |
| Border | `var(--border)` | `var(--glass-border)` |
| Shadow | `var(--sh-lg)` | `var(--glass-shadow-elevated)` |
| Fallback | Keiner | `@supports not → var(--surface) + var(--sh-lg)` |
| Webkit | Keiner | `-webkit-backdrop-filter` |

### 11.10 Dropdown Header

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Border | `var(--border)` | `var(--glass-border-light)` |
| Name Text | Kein Shadow | `@include glass-text` |

### 11.11 Dropdown Items

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Hover BG | `var(--surface-2)` | `var(--glass-bg-hover)` |
| Hover Color | `var(--primary)` | Beibehalten |
| Focus | `@include focus-ring-inset` | Beibehalten |

### 11.12 Skeleton (Loading State)

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Keine Änderung | Skeleton ist eine gemeinsame Komponente | Keine Glass-Änderung am Skeleton selbst nötig — Funktional korrekt, `React.memo`, a11y vorhanden |

### 11.13 HamburgerMenu-Integration

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Escape Handler | `useEffect` mit Inline-Funktion | `useCallback` wrapping für stabile Referenz |
| `handleLogout` | `async function` direkt definiert | `useCallback` mit `[logout, navigate]` Dependencies |

---

## 12. Test-Plan

### 12.1 Unit-Tests — Header (bestehend: 372 Zeilen, komplett neu schreiben)

**Datei:** `src/components/layout/Header/__tests__/Header.test.jsx`

> **Hinweis:** Test-Datei von `layout/__tests__/Header.test.jsx` nach `layout/Header/__tests__/Header.test.jsx` verschieben (konsistent mit Komponentenstruktur).

#### Desktop Rendering

| Test | Beschreibung |
|------|-------------|
| **Logo sichtbar** | Logo `<img>` mit `alt="Finora"` gerendert |
| **Kein Hamburger** | Hamburger-Button nicht gerendert |
| **role="banner"** | `<header>` hat `role="banner"` |

#### Mobile Rendering

| Test | Beschreibung |
|------|-------------|
| **Hamburger sichtbar** | Hamburger-Button gerendert |
| **Kein Logo** | Logo nicht sichtbar |
| **aria-label** | Hamburger hat `aria-label="common.menu"` |
| **aria-expanded** | `aria-expanded="false"` im Initialzustand |

#### HamburgerMenu Integration

| Test | Beschreibung |
|------|-------------|
| **Öffnen** | Klick auf Hamburger → `isHamburgerOpen = true` |
| **Schließen via onClose** | HamburgerMenu `onClose` → `isHamburgerOpen = false` |
| **Schließen via Escape** | Escape-Taste → `isHamburgerOpen = false` |

#### Auth States

| Test | Beschreibung |
|------|-------------|
| **Loading** | `isLoading=true` → Skeleton gerendert |
| **Authenticated** | `isAuthenticated=true` → UserMenu gerendert |
| **Unauthenticated** | `isAuthenticated=false` → Auth-Link gerendert |
| **Auth Link Route** | Auth-Link zeigt auf `/login` |

#### Badges

| Test | Beschreibung |
|------|-------------|
| **Admin Badge** | `role=admin` → `.adminBadge` mit `admin.badge` Text |
| **Viewer Badge** | `role=viewer` → `.viewerBadge` mit `admin.viewerBadge` Text |
| **Kein Badge** | `role=user` → Kein Badge gerendert |

#### Logout

| Test | Beschreibung |
|------|-------------|
| **Logout + Navigation** | `handleLogout` ruft `logout()` auf, dann `navigate('/dashboard')` |

### 12.2 Unit-Tests — UserMenu (bestehend: 14 Tests, erweitern)

**Datei:** `src/components/common/UserMenu/__tests__/UserMenu.test.jsx`

#### Bestehende Tests (beibehalten)

| Test | Beschreibung |
|------|-------------|
| **Avatar Button** | Button gerendert mit `aria-label` |
| **Initialen — 2 Wörter** | "Max Mustermann" → "MM" |
| **Initialen — kein Name** | `{}` → "U" |
| **Initialen — 1 Wort** | "Admin" → "A" |
| **Dropdown — geschlossen** | `aria-expanded="false"` im Initialzustand |
| **Dropdown — öffnen** | Klick → Name + Email sichtbar |
| **Dropdown — aria-expanded** | `aria-expanded="true"` nach Öffnen |
| **Dropdown — toggle** | Zweiter Klick schließt Dropdown |
| **Profile Link** | Link zeigt auf `/profile` |
| **Logout Button** | Logout-Button sichtbar |
| **Logout — Handler** | `onLogout` aufgerufen, Dropdown schließt |
| **Escape** | Escape schließt Dropdown |
| **Click Outside** | Klick außerhalb schließt Dropdown |
| **Profile Link Close** | Profile-Link Klick schließt Dropdown |

#### Neue Tests (hinzufügen)

| Test | Beschreibung |
|------|-------------|
| **Initialen — useMemo** | Initialen werden nur bei `user.name`-Wechsel neu berechnet (Performance) |
| **shouldAnimate — false** | Keine Motion-Props wenn `shouldAnimate=false` |
| **Glass Classes** | Dropdown hat Glass-konforme Klassen |

### 12.3 E2E-Tests (bestehende erweitern)

| Test | Datei | Beschreibung |
|------|-------|-------------|
| Header Logo | `e2e/navigation.spec.js` | Logo Navigation zu `/` |
| UserMenu Dropdown | `e2e/navigation.spec.js` | Avatar öffnet Dropdown, Profile-Link funktioniert |
| Admin Badge | `e2e/settings.spec.js` | Admin-Badge sichtbar für Admin-User |
| Mobile Hamburger | `e2e/responsive-a11y.spec.js` | Hamburger öffnet/schließt HamburgerMenu |
| Auth State | `e2e/auth.spec.js` | Login-Link sichtbar wenn nicht authentifiziert |
| Logout | `e2e/auth.spec.js` | Logout via UserMenu → Redirect |

---

## 13. Implementierungs-Checkliste

### Phase A: Vorbereitung

- [ ] `frontend-design` Skill lesen
- [ ] `vercel-react-best-practices` Skill lesen
- [ ] Aktuelle Header-Styles sichern (Git Branch)
- [ ] Verifizieren: `glass-panel()`, `glass-hover()`, `glass-text()`, `focus-ring`, `focus-ring-inset` Mixins vorhanden

### Phase B: SCSS (Header.module.scss)

- [ ] `Header.module.scss` komplett neu schreiben
- [ ] Glass-Tokens: Header Root (glass-bg, blur, border, shadow)
- [ ] Logo Styles mit Focus-Ring + Hover-Opacity
- [ ] Hamburger: `color: var(--primary)` Hover + `.open` State
- [ ] Admin Badge: Glass-BG + subtle Border + `@include glass-text`
- [ ] Viewer Badge: Warning-Variant desselben
- [ ] Auth Button: Glow-Hover + Focus-Ring
- [ ] HeaderLeft + HeaderRight Responsive
- [ ] `-webkit-backdrop-filter` überall dabei
- [ ] `@supports not (backdrop-filter)` Fallback
- [ ] `@include reduced-motion` Block

### Phase C: SCSS (UserMenu.module.scss)

- [ ] `UserMenu.module.scss` komplett neu schreiben
- [ ] Avatar Button: Glass-Border + Glass-BG-Hover
- [ ] Avatar Circle: Gradient beibehalten (bewusster Akzent)
- [ ] Dropdown Menu: Glass-Card (blur, border, shadow-elevated)
- [ ] Dropdown Header: Glass-Border-Light + `@include glass-text` auf Name
- [ ] Dropdown Items: Glass-BG-Hover + Primary Color Hover
- [ ] RTL `:global([dir='rtl'])` Selectors
- [ ] `@supports not (backdrop-filter)` Fallback auf Dropdown
- [ ] `-webkit-backdrop-filter` auf Dropdown
- [ ] `@include reduced-motion` Block
- [ ] `@include focus-ring-inset` auf Items

### Phase D: JSX (Header.jsx)

- [ ] Glass-Klassen anwenden (`.header` statt `.headerTop`)
- [ ] `useCallback` für `handleLogout` (`[logout, navigate]`)
- [ ] Motion-Configs als stabile Konstanten (`HAMBURGER_HOVER`, `HAMBURGER_TAP`)
- [ ] `shouldAnimate` Guard auf Hamburger Motion-Props
- [ ] Logo Link mit Focus-Ring-Klasse
- [ ] Escape-Handler korrekt in `useEffect`
- [ ] i18n Keys korrekt referenziert (4 Keys)

### Phase E: JSX (UserMenu.jsx)

- [ ] `React.memo` Wrapper
- [ ] `useMemo` für Initialen-Berechnung
- [ ] `useCallback` für `handleLogout`
- [ ] Motion-Configs als stabile Konstanten (`AVATAR_HOVER`, `AVATAR_TAP`, `DROPDOWN_*`)
- [ ] `shouldAnimate` Guards beibehalten
- [ ] Click-outside + Escape Handler korrekt
- [ ] i18n Keys korrekt (3 Keys)

### Phase F: Integration

- [ ] MainLayout → Header korrekt eingebunden (keine Props nötig)
- [ ] Dashboard: Glass-Blur mit Aurora-Gradient testen
- [ ] Nicht-Dashboard-Seiten: Glass-Blur auf `--bg` testen
- [ ] Admin-Bereich: Header identisch funktional prüfen
- [ ] Mobile: Hamburger → HamburgerMenu Öffnen/Schließen
- [ ] Dropdown: Öffnen, Profile-Link, Logout funktional
- [ ] Loading State: Skeleton gerendert während Auth-Check

### Phase G: Tests

- [ ] Test-Datei verschieben: `layout/__tests__/Header.test.jsx` → `layout/Header/__tests__/Header.test.jsx`
- [ ] Unit-Tests: Desktop Rendering (3 Tests)
- [ ] Unit-Tests: Mobile Rendering (4 Tests)
- [ ] Unit-Tests: HamburgerMenu Integration (3 Tests)
- [ ] Unit-Tests: Auth States (4 Tests)
- [ ] Unit-Tests: Badges (3 Tests)
- [ ] Unit-Tests: Logout (1 Test)
- [ ] UserMenu Tests: Bestehende 14 Tests anpassen
- [ ] UserMenu Tests: 3 neue Tests hinzufügen
- [ ] E2E-Tests erweitern (6 Szenarien)
- [ ] Visuell: Light + Dark Theme, alle 4 Sprachen
- [ ] RTL: Dropdown Position, Header-Layout prüfen
- [ ] `prefers-reduced-motion`: Keine Animationen
- [ ] `@supports not (backdrop-filter)`: Fallback prüfen

### Phase H: Code Review

- [ ] Keine hardcodierten Farben/Werte
- [ ] Alle 7 i18n-Keys korrekt referenziert (4 Header + 3 UserMenu)
- [ ] `React.memo` auf UserMenu
- [ ] `useCallback`/`useMemo` wo relevant
- [ ] Motion-Configs als stabile Konstanten
- [ ] Glass-Tokens durchgängig (kein `--surface`, `--border`, `--sh-*` mehr)
- [ ] `-webkit-backdrop-filter` überall
- [ ] `@supports` Fallbacks überall
- [ ] Build erfolgreich (`npm run build`)
