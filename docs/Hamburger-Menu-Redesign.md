# Hamburger-Menü — Komplett-Neubau (Aurora Flow Glass)

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

Das Hamburger-Menü wird **identisch** im User-Bereich und im Admin-Bereich eingesetzt:
- Navigation-Items kommen aus `navigation.js` (User: Dashboard, Transactions, Settings)
- Admin-Panel-Link wird **rollenbasiert** eingeblendet (`admin` / `viewer`)
- Kein separates Menü-Design für Admin — ein Menü, globales Styling
- Erscheint auf **allen Seiten** unter dem Tablet-Breakpoint (≤768px)

---

## 2. Bestandsaufnahme (Ist-Zustand)

### 2.1 Dateien

| Datei | Pfad | Status |
|-------|------|--------|
| `HamburgerMenu.jsx` | `src/components/layout/HamburgerMenu/HamburgerMenu.jsx` | Komplett ersetzen |
| `HamburgerMenu.module.scss` | `src/components/layout/HamburgerMenu/HamburgerMenu.module.scss` | Komplett ersetzen |
| `navigation.js` | `src/config/navigation.js` | Unverändert (Referenz) |
| `motionPresets.js` | `src/utils/motionPresets.js` | Unverändert (Referenz) |

### 2.2 Props

| Prop | Typ | Default | Beschreibung |
|------|-----|---------|-------------|
| `isOpen` | `boolean` | — | Menü sichtbar/unsichtbar |
| `onClose` | `Function` | — | Close Handler (ruft Parent-State-Setter auf) |

### 2.3 Sektionen (Top → Bottom)

```
┌─────────────────────────────────┐
│ Backdrop (60% schwarz)          │  ← Fixed, full-screen
├─────────────────────────────────┤
│ Menu Overlay (slides from left) │
│ ┌─────────────────────────────┐ │
│ │ Header (Logo)               │ │
│ ├─────────────────────────────┤ │
│ │ UserSection                 │ │
│ │  ├─ Avatar (Initialen)      │ │
│ │  ├─ Admin/Viewer Badge      │ │
│ │  ├─ Name                    │ │
│ │  └─ Email                   │ │
│ ├─────────────────────────────┤ │
│ │ Navigation (stagger anim.)  │ │
│ │  ├─ Dashboard (FiBarChart2) │ │
│ │  ├─ Transactions (FiCredit) │ │
│ │  ├─ Settings (FiSettings)   │ │
│ │  ├─ Admin Panel (FiShield)  │ │  ← rollenbasiert
│ │  └─ ThemeSelector           │ │
│ ├─────────────────────────────┤ │
│ │ Footer (Logout / Login)     │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 2.4 Verhalten

| Feature | Detail |
|---------|--------|
| **Sichtbarkeit** | Nur Mobile/Tablet (≤768px). Desktop: Sidebar übernimmt |
| **Trigger** | Hamburger-Button (FiMenu) im Header |
| **Width** | 320px (288px bei <400px Viewport), max 85vw |
| **Height** | `100svh` / `100dvh` mit safe-area-inset-bottom |
| **Close-Triggers** | Escape-Key, Backdrop-Click, Navigation-Click |
| **Body Scroll Lock** | `document.body.style.overflow = 'hidden'` bei Open |
| **Z-Index** | Backdrop: `var(--z-header)`, Menu: `var(--z-overlay)` |
| **Animation** | Backdrop: Fade 200ms. Menu: Spring-Slide (`MOTION_EASING.spring`) |
| **NavItem Stagger** | `delay: idx * 0.05`, `x: ±20 → 0` |

### 2.5 Auth-Logik

```jsx
const { logout, user, isAuthenticated } = useAuth();

// UserSection nur bei Authentifizierung
{isAuthenticated && user && ( <UserSection /> )}

// Admin-Link nur für admin/viewer Rollen
{isAuthenticated && (user?.role === 'admin' || user?.role === 'viewer') && ( <AdminLink /> )}

// Footer: Logout (auth) oder Login (guest)
{isAuthenticated ? <Logout /> : <Login />}

// Navigation schließt Menü
const handleNavigate = (path) => { navigate(path); onClose?.(); };
const handleLogout = async () => { await logout(); navigate('/dashboard', { replace: true }); onClose?.(); };
```

### 2.6 Close-Mechanismen

```jsx
// 1. Escape Key
useEffect(() => {
  const handleKeyDown = (e) => { if (e.key === 'Escape' && isOpen) onClose?.(); };
  if (isOpen) document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isOpen, onClose]);

// 2. Backdrop Click
useEffect(() => {
  const handleClickOutside = (e) => {
    if (isOpen && menuRef.current && !menuRef.current.contains(e.target)) onClose?.();
  };
  if (isOpen) document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen, onClose]);

// 3. Body Scroll Lock
useEffect(() => {
  if (isOpen) document.body.style.overflow = 'hidden';
  return () => { document.body.style.overflow = ''; };
}, [isOpen]);
```

### 2.7 Aktuelles Styling (Probleme)

| Problem | Detail |
|---------|--------|
| **Keine Glass-Tokens** | `--surface`, `--border` statt `--glass-bg`, `--glass-border` |
| **Kein Backdrop-Filter** | Menu hat keinen Blur-Effekt |
| **Backdrop-Farbe** | `black 60%` statt thematisch passendes `var(--bg)` |
| **Kein Glass-Shadow** | `--sh-xl` statt `--glass-shadow` |
| **Kein Focus-Trap** | Trotz `aria-modal="true"` kein Focus-Trap implementiert |
| **Duplikat-Code** | NavItem-Styles identisch mit Sidebar |
| **Fehlende Unit-Tests** | Keine Unit-Tests vorhanden |
| **Kein glass-text** | Kein Text-Shadow für Lesbarkeit auf Glass |

---

## 3. Neues Design (Soll-Zustand)

### 3.1 Design-Vision

Das Hamburger-Menü wird ein **schwebendes Glass-Panel**, das über einem atmosphärischen Backdrop gleitet. Der Backdrop nutzt den Seitenhintergrund (Aurora-Gradient auf Dashboard, `--bg` auf anderen Seiten) als Blur-Source, statt alles schwarz zu verdunkeln.

### 3.2 Backdrop

```scss
.backdrop {
  position: fixed;
  inset: 0;
  // Thematisch passend statt generisches Schwarz
  background: color-mix(in srgb, var(--bg) 60%, transparent);
  backdrop-filter: blur(4px);                           // Subtiler Hintergrund-Blur
  -webkit-backdrop-filter: blur(4px);
  z-index: var(--z-header);

  @supports not (backdrop-filter: blur(1px)) {
    background: color-mix(in srgb, black 60%, transparent); // Fallback
  }
}

@media (prefers-reduced-transparency: reduce) {
  .backdrop {
    background: color-mix(in srgb, var(--bg) 85%, transparent);
  }
}
```

### 3.3 Menu Panel

```scss
.menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 320px;
  max-width: 85vw;
  height: 100svh;
  @supports (height: 100dvh) { height: 100dvh; }

  background: var(--glass-bg);                            // rgba(15,18,35,0.40)
  backdrop-filter: blur(var(--glass-blur-reduced));        // 16px (Tablet-Stufe)
  -webkit-backdrop-filter: blur(var(--glass-blur-reduced));
  border-right: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  z-index: var(--z-overlay);
  overflow: hidden;
  padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom));

  @include breakpoint($max: 400px) {
    width: 288px;
    backdrop-filter: blur(var(--glass-blur-minimal));      // 10px (Mobile-Stufe)
    -webkit-backdrop-filter: blur(var(--glass-blur-minimal));
  }

  @supports not (backdrop-filter: blur(1px)) {
    background: var(--surface);
  }
}
```

### 3.4 Menu Header

```scss
.menuHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height, 48px);
  padding: 0 var(--space-lg);
  border-bottom: 1px solid var(--glass-border-light);     // Subtiler als Glass-Border
  background: var(--glass-bg-hover);                      // Leicht hervorgehoben
  flex-shrink: 0;
}
```

### 3.5 UserCard (Glass-Variant)

```scss
.userCard {
  background: var(--glass-bg-hover);
  border: 1px solid var(--glass-border);
  border-radius: var(--r-lg);
  @include glass-text;
}
```

### 3.6 NavItem (Glass-Hover)

```scss
.navItem {
  @include nav-item-base;          // Shared Partial
  @include nav-item-indicator;
  @include nav-item-hover-glass;   // Hover: --glass-bg-hover
  @include nav-item-active;        // Active: --primary + --glow-sm
  @include nav-item-rtl;

  &:focus-visible {
    @include focus-ring;
  }
}
```

### 3.7 Footer-Buttons (Logout / Login)

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
    box-shadow: var(--glow-md);
  }
}
```

### 3.8 Menu Footer

```scss
.menuFooter {
  border-top: 1px solid var(--glass-border-light);
  background: transparent;                                 // Menu hat bereits Glass-BG
  padding: var(--space-md) var(--space-md) calc(var(--space-md) + env(safe-area-inset-bottom));
}
```

---

## 4. Komponentenarchitektur

### 4.1 Dateistruktur

```
src/components/layout/HamburgerMenu/
├── HamburgerMenu.jsx              // Hauptkomponente
├── HamburgerMenu.module.scss      // Glass-Styling
└── __tests__/
    └── HamburgerMenu.test.jsx     // Unit-Tests
```

### 4.2 Shared Partial (mit Sidebar geteilt)

```
src/styles/partials/
└── _nav-items.scss                // Gemeinsame NavItem-Styles
```

### 4.3 JSX-Struktur (Neu)

```jsx
<AnimatePresence>
  {isOpen && (
    <>
      {/* 1. Backdrop */}
      <motion.div className={styles.backdrop} onClick={onClose} aria-hidden="true"
        initial={shouldAnimate ? { opacity: 0 } : false}
        animate={shouldAnimate ? { opacity: 1 } : false}
        exit={shouldAnimate ? { opacity: 0 } : undefined}
        transition={{ duration: 0.2 }}
      />

      {/* 2. Menu Panel */}
      <motion.aside ref={menuRef} className={styles.menu}
        role="dialog"
        aria-modal="true"
        aria-label={t('common.navigation')}
        initial={shouldAnimate ? { x: isRtl ? '100%' : '-100%' } : false}
        animate={shouldAnimate ? { x: 0 } : false}
        exit={shouldAnimate ? { x: isRtl ? '100%' : '-100%' } : undefined}
        transition={{ type: 'spring', ...MOTION_EASING.spring }}
      >
        {/* 2a. Header: Logo */}
        <div className={styles.menuHeader}>
          <Link to="/" onClick={onClose}>
            <img src="/logo-branding/finora-logo.svg" alt="Finora" className="app-logo app-logo--sm" />
          </Link>
        </div>

        {/* 2b. UserSection (nur wenn authentifiziert) */}
        {isAuthenticated && user && <UserCard />}

        {/* 2c. Scrollable Content */}
        <div className={styles.menuContent}>
          <nav className={styles.nav} aria-label={t('common.navigation')}>
            {NAV_ITEMS.map((item, idx) => <NavItem key={item.path} delay={idx * 0.05} />)}
            {isAdminOrViewer && <AdminNavItem />}
            <ThemeSelector />
          </nav>
        </div>

        {/* 2d. Footer: Logout / Login */}
        <div className={styles.menuFooter}>
          {isAuthenticated ? <LogoutButton /> : <LoginButton />}
        </div>
      </motion.aside>
    </>
  )}
</AnimatePresence>
```

### 4.4 Focus-Trap (NEU)

Aktuell fehlt trotz `aria-modal="true"` ein Focus-Trap. Im Neubau wird einer implementiert:

```jsx
// Option A: Eigener Hook
useFocusTrap(menuRef, isOpen);

// Option B: Manuelle Implementierung
useEffect(() => {
  if (!isOpen || !menuRef.current) return;

  const focusableEls = menuRef.current.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstEl = focusableEls[0];
  const lastEl = focusableEls[focusableEls.length - 1];

  firstEl?.focus();

  const handleTab = (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === firstEl) { e.preventDefault(); lastEl?.focus(); }
    } else {
      if (document.activeElement === lastEl) { e.preventDefault(); firstEl?.focus(); }
    }
  };

  document.addEventListener('keydown', handleTab);
  return () => document.removeEventListener('keydown', handleTab);
}, [isOpen]);
```

### 4.5 Performance-Optimierungen (vercel-react-best-practices)

| Optimierung | Detail |
|-------------|--------|
| Kein `React.memo` | Komponente wird nur bei `isOpen`-Änderung re-rendered (kontrolliert durch Parent) |
| `useCallback` | Alle Handler (`handleNavigate`, `handleLogout`) |
| `useMemo` | Nicht nötig (keine teuren Berechnungen) |
| Stabile Motion-Konstanten | `MOTION_EASING.spring`, Stagger-Configs als Module-Level-Konstanten |
| `AnimatePresence` | Effizient: rendert nur wenn `isOpen === true` |
| Cleanup | Effects sauber aufgeräumt (Event Listeners, scroll lock) |
| Kein Layout-Thrashing | `document.body.style.overflow` nur einmal bei open/close gesetzt |

---

## 5. Responsive Spezifikation

### 5.1 Breakpoint-Regel

| Viewport | HamburgerMenu | Begründung |
|----------|---------------|-----------|
| Mobile (≤640px) | Sichtbar, 288–320px | Primärer Einsatz |
| Tablet (641–768px) | Sichtbar, 320px | Sekundärer Einsatz |
| Desktop (>768px) | **Nie sichtbar** | Sidebar übernimmt |

> Gesteuert über `Header.jsx`: Hamburger-Button nur sichtbar wenn `isMobile` (≤768px).

### 5.2 Dimensionen

| Viewport | Menu-Width | Menu-Max-Width | Blur |
|----------|-----------|----------------|------|
| <400px | 288px | 85vw | `var(--glass-blur-minimal)` (10px) |
| 400–768px | 320px | 85vw | `var(--glass-blur-reduced)` (16px) |
| >768px | — | — | — (nicht sichtbar) |

### 5.3 Height & Safe Area

```scss
height: 100svh;
@supports (height: 100dvh) { height: 100dvh; }
padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom));
```

Für iOS-Geräte mit Dynamic Island / Home Indicator.

---

## 6. Animationen & Motion

### 6.1 Pflicht: `useMotion()` Hook

```jsx
const { shouldAnimate } = useMotion();
// Alle Framer Motion Props: shouldAnimate ? config : undefined/false
```

### 6.2 Animation-Specs

| Element | Trigger | Effekt | Duration/Config |
|---------|---------|--------|-----------------|
| **Backdrop** | Open | `opacity: 0 → 1` | 200ms ease |
| **Backdrop** | Close | `opacity: 1 → 0` | 200ms ease |
| **Menu Panel** | Open | `x: -100% → 0` (LTR) / `x: 100% → 0` (RTL) | Spring: `MOTION_EASING.spring` |
| **Menu Panel** | Close | `x: 0 → -100%` (LTR) / `x: 0 → 100%` (RTL) | Spring: `MOTION_EASING.spring` |
| **NavItems** | Open | Stagger: `opacity: 0, x: -20 → 1, 0` (LTR) / `x: 20 → 0` (RTL) | `delay: idx × 0.05` |
| **NavItem Hover** | Mouse Enter | `x: ±8` (RTL-aware) | Framer spring |
| **NavItem Tap** | Click | `scale: 0.98` | Framer instant |
| **ThemeSelector** | Open | `opacity: 0, x: -20 → 1, 0` | `delay: 0.3` |
| **Logout/Login** | Hover | `x: ±8` (RTL-aware) | Framer spring |
| **Logout/Login** | Tap | `scale: 0.98` | Framer instant |

### 6.3 Stabile Motion-Konstanten

```jsx
// Module-Level (außerhalb Render)
const BACKDROP_TRANSITION = { duration: 0.2 };
const MENU_SPRING = { type: 'spring', ...MOTION_EASING.spring };
const NAV_HOVER_LTR = { x: 8 };
const NAV_HOVER_RTL = { x: -8 };
const TAP_SCALE = { scale: 0.98 };
```

### 6.4 Reduced Motion (SCSS)

```scss
@include reduced-motion {
  .menu,
  .navItem,
  .navItem::before,
  .navIcon,
  .logoutBtn,
  .loginBtn {
    transition: none;
  }
}
```

### 6.5 Reduced Transparency (a11y)

```scss
@media (prefers-reduced-transparency: reduce) {
  .backdrop {
    background: color-mix(in srgb, var(--bg) 85%, transparent);
  }
  .menu {
    background: var(--surface);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
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
| `nav.logout` | Logout-Button Text | Footer |
| `nav.adminPanel` | Admin-Link Label | Navigation |
| `auth.loginOrRegister` | Login-Button Text | Footer |
| `common.navigation` | `<nav>` + `<aside>` aria-label | Menu |
| `admin.badge` | Admin Badge Text | UserSection |
| `admin.viewerBadge` | Viewer Badge Text | UserSection |

### 7.2 Sprachen

Alle Keys in 4 Sprachen: `de`, `en`, `ar`, `ka` (Georgisch).

---

## 8. RTL-Plan (Arabisch)

### 8.1 Menu-Position

| LTR | RTL |
|-----|-----|
| `left: 0` | `left: auto; right: 0` |
| `border-right: 1px solid var(--glass-border)` | `border-right: none; border-left: 1px solid var(--glass-border)` |

### 8.2 Slide-Direction

```jsx
// LTR: Menu kommt von links
initial={{ x: '-100%' }}
exit={{ x: '-100%' }}

// RTL: Menu kommt von rechts
initial={{ x: '100%' }}
exit={{ x: '100%' }}
```

### 8.3 NavItem Stagger Direction

```jsx
// LTR: Einblenden von links
initial={{ opacity: 0, x: -20 }}

// RTL: Einblenden von rechts
initial={{ opacity: 0, x: 20 }}
```

### 8.4 Hover-Direction

```jsx
// LTR: Hover nach rechts
whileHover={{ x: 8 }}

// RTL: Hover nach links
whileHover={{ x: -8 }}
```

### 8.5 Active Indicator

```scss
// LTR: Linker Rand
.navItem::before { left: 0; border-radius: 0 var(--r-sm) var(--r-sm) 0; }

// RTL: Rechter Rand
:global([dir='rtl']) .navItem::before { left: auto; right: 0; border-radius: var(--r-sm) 0 0 var(--r-sm); }
```

### 8.6 Login/Logout Icon

```scss
// LTR: Icon-Shift rechts
.logoutBtn:hover svg { transform: translateX(4px); }

// RTL: Icon-Shift links
:global([dir='rtl']) .logoutBtn:hover svg { transform: translateX(-4px); }

// Login Button RTL
:global([dir='rtl']) .loginBtn { flex-direction: row-reverse; text-align: right; }
```

### 8.7 Badge-Position

```scss
.avatarBadge { bottom: -6px; right: -6px; }
:global([dir='rtl']) .avatarBadge { right: auto; left: -6px; }
```

---

## 9. Accessibility

### 9.1 Semantik

| Element | Attribut | Wert |
|---------|----------|------|
| `<motion.aside>` | `role` | `"dialog"` (statt aktuell `"navigation"` — korrekter für modale Panels) |
| `<motion.aside>` | `aria-modal` | `"true"` |
| `<motion.aside>` | `aria-label` | `t('common.navigation')` |
| `<motion.div>` (Backdrop) | `aria-hidden` | `"true"` |
| `<nav>` (innerhalb Menu) | `aria-label` | `t('common.navigation')` |

### 9.2 Focus-Trap (NEU)

Wenn `isOpen`:
1. Erster fokussierbarer Element bekommt Focus (Logo-Link oder erster NavItem)
2. Tab/Shift+Tab zykliert innerhalb des Menüs
3. Escape schließt das Menü
4. Nach Schließen: Focus zurück zum Hamburger-Button

### 9.3 Body Scroll Lock

```jsx
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }
}, [isOpen]);
```

### 9.4 Touch Targets

```scss
.navItem, .logoutBtn, .loginBtn {
  min-height: 44px;
}
button { min-height: 0; } // Chrome UA-Fix
```

### 9.5 Focus Management

```scss
@mixin focus-ring {
  &:focus { outline: none; }
  &:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 40%, transparent);
  }
}
```

Alle interaktiven Elemente: `@include focus-ring`.

### 9.6 Reduced Motion

Alle Framer Motion via `shouldAnimate`. CSS Transitions via `@include reduced-motion`.

### 9.7 Reduced Transparency

```scss
@media (prefers-reduced-transparency: reduce) {
  .backdrop { background: color-mix(in srgb, var(--bg) 85%, transparent); }
  .menu { background: var(--surface); backdrop-filter: none; }
}
```

---

## 10. SCSS-Architektur

### 10.1 Imports

```scss
@use '@/styles/mixins' as *;
@use '@/styles/partials/nav-items' as *;  // Shared NavItem-Styles (mit Sidebar geteilt)
```

### 10.2 Pflicht-Regeln (aus Projekt-Design.md)

| Regel | Detail |
|-------|--------|
| Keine Hex/RGBA in Komponenten | Nur `var(--glass-*)`, `var(--tx-*)`, `color-mix()` |
| `-webkit-backdrop-filter` Pflicht | Immer zusammen mit `backdrop-filter` |
| `@supports` Fallback | Für Blur + Glass-BG |
| Blur via Token | `var(--glass-blur-reduced)` und `var(--glass-blur-minimal)` |
| `@include reduced-motion` | Alle Transitions deaktivieren |
| `@include focus-ring` | Alle interaktiven Elemente |

### 10.3 Struktur

```scss
// 1. BACKDROP
.backdrop { ... }

// 2. MENU PANEL
.menu { ... }
:global([dir='rtl']) .menu { ... }

// 3. MENU HEADER
.menuHeader { ... }

// 4. USER SECTION
.userSection { ... }
.userCard { ... }
.userAvatar { ... }
.avatarBadge { ... }
.avatarViewerBadge { ... }
.userInfo { ... }
.userName { ... }
.userEmail { ... }

// 5. NAVIGATION (via Shared Partial)
.nav { ... }
.menuContent { ... }
.navItem { @include nav-item-base; @include nav-item-indicator; ... }
.navIcon { @include nav-icon-base; }
.navLabel { ... }
.adminLink { ... }
.themeSection { ... }

// 6. FOOTER
.menuFooter { ... }
.logoutBtn { ... }
.loginBtn { ... }

// 7. SCROLLBAR
.menu::-webkit-scrollbar { ... }

// 8. RTL OVERRIDES
:global([dir='rtl']) .navItem { ... }
:global([dir='rtl']) .logoutBtn { ... }
:global([dir='rtl']) .loginBtn { ... }
:global([dir='rtl']) .avatarBadge { ... }

// 9. REDUCED MOTION
@include reduced-motion { ... }

// 10. REDUCED TRANSPARENCY
@media (prefers-reduced-transparency: reduce) { ... }
```

---

## 11. Optimierung aller Elemente

Jedes Element des Hamburger-Menüs wird im Neubau einzeln optimiert:

### 11.1 Backdrop

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `black 60%` | `color-mix(in srgb, var(--bg) 60%, transparent)` |
| Blur | Keiner | `backdrop-filter: blur(4px)` (subtil) |
| Reduced Transparency | `black 80%` | `var(--bg) 85%` + kein Blur |

### 11.2 Menu Panel

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `var(--surface)` | `var(--glass-bg)` |
| Blur | Keiner | `var(--glass-blur-reduced)` (16px) / `var(--glass-blur-minimal)` (10px) |
| Border | `var(--border)` | `var(--glass-border)` |
| Shadow | `var(--sh-xl)` | `var(--glass-shadow)` |
| Fallback | Keiner | `@supports not → var(--surface)` |

### 11.3 Menu Header

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `var(--surface-2)` | `var(--glass-bg-hover)` |
| Border | `var(--border)` | `var(--glass-border-light)` (subtiler) |

### 11.4 UserCard

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `var(--surface-2)` | `var(--glass-bg-hover)` |
| Border | `var(--border)` | `var(--glass-border)` |
| Text | Kein Shadow | `@include glass-text` |

### 11.5 Avatar Badges

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Admin BG | `color-mix(--primary 10%, --surface)` | `color-mix(--primary 12%, --glass-bg)` |
| Viewer BG | `color-mix(--warning 10%, --surface)` | `color-mix(--warning 12%, --glass-bg)` |
| Border | `1px solid var(--primary/--warning)` | `1px solid color-mix(--primary/--warning 30%, transparent)` |

### 11.6 NavItems

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Hover-BG | `color-mix(--primary 8%, --surface)` | `var(--glass-bg-hover)` |
| Active Indicator | `--primary` ohne Glow | `--primary` + `var(--glow-sm)` |
| Shared Styles | Duplikat mit Sidebar | `@include nav-item-base` (Shared Partial) |

### 11.7 ThemeSelector Section

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Padding | `padding: 0` | Zusätzlich: `border-top: 1px solid var(--glass-border-light)` möglich |
| Animation | `delay: 0.3` | Beibehalten |

### 11.8 Footer (Menu Footer)

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `var(--surface)` | `transparent` (Menu hat bereits Glass-BG) |
| Border | `var(--border)` | `var(--glass-border-light)` |

### 11.9 Logout-Button

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Background | `var(--surface)` | `transparent` |
| Border | `var(--border)` | `var(--glass-border)` |
| Hover-BG | `color-mix(--error 10%)` | Beibehalten |
| Icon Shift | `translateX(4px)` | Beibehalten + RTL-Mirror |

### 11.10 Login-Button

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Hover | `var(--pri-hover)` | + `box-shadow: var(--glow-md)` |
| RTL | `flex-direction: row-reverse` | Beibehalten |

### 11.11 Scrollbar

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Thumb | `var(--border)` | `var(--glass-border-light)` |
| Thumb Hover | `var(--tx-muted)` | `var(--glass-border)` |

### 11.12 Focus-Trap (NEU)

| Aspekt | Alt | Neu |
|--------|-----|-----|
| Focus-Trap | ❌ Nicht vorhanden | ✅ Vollständiger Focus-Trap |
| Focus Return | ❌ | ✅ Focus zurück zum Hamburger-Button |

---

## 12. Test-Plan

### 12.1 Unit-Tests (NEU — aktuell keine vorhanden)

**Datei:** `src/components/layout/HamburgerMenu/__tests__/HamburgerMenu.test.jsx`

| Test | Beschreibung |
|------|-------------|
| **Render — Open** | Menu rendert Backdrop + Menu Panel mit allen Sektionen |
| **Render — Closed** | `isOpen=false`: Nichts gerendert (AnimatePresence) |
| **Close — Escape** | Escape-Key ruft `onClose` auf |
| **Close — Backdrop Click** | Klick auf Backdrop ruft `onClose` auf |
| **Close — Navigation** | Klick auf NavItem ruft `onClose` nach Navigation auf |
| **Body Scroll Lock** | Open: `body.overflow = 'hidden'`. Close: zurückgesetzt |
| **Navigation — Route** | Klick auf NavItem navigiert zur Route |
| **Navigation — Active** | Aktueller Pfad hat `.active` Klasse |
| **Auth — User angezeigt** | Authentifizierter User: UserCard sichtbar |
| **Auth — Admin Badge** | Admin-Rolle: Badge mit `t('admin.badge')` |
| **Auth — Viewer Badge** | Viewer-Rolle: Badge mit `t('admin.viewerBadge')` |
| **Auth — Admin Link** | Admin/Viewer: Admin-Panel Link sichtbar |
| **Auth — Logout** | Klick auf Logout: `logout()` + `onClose()` aufgerufen |
| **Auth — Guest** | Nicht authentifiziert: Login-Button, kein UserCard |
| **Focus-Trap** | Tab zykliert innerhalb des Menüs |
| **Focus Return** | Nach Close: Focus auf Hamburger-Button |
| **RTL — Slide Direction** | `dir="rtl"`: Menu von rechts |
| **a11y — aria-modal** | `aria-modal="true"` vorhanden |
| **a11y — aria-label** | `aria-label` auf Menu und Nav |
| **Logo — Link** | Logo-Klick navigiert zu `/` und schließt Menü |

### 12.2 E2E-Tests (bestehende erweitern)

| Test | Datei | Beschreibung |
|------|-------|-------------|
| Menu Open/Close | `e2e/navigation.spec.js` | Hamburger-Button öffnet/schließt Menü |
| Mobile Navigation | `e2e/navigation.spec.js` | NavItem-Klick navigiert, Active State |
| Responsive Switch | `e2e/responsive-a11y.spec.js` | Mobile → HamburgerMenu, Desktop → Sidebar |
| Admin-Link on Mobile | `e2e/navigation.spec.js` | Admin-Link im Menü für Admin/Viewer |

---

## 13. Implementierungs-Checkliste

### Phase A: Vorbereitung

- [ ] `frontend-design` Skill lesen
- [ ] `vercel-react-best-practices` Skill lesen
- [ ] Shared `_nav-items.scss` Partial erstellen (wenn nicht bereits durch Sidebar erstellt)
- [ ] Focus-Trap Utility prüfen/erstellen

### Phase B: SCSS

- [ ] `HamburgerMenu.module.scss` komplett neu schreiben
- [ ] Glass-Tokens für Backdrop, Menu, Header, UserCard, NavItems, Footer
- [ ] `@include nav-item-base` + Mixins aus Shared Partial
- [ ] RTL `:global([dir='rtl'])` Selectors
- [ ] `@include reduced-motion` Block
- [ ] `@media (prefers-reduced-transparency: reduce)` Block
- [ ] `@supports not (backdrop-filter)` Fallbacks
- [ ] Scrollbar Glass-themed
- [ ] Safe-area-inset-bottom

### Phase C: JSX

- [ ] `HamburgerMenu.jsx` komplett neu schreiben
- [ ] `AnimatePresence` mit `shouldAnimate` Guards
- [ ] Focus-Trap implementieren
- [ ] Focus-Return nach Close
- [ ] Close-Mechanismen: Escape, Backdrop, Navigation
- [ ] Body Scroll Lock mit Cleanup
- [ ] Stagger-Animation auf NavItems
- [ ] Stabile Motion-Konstanten (Module-Level)
- [ ] `useCallback` auf allen Handlers
- [ ] Auth-Logik: User, Admin, Viewer, Guest States
- [ ] `role="dialog"` statt `role="navigation"` auf `<aside>`

### Phase D: Integration

- [ ] `Header.jsx` prüfen — HamburgerMenu Props unverändert
- [ ] Dashboard-Seite (Mobile): Glass-Blur mit Aurora-Gradient testen
- [ ] Nicht-Dashboard-Seiten (Mobile): Glass-Blur auf `--bg` testen
- [ ] Admin-Bereich (Mobile): HamburgerMenu identisch funktional prüfen
- [ ] iOS Safari: safe-area-inset + dvh testen
- [ ] Android Chrome: UA button min-height fix testen

### Phase E: Tests

- [ ] Unit-Tests schreiben (20 Tests wie oben)
- [ ] E2E-Tests erweitern
- [ ] Visuell testen: Light + Dark Theme, alle 4 Sprachen
- [ ] RTL-Layout visuell prüfen (Arabisch: Menu von rechts)
- [ ] `prefers-reduced-motion` testen (keine Animationen)
- [ ] `prefers-reduced-transparency` testen (opaker Backdrop, kein Blur)
- [ ] `@supports not (backdrop-filter)` Fallback testen

### Phase F: Code Review

- [ ] Keine hardcodierten Farben/Werte
- [ ] Alle Token-Referenzen korrekt
- [ ] Focus-Trap funktioniert korrekt
- [ ] Body Scroll Lock wird immer aufgeräumt (auch bei unmount)
- [ ] Event Listener werden immer aufgeräumt
- [ ] a11y: `role="dialog"`, `aria-modal`, `aria-label` korrekt
- [ ] Build erfolgreich (`npm run build`)
