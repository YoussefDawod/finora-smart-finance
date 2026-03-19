# Footer — Komplett-Neubau (Aurora Flow Glass)

> **⚠️ ABSOLUTES MUSS: KEIN REPAIR — KEIN PATCH — KEIN ERWEITERN.**
> **Jede bestehende Datei wird GELÖSCHT und von NULL NEU GEBAUT.**
> **Wer eine bestehende Zeile „aufwartet" statt neu schreibt, hat die Aufgabe falsch verstanden.**

> **Scope:** Ausschließlich User-Bereich — Admin-Bereich bleibt BEWUSST footer-frei (Clean-Admin-Prinzip)  
> **Design-System:** Aurora Flow Glass — Tokens (`--glass-*`), Mixins, Animations  
> **Ansatz:** 100% Neubau. Keine einzige bestehende Zeile wird wiederverwendet.  
> **Umfang:** Haupt-Footer (7 Komponenten) + MiniFooter (standalone)  
> **Stand:** Überarbeitet & erweitert am 14. März 2026  
> **Implementierung:** Multi-Agent-Architektur — 1 Haupt-Agent koordiniert 5 Fachagenten


---

## Inhaltsverzeichnis

1. [Skills & Richtlinien — PFLICHTLEKTÜRE](#1-skills--richtlinien--pflichtlektüre)
2. [Multi-Agent-Architektur](#2-multi-agent-architektur)
3. [Kritische Regel: NEUBAU — KEIN REPAIR](#3-kritische-regel-neubau--kein-repair)
4. [Bestandsaufnahme — Vollständiger Ist-Zustand](#4-bestandsaufnahme--vollständiger-ist-zustand)
5. [Scope: User-Bereich Only — Admin Bleibt Clean](#5-scope-user-bereich-only--admin-bleibt-clean)
6. [Design-Vision — Aurora Flow Glass Footer](#6-design-vision--aurora-flow-glass-footer)
7. [Komponentenarchitektur (Neubau)](#7-komponentenarchitektur-neubau)
8. [SCSS-Architektur (Neubau)](#8-scss-architektur-neubau)
9. [Responsive Spezifikation](#9-responsive-spezifikation)
10. [Animationen & Motion (Neubau)](#10-animationen--motion-neubau)
11. [i18n-Plan](#11-i18n-plan)
12. [RTL-Plan (Arabisch)](#12-rtl-plan-arabisch)
13. [Accessibility](#13-accessibility)
14. [Detailspezifikation — Jede Komponente](#14-detailspezifikation--jede-komponente)
15. [Test-Plan (Neubau)](#15-test-plan-neubau)
16. [Implementierungs-Checkliste](#16-implementierungs-checkliste)

---

## 1. Skills & Richtlinien — PFLICHTLEKTÜRE

**Alle Agents MÜSSEN diese Skills VOR BEGINN lesen. Keine Ausnahme.**

| Skill | Pfad | Zweck |
|-------|------|-------|
| **frontend-design** | `~/.agents/skills/frontend-design/SKILL.md` | Aurora Flow Ästhetik: dark-first, immersiv, nicht generisch, atmosphärisch. Kein boring AI-Slop. |
| **vercel-react-best-practices** | `~/.agents/skills/vercel-react-best-practices/SKILL.md` | React Performance: `React.memo`, `useCallback`, `useMemo`, Bundle-Splitt, Re-Render-Kontrolle |

### Projekt-Design-Referenz

| Dokument | Pfad | Warum |
|----------|------|-------|
| `Projekt-Design.md` | `./Projekt-Design.md` | Alle Token-Definitionen, Glass-System, Farbregeln, Motion-Regeln, SCSS-Architektur |

### Non-Negotiable-Regeln für alle Agents

1. **Kein Hex oder RGBA direkt in Komponenten-SCSS** — ausschließlich `var(--glass-*)`, `var(--tx-*)`, `color-mix()`
2. **`-webkit-backdrop-filter` immer zusammen mit `backdrop-filter`** — kein Safari-Bug
3. **`@supports not (backdrop-filter: blur(1px))`** Fallback auf jede Glass-Fläche
4. **`shouldAnimate` Guard** auf jeden Framer-Motion-Prop
5. **Keine Inline-Objects in JSX** für Motion-Configs — stabile `const` außerhalb der Komponente
6. **`@include focus-ring`** auf jedes interaktive Element
7. **`@include reduced-motion`** — alle Transitions deaktivieren

---

## 2. Multi-Agent-Architektur

### Übersicht

Die Implementierung wird auf **5 spezialisierte Fachagenten** aufgeteilt. Ein **Haupt-Agent (Koordinator)** überwacht den gesamten Prozess, prüft Abhängigkeiten und stellt die Integration aller Teile sicher.

```
HAUPT-AGENT (Koordinator)
├── Liest diesen Plan vollständig
├── Prüft alle Dateien vor Start (Ist-Zustand-Audit)
├── Koordiniert die 5 Fachagenten in korrekter Reihenfolge
├── Validiert jedes Agenten-Ergebnis (Tests + visuelle Kohärenz)
└── Stellt sicher: 0 Fehler, alle Tests grün, kein Rückfall auf alte Tokens

FACHAGENT 1 — SCSS-Design-Spezialist
├── Zuständig: Footer.module.scss (vollständiger Neubau)
├── Zuständig: MiniFooter.module.scss (vollständiger Neubau)
├── Basis: Glass-Panel-System, Aurora Flow Tokens, Mixins
└── Output: Zwei production-grade SCSS-Dateien, 0 alte Tokens

FACHAGENT 2 — Container & Struktur
├── Zuständig: Footer.jsx (vollständiger Neubau)
├── Zuständig: FooterBrand.jsx (vollständiger Neubau)
├── Zuständig: FooterBottom.jsx (vollständiger Neubau)
├── Zuständig: index.js (prüfen & ggf. aktualisieren)
└── Output: Drei production-grade React-Komponenten

FACHAGENT 3 — Navigation & Social
├── Zuständig: FooterNav.jsx (vollständiger Neubau)
├── Besonderheiten: useMemo für sections, useCallback für handlers
├── Social Icons mit Aurora Glow-Hover, Motion Guards
└── Output: Production-grade Navigation-Komponente

FACHAGENT 4 — Features & Interaktion
├── Zuständig: FooterNewsletter.jsx (vollständiger Neubau)
├── Zuständig: BackToTop.jsx (vollständiger Neubau)
├── Zuständig: LanguageSwitcher.jsx (vollständiger Neubau)
└── Output: Drei production-grade Feature-Komponenten

FACHAGENT 5 — MiniFooter & Tests
├── Zuständig: MiniFooter.jsx (vollständiger Neubau)
├── Zuständig: Alle __tests__/*.test.jsx (vollständiger Neubau)
│   ├── Footer.test.jsx
│   ├── FooterBrand.test.jsx (NEU — existiert bisher nicht)
│   ├── FooterNav.test.jsx
│   ├── FooterNewsletter.test.jsx
│   ├── BackToTop.test.jsx
│   ├── LanguageSwitcher.test.jsx
│   └── MiniFooter.test.jsx (NEU — existiert bisher nicht)
└── Output: Vollständige Test-Suite, alle Tests grün
```

### Reihenfolge der Ausführung

```
Phase 1 (Parallel): Agent 1 (SCSS) + Haupt-Agent (Audit)
Phase 2 (Parallel): Agent 2 + Agent 3 + Agent 4 (Komponenten)
Phase 3:            Agent 5 (MiniFooter + alle Tests)
Phase 4:            Haupt-Agent (Integration + Validierung + Test-Run)
```

### Verantwortlichkeiten des Haupt-Agents

- Plan vollständig lesen vor Delegierung
- Jeden Fachagenten mit exaktem Kontext aus diesem Plan briefen
- Nach jedem Agent: `npx vitest run src/components/layout/Footer` ausführen
- Finale Integration: Footer in `MainLayout.jsx` prüfen (bereits korrekt eingebunden — keine Änderung)
- Admin-Bereich bestätigen: Footer erscheint dort NICHT
- Visuelle Kohärenz aller Komponenten sicherstellen: alle `--glass-*` Tokens, kein `--border` oder `--surface`

---

## 3. Kritische Regel: NEUBAU — KEIN REPAIR

```
╔══════════════════════════════════════════════════════════════════════╗
║  ⛔ KEIN REPAIR. KEIN PATCH. KEIN "VERBESSERN". KEIN ERWEITERN.    ║
║                                                                      ║
║  Jede dieser Dateien wird von NULL NEU GESCHRIEBEN:                 ║
║                                                                      ║
║  • Footer.jsx              • BackToTop.jsx                          ║
║  • FooterBrand.jsx         • LanguageSwitcher.jsx                   ║
║  • FooterNav.jsx           • Footer.module.scss                     ║
║  • FooterNewsletter.jsx    • MiniFooter.jsx                         ║
║  • FooterBottom.jsx        • MiniFooter.module.scss                 ║
║  • Alle __tests__/*.test.jsx                                        ║
║                                                                      ║
║  Der bestehende Code dient NUR als Referenz für:                    ║
║  • Logik-Verhalten (Newsletter-States, Observer-Cleanup)            ║
║  • i18n-Keys (damit keine Übersetzungen brechen)                    ║
║  • Props-API (damit MainLayout.jsx unverändert bleibt)             ║
║                                                                      ║
║  WARUM: Die bestehenden Dateien verwenden --surface, --border,      ║
║  kein Blur, kein Backdrop-Filter, keine Glass-Tokens, keine         ║
║  Aurora-Ästhetik. Das ist fundamental falsch für das Aurora Flow    ║
║  Design-System und kann NICHT „gepatcht" werden.                    ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Was aus dem alten Code BEWAHRT wird (ausschließlich Logik)

| Element | Bewahren | Begründung |
|---------|----------|------------|
| IntersectionObserver in `Footer.jsx` | ✅ | Korrekte Implementierung mit Cleanup |
| Newsletter-Validierungslogik | ✅ | `emailRegex`, Status-Timeout-Logik |
| `LANGUAGES` Array | ✅ | `['de', 'en', 'ar', 'ka']` |
| `useCookieConsent` + `reopenNotice` | ✅ | Funktional korrekt |
| Social-Links-Konstante (URLs + Keys) | ✅ | Korrekte externe URLs |
| Props-Signatur `Footer({ isCollapsed, isMobile })` | ✅ | `MainLayout.jsx` Kompatibilität |
| Alle i18n-Keys | ✅ | Keine Übersetzungen brechen |

### Was NICHT übernommen wird

| Element | Verwerfen | Grund |
|---------|-----------|-------|
| `background: var(--surface)` am Footer | ❌ | Muss Glass-Surface sein |
| `border-top: 1px solid var(--border)` | ❌ | Muss `--glass-border` sein |
| Kein `backdrop-filter` | ❌ | Glass-Effekt ist Pflicht |
| `background: var(--bg)` am Input | ❌ | Muss glass-themed sein |
| `@use '@/styles/variables' as *` | ❌ | Nicht benötigt (Glass = CSS Custom Properties) |
| `background: color-mix(--primary 8%, transparent)` am navTitle | ❌ | Basis falsch (`--glass-bg` nötig) |
| Flacher `--primary`-Hintergrund am BackToTop | ❌ | Muss Glass-first sein |
| `border: 1px solid var(--border)` an langPill | ❌ | Muss `--glass-border` sein |
| `MiniFooter` ohne Blur | ❌ | Muss Glass-Surface sein |

---

## 4. Bestandsaufnahme — Vollständiger Ist-Zustand

**Status: Vollständig auditiert am 14. März 2026 — vor Implementierungsstart**

### 4.1 Datei-Inventar

| Datei | Pfad | ca. Zeilen | Zustand |
|-------|------|-----------|---------|
| `Footer.jsx` | `src/components/layout/Footer/Footer.jsx` | 60 | Logik OK, Styling-Klassen ersetzen |
| `FooterBrand.jsx` | `src/components/layout/Footer/FooterBrand.jsx` | 20 | Zu simpel, kein Glass |
| `FooterNav.jsx` | `src/components/layout/Footer/FooterNav.jsx` | 110 | Kein `useMemo`, Social ohne Glow |
| `FooterNewsletter.jsx` | `src/components/layout/Footer/FooterNewsletter.jsx` | 120 | Logik OK, kein Glass-Input, kein `role="alert"` |
| `FooterBottom.jsx` | `src/components/layout/Footer/FooterBottom.jsx` | 50 | Zu simpel |
| `BackToTop.jsx` | `src/components/layout/Footer/BackToTop.jsx` | 50 | Logik OK, flaches Primary-Design |
| `LanguageSwitcher.jsx` | `src/components/layout/Footer/LanguageSwitcher.jsx` | 40 | Logik OK, `--border` Pills |
| `Footer.module.scss` | `src/components/layout/Footer/Footer.module.scss` | 650 | Komplett falsche Tokens |
| `MiniFooter.jsx` | `src/components/common/MiniFooter/MiniFooter.jsx` | 30 | Zu simpel, kein Glass |
| `MiniFooter.module.scss` | `src/components/common/MiniFooter/MiniFooter.module.scss` | 45 | `--border`, kein Blur |
| `index.js` | `src/components/layout/Footer/index.js` | — | Prüfen |

### 4.2 Test-Inventar

| Test-Datei | Existiert | Zustand |
|------------|-----------|---------|
| `__tests__/Footer.test.jsx` | ✅ | Vollständig neu schreiben |
| `__tests__/FooterNav.test.jsx` | ✅ | Vollständig neu schreiben |
| `__tests__/FooterNewsletter.test.jsx` | ✅ | Vollständig neu schreiben |
| `__tests__/BackToTop.test.jsx` | ✅ | Vollständig neu schreiben |
| `__tests__/LanguageSwitcher.test.jsx` | ✅ | Vollständig neu schreiben |
| `__tests__/FooterBrand.test.jsx` | ❌ | NEU erstellen |
| `common/MiniFooter/__tests__/MiniFooter.test.jsx` | ❌ | NEU erstellen |

### 4.3 Einbindung im Layout (auditiert)

| Layout | Footer eingebunden | Soll-Zustand | Maßnahme |
|--------|--------------------|--------------|----------|
| `MainLayout.jsx` | ✅ (Zeile 8 + JSX) | ✅ User-Bereich | **KEINE Änderung** |
| `AdminLayout.jsx` | ❌ | ❌ footer-frei | **KEINE Änderung** |
| Auth-Seiten | `MiniFooter` | ✅ MiniFooter | MiniFooter neu bauen |

### 4.4 Konkrete Design-Defizite (vollständig, mit Zeilennummern)

| Nr. | Datei + Zeile | Problem | Schweregrad |
|-----|--------------|---------|-------------|
| 1 | `Footer.module.scss:21` | `background: var(--surface)` | 🔴 Kritisch |
| 2 | `Footer.module.scss:22` | `border-top: 1px solid var(--border)` | 🔴 Kritisch |
| 3 | `Footer.module.scss` | Kein `backdrop-filter` — Footer hat keine Tiefe | 🔴 Kritisch |
| 4 | `Footer.module.scss` | Kein Upward Shadow | 🟠 Hoch |
| 5 | `Footer.module.scss:190` | `background: color-mix(--primary 8%, transparent)` — Basis falsch | 🟠 Hoch |
| 6 | `Footer.module.scss:126` | `background: var(--border)` Divider | 🟠 Hoch |
| 7 | `Footer.module.scss:415` | `background: var(--bg)` am Newsletter-Input | 🟠 Hoch |
| 8 | `Footer.module.scss:535` | `background: var(--primary)` BackToTop — flach | 🟠 Hoch |
| 9 | `Footer.module.scss:495` | `border: 1px solid var(--border)` langPill | 🟡 Mittel |
| 10 | `FooterNav.jsx` | Kein `useMemo` für `sections` Array | 🟡 Mittel |
| 11 | `FooterNav.jsx` | Social Icons ohne `filter: drop-shadow` Glow | 🟡 Mittel |
| 12 | `MiniFooter.module.scss:13` | `border-top: 1px solid var(--border)` | 🟠 Hoch |
| 13 | `MiniFooter.module.scss` | Kein Glass, kein Blur | 🔴 Kritisch |
| 14 | `FooterNewsletter.jsx` | Kein `role="alert"` auf Status-Meldungen | 🟡 Mittel |

---

## 5. Scope: User-Bereich Only — Admin Bleibt Clean

```
╔══════════════════════════════════════════════════════════════════════╗
║  FOOTER-SCOPE — VERBINDLICHE REGEL                                  ║
║                                                                      ║
║  ✅ MainLayout.jsx (User-Bereich) — Footer mit allen Features       ║
║  ✅ Auth-Seiten (Login, Register, Reset) — MiniFooter               ║
║                                                                      ║
║  ❌ AdminLayout.jsx — KEIN Footer, KEINE Änderung dort              ║
║                                                                      ║
║  BEGRÜNDUNG: Der Admin-Bereich folgt dem „Clean Admin"-Prinzip.     ║
║  Admins brauchen keinen Newsletter, keine Social-Links und keinen   ║
║  Language-Switcher im Footer. Das ist eine bewusste UX-Entscheidung ║
║  für fokussierte, ablenkungsfreie Admin-Oberflächen.                ║
╚══════════════════════════════════════════════════════════════════════╝
```

**Maßnahme:** `MainLayout.jsx` und `AdminLayout.jsx` werden **nicht angefasst**. Der Footer ist bereits ausschließlich in `MainLayout.jsx` eingebunden.

---

## 6. Design-Vision — Aurora Flow Glass Footer

### 6.1 Konzeptuelle Richtung: Die Atmosphärische Landezone

Der Footer ist **nicht** ein langweiliger Abschluss einer Seite. Er ist eine **atmosphärische Landezone** — eine Fläche, auf der der Nutzer beim Scrollen ankommt und sich wohlfühlt. Der Aurora-Gradient der Seite schimmert durch das Frosted-Glass hindurch. Das erzeugt echte Tiefe, echtes Material, echtes Design.

**Was den Footer unvergesslich macht:**
- **Blur durch den Aurora-Hintergrund** — der Gradient leuchtet durch die Glassfläche
- **Upward Glow-Shadow** — kein harter `border-top`, sondern warmes Licht von unten
- **Aurora-Tinted Brand-Zone** — der oberste Bereich hat einen subtilen `--primary`-Gradient von links
- **Social Icons die leuchten** — GitHub/LinkedIn strahlen `--primary` Glow auf Hover aus
- **BackToTop als Juwel** — ein Glas-Kreis, der auf Hover von transparent zu `--primary` wechselt
- **Newsletter als eingebettete Glass-Card** — ein sekundärer Glass-Layer im Footer

### 6.2 Footer Root Surface

```scss
.footer {
  background: color-mix(in srgb, var(--primary) 3%, color-mix(in srgb, var(--bg) 78%, transparent));
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-top: 1px solid var(--glass-border);
  box-shadow: 0 -8px 48px color-mix(in srgb, var(--primary) 6%, color-mix(in srgb, black 20%, transparent));

  @supports not (backdrop-filter: blur(1px)) {
    background: var(--surface);
  }
}
```

### 6.3 Brand-Zone — Aurora-Akzent-Gradient

```scss
.brand {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--primary) 5%, transparent) 0%,
    transparent 60%
  );
  border-bottom: 1px solid var(--glass-border-light);
}
.brandDescription { @include glass-text; }
```

### 6.4 NavTitle — Glass-Badge mit Primary-Border

```scss
.navTitle {
  background: color-mix(in srgb, var(--primary) 10%, var(--glass-bg));
  border: 1px solid var(--glass-border);
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: var(--ls-wider);
}
```

### 6.5 Social Icons — Aurora Glow auf Hover

```scss
.socialIcon {
  color: var(--tx-muted);
  transition: color var(--tr-fast), filter var(--tr-fast), transform var(--tr-fast);

  &:hover {
    color: var(--primary);
    filter: drop-shadow(0 0 8px color-mix(in srgb, var(--primary) 60%, transparent));
    transform: translateY(-2px);
  }
}
```

### 6.6 Newsletter — Nested Glass-Card

```scss
.newsletterWrap {
  position: relative;
  background: color-mix(in srgb, var(--glass-bg) 50%, transparent);
  border: 1px solid var(--glass-border-light);
  border-radius: var(--r-lg);
  padding: var(--space-md) var(--space-lg);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    backdrop-filter: blur(calc(var(--glass-blur) * 0.5));
    -webkit-backdrop-filter: blur(calc(var(--glass-blur) * 0.5));
    border-radius: inherit;
    pointer-events: none;
    z-index: 0;
  }

  > * { position: relative; z-index: 1; }
}

.newsletterInput {
  background: color-mix(in srgb, var(--glass-bg) 60%, transparent);
  border: 1px solid var(--glass-border);

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
  }
}

.newsletterButton {
  background: var(--primary);
  color: var(--on-primary);

  &:hover:not(:disabled) {
    box-shadow: var(--glow-sm);
    transform: translateY(-1px);
  }
}
```

### 6.7 LanguageSwitcher — Glass Pills

```scss
.langPill {
  border: 1px solid var(--glass-border);
  background: transparent;

  &:hover {
    background: color-mix(in srgb, var(--primary) 8%, transparent);
    border-color: var(--primary);
    color: var(--primary);
  }
}

.langPillActive {
  background: var(--primary);
  color: var(--on-primary);
  border-color: var(--primary);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--primary) 30%, transparent);
}
```

### 6.8 BackToTop — Glass-Jewel

```scss
.backToTop {
  position: fixed;
  background: color-mix(in srgb, var(--glass-bg-hover) 90%, var(--primary) 10%);
  border: 1px solid var(--glass-border);
  color: var(--primary);
  box-shadow: var(--glass-shadow);
  border-radius: var(--r-full);
  overflow: hidden;

  // ::before für Blur — verhindert Framer Motion Stacking-Context-Problem
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border-radius: inherit;
    pointer-events: none;
    z-index: 0;
  }

  > * { position: relative; z-index: 1; }

  &:hover {
    background: var(--primary);
    color: var(--on-primary);
    box-shadow: var(--glow-md);
    border-color: var(--primary);
  }
}
```

### 6.9 MiniFooter — Standalone Glass Strip

```scss
.miniFooter {
  background: color-mix(in srgb, var(--glass-bg) 70%, transparent);
  backdrop-filter: blur(var(--glass-blur-minimal));
  -webkit-backdrop-filter: blur(var(--glass-blur-minimal));
  border-top: 1px solid var(--glass-border-light);

  @supports not (backdrop-filter: blur(1px)) {
    background: var(--surface);
  }
}
```

---

## 7. Komponentenarchitektur (Neubau)

### 7.1 Verzeichnisstruktur nach Neubau

```
src/components/layout/Footer/
├── Footer.jsx                  ← NEUBAU: Container + IntersectionObserver
├── FooterBrand.jsx             ← NEUBAU: Logo + Aurora-Akzent
├── FooterNav.jsx               ← NEUBAU: 4-Spalten + useMemo + Glow-Icons
├── FooterNewsletter.jsx        ← NEUBAU: Glass-Card + DSGVO + role="alert"
├── FooterBottom.jsx            ← NEUBAU: Bottom-Zone-Wrapper
├── BackToTop.jsx               ← NEUBAU: Glass-Jewel + AnimatePresence
├── LanguageSwitcher.jsx        ← NEUBAU: Glass Pills
├── Footer.module.scss          ← NEUBAU: 100% Glass-Tokens
├── index.js                    ← prüfen
└── __tests__/
    ├── Footer.test.jsx         ← NEUBAU
    ├── FooterBrand.test.jsx    ← NEU ERSTELLEN
    ├── FooterNav.test.jsx      ← NEUBAU
    ├── FooterNewsletter.test.jsx ← NEUBAU
    ├── BackToTop.test.jsx      ← NEUBAU
    └── LanguageSwitcher.test.jsx ← NEUBAU

src/components/common/MiniFooter/
├── MiniFooter.jsx              ← NEUBAU
├── MiniFooter.module.scss      ← NEUBAU
└── __tests__/
    └── MiniFooter.test.jsx     ← NEU ERSTELLEN
```

### 7.2 Komponenten-Hierarchie

```
Footer (Container)
├── FooterBrand     (Zone 1)
├── FooterNav       (Zone 2)
│   ├── sections: useMemo([company, product, resources, legal])
│   ├── handlePrivacyNotice: useCallback(() => reopenNotice())
│   └── SOCIAL_LINKS: motion.a + shouldAnimate Guards
├── FooterBottom    (Zone 3)
│   ├── FooterNewsletter
│   │   ├── Glass-Input-Card (::before blur)
│   │   ├── Consent-Checkbox (Checkbox-Komponente)
│   │   └── Status: motion.p + role="alert"
│   └── LanguageSwitcher
│       └── Glass Pills + aria-current
└── BackToTop
    └── AnimatePresence + Glass-Jewel (::before blur)

MiniFooter (standalone)
└── Glass-Strip + Links + aria-hidden Divider
```

### 7.3 Performance-Optimierungen

| Komponente | Techniken |
|------------|-----------|
| `Footer` | `React.memo` |
| `FooterBrand` | `React.memo`, keine Props |
| `FooterNav` | `React.memo`, `useMemo` für `sections`, `useCallback` für `handlePrivacyNotice` |
| `FooterNewsletter` | `React.memo`, `useCallback` für `handleSubmit`, `useMemo` für `statusConfig` |
| `FooterBottom` | `React.memo`, keine Props |
| `BackToTop` | `React.memo`, `useCallback` für `scrollToTop` |
| `LanguageSwitcher` | `React.memo`, `useCallback` für `handleChange` |
| `MiniFooter` | `React.memo`, keine Props |
| Alle | Keine Inline-Objects in JSX für Motion-Configs |
| IntersectionObserver | Disconnect im Cleanup, `footerRef.current` sichern |

### 7.4 Props-API (unverändert — MainLayout-Kompatibilität)

```jsx
const Footer = ({ isCollapsed = false, isMobile = false }) => { ... }
// BackToTop
function BackToTop({ visible }) { ... }
BackToTop.propTypes = { visible: PropTypes.bool.isRequired };
```

---

## 8. SCSS-Architektur (Neubau)

### 8.1 Imports

```scss
// Footer.module.scss — NUR dieser Import
@use '@/styles/mixins' as *;
// KEIN @use '@/styles/variables' as * — Glass-Tokens sind CSS Custom Properties
```

### 8.2 Footer.module.scss Vollstruktur

```scss
// ============================================
// FOOTER — AURORA FLOW GLASS (NEUBAU)
// ============================================
@use '@/styles/mixins' as *;

// ── 1. FOOTER ROOT ────────────────────────────
.footer { }           // Glass BG, blur, upward shadow, glass-border top
.footer.sidebarExpanded { }
.footer.sidebarCollapsed { }

// ── 2. CONTAINER ──────────────────────────────
.container { }

// ── 3. ZONE 1: BRAND ──────────────────────────
.brand { }            // Aurora-Akzent-Gradient, glass-border-light bottom
.brandLogo { }
.brandDescription { } // @include glass-text

// ── 4. ZONE 2: NAVIGATION ─────────────────────
.navGrid { }
.navSection { }       // ::before = glass-border-light divider
.navTitle { }         // Glass-Badge, --primary color + border
.navLinks { }
.navLink { }          // hover: --primary, focus-ring
.socialIcons { }
.socialIcon { }       // hover: --primary + drop-shadow glow

// ── 5. ZONE 3: BOTTOM ─────────────────────────
.bottom { }           // glass-border-light top
.bottomRow { }
.copyrightRow { }
.copyright { }        // @include glass-text
.copyrightDivider { }
.copyrightLink { }    // focus-ring
.rights { }

// ── 6. NEWSLETTER GLASS CARD ──────────────────
.newsletterWrap { }   // Nested Glass-Panel, ::before blur, overflow: hidden
.newsletterTitle { }
.newsletterSubtitle { }
.newsletterForm { }
.newsletterRow { }
.inputWrapper { }
.inputIcon { }
.newsletterInput { }  // glass-bg, glass-border, focus: primary glow
.newsletterButton { } // primary, hover: glow-sm + translateY(-1px)
.newsletterSuccess { }
.newsletterError { }

// ── 7. LANGUAGE SWITCHER ──────────────────────
.langSwitcher { }
.langPill { }         // glass-border, hover: primary-tint + border
.langPillActive { }   // primary bg, on-primary text

// ── 8. BACK TO TOP ────────────────────────────
.backToTop { }        // Glass-Jewel, ::before blur, hover: primary fill

// ── 9. RTL OVERRIDES ──────────────────────────
:global([dir='rtl']) .footer { }
:global([dir='rtl']) .inputIcon { }
:global([dir='rtl']) .newsletterInput { }
:global([dir='rtl']) .backToTop { }

// ── 10. REDUCED MOTION ────────────────────────
@include reduced-motion { ... }
```

### 8.3 MiniFooter.module.scss Struktur

```scss
// ============================================
// MINI FOOTER — AURORA FLOW GLASS (NEUBAU)
// ============================================
@use '@/styles/mixins' as *;

.miniFooter { }   // glass-bg 70%, blur-minimal, glass-border-light top, @supports fallback
.link { }         // tx-muted, hover: primary, focus-ring
.divider { }      // glass-border color, user-select: none

@include reduced-motion { .link { transition: none; } }
```

---

## 9. Responsive Spezifikation

### 9.1 Breakpoints

| Viewport | Footer-Layout | Blur |
|----------|--------------|------|
| Desktop ≥ 1024px | 4-Spalten NavGrid, sidebar-aware | `var(--glass-blur)` = 28px |
| Tablet 768–1023px | 2-Spalten NavGrid | `var(--glass-blur-reduced)` = 16px |
| Mobile < 640px | 1-Spalte, zentriert | `var(--glass-blur-minimal)` = 10px |

### 9.2 NavGrid

```scss
.navGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  column-gap: var(--space-xl);

  @include tablet { grid-template-columns: repeat(2, 1fr); column-gap: var(--space-lg); row-gap: var(--space-lg); }
  @include mobile { grid-template-columns: 1fr; gap: 0; }
}
```

### 9.3 NavSection Divider

```scss
.navSection {
  position: relative;
  padding-left: var(--space-xl);

  &::before { /* glass-border-light vertikale Linie */ }
  &:first-child { padding-left: 0; &::before { display: none; } }

  @include tablet {
    &:nth-child(2n + 1) { padding-left: 0; &::before { display: none; } }
    &:nth-child(2n) { padding-left: var(--space-lg); }
  }

  @include mobile {
    padding-left: 0;
    border-bottom: 1px solid var(--glass-border-light);
    &::before { display: none; }
    &:last-child { border-bottom: none; }
  }
}
```

### 9.4 Blur Responsive

```scss
.footer {
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));

  @include tablet {
    backdrop-filter: blur(var(--glass-blur-reduced));
    -webkit-backdrop-filter: blur(var(--glass-blur-reduced));
  }

  @include mobile {
    backdrop-filter: blur(var(--glass-blur-minimal));
    -webkit-backdrop-filter: blur(var(--glass-blur-minimal));
  }
}
```

### 9.5 BottomRow

```scss
.bottomRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-xl);

  @include mobile { flex-direction: column; align-items: stretch; gap: var(--space-lg); }
}
```

### 9.6 Newsletter

```scss
.newsletterWrap { max-width: 28rem; @include tablet { max-width: 100%; } }
.newsletterRow { display: flex; gap: var(--space-xs); @include mobile { flex-direction: column; } }
.newsletterButton { @include mobile { width: 100%; } }
```

### 9.7 Brand

```scss
.brand {
  display: flex; align-items: center; gap: var(--space-lg);
  @include mobile { flex-direction: column; text-align: center; }
}
.brandLogo { height: 2.5rem; @include mobile { height: 2rem; } }
```

### 9.8 Copyright

```scss
.copyrightRow {
  display: flex; align-items: center; justify-content: center; gap: var(--space-xs);
  @include below-lg { flex-direction: column; gap: var(--space-3xs); }
}
.copyrightDivider { @include below-lg { display: none; } }
```

### 9.9 BackToTop

```scss
.backToTop {
  position: fixed;
  bottom: var(--space-2xl); right: var(--space-2xl);
  width: 2.75rem; height: 2.75rem;

  @include mobile { bottom: var(--space-lg); right: var(--space-lg); width: 2.5rem; height: 2.5rem; }
}
```

---

## 10. Animationen & Motion (Neubau)

### 10.1 `useMotion()` Hook — Pflicht

```jsx
const { shouldAnimate } = useMotion();
// Jeder Framer-Motion-Prop braucht diesen Guard:
initial={shouldAnimate ? BTT_INITIAL : false}
```

**Komponenten mit Motion:** `FooterNav` (Social Icons), `BackToTop`, `FooterNewsletter` (Status)

### 10.2 Alle Motion-Konstanten — Außerhalb der Komponente

```jsx
// FooterNav.jsx
const SOCIAL_HOVER = { scale: 1.05, y: -2 };
const SOCIAL_TAP   = { scale: 0.95 };

// BackToTop.jsx
const BTT_INITIAL    = { opacity: 0, scale: 0.8 };
const BTT_ANIMATE    = { opacity: 1, scale: 1 };
const BTT_EXIT       = { opacity: 0, scale: 0.8 };
const BTT_HOVER      = { scale: 1.05 };
const BTT_TAP        = { scale: 0.95 };
const BTT_TRANSITION = { type: 'spring', stiffness: 400, damping: 25 };

// FooterNewsletter.jsx
const STATUS_INITIAL    = { opacity: 0, y: -8 };
const STATUS_ANIMATE    = { opacity: 1, y: 0 };
const STATUS_TRANSITION = { duration: 0.2 };
```

### 10.3 Animation-Specs

| Element | Trigger | Effekt | Konfiguration |
|---------|---------|--------|----------------|
| BackToTop Enter | Footer sichtbar | `opacity: 0, scale: 0.8 → 1, 1` | AnimatePresence, Spring |
| BackToTop Exit | Footer nicht sichtbar | `opacity: 1, scale: 1 → 0, 0.8` | AnimatePresence |
| BackToTop Hover | Mouse Enter | `scale: 1.05` | Spring |
| BackToTop Tap | Click | `scale: 0.95` | Instant |
| Social Hover | Mouse Enter | `scale: 1.05, y: -2` | Spring |
| Social Tap | Click | `scale: 0.95` | Instant |
| Newsletter Status | Status-Change | `opacity: 0, y: -8 → 1, 0` | 200ms ease |

### 10.4 Stacking Context — BackToTop (kritisch)

`AnimatePresence` + Framer Motion `scale` erzeugt einen neuen Compositor Layer für `motion.button`. `backdrop-filter` direkt auf dem Element würde kein echtes Hintergrund sehen. **Lösung (bewährt aus UserMenu):** `backdrop-filter` in `::before` Pseudo-Element mit `z-index: 0`, alle Kinder via `> * { position: relative; z-index: 1; }`.

### 10.5 Reduced Motion

```scss
@include reduced-motion {
  .footer { transition: none; }
  .socialIcon { transition: none; &:hover { transform: none; } }
  .navLink, .copyrightLink, .newsletterInput,
  .newsletterButton, .langPill, .backToTop { transition: none; }
  .newsletterButton:hover { transform: none; }
}
```

---

## 11. i18n-Plan

### 11.1 Alle bestehenden Keys — unverändert beibehalten

**Brand:**
`footer.brand.description`

**Navigation:**
`footer.sections.company`, `footer.sections.product`, `footer.sections.resources`, `footer.sections.legal`
`footer.links.about`, `footer.links.contact`, `footer.links.blog`, `footer.links.features`, `footer.links.pricing`, `footer.links.help`, `footer.links.faq`
`footer.impressum`, `footer.terms`, `footer.privacy`, `footer.privacyNotice`
`footer.social.ariaGithub`, `footer.social.ariaLinkedin`

**Bottom:**
`footer.newsletter.title`, `footer.newsletter.subtitle`, `footer.newsletter.placeholder`, `footer.newsletter.button`
`footer.newsletter.success`, `footer.newsletter.emailRequired`, `footer.newsletter.error`, `footer.newsletter.serverError`, `footer.newsletter.consentRequired`, `footer.newsletter.consent`
`footer.allRightsReserved`, `footer.backToTop`
`footer.languageSwitcher.label`, `footer.languageSwitcher.de`, `footer.languageSwitcher.en`, `footer.languageSwitcher.ar`, `footer.languageSwitcher.ka`

**MiniFooter:**
`miniFooter.ariaLabel`, `miniFooter.home`, `footer.impressum`, `footer.privacy`, `footer.terms`

### 11.2 Sprachen

Alle Keys in 4 Sprachen implementiert: `de`, `en`, `ar`, `ka`. **Keine neuen Keys** erforderlich.

---

## 12. RTL-Plan (Arabisch)

### 12.1 Footer Padding

```scss
:global([dir='rtl']) .footer {
  transition: padding-right var(--tr);
  padding-left: var(--space-lg);

  &.sidebarExpanded {
    padding-left: var(--space-lg);
    padding-right: calc(var(--sidebar-width, 280px) + var(--space-lg));
  }

  &.sidebarCollapsed {
    padding-left: var(--space-lg);
    padding-right: calc(var(--sidebar-collapsed-width, 72px) + var(--space-lg));
  }
}
```

### 12.2 Newsletter Input Icon

```scss
.inputIcon {
  left: var(--space-sm);
  :global([dir='rtl']) & { left: auto; right: var(--space-sm); }
}

.newsletterInput {
  padding-left: calc(var(--space-sm) * 2.5);
  :global([dir='rtl']) & {
    padding-left: var(--space-sm);
    padding-right: calc(var(--space-sm) * 2.5);
  }
}
```

### 12.3 BackToTop Position

```scss
.backToTop {
  right: var(--space-2xl);
  :global([dir='rtl']) & {
    right: auto;
    left: var(--space-2xl);
    @include mobile { left: var(--space-lg); }
  }
}
```

### 12.4 Grid + Dividers

CSS Grid spiegelt das Layout bei `dir="rtl"` automatisch. Die `::before` Pseudo-Elemente der NavSections benötigen keine RTL-Overrides.

---

## 13. Accessibility

### 13.1 Semantische Attribute

| Element | Attribut | Wert |
|---------|----------|------|
| `<footer>` | implizit | `role="contentinfo"` — **NICHT explizit setzen** (redundant) |
| `<nav>` in FooterNav | — | implizit durch `<nav>` Element |
| `<nav>` in MiniFooter | `aria-label` | `t('miniFooter.ariaLabel')` |
| Social Links | `target` | `"_blank"` |
| Social Links | `rel` | `"noopener noreferrer"` |
| Social Links | `aria-label` | je Key |
| LanguageSwitcher | `role` | `"group"` |
| LanguageSwitcher | `aria-label` | `t('footer.languageSwitcher.label')` |
| Aktive Sprache | `aria-current` | `"true"` |
| Newsletter Input | `type` | `"email"` |
| Newsletter Input | `aria-label` | `t('footer.newsletter.placeholder')` |
| Newsletter Status | `role` | **`"alert"`** (Verbesserung gegenüber alt) |
| BackToTop | `aria-label` + `title` | `t('footer.backToTop')` |
| MiniFooter Divider-Spans | `aria-hidden` | `"true"` |

### 13.2 Focus Management

`@include focus-ring` auf: `.navLink`, `.socialIcon`, `.langPill`, `.newsletterInput`, `.newsletterButton`, `.copyrightLink`, `.backToTop`, MiniFooter `.link`

### 13.3 External Links Security

Alle `target="_blank"` haben `rel="noopener noreferrer"` (XSS-Schutz + Performance).

---

## 14. Detailspezifikation — Jede Komponente

### 14.1 Footer.jsx (Agent 2)

**Logik:** IntersectionObserver steuert `BackToTop` via `visible` Prop. Sidebar-Klassen werden auf Basis von `isMobile` und `isCollapsed` berechnet.

```jsx
const footerClass = isMobile
  ? styles.footer
  : `${styles.footer} ${isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`;
```

**Besonderheit:** `role="contentinfo"` ist durch `<footer>` implizit — NICHT explizit setzen.

### 14.2 FooterBrand.jsx (Agent 2)

Logo mit `app-logo` Klasse (für Theme-Switching) + Brand-Beschreibung mit `glass-text` Mixin.

### 14.3 FooterNav.jsx (Agent 3)

**`sections` mit `useMemo`** — dependencies: `[t, handlePrivacyNotice]`

Alle Social Icons als `motion.a` mit externen URLs, `target="_blank"`, `rel="noopener noreferrer"` und `aria-label`. Framer Motion Props mit `shouldAnimate` Guard.

### 14.4 FooterNewsletter.jsx (Agent 4)

**Status-Meldungen zwingend mit `role="alert"`** — Screenreader-Accessibility.

```jsx
{status && statusConfig[status] && (
  <motion.p
    role="alert"
    className={statusConfig[status].className}
    initial={shouldAnimate ? STATUS_INITIAL : false}
    animate={shouldAnimate ? STATUS_ANIMATE : false}
    transition={STATUS_TRANSITION}
  >
    {t(statusConfig[status].key)}
  </motion.p>
)}
```

`statusConfig` als `useMemo`. `handleSubmit` als `useCallback`. Email-Regex lokal im `handleSubmit` ist akzeptabel.

### 14.5 BackToTop.jsx (Agent 4)

Alle Motion-Konstanten außerhalb der Komponente. `BTT_TRANSITION` als Spring-Config für natürliche Physik. Glass-Jewel-Design mit `::before` Blur Pattern (Anti-Stacking-Context).

### 14.6 LanguageSwitcher.jsx (Agent 4)

```jsx
const LANGUAGES = ['de', 'en', 'ar', 'ka'];  // außerhalb der Komponente
```

`handleChange` mit `useCallback`, dependencies: `[i18n]`.

### 14.7 MiniFooter.jsx (Agent 5)

Standalone `<nav>` — kein Brand, kein Newsletter. Vier Links: Home, Impressum, Privacy, Terms. Divider `·` mit `aria-hidden="true"`.

---

## 15. Test-Plan (Neubau)

**Alle bestehenden Test-Dateien werden vollständig neu geschrieben. FooterBrand.test.jsx und MiniFooter.test.jsx werden neu erstellt.**

### 15.1 Mock-Setup (Standard für alle Footer-/MiniFooter-Tests)

```jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Framer Motion Mock
const MOTION_PROPS = new Set([
  'whileHover', 'whileTap', 'whileFocus', 'whileInView', 'whileDrag',
  'initial', 'animate', 'exit', 'transition', 'variants', 'layout', 'layoutId',
]);
vi.mock('framer-motion', () => {
  const motion = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'create') return (Component) => Component;
      return ({ children, ...props }) => {
        const htmlProps = Object.fromEntries(
          Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)),
        );
        return React.createElement(typeof prop === 'string' ? prop : 'div', htmlProps, children);
      };
    },
  });
  return { __esModule: true, motion, AnimatePresence: ({ children }) => <>{children}</> };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'de', dir: () => 'ltr', changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey }) => <span>{i18nKey}</span>,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('@/hooks/useMotion', () => ({ useMotion: () => ({ shouldAnimate: false }) }));

vi.mock('@/hooks/useCookieConsent', () => ({
  useCookieConsent: () => ({
    noticeSeen: true, showNotice: false,
    dismissNotice: vi.fn(), reopenNotice: vi.fn(), closeNotice: vi.fn(),
  }),
}));

vi.mock('@/api/client', () => ({ default: { post: vi.fn() } }));
vi.mock('@/api/endpoints', () => ({
  ENDPOINTS: { newsletter: { subscribe: '/newsletter/subscribe' } },
}));
```

### 15.2 Footer.test.jsx

```
describe('Footer')
  ├── rendert <footer>
  ├── rendert ohne Props (Default-Werte)
  ├── erstellt IntersectionObserver
  ├── observiert Footer-Element
  ├── disconnected Observer beim Unmount
  ├── Sidebar-Klassen
  │   ├── isMobile=false, isCollapsed=false → sidebarExpanded
  │   ├── isMobile=false, isCollapsed=true → sidebarCollapsed
  │   └── isMobile=true → keine sidebar-Klasse
  ├── rendert FooterBrand (Logo vorhanden)
  ├── rendert FooterNav (nav Element vorhanden)
  ├── rendert Copryight-Text
  └── BackToTop erscheint nach IntersectionObserver-Callback
```

### 15.3 FooterBrand.test.jsx (NEU)

```
describe('FooterBrand')
  ├── rendert Logo mit alt="Finora"
  ├── Logo hat CSS-Klasse app-logo
  └── rendert Brand-Description-Text
```

### 15.4 FooterNav.test.jsx

```
describe('FooterNav')
  ├── Navigation-Links: alle 4 Sektions-Titel
  ├── Company-Links: About, Contact, Blog vorhanden
  ├── Product-Links: Features, Pricing vorhanden
  ├── Resources-Links: Help, FAQ vorhanden
  ├── Legal-Links: Impressum, AGB, Datenschutz, Datenschutzhinweis vorhanden
  ├── Social Icons
  │   ├── GitHub-Link mit korrekter URL
  │   ├── LinkedIn-Link mit korrekter URL
  │   ├── target="_blank" + rel="noopener noreferrer"
  │   └── aria-label auf beiden Social-Links
  ├── Privacy Notice
  │   ├── Button klick ruft reopenNotice auf
  │   └── preventDefault wird aufgerufen
  └── shouldAnimate Guard
      ├── shouldAnimate=false → keine motion-props auf social links
      └── shouldAnimate=true → whileHover/whileTap vorhanden
```

### 15.5 FooterNewsletter.test.jsx

```
describe('FooterNewsletter')
  ├── rendert Email-Input mit aria-label
  ├── rendert Submit-Button
  ├── leere Email → emailRequired Status mit role="alert"
  ├── ungültige Email → error Status mit role="alert"
  ├── kein Consent → consentRequired Status mit role="alert"
  ├── erfolgreiche Submission → client.post aufgerufen
  ├── erfolgreiche Submission → Email + Consent zurückgesetzt
  ├── Submit-Button disabled während isSubmitting
  └── API-Fehler → serverError Status
```

### 15.6 BackToTop.test.jsx

```
describe('BackToTop')
  ├── rendert nichts bei visible=false
  ├── rendert Button bei visible=true
  ├── Button hat aria-label
  ├── Button hat title
  ├── Klick ruft window.scrollTo auf
  └── window.scrollTo mit { top: 0, behavior: 'smooth' }
```

### 15.7 LanguageSwitcher.test.jsx

```
describe('LanguageSwitcher')
  ├── rendert 4 Pills (DE, EN, AR, KA)
  ├── aktive Sprache (de) hat langPillActive-Klasse
  ├── aktive Sprache hat aria-current="true"
  ├── inaktive Sprachen haben kein aria-current
  ├── Klick auf inaktive Sprache ruft changeLanguage auf
  └── Klick auf aktive Sprache ruft changeLanguage NICHT auf
```

### 15.8 MiniFooter.test.jsx (NEU)

```
describe('MiniFooter')
  ├── rendert <nav> mit aria-label
  ├── rendert Home-Link zu "/"
  ├── rendert Impressum-Link zu "/impressum"
  ├── rendert Datenschutz-Link zu "/privacy"
  ├── rendert AGB-Link zu "/terms"
  └── rendert aria-hidden="true" auf Divider-Spans
```

### 15.9 Test-Kommandos

```bash
# Alle Footer-Tests
npx vitest run src/components/layout/Footer

# Alle MiniFooter-Tests
npx vitest run src/components/common/MiniFooter

# Alle Footer-bezogenen Tests (vollständig)
npx vitest run src/components/layout/Footer src/components/common/MiniFooter
```

**Ziel: Alle Tests grün, Mindest-Coverage 80%+**

---

## 16. Implementierungs-Checkliste

### Haupt-Agent — Vor Start (Pflicht)

- [ ] Plan vollständig gelesen (alle 16 Abschnitte)
- [ ] `frontend-design` Skill gelesen
- [ ] `vercel-react-best-practices` Skill gelesen
- [ ] `Projekt-Design.md` gelesen
- [ ] Alle bestehenden Footer-Dateien auditiert (Abschnitt 4 verifiziert)
- [ ] `MainLayout.jsx` geprüft: Footer korrekt eingebunden ✅
- [ ] `AdminLayout.jsx` geprüft: Footer NICHT eingebunden ✅
- [ ] Baseline-Test-Run: `npx vitest run src/components/layout/Footer`

### Phase 1 — SCSS (Agent 1)

- [ ] `Footer.module.scss` vollständig neu — keine alten Tokens
- [ ] Glass-Surface mit `backdrop-filter` + `-webkit-backdrop-filter` + `@supports` Fallback
- [ ] `--glass-border` statt `--border` überall
- [ ] `--glass-border-light` für innere Trennlinien
- [ ] Upward Shadow (`0 -8px 48px ...`) implementiert
- [ ] `::before` blur + `> * z-index` Pattern auf `.backToTop`
- [ ] `::before` blur + `> * z-index` Pattern auf `.newsletterWrap`
- [ ] Responsive blur in drei Stufen (`--glass-blur` / `--glass-blur-reduced` / `--glass-blur-minimal`)
- [ ] Aurora-Akzent-Gradient auf `.brand`
- [ ] RTL-Overrides vollständig
- [ ] `@include reduced-motion` vollständig
- [ ] `MiniFooter.module.scss` vollständig neu mit Glass-Surface

### Phase 2 — Komponenten (Agents 2, 3, 4)

- [ ] `Footer.jsx` neu — Props-API identisch zu alt
- [ ] `FooterBrand.jsx` neu — `app-logo` Klasse auf `<img>` beibehalten
- [ ] `FooterBottom.jsx` neu
- [ ] `FooterNav.jsx` neu — `useMemo` für `sections`, dependencies: `[t, handlePrivacyNotice]`
- [ ] `FooterNav.jsx` — `useCallback` für `handlePrivacyNotice`, dependencies: `[reopenNotice]`
- [ ] `FooterNav.jsx` — alle `shouldAnimate` Guards auf `motion.a` Props
- [ ] `FooterNav.jsx` — Social Links mit `target="_blank"` und `rel="noopener noreferrer"`
- [ ] `FooterNewsletter.jsx` neu — `role="alert"` auf jedem Status-`<motion.p>`
- [ ] `FooterNewsletter.jsx` — `useMemo` für `statusConfig`
- [ ] `FooterNewsletter.jsx` — `useCallback` für `handleSubmit`
- [ ] `BackToTop.jsx` neu — alle Motion-Konstanten außerhalb der Komponente
- [ ] `BackToTop.jsx` — `BTT_TRANSITION` mit Spring-Config
- [ ] `LanguageSwitcher.jsx` neu — `LANGUAGES` außerhalb, `useCallback` für `handleChange`
- [ ] **Kein einziges Inline-Object** in JSX für Motion-Configs in allen Dateien

### Phase 3 — MiniFooter (Agent 5)

- [ ] `MiniFooter.jsx` neu — `<nav>` mit `aria-label`, vier Links, `aria-hidden` Divider
- [ ] `MiniFooter.module.scss` glass-themed (abgestimmt mit Agent 1)

### Phase 4 — Tests (Agent 5)

- [ ] `__tests__/Footer.test.jsx` vollständig neu
- [ ] `__tests__/FooterBrand.test.jsx` NEU erstellt
- [ ] `__tests__/FooterNav.test.jsx` vollständig neu
- [ ] `__tests__/FooterNewsletter.test.jsx` vollständig neu (inkl. `role="alert"` Test)
- [ ] `__tests__/BackToTop.test.jsx` vollständig neu
- [ ] `__tests__/LanguageSwitcher.test.jsx` vollständig neu
- [ ] `common/MiniFooter/__tests__/MiniFooter.test.jsx` NEU erstellt

### Haupt-Agent — Finale Validierung

- [ ] `npx vitest run src/components/layout/Footer` → alle Tests grün
- [ ] `npx vitest run src/components/common/MiniFooter` → alle Tests grün
- [ ] Grep-Check: `--glass-bg` in `Footer.module.scss` vorhanden
- [ ] Grep-Check: `--glass-border` in `Footer.module.scss` vorhanden
- [ ] Grep-Check: `backdrop-filter` in `Footer.module.scss` vorhanden
- [ ] Grep-Check: `var(--surface)` in `Footer.module.scss` NICHT vorhanden
- [ ] Grep-Check: `var(--border)` (ohne `glass-`) in `Footer.module.scss` NICHT vorhanden
- [ ] `AdminLayout.jsx` — Footer-Import NICHT vorhanden
- [ ] `MainLayout.jsx` — Footer-Einbindung unverändert korrekt