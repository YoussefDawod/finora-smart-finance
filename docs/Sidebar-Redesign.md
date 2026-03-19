# Sidebar — Komplett-Neubau (Aurora Flow Glass)

> **Scope:** Globaler Einsatz — User-Bereich UND Admin-Bereich  
> **Design-System:** Aurora Flow Glass-Tokens (`--glass-*`)  
> **Ansatz:** Kein Repair — vollständiger Neubau von Grund auf  
> **Stand:** Plan erstellt am 13. März 2026

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

Die Sidebar wird **identisch** im User-Bereich und im Admin-Bereich eingesetzt:
- Navigation-Items kommen aus `navigation.js` (User: Dashboard, Transactions, Settings)
- Admin-Panel-Link wird **rollenbasiert** eingeblendet (`admin` / `viewer`)
- Kein separates Sidebar-Design für Admin — eine Sidebar, globales Styling

---

## 2. Bestandsaufnahme (Ist-Zustand)

### 2.1 Dateien

| Datei | Pfad | Status |
|-------|------|--------|
| `Sidebar.jsx` | `src/components/layout/Sidebar/Sidebar.jsx` | Komplett ersetzen |
| `Sidebar.module.scss` | `src/components/layout/Sidebar/Sidebar.module.scss` | Komplett ersetzen |
| `navigation.js` | `src/config/navigation.js` | Unverändert (Referenz) |

### 2.2 Props

| Prop | Typ | Default | Beschreibung |
|------|-----|---------|-------------|
| `isCollapsed` | `boolean` | — | Desktop: Sidebar eingeklappt |
| `onToggleCollapse` | `Function` | — | Desktop: Toggle Collapse Handler |

### 2.3 Sektionen (Top → Bottom)

```
┌─────────────────────────────┐
│ Header (Collapse-Toggle)    │
├─────────────────────────────┤
│ UserSection                 │
│  ├─ Avatar (Initialen)      │
│  ├─ Admin/Viewer Badge      │
│  ├─ Name                    │
│  └─ Email                   │
├─────────────────────────────┤
│ Navigation                  │
│  ├─ Dashboard (FiBarChart2) │
│  ├─ Transactions (FiCredit) │
│  ├─ Settings (FiSettings)   │
│  └─ Admin Panel (FiShield)  │  ← rollenbasiert
├─────────────────────────────┤
│ ThemeSelector               │
├─────────────────────────────┤
│ Footer (Logout / Login)     │
└─────────────────────────────┘
```

### 2.4 Verhalten

| Feature | Detail |
|---------|--------|
| **Sichtbarkeit** | Nur Desktop (>768px). Mobile: `HamburgerMenu` übernimmt |
| **Collapse** | 280px → 72px, State in `localStorage('sidebar-collapsed')` |
| **Auto-Expand** | ThemeSelector-Klick expandiert Sidebar temporär |
| **Position** | Fixed left, `top: var(--header-height, 56px)`, `height: calc(100vh - var(--header-height))` |
| **Z-Index** | `var(--z-dropdown)` |
| **Active State** | `::before` left border bar (4px normal, 5px active), `--primary` Farbe |

### 2.5 Auth-Logik

```jsx
const { logout, user, isAuthenticated, isViewer } = useAuth();

// UserSection nur bei Authentifizierung
{isAuthenticated && user && ( <UserSection /> )}

// Admin-Link nur für admin/viewer Rollen
{isAuthenticated && (user?.role === 'admin' || user?.role === 'viewer') && ( <AdminLink /> )}

// Footer: Logout (auth) oder Login (guest)
{isAuthenticated ? <Logout /> : <Login />}
```

### 2.6 Navigation-Config (unverändert)

```javascript
// src/config/navigation.js
import { FiBarChart2, FiCreditCard, FiSettings } from 'react-icons/fi';

export const NAV_ITEMS = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: FiBarChart2 },
  { path: '/transactions', labelKey: 'nav.transactions', icon: FiCreditCard },
  { path: '/settings', labelKey: 'nav.settings', icon: FiSettings },
];
```

### 2.7 Aktuelles Styling (Probleme)

| Problem | Detail |
|---------|--------|
| **Keine Glass-Tokens** | `--surface`, `--border` statt `--glass-bg`, `--glass-border` |
| **Kein Backdrop-Filter** | Kein Blur-Effekt — flache Oberfläche |
| **Kein Glass-Shadow** | `--sh-lg` statt `--glass-shadow` |
| **UserCard** | `--surface-2` statt `--glass-bg-hover` |
| **Keine glass-text** | Kein Text-Shadow für Lesbarkeit auf Glass |
| **CSS-Transition für Width** | Kein Spring-basierter Collapse |
| **Duplikat-Code** | NavItem-Styles identisch mit HamburgerMenu, kein Shared Partial |
| **Fehlende Unit-Tests** | Keine Unit-Tests vorhanden |

---

## 3. Neues Design (Soll-Zustand)

### 3.1 Design-Vision

Die Sidebar wird eine **schwebende Glass-Fläche** mit Tiefenwirkung. Auf Dashboard-Seiten (`html.page-dashboard`) scheint der Aurora-Gradient durch den Glass-Blur. Auf anderen Seiten (`/transactions`, `/settings`, `/admin`) bleibt der Blur subtil über `--bg`.

### 3.2 Surface & Background

```scss
.sidebar {
  background: var(--glass-bg);                        // rgba(15,18,35,0.40)
  backdrop-filter: blur(var(--glass-blur));            // 28px Desktop
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-right: 1px solid var(--glass-border);        // rgba(255,255,255,0.08)
  box-shadow: var(--glass-shadow);                    // 0 8px 32px rgba(0,0,0,0.35)

  @supports not (backdrop-filter: blur(1px)) {
    background: var(--surface);                       // Fallback
  }
}
```

### 3.3 UserCard (Glass-Variant)

```scss
.userCard {
  background: var(--glass-bg-hover);                  // rgba(15,18,35,0.55)
  border: 1px solid var(--glass-border);
  border-radius: var(--r-lg);
  @include glass-text;                                // Text-Shadow für Lesbarkeit
}
```

### 3.4 NavItem (Glass-Hover)

```scss
.navItem {
  // Default
  background: transparent;
  color: var(--tx-muted);

  // Hover
  &:hover {
    background: var(--glass-bg-hover);
    color: var(--tx);
    @include glass-hover;                             // Lift + Shadow
  }

  // Active
  &.active {
    color: var(--primary);
    // Active Indicator: --primary mit subtlem Glow
    &::before {
      background: var(--primary);
      box-shadow: var(--glow-sm);                     // 0 0 6px --glow-primary
    }
  }
}
```

### 3.5 Collapse-Toggle

```scss
.collapseBtn {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);

  &:hover {
    background: var(--glass-bg-hover);
    border-color: var(--primary);
    color: var(--primary);
  }
}
```

### 3.6 Footer-Buttons (Logout / Login)

```scss
// Logout: Error-Farbe auf Glass
.logoutBtn {
  background: transparent;
  border: 1px solid var(--glass-border);
  color: var(--error);

  &:hover {
    background: color-mix(in srgb, var(--error) 10%, transparent);
    border-color: var(--error);
  }
}

// Login: Primary auf Glass
.loginBtn {
  background: var(--primary);
  border: 1px solid var(--primary);
  color: var(--on-primary);

  &:hover {
    background: var(--pri-hover);
    box-shadow: var(--glow-md);                       // Primary Glow auf Hover
  }
}
```

### 3.7 Admin/Viewer Badges

```scss
// Admin Badge
.avatarBadge {
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 12%, var(--glass-bg));
  border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
}

// Viewer Badge
.avatarViewerBadge {
  color: var(--warning);
  background: color-mix(in srgb, var(--warning) 12%, var(--glass-bg));
  border: 1px solid color-mix(in srgb, var(--warning) 30%, transparent);
}
```

### 3.8 Scrollbar (Glass-themed)

```scss
.sidebar::-webkit-scrollbar-thumb {
  background: var(--glass-border-light);              // rgba(255,255,255,0.04)
  &:hover {
    background: var(--glass-border);                  // rgba(255,255,255,0.08)
  }
}
```

---

## 4. Komponentenarchitektur

### 4.1 Dateistruktur

```
src/components/layout/Sidebar/
├── Sidebar.jsx                 // Hauptkomponente
├── Sidebar.module.scss         // Glass-Styling
└── __tests__/
    └── Sidebar.test.jsx        // Unit-Tests
```

### 4.2 Shared Partial (NEU)

```
src/styles/partials/
└── _nav-items.scss             // Gemeinsame NavItem-Styles für Sidebar + HamburgerMenu
```

Inhalt: Active Indicator, Hover-States, Icon-Styles, Label-Styles, RTL-Selectors, Reduced-Motion. Wird von `Sidebar.module.scss` und `HamburgerMenu.module.scss` importiert.

### 4.3 JSX-Struktur (Neu)

```jsx
<aside className={sidebarClasses}>
  {/* 1. Header: Collapse Toggle */}
  <div className={styles.header}>
    <CollapseButton />
  </div>

  {/* 2. UserSection (nur wenn authentifiziert) */}
  {isAuthenticated && user && <UserCard />}

  {/* 3. Navigation */}
  <nav className={styles.nav} aria-label={t('common.navigation')}>
    {NAV_ITEMS.map(item => <NavItem />)}
    {isAdminOrViewer && <AdminNavItem />}
  </nav>

  {/* 4. ThemeSelector */}
  <div className={styles.themeSection}>
    <ThemeSelector isCollapsed={isCollapsed} onClose={handleThemeClose} />
  </div>

  {/* 5. Footer: Logout / Login */}
  <div className={styles.footer}>
    {isAuthenticated ? <LogoutButton /> : <LoginButton />}
  </div>
</aside>
```

### 4.4 Performance-Optimierungen (vercel-react-best-practices)

| Optimierung | Detail |
|-------------|--------|
| `React.memo` | Sidebar wird memoized (Props: `isCollapsed`, `onToggleCollapse`) |
| `useCallback` | Alle Handler (`handleNavigate`, `handleLogout`, `handleThemeSectionClick`, `handleThemeClose`) |
| `useMemo` | `isActive` Berechnung, `sidebarClasses` String-Konstruktion |
| Conditional Icon Import | Admin-Icon (`FiShield`) nur wenn Rolle vorhanden (oder lazy) |
| `displayName` | Für DevTools: `Sidebar.displayName = 'Sidebar'` |
| Keine Inline-Objekte | `whileHover`/`whileTap` Config als stabile Konstanten außerhalb der Render-Funktion |

---

## 5. Responsive Spezifikation

### 5.1 Breakpoint-Regel

| Viewport | Sidebar | Begründung |
|----------|---------|-----------|
| Desktop (>768px) | Sichtbar, fixed left | Standard-Layout |
| Tablet (≤768px) | **Nicht gerendert** | HamburgerMenu übernimmt |
| Mobile (≤640px) | **Nicht gerendert** | HamburgerMenu übernimmt |

> Die Sidebar wird in `MainLayout.jsx` nur gerendert, wenn `!isMobile` (Breakpoint: 768px via `useMediaQuery`).

### 5.2 Desktop-Dimensionen

| Zustand | Breite | Blur | Padding |
|---------|--------|------|---------|
| Expanded | `var(--sidebar-width, 280px)` | `var(--glass-blur)` (28px) | `0` |
| Collapsed | `var(--sidebar-collapsed-width, 72px)` | `var(--glass-blur)` (28px) | `0` |

### 5.3 Collapsed-Verhalten

| Element | Expanded | Collapsed |
|---------|----------|-----------|
| NavLabel | Sichtbar | `opacity: 0; width: 0; overflow: hidden` |
| LogoutLabel | Sichtbar | Hidden |
| UserInfo (Name+Email) | Sichtbar | Hidden |
| UserAvatar | 48×48px | 36×36px |
| NavItem | `padding: sm md` | `padding: sm; justify-content: center` |
| CollapseBtn | `justify-content: flex-end` | `justify-content: center` |
| ThemeSelector | Full | Icon-only via `isCollapsed` Prop |

---

## 6. Animationen & Motion

### 6.1 Pflicht: `useMotion()` Hook

Alle Framer Motion Animationen MÜSSEN via `shouldAnimate` gesteuert werden:

```jsx
const { shouldAnimate } = useMotion();

// Nur animieren, wenn prefers-reduced-motion nicht aktiv
whileHover={shouldAnimate ? hoverConfig : undefined}
whileTap={shouldAnimate ? tapConfig : undefined}
```

### 6.2 Animation-Specs

| Element | Trigger | Effekt | Duration/Config |
|---------|---------|--------|-----------------|
| Sidebar Width | Collapse Toggle | `width: 280px ↔ 72px` | CSS: `transition: width var(--tr)` (250ms) |
| NavItem Hover | Mouse Enter | `x: ±4px` (RTL-aware) | Framer: spring, instant |
| NavItem Tap | Click | `scale: 0.98` | Framer: instant |
| Active Indicator | Route Change | `height: 0 → 70%` | CSS: `transition: height var(--tr-fast)` |
| Collapse Button | Hover | `scale: 1.02` | Framer: spring |
| Collapse Button | Tap | `scale: 0.98` | Framer: instant |
| Logout Button | Hover | Icon `translateX(4px)` (RTL: `-4px`) | CSS: `transition: transform var(--tr-fast)` |
| Login Button | Hover | `box-shadow: var(--glow-md)` | CSS: `transition: box-shadow var(--tr-fast)` |

### 6.3 Stabile Motion-Konstanten (außerhalb Render)

```jsx
const HOVER_SCALE = { scale: 1.02 };
const TAP_SCALE = { scale: 0.98 };
const NAV_HOVER_LTR = { x: 4 };
const NAV_HOVER_RTL = { x: -4 };
const NAV_HOVER_COLLAPSED = undefined;
```

### 6.4 Reduced Motion

```scss
@include reduced-motion {
  .sidebar,
  .navItem,
  .navItem::before,
  .navIcon,
  .collapseBtn,
  .logoutBtn,
  .loginBtn {
    transition: none;
    animation: none;
  }
}
```

---

## 7. i18n-Plan

### 7.1 Bestehende Keys (alle beibehalten)

| Key | Verwendung | Kontext |
|-----|------------|---------|
| `nav.dashboard` | NavItem Label | Navigation |
| `nav.transactions` | NavItem Label | Navigation |
| `nav.settings` | NavItem Label | Navigation |
| `nav.logout` | Logout-Button Label + Title | Footer |
| `nav.adminPanel` | Admin-Link Label + Title | Navigation |
| `auth.loginOrRegister` | Login-Button Label + Title | Footer |
| `common.expand` | Collapse-Button aria-label + title | Header |
| `common.collapse` | Collapse-Button aria-label + title | Header |
| `common.navigation` | `<nav>` aria-label | Navigation |
| `admin.badge` | Admin Badge Text | UserSection |
| `admin.viewerBadge` | Viewer Badge Text | UserSection |
| `themeSelector.ariaLabel` | ThemeSelector aria-label | ThemeSection |

### 7.2 Sprachen

Alle Keys in 4 Sprachen: `de`, `en`, `ar`, `ka` (Georgisch).

---

## 8. RTL-Plan (Arabisch)

### 8.1 Layout-Spiegelung

| LTR | RTL |
|-----|-----|
| `position: fixed; left: 0` | `left: auto; right: 0` |
| `border-right: 1px solid var(--glass-border)` | `border-right: none; border-left: 1px solid var(--glass-border)` |
| `text-align: left` auf NavItems | `text-align: right` |
| Active Indicator `left: 0`, `border-radius: 0 r-sm r-sm 0` | `left: auto; right: 0`, `border-radius: r-sm 0 0 r-sm` |

### 8.2 Chevron-Flip

```jsx
// Expanded → Collapse: Pfeil zeigt zur Seite wo Sidebar ist
{isCollapsed
  ? (isRtl ? <FiChevronLeft /> : <FiChevronRight />)   // → Expand zeigt WEG von der Sidebar
  : (isRtl ? <FiChevronRight /> : <FiChevronLeft />)}  // → Collapse zeigt ZUR Sidebar
```

### 8.3 Hover-Direction

```jsx
// NavItem Hover verschiebt leicht in Leserichtung
whileHover={{ x: isCollapsed ? 0 : (isRtl ? -4 : 4) }}
```

### 8.4 Badge-Position

```scss
// LTR: Badge rechts unten
.avatarBadge { bottom: -6px; right: -6px; }

// RTL: Badge links unten
:global([dir='rtl']) .avatarBadge { right: auto; left: -6px; }
```

### 8.5 Logout-Icon

```scss
// LTR: Icon verschiebt sich rechts
.logoutBtn:hover .logoutIcon { transform: translateX(4px); }

// RTL: Icon verschiebt sich links
:global([dir='rtl']) .logoutBtn:hover .logoutIcon { transform: translateX(-4px); }
```

### 8.6 SCSS-Implementierung

Alle RTL-Regeln über `:global([dir='rtl'])` Selectors — die `dir`-Attribut wird von `react-i18next` auf `<html>` gesetzt.

---

## 9. Accessibility

### 9.1 Semantik

| Element | Attribut | Wert |
|---------|----------|------|
| `<aside>` | Rolle | Implizit `complementary` |
| `<nav>` | `aria-label` | `t('common.navigation')` |
| Collapse-Button | `aria-label` | `t('common.expand')` / `t('common.collapse')` |
| Collapse-Button | `title` | Identisch mit `aria-label` |
| ThemeSection (collapsed) | `role` | `"button"` |
| ThemeSection (collapsed) | `tabIndex` | `0` |
| ThemeSection (collapsed) | `aria-label` | `t('themeSelector.ariaLabel')` |
| ThemeSection (collapsed) | `onKeyDown` | Enter/Space Handler |
| NavItems | `title` | Label-Text |

### 9.2 Touch Targets

```scss
.navItem, .logoutBtn, .loginBtn {
  min-height: 44px;    // WCAG 2.5.8 Target Size
}

// Chrome Mobile UA Fix
button { min-height: 0; }
```

### 9.3 Focus Management

```scss
@mixin focus-ring {
  &:focus { outline: none; }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 40%, transparent);
  }
}
```

Alle interaktiven Elemente: `@include focus-ring` oder `@include focus-ring-inset`.

### 9.4 Keyboard-Navigation

- Tab-Reihenfolge: CollapseBtn → UserCard (wenn sichtbar) → NavItems → ThemeSelector → Logout/Login
- Enter/Space auf ThemeSection triggert Expand + öffnet ThemeSelector
- Alle Buttons via `<button>` (nicht `<div>`)

### 9.5 Reduced Motion

```jsx
const { shouldAnimate } = useMotion(); // prüft prefers-reduced-motion
```

Alle Framer Motion Props werden `undefined` bei `shouldAnimate === false`.

---

## 10. SCSS-Architektur

### 10.1 Imports

```scss
@use '@/styles/mixins' as *;
// @use '@/styles/variables' as *;  // nur wenn $sass-Variablen benötigt
@use '@/styles/partials/nav-items' as *;  // Shared NavItem-Styles (NEU)
```

### 10.2 Pflicht-Regeln (aus Projekt-Design.md)

| Regel | Beispiel |
|-------|---------|
| Keine Hex/RGBA in Komponenten | `var(--glass-bg)` statt `rgba(15,18,35,0.40)` |
| `color-mix()` für Opacity | `color-mix(in srgb, var(--primary) 10%, transparent)` |
| `-webkit-backdrop-filter` Pflicht | Immer zusammen mit `backdrop-filter` |
| `@supports` Fallback | `@supports not (backdrop-filter: blur(1px)) { background: var(--surface); }` |
| Blur via Token | `var(--glass-blur)`, nie `blur(20px)` |
| `@include reduced-motion` | Für alle Transitions und Animations |
| `@include focus-ring` | Für alle interaktiven Elemente |
| `min-height: 0` auf Buttons | Chrome Mobile UA-Fix |

### 10.3 Neue Shared-Datei: `_nav-items.scss`

```scss
// src/styles/partials/_nav-items.scss
// Gemeinsame NavItem-Styles für Sidebar + HamburgerMenu (DRY)

@mixin nav-item-base {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: none;
  border-radius: var(--r-lg);
  color: var(--tx-muted);
  font-size: var(--fs-sm);
  font-weight: var(--fw-m);
  text-align: left;
  cursor: pointer;
  transition: all var(--tr-fast);
  position: relative;
  width: 100%;
  min-height: 44px;
  overflow: hidden;
}

@mixin nav-item-indicator {
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 0;
    background: var(--primary);
    border-radius: 0 var(--r-sm) var(--r-sm) 0;
    transition: height var(--tr-fast);
  }
}

@mixin nav-item-hover-glass {
  &:hover {
    background: var(--glass-bg-hover);
    color: var(--tx);
    &::before { height: 50%; }
    .navIcon { color: var(--primary); }
  }
}

@mixin nav-item-active {
  &.active {
    background: transparent;
    color: var(--primary);
    font-weight: var(--fw-sb);
    &::before {
      height: 70%;
      width: 5px;
      box-shadow: var(--glow-sm);
    }
    .navIcon { color: var(--primary); }
  }
}

@mixin nav-item-rtl {
  :global([dir='rtl']) & {
    text-align: right;
    &::before {
      left: auto;
      right: 0;
      border-radius: var(--r-sm) 0 0 var(--r-sm);
    }
  }
}

@mixin nav-icon-base {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  min-width: 28px;
  color: var(--tx-muted);
  transition: color var(--tr-fast);
  flex-shrink: 0;
  svg { width: 24px; height: 24px; }
}
```

---

## 11. Optimierung aller Elemente

Jedes Element der Sidebar wird im Neubau einzeln optimiert:

### 11.1 Collapse-Button

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `transparent` | `var(--glass-bg)` |
| Border | `var(--border)` | `var(--glass-border)` |
| Hover | `color-mix(--primary 5%)` | `var(--glass-bg-hover)` + `border-color: var(--primary)` |
| Focus | `focus-ring-inset` | Beibehalten |
| RTL-Chevron | Korrekt | Beibehalten |

### 11.2 UserCard

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `var(--surface-2)` | `var(--glass-bg-hover)` |
| Border | `var(--border)` | `var(--glass-border)` |
| Text | Kein Shadow | `@include glass-text` |
| Avatar Shadow | `color-mix(--primary 30%)` | Beibehalten (passt zu Glass) |
| Collapsed Avatar | 36×36, `--fs-sm` | Beibehalten |

### 11.3 NavItems

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Hover-BG | `color-mix(--primary 8%, --surface)` | `var(--glass-bg-hover)` |
| Active Indicator | `--primary` Balken ohne Glow | `--primary` Balken + `var(--glow-sm)` |
| Shared Styles | Duplikat mit HamburgerMenu | `@include nav-item-base` Mixin |
| Transition | `all var(--tr-fast)` | Beibehalten (optimiert) |

### 11.4 ThemeSelector Section

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Styling | `padding: 0 var(--space-md)` | Zusätzlich: `border-top: 1px solid var(--glass-border-light)` |
| Auto-Expand | Via `autoExpandedForTheme` State | Beibehalten (UX ist gut) |
| a11y (collapsed) | `role="button"`, `tabIndex`, `aria-label`, `onKeyDown` | Beibehalten |

### 11.5 Logout-Button

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Border | `var(--border)` | `var(--glass-border)` |
| Hover-BG | `color-mix(--error 10%)` | Beibehalten (passt semantisch) |
| Icon Shift | `translateX(4px)` | Beibehalten + RTL-Mirror |

### 11.6 Login-Button

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `var(--primary)` | Beibehalten |
| Hover | `var(--pri-hover)` | Zusätzlich: `box-shadow: var(--glow-md)` |
| Hover-BG | `pri-hover` | Beibehalten |

### 11.7 Footer Section

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `var(--surface)` | `transparent` (Sidebar hat bereits Glass-BG) |
| Border-Top | `var(--border)` | `var(--glass-border-light)` (subtiler) |

### 11.8 Scrollbar

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Thumb | `var(--border)` | `var(--glass-border-light)` |
| Thumb Hover | `var(--tx-muted)` | `var(--glass-border)` |
| Track | `transparent` | Beibehalten |

---

## 12. Test-Plan

### 12.1 Unit-Tests (NEU — aktuell keine vorhanden)

**Datei:** `src/components/layout/Sidebar/__tests__/Sidebar.test.jsx`

| Test | Beschreibung |
|------|-------------|
| **Render — Expanded** | Sidebar rendert mit allen Sektionen (Header, Nav, ThemeSelector, Footer) |
| **Render — Collapsed** | Labels und UserInfo sind hidden, NavItems zentriert |
| **Collapse Toggle** | Klick auf CollapseBtn ruft `onToggleCollapse` auf |
| **Navigation — Route** | Klick auf NavItem navigiert zur Route |
| **Navigation — Active** | Aktueller Pfad hat `.active` Klasse |
| **Auth — User angezeigt** | Authentifizierter User: UserCard mit Name/Email sichtbar |
| **Auth — Admin Badge** | Admin-Rolle: Badge mit `t('admin.badge')` Text |
| **Auth — Viewer Badge** | Viewer-Rolle: Badge mit `t('admin.viewerBadge')` Text |
| **Auth — Admin Link** | Admin/Viewer: Admin-Panel Link sichtbar |
| **Auth — Logout** | Klick auf Logout: `logout()` wird aufgerufen, Navigation zu `/dashboard` |
| **Auth — Guest** | Nicht authentifiziert: Login-Button statt Logout, kein UserCard |
| **ThemeSelector — Collapsed Click** | Klick expandiert Sidebar, öffnet ThemeSelector |
| **ThemeSelector — Close** | ThemeSelector schließen re-collapsed Sidebar |
| **RTL — Layout** | `dir="rtl"`: Sidebar rechts, Active Indicator rechts |
| **Keyboard — Tab Order** | Tab navigiert durch CollapseBtn → NavItems → ThemeSelector → Logout |
| **Keyboard — Enter** | Enter auf NavItem triggert Navigation |
| **a11y — aria-labels** | Alle interaktiven Elemente haben `aria-label` oder `title` |

### 12.2 E2E-Tests (bestehende erweitern)

| Test | Datei | Beschreibung |
|------|-------|-------------|
| Sidebar Collapse/Expand | `e2e/navigation.spec.js` | Toggle verändert Layout |
| Sidebar Navigation | `e2e/navigation.spec.js` | Klick navigiert, Active State |
| Responsive Switch | `e2e/responsive-a11y.spec.js` | Desktop → Sidebar, Mobile → HamburgerMenu |
| Admin-Link Sichtbarkeit | `e2e/navigation.spec.js` | Nur für Admin/Viewer |

---

## 13. Implementierungs-Checkliste

### Phase A: Vorbereitung

- [ ] `frontend-design` Skill lesen
- [ ] `vercel-react-best-practices` Skill lesen
- [ ] Shared `_nav-items.scss` Partial erstellen
- [ ] Verifizieren: `glass-panel()`, `glass-hover()`, `glass-text()` Mixins in `mixins.scss` vorhanden

### Phase B: SCSS

- [ ] `Sidebar.module.scss` komplett neu schreiben
- [ ] Glass-Tokens für alle Surfaces
- [ ] `@include nav-item-base` + Mixins aus Shared Partial
- [ ] RTL `:global([dir='rtl'])` Selectors
- [ ] `@include reduced-motion` Block
- [ ] `@supports not (backdrop-filter)` Fallback
- [ ] Scrollbar Glass-themed

### Phase C: JSX

- [ ] `Sidebar.jsx` komplett neu schreiben
- [ ] `React.memo` mit `displayName`
- [ ] `useCallback` für alle Handler
- [ ] Stabile Motion-Konstanten außerhalb Render
- [ ] `useMotion()` + `shouldAnimate` auf allen Framer-Props
- [ ] Auth-Logik: User, Admin, Viewer, Guest States
- [ ] ThemeSelector Auto-Expand Logik

### Phase D: Integration

- [ ] `MainLayout.jsx` prüfen — Sidebar Props unverändert
- [ ] `localStorage('sidebar-collapsed')` Persistenz prüfen
- [ ] Dashboard-Seite: Glass-Blur mit Aurora-Gradient testen
- [ ] Nicht-Dashboard-Seiten: Glass-Blur auf `--bg` testen
- [ ] Admin-Bereich: Sidebar identisch funktional prüfen

### Phase E: Tests

- [ ] Unit-Tests schreiben (17 Tests wie oben)
- [ ] E2E-Tests erweitern
- [ ] Visuell testen: Light + Dark Theme, alle 4 Sprachen
- [ ] RTL-Layout visuell prüfen (Arabisch)
- [ ] `prefers-reduced-motion` testen
- [ ] `@supports not (backdrop-filter)` Fallback testen

### Phase F: Code Review

- [ ] Keine hardcodierten Farben/Werte
- [ ] Alle Token-Referenzen korrekt
- [ ] Performance: keine unnötigen Re-Renders
- [ ] Bundle: keine ungenutzten Imports
- [ ] a11y: alle Buttons haben aria-label oder title
- [ ] Build erfolgreich (`npm run build`)
