# Auth-System — Vollständige Optimierung (Aurora Flow Glass)

> **Scope:** Alle 6 Auth-Flows + 2 Layout-Dateien + Mobile-Viewport-Fix + Unit-Tests
> **Ansatz:** Gezieltes Upgrade — Logik & Architektur bewährt und bleibt erhalten
> **Stand:** 14. März 2026
> **Implementierung:** Multi-Agent — 1 Haupt-Agent koordiniert 3 Fachagenten
> **Philo:** Kein Neubau um des Neubaus willen. Was funktioniert, bleibt. Was falsche Tokens hat, wird gefixt.

---

## Inhaltsverzeichnis

1. [Skills & Richtlinien — PFLICHTLEKTÜRE](#1-skills--richtlinien--pflichtlektüre)
2. [Multi-Agent-Architektur](#2-multi-agent-architektur)
3. [Bestandsaufnahme — Vollständiger Ist-Zustand](#3-bestandsaufnahme--vollständiger-ist-zustand)
4. [Theme A — Design-Upgrade: Glass-Tokens](#4-theme-a--design-upgrade-glass-tokens)
5. [Theme B — Code-Qualität: Inline-Artifacts & Fehlerbehandlung](#5-theme-b--code-qualität-inline-artifacts--fehlerbehandlung)
6. [Theme C — Mobile-Viewport-Fix: svh + clamp + Intrinsic Sizing](#6-theme-c--mobile-viewport-fix-svh--clamp--intrinsic-sizing)
7. [EmailVerificationPage → AuthLayout-Integration](#7-emailverificationpage--authlayout-integration)
8. [BrandingPanel: verify-Mode + i18n-Tagline](#8-brandingpanel-verify-mode--i18n-tagline)
9. [Theme D — Tests (vollständig, alle Flows)](#9-theme-d--tests-vollständig-alle-flows)
10. [Implementierungs-Checkliste](#10-implementierungs-checkliste)

---

## 1. Skills & Richtlinien — PFLICHTLEKTÜRE

**Alle Agents MÜSSEN diese Skills VOR BEGINN lesen:**

| Skill | Pfad | Zweck |
|-------|------|-------|
| **frontend-design** | `~/.agents/skills/frontend-design/SKILL.md` | Aurora Flow: atmospärisch, dark-first, kein generisches AI-Slop |
| **vercel-react-best-practices** | `~/.agents/skills/vercel-react-best-practices/SKILL.md` | React Performance: Memo, useCallback, const außerhalb Render |

### Non-Negotiable-Regeln

1. **Kein `--surface-2` oder `--border` in Form-SCSS** — ausschließlich `--glass-*` oder `color-mix()`
2. **`-webkit-backdrop-filter` immer** zusammen mit `backdrop-filter`
3. **`@supports not (backdrop-filter: blur(1px))`** auf jede Glass-Fläche
4. **Keine Inline-Objekte** in JSX für Motion-Configs — stabile `const` außerhalb der Komponente
5. **`100svh` + `100vh` Fallback** — nie `100vh` allein in Auth-Containern
6. **`clamp()`** für kritische Typografie, nie `font-size` ohne Responsive-Fallback
7. **`min-height: 0`** auf Flex-Children die schrumpfen sollen

---

## 2. Multi-Agent-Architektur

```
HAUPT-AGENT (Koordinator)
├── Plan vollständig lesen
├── Alle betroffenen Dateien vor Start auditieren
├── Fachagenten in korrekter Reihenfolge koordinieren
├── Nach jedem Agent: Tests ausführen + visuelle Prüfung
└── Finale Validierung: 0 Fehler, alle Tests grün

FACHAGENT 1 — SCSS & Layout (Theme A + C)
├── AuthPage.module.scss: Glass-Surface + svh + Flex intrinsic
├── AuthLayout.module.scss: svh + Flex intrinsic
├── EmailVerificationPage.module.scss: svh + AuthLayout
├── LoginForm.module.scss: Glass-Inputs
├── MultiStepRegisterForm.module.scss: Glass-Inputs + Step-Indicator
├── ForgotPasswordRequestForm.module.scss: Glass-Inputs
├── VerifyEmailForm.module.scss: Glass-Inputs + Code-Felder
└── BrandingPanel.module.scss: Glass-Badge + clamp Typography

FACHAGENT 2 — JSX Code-Qualität (Theme B + Erweiterungen)
├── AuthPage.jsx: springConfig außerhalb Render
├── AuthLayout.jsx: springTransition + panelVariants außerhalb Render
├── ForgotPasswordRequestForm.jsx: parseApiError() verwenden
├── BrandingPanel.jsx: verify-Mode + i18n-Tagline
└── EmailVerificationPage.jsx: AuthLayout-Integration

FACHAGENT 3 — Tests (Theme D)
└── 7 neue/erweiterte Testdateien
```

### Ausführungs-Reihenfolge

```
Phase 1: Agent 1 (SCSS) — keine JSX-Abhängigkeiten
Phase 2: Agent 2 (JSX) — kann nach oder parallel zu Agent 1 starten
Phase 3: Agent 3 (Tests) — NACH Agents 1+2
Phase 4: Haupt-Agent Validierung
```

---

## 3. Bestandsaufnahme — Vollständiger Ist-Zustand

### 3.1 Datei-Inventar

| Datei | ca. Zeilen | Rolle |
|-------|-----------|-------|
| `pages/AuthPage/AuthPage.jsx` | 175 | Haupt-Container: Panel-Slide, Mode-Detection |
| `pages/AuthPage/AuthPage.module.scss` | 200 | Desktop 50/50 + Mobile 30/70 |
| `pages/VerifyEmailPage/VerifyEmailPage.jsx` | 140 | Code-Eingabe-Seite |
| `pages/EmailVerificationPage.jsx` | 80 | Link-Klick-Verifikation |
| `pages/EmailVerificationPage.module.scss` | 90 | Standalone-Card, `min-height: 100vh` |
| `components/auth/BrandingPanel/BrandingPanel.jsx` | 160 | Rechtes Panel, 3 Modi |
| `components/auth/BrandingPanel/BrandingPanel.module.scss` | 270 | Panel-Styles |
| `components/auth/LoginForm/LoginForm.jsx` | 210 | Username + PW + Remember |
| `components/auth/LoginForm/LoginForm.module.scss` | 200 | `--surface-2` + `--border` |
| `components/auth/MultiStepRegisterForm/MultiStepRegisterForm.jsx` | 420 | 3-Schritt-Register |
| `components/auth/MultiStepRegisterForm/MultiStepRegisterForm.module.scss` | 430 | `--surface-2` + `--border` |
| `components/auth/ForgotPasswordRequestForm/ForgotPasswordRequestForm.jsx` | 150 | Email + Success-State |
| `components/auth/ForgotPasswordRequestForm/ForgotPasswordRequestForm.module.scss` | 120 | `--surface-2` + `--border` |
| `components/auth/ResetPasswordForm/ResetPasswordForm.jsx` | 180 | Neues PW + Token |
| `components/auth/ResetPasswordForm/ResetPasswordForm.module.scss` | ~150 | `--surface-2` + `--border` |
| `components/auth/VerifyEmailForm/VerifyEmailForm.jsx` | 180 | 6-Digit Code + Auto-Submit |
| `components/auth/VerifyEmailForm/VerifyEmailForm.module.scss` | ~140 | `--surface-2` + `--border` |
| `components/layout/AuthLayout/AuthLayout.jsx` | 65 | Wrapper für VerifyEmailPage |
| `components/layout/AuthLayout/AuthLayout.module.scss` | 130 | Layout-Styles |

### 3.2 Vollständige Defizit-Liste

#### 🔴 Kritisch

| Nr. | Datei | Zeile | Problem |
|-----|-------|-------|---------|
| D1 | `LoginForm.module.scss` | 60–61 | `background: var(--surface-2)` + `border: 1px solid var(--border)` |
| D2 | `MultiStepRegisterForm.module.scss` | 71–72 | identisch |
| D3 | `ForgotPasswordRequestForm.module.scss` | 29–30 | identisch |
| D4 | `VerifyEmailForm.module.scss` | 37–38 | identisch |
| D5 | (ResetPasswordForm.module.scss) | ~40 | erwarteter gleicher Befund |
| D6 | `EmailVerificationPage.module.scss` | 13 | `min-height: 100vh` → Browser-UI schneidet Inhalt ab |
| D7 | `EmailVerificationPage.module.scss` | — | kein Glass, kein `AuthLayout` |
| D8 | `AuthPage.module.scss` | 31–38 | `formPanel { background: var(--bg) }` — kein Glass |
| D9 | `AuthLayout.module.scss` | 35 | `formPanel { background: var(--bg) }` — kein Glass |

#### 🟠 Hoch — Mobile-Viewport

| Nr. | Datei | Problem |
|-----|-------|---------|
| M1 | `AuthPage.module.scss` | `position: fixed; inset: 0` — kein `height: 100svh` Workaround für Safari |
| M2 | `EmailVerificationPage.module.scss` | `min-height: 100vh` — Safari Dynamic Island frisst Platz |
| M3 | `AuthLayout.module.scss` | `position: fixed; inset: 0` — identisches Problem |
| M4 | `AuthPage.module.scss` | `flex: 0 0 30%` für Branding — feste 30% kollabieren auf iPhone SE (667px Höhe) |
| M5 | `BrandingPanel.module.scss` | `padding: var(--space-xs)` — zu wenig Kontrolle auf sehr kleinen Viewports |
| M6 | `LoginForm.module.scss` | `height: 2.75rem` auf Input — zu hoch auf iPhone SE, kann Formular sprengen |
| M7 | `MultiStepRegisterForm.module.scss` | `height: 2.75rem` auf Input — identisch |
| M8 | `VerifyEmailForm.module.scss` | 6 Code-Felder mit fester Breite — Overflow auf 320px-Screens |

#### 🟡 Mittel — Code-Qualität

| Nr. | Datei | Zeile | Problem |
|-----|-------|-------|---------|
| Q1 | `AuthPage.jsx` | 67–71 | `springConfig` Inline-Object in Render-Funktion |
| Q2 | `AuthLayout.jsx` | 29–35 | `springTransition` + `panelVariants` inline |
| Q3 | `ForgotPasswordRequestForm.jsx` | 78–80 | `err?.response?.data?.message` direkt statt `parseApiError()` |
| Q4 | `VerifyEmailPage.jsx` | 74–90 | `containerVariants` + `itemVariants` inline |

#### 🟡 Mittel — i18n & Content

| Nr. | Datei | Problem |
|-----|-------|---------|
| I1 | `BrandingPanel.jsx:143` | Hardcoded `"Intelligente Finanzverwaltung für dein smartes Leben"` |
| I2 | `BrandingPanel.jsx` | Kein `verify`-Mode in `contentMap` für `EmailVerificationPage` |

#### 🟡 Mittel — Tests

| Test-Datei | Status |
|------------|--------|
| `auth/ErrorBanner/__tests__/ErrorBanner.test.jsx` | ✅ vorhanden |
| `auth/PasswordInput/__tests__/PasswordInput.test.jsx` | ✅ vorhanden |
| `auth/__tests__/AdminRoute.test.jsx` | ✅ vorhanden |
| `auth/__tests__/LoginForm.test.jsx` | ❌ fehlt |
| `auth/__tests__/MultiStepRegisterForm.test.jsx` | ❌ fehlt |
| `auth/__tests__/ForgotPasswordRequestForm.test.jsx` | ❌ fehlt |
| `auth/__tests__/ResetPasswordForm.test.jsx` | ❌ fehlt |
| `auth/__tests__/VerifyEmailForm.test.jsx` | ❌ fehlt |
| `auth/__tests__/BrandingPanel.test.jsx` | ❌ fehlt |
| `pages/__tests__/AuthPage.test.jsx` | ❌ fehlt |

### 3.3 Was BEWAHRT wird (unveränderlich)

| Element | Dateien | Begründung |
|---------|---------|------------|
| 50/50 Panel-Slide-Logik mit Spring-Animation | `AuthPage.jsx` | Einzigartiges, korrekt implementiertes Feature |
| 30/70 Mobile Stack + `.registerMode` CSS-Order-Swap | `AuthPage.jsx + .scss` | Korrekte Mobile-UX |
| `mode`-Detection via `location.pathname` | `AuthPage.jsx` | Kein redundanter State |
| `AnimatePresence mode="wait"` für Formwechsel | `AuthPage.jsx` | Korrekte Exit-Animationen |
| Multi-Step-Architektur (3 Schritte) | `MultiStepRegisterForm.jsx` | Gut strukturiert |
| `understoodNoEmailReset` + Email-optional-Logik | `MultiStepRegisterForm.jsx` | UX-Feature |
| Password-Stärke-Indikator via `@/validators` | `MultiStepRegisterForm.jsx` | Feature-complete |
| `shouldAnimate` Guards auf jedem Framer-Prop | alle Formulare | Reduced-Motion-konform |
| `ErrorBanner` (shared) | `ErrorBanner.jsx` | DRY, einheitlich — unverändert |
| `PasswordInput` (shared) | `PasswordInput.jsx` | DRY, einheitlich — unverändert |
| `PublicRoute` Auto-Redirect | `AppRoutes.jsx` | Korrekt — unverändert |
| `AdminRoute` mit Skeleton | `AppRoutes.jsx` | Korrekt — unverändert |
| 6-Digit-Code Auto-Submit + Resend | `VerifyEmailForm.jsx` | Feature-complete |
| RTL-Support (`isRtl` + Arrow-Direction) | alle Formulare | 4-Sprachen-Support — bleibt |
| `parseApiError()` in Login + Register + Reset | jeweilige JSX | Pattern wird auf Forgot ausgeweitet |
| Alle i18n-Keys | alle Dateien | Keine Übersetzungen brechen |

---

## 4. Theme A — Design-Upgrade: Glass-Tokens

### 4.1 Form-Panel (AuthPage + AuthLayout)

**AuthPage.module.scss — `.formPanel`:**
```scss
// VORHER:
.formPanel { background: var(--bg); }

// NACHHER:
.formPanel {
  background: color-mix(in srgb, var(--primary) 3%, color-mix(in srgb, var(--glass-bg) 80%, transparent));
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-right: 1px solid var(--glass-border);

  @supports not (backdrop-filter: blur(1px)) {
    background: var(--surface);
  }
}
```

**AuthLayout.module.scss — `.formPanel`:**
```scss
// Identisches Muster, zusätzlich .formContainer anpassen:
.formContainer {
  @include below-lg {
    background: color-mix(in srgb, var(--glass-bg) 60%, transparent);
    border: 1px solid var(--glass-border);
    // backdrop-filter via ::before (Box-Shadow Stacking):
    // → hier reicht direktes blur da kein Framer-Motion-Transform drauf
    backdrop-filter: blur(var(--glass-blur-minimal));
    -webkit-backdrop-filter: blur(var(--glass-blur-minimal));
  }
}
```

### 4.2 Input-Wrapper (alle 5 Form-SCSS)

Betrifft: `LoginForm`, `MultiStepRegisterForm`, `ForgotPasswordRequestForm`, `ResetPasswordForm`, `VerifyEmailForm`

```scss
// VORHER:
.inputWrapper {
  background: var(--surface-2);
  border: 1px solid var(--border);
  // .error: background: color-mix(in srgb, var(--error) 3%, var(--surface-2));
}

// NACHHER:
.inputWrapper {
  background: color-mix(in srgb, var(--glass-bg) 70%, transparent);
  border: 1px solid var(--glass-border);

  &.error {
    border-color: var(--error);
    background: color-mix(in srgb, var(--error) 5%, color-mix(in srgb, var(--glass-bg) 70%, transparent));
  }

  &.valid {
    border-color: var(--success);
  }

  // Autofill: glass-bg statt surface-2
  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px
      color-mix(in srgb, var(--glass-bg) 95%, transparent) inset;
  }
}
```

Focus-State: `border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);`

### 4.3 Step-Indicator (MultiStepRegisterForm)

```scss
.stepCircle {
  background: color-mix(in srgb, var(--glass-bg) 70%, transparent);
  border: 2px solid var(--glass-border);
  // .current: border-color: var(--primary); background: color-mix(in srgb, var(--primary) 10%, transparent);
}
.stepLine {
  background: var(--glass-border);
  // .completed: background: var(--primary);
}
```

### 4.4 Terms/Warning Boxen (MultiStepRegisterForm)

```scss
.termsBox {
  background: color-mix(in srgb, var(--glass-bg) 50%, transparent);
  border: 1px solid var(--glass-border-light);
}
.warningBox {
  background: color-mix(in srgb, var(--warning) 8%, color-mix(in srgb, var(--glass-bg) 60%, transparent));
  border: 1px solid color-mix(in srgb, var(--warning) 35%, transparent);
}
```

### 4.5 VerifyEmailForm Code-Felder

```scss
.codeInput {
  background: color-mix(in srgb, var(--glass-bg) 70%, transparent);
  border: 2px solid var(--glass-border);

  &:focus {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--primary) 5%, color-mix(in srgb, var(--glass-bg) 70%, transparent));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
  }
}
```

### 4.6 BrandingPanel Badge

```scss
.badge {
  background: color-mix(in srgb, var(--glass-bg) 60%, transparent);
  border: 1px solid var(--glass-border);
  // Kein --surface-2, kein --border
}
```

### 4.7 EmailVerificationPage Card

```scss
// VORHER:
.verifyCard { background: var(--surface); border-radius: var(--r-xl); }

// NACHHER:
.verifyCard {
  background: color-mix(in srgb, var(--glass-bg) 70%, transparent);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur-reduced));
  -webkit-backdrop-filter: blur(var(--glass-blur-reduced));
  box-shadow: var(--glass-shadow);

  @supports not (backdrop-filter: blur(1px)) {
    background: var(--surface);
  }
}
```

---

## 5. Theme B — Code-Qualität: Inline-Artifacts & Fehlerbehandlung

### 5.1 AuthPage.jsx — springConfig außerhalb Render

```jsx
// VORHER (innerhalb der Komponente, wird bei jedem Render neu erstellt):
const springConfig = { type: 'spring', stiffness: 220, damping: 28 };

// NACHHER (außerhalb der Komponente, stabile Referenz):
const SPRING_CONFIG = { type: 'spring', stiffness: 220, damping: 28 };

export default function AuthPage() {
  // springConfig-Verwendung: animate={{ x: ... }} transition={SPRING_CONFIG}
}
```

### 5.2 AuthLayout.jsx — außerhalb Render

```jsx
// VORHER:
const springTransition = { type: 'spring', stiffness: 220, damping: 28 };
const panelVariants = {
  left:  { x: '0%',   transition: springTransition },
  right: { x: '100%', transition: springTransition },
};

// NACHHER (außerhalb Komponente):
const SPRING_TRANSITION = { type: 'spring', stiffness: 220, damping: 28 };
const PANEL_VARIANTS = {
  left:  { x: '0%',   transition: SPRING_TRANSITION },
  right: { x: '100%', transition: SPRING_TRANSITION },
};
```

### 5.3 ForgotPasswordRequestForm.jsx — parseApiError

```jsx
// VORHER:
import { useAuth, useToast, useMotion } from '@/hooks';
// ...
} catch (err) {
  const errorMessage = err?.response?.data?.message || t('auth.forgot.errorToast');
  setApiError(errorMessage);
  toast.error(errorMessage);
}

// NACHHER:
import { useAuth, useToast, useMotion } from '@/hooks';
import { parseApiError } from '@/api/errorHandler';
// ...
} catch (err) {
  const { message } = parseApiError(err);
  setApiError(message);
  toast.error(message);
}
```

### 5.4 VerifyEmailPage.jsx — Variants außerhalb Render

```jsx
// VORHER (innerhalb der Komponente vor return):
const containerVariants = { hidden: { opacity: 0 }, visible: { ... } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { ... } };

// NACHHER (außerhalb):
const CONTAINER_VARIANTS = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const ITEM_VARIANTS = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } } };
```

---

## 6. Theme C — Mobile-Viewport-Fix: svh + clamp + Intrinsic Sizing

### 6.1 Das Problem (iPhone SE / S10e)

- **iPhone SE**: 375×667px (Safari-Adressleiste + untere Nav: bis -130px!)
- **Samsung S10e**: 360×760px
- `position: fixed; inset: 0` auf dem Paper safe, aber `flex: 0 0 30%` für Branding = feste 30% der Höhe → auf 667px = 200px für Branding, lässt 467px für das Formular
- Auf 3-Schritt-Registrierung: Step 3 (Terms + Warning Box + 2 Checkboxen) braucht mehr als 467px → OVERFLOW oder Abschnitt

### 6.2 AuthPage.module.scss — svh + adaptive Flex

```scss
// MOBILES ROOT:
.authPageMobile {
  position: fixed;
  inset: 0;
  // Fallback → svh:
  height: 100vh;
  height: 100svh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// BRANDING PANEL (bisher: flex: 0 0 30% — zu starr):
.brandingPanelMobile {
  position: relative;
  width: 100%;
  // Adaptive: min, ideal, max — schrumpft auf iPhone SE
  flex: 0 0 clamp(80px, 25svh, 30%);
  overflow: hidden;
}

// FORM PANEL bekommt flex-grow:
.formPanelMobile {
  position: relative;
  width: 100%;
  flex: 1 1 0;           // nimmt restlichen Platz
  min-height: 0;         // darf schrumpfen
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
```

### 6.3 formInner — scrollbar auf sehr kleinen Screens

Wenn das Formular dennoch nicht passt (z.B. 3-Schritt mit Terms auf 480px Höhe):

```scss
.formInner {
  width: 100%;
  max-width: 380px;
  padding: var(--space-sm);
  // Auf kleinen Screens scrollbar, aber schmale scrollbar:
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  @include lg { max-width: 400px; padding: var(--space-md); }
  @include breakpoint($max: $bp-xs) {
    max-width: 360px;
    padding: 0 max(var(--space-sm), 16px);
  }
}
```

### 6.4 AuthLayout.module.scss — identische svh-Fixes

```scss
.authLayout {
  position: fixed;
  inset: 0;
  height: 100vh;
  height: 100svh;  // Safari-Fix
  display: flex;
  overflow: hidden;

  @include below-lg { flex-direction: column; }
}

.mobileBranding {
  @include below-lg {
    display: block;
    width: 100%;
    flex: 0 0 clamp(80px, 25svh, 30%);  // adaptiv
    overflow: hidden;
  }
}

.formPanel {
  @include below-lg {
    flex: 1 1 0;
    min-height: 0;
    // overflow-y: auto für scrollbare Formulare:
    overflow-y: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
}
```

### 6.5 EmailVerificationPage.module.scss — svh + kein min-height

```scss
.verifyContainer {
  // VORHER: min-height: 100vh;
  // NACHHER:
  min-height: 100vh;       // Fallback
  min-height: 100svh;      // Safari-Fix
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  background: var(--bg);

  @include mobile { padding: var(--space-md); }
}
```

### 6.6 Input-Höhe — flex statt fixer Höhe

```scss
// VORHER:
.input { height: 2.75rem; }

// NACHHER:
.input {
  height: 2.75rem;              // Desktop/Tablet
  min-height: 2.25rem;          // iPhone SE Mindest-Höhe

  @include breakpoint($max: $bp-xs) {
    height: 2.5rem;
  }
}
```

### 6.7 VerifyEmailForm Code-Felder — Overflow-Schutz

```scss
.codeContainer {
  display: flex;
  gap: var(--space-xs);
  justify-content: center;
  flex-wrap: nowrap;
  // Skalierbar auf kleinen Screens:
  width: 100%;
  max-width: 100%;
}

.codeInput {
  flex: 1;
  min-width: 0;
  max-width: clamp(2.5rem, 12vw, 3.5rem);
  aspect-ratio: 1;           // immer quadratisch
  padding: 0;
  text-align: center;
}
```

### 6.8 Typografie — clamp für kritische Titel

```scss
// AuthPage.module.scss:
.title {
  font-size: clamp(var(--fs-lg), 3.5svh, var(--fs-xl));  // passt sich Viewport-Höhe an
  // (Nur für mobile — Desktop behält var(--fs-xl)/2xl)
}

// BrandingPanel.module.scss — wichtigste Headline:
.headline h2 {
  font-size: clamp(var(--fs-md), 4svh, var(--fs-3xl));
}

// BrandingPanel tagline:
.tagline {
  font-size: clamp(0.65rem, 1.5svh, var(--fs-sm));
}
```

---

## 7. EmailVerificationPage → AuthLayout-Integration

### 7.1 EmailVerificationPage.jsx umschreiben

**Aktuell:** Standalone-Seite mit eigenem Background + Card
**Neu:** In `AuthLayout` eingebettet, `mode="verify"`

```jsx
// NACHHER:
import { AuthLayout } from '@/components/layout';

export default function EmailVerificationPage() {
  // ... bestehende Logik unverändert ...

  return (
    <AuthLayout variant="verify">
      <motion.div className={styles.verifyCard} ...>
        {/* status-basierter Inhalt bleibt 1:1 erhalten */}
      </motion.div>
    </AuthLayout>
  );
}
```

**EmailVerificationPage.module.scss:** `.verifyContainer` wird überflüssig (AuthLayout handles wrapper). Nur `.verifyCard` + innere Styles bleiben. Glass-Card wie in Abschnitt 4.7 spezifiziert.

### 7.2 AppRoutes.jsx — `PublicRoute` für EmailVerificationPage

```jsx
// NACHHER (in VerifyEmailWrapper):
const VerifyEmailWrapper = () => {
  const location = useLocation();
  const params = new globalThis.URLSearchParams(location.search);
  const hasResult = params.has('success') || params.has('error');
  // EmailVerificationPage hat jetzt AuthLayout intern → kein extra PublicRoute nötig
  return hasResult ? <EmailVerificationPage /> : <VerifyEmailPage />;
};
```

---

## 8. BrandingPanel: verify-Mode + i18n-Tagline

### 8.1 getContent() erweitern

```jsx
const getContent = (mode) => {
  const contentMap = {
    login:    { /* unverändert */ },
    register: { /* unverändert */ },
    forgot:   { /* unverändert */ },
    verify: {    // NEU
      kickerKey:   'auth.branding.kicker',
      headlineKey: 'auth.branding.verify.headline',
      sublineKey:  'auth.branding.verify.subline',
      ctaTextKey:  'auth.branding.verify.cta',
      ctaPath:     '/login',
    },
  };
  // ...
};
```

### 8.2 Tagline → i18n

```jsx
// VORHER:
<p className={styles.tagline}>Intelligente Finanzverwaltung für dein smartes Leben</p>

// NACHHER:
<p className={styles.tagline}>{t('auth.branding.tagline')}</p>
```

**Neue i18n-Keys (alle 4 Sprachen nötig):**
```
auth.branding.tagline
auth.branding.verify.headline
auth.branding.verify.subline
auth.branding.verify.cta
```

**Lokalisierungsdateien prüfen:** `public/locales/de/`, `en/`, `ar/`, `ka/` — Keys hinzufügen.

### 8.3 Arrow-Direction für verify-Mode

```jsx
const isLoginMode = mode === 'login';
const isVerifyMode = mode === 'verify';  // NEU

const arrowDir = isDesktop
  ? (isLoginMode || isVerifyMode ? (isRtl ? 'right' : 'left') : (isRtl ? 'left' : 'right'))
  : (isLoginMode || isVerifyMode ? (isRtl ? 'down' : 'up') : (isRtl ? 'up' : 'down'));
```

---

## 9. Theme D — Tests (vollständig, alle Flows)

### 9.1 Mock-Setup (Standard für alle Auth-Tests)

```jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Framer Motion Mock
const MOTION_PROPS = new Set([
  'whileHover','whileTap','whileFocus','whileInView','initial',
  'animate','exit','transition','variants','layout','layoutId',
]);
vi.mock('framer-motion', () => {
  const motion = new Proxy({}, {
    get: (_t, prop) => {
      if (prop === 'create') return (C) => C;
      return ({ children, ...props }) => {
        const htmlProps = Object.fromEntries(
          Object.entries(props).filter(([k]) => !MOTION_PROPS.has(k))
        );
        return React.createElement(typeof prop === 'string' ? prop : 'div', htmlProps, children);
      };
    },
  });
  return { __esModule: true, motion, AnimatePresence: ({ children }) => <>{children}</> };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key, i18n: { language: 'de', dir: () => 'ltr', changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey, children }) => <span>{i18nKey ?? children}</span>,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('@/hooks/useMotion', () => ({ useMotion: () => ({ shouldAnimate: false }) }));
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }) }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ login: vi.fn().mockResolvedValue({}), register: vi.fn().mockResolvedValue({}), forgotPassword: vi.fn().mockResolvedValue({}), resetPassword: vi.fn().mockResolvedValue({}), verifyEmail: vi.fn().mockResolvedValue({}), resendVerificationEmail: vi.fn().mockResolvedValue({}) }) }));
vi.mock('@/api/errorHandler', () => ({ parseApiError: (e) => ({ message: e?.response?.data?.message || 'error' }) }));
vi.mock('@/components/common/Checkbox/Checkbox', () => ({ default: ({ checked, onChange, id }) => <input type="checkbox" id={id} checked={checked} onChange={onChange} /> }));
```

### 9.2 LoginForm.test.jsx (NEU)

```
describe('LoginForm')
  ├── rendert Username-Input
  ├── rendert Password-Input
  ├── Submit-Button disabled wenn Felder leer
  ├── Submit-Button aktiviert wenn beide Felder ausgefüllt
  ├── zeigt Fehler nach Blur mit leerem Namen
  ├── zeigt Fehler nach Blur mit Name < 3 Zeichen
  ├── zeigt Fehler nach Blur mit leerem Passwort
  ├── zeigt kein Fehler bei validen Werten
  ├── Submit ruft login() mit korrekten Parametern auf
  ├── Submit setzt isLoading → Button disabled
  ├── API-Fehler → ErrorBanner sichtbar
  ├── ErrorBanner lässt sich schließen
  ├── Remember-Me-Checkbox togglet formData.rememberMe
  └── Forgot-Password-Link vorhanden mit href=/forgot-password
```

### 9.3 MultiStepRegisterForm.test.jsx (NEU)

```
describe('MultiStepRegisterForm')
  ├── Step-Indicator: 3 Kreise vorhanden
  ├── Schritt 1: Name-Input vorhanden
  ├── Schritt 1: Email-Input vorhanden (optional)
  ├── Schritt 1: Fehler bei leerem Name
  ├── Schritt 1: Fehler bei Name < 3 Zeichen
  ├── Schritt 1: Ungültige Email → Fehler
  ├── Schritt 1: Kein Fehler bei leerem Email (optional)
  ├── Schritt 1: handleNext ohne valide → kein Weiterschalten
  ├── Schritt 1: handleNext mit validen Daten → Schritt 2
  ├── Schritt 2: Passwort-Stärke-Indikator sichtbar
  ├── Schritt 2: Schwaches Passwort → Stärke "weak"
  ├── Schritt 2: Starkes Passwort → Stärke "strong"
  ├── Schritt 2: Passwort-Mismatch → Fehler bei confirmPassword
  ├── Schritt 3: AGB-Checkbox vorhanden
  ├── Schritt 3 ohne Email: understoodNoEmailReset-Checkbox sichtbar
  ├── Schritt 3 mit Email: understoodNoEmailReset-Checkbox NICHT sichtbar
  ├── Submit ohne AGB → Fehler
  ├── Submit ohne understoodNoEmailReset (kein Email) → Fehler
  ├── Submit mit Email → register() mit email + navigate zum verify-email
  ├── Submit ohne Email → register() ohne email + navigate zum dashboard
  └── API-Fehler → ErrorBanner sichtbar
```

### 9.4 ForgotPasswordRequestForm.test.jsx (NEU)

```
describe('ForgotPasswordRequestForm')
  ├── rendert Email-Input
  ├── Submit bei leerem Email → Validierungsfehler
  ├── Submit bei ungültiger Email → Validierungsfehler
  ├── Submit bei valider Email → forgotPassword() aufgerufen
  ├── Erfolg → Success-State mit Email-Icon sichtbar
  ├── Erfolg → kein Form mehr sichtbar
  ├── API-Fehler → ErrorBanner sichtbar
  └── zurück-zum-Login Link sichtbar (im Success-State)
```

### 9.5 ResetPasswordForm.test.jsx (NEU)

```
describe('ResetPasswordForm')
  ├── rendert Passwort-Input
  ├── rendert Bestätigungs-Input
  ├── Fehler bei leerem Passwort
  ├── Fehler bei schwachem Passwort (unter Mindestkomplexität)
  ├── Fehler bei Passwort-Mismatch
  ├── Submit mit validen Werten → resetPassword(token, password) aufgerufen
  ├── Erfolg → Success-State sichtbar
  └── API-Fehler → ErrorBanner sichtbar
```

### 9.6 VerifyEmailForm.test.jsx (NEU)

```
describe('VerifyEmailForm')
  ├── rendert 6 Input-Felder
  ├── Eingabe in Feld 1 → Fokus verschiebt sich zu Feld 2
  ├── Bei 6 Ziffern → verifyEmail() aufgerufen
  ├── Backspace in Feld 3 → Fokus zurück zu Feld 2
  ├── Nur Ziffern erlaubt (kein Buchstabe möglich)
  ├── API-Fehler → ErrorBanner + Code zurückgesetzt
  ├── Resend-Button sichtbar
  ├── Resend-Button deaktiviert während Countdown
  └── Resend-Button ruft resendVerificationEmail() auf
```

### 9.7 BrandingPanel.test.jsx (NEU)

```
describe('BrandingPanel')
  ├── mode="login": CTA-Button zeigt Login-Text + href="/register"
  ├── mode="register": CTA-Button zeigt Register-Text + href="/login"
  ├── mode="forgot": CTA-Button zeigt Forgot-Text + href="/login"
  ├── mode="verify": CTA-Button zeigt Verify-Text + href="/login"
  ├── Desktop + LTR + Login → Arrow links
  ├── Desktop + RTL + Login → Arrow rechts
  ├── Mobile + Login → Arrow oben
  ├── Mobile + Register → Arrow unten
  └── Logo vorhanden mit alt="Finora"
```

### 9.8 AuthPage.test.jsx (NEU)

```
describe('AuthPage')
  ├── /login → LoginForm sichtbar
  ├── /register → MultiStepRegisterForm sichtbar
  ├── /forgot-password → ForgotPasswordRequestForm sichtbar
  ├── /forgot-password?token=XYZ → ResetPasswordForm sichtbar
  ├── Authenticated + !isLoading → navigate("/dashboard")
  ├── isLoading → AuthPageSkeleton sichtbar
  └── Desktop: formPanel + brandingPanel vorhanden
```

### 9.9 Test-Kommandos

```bash
# Alle Auth-Unit-Tests
npx vitest run src/components/auth src/pages/AuthPage

# Nur neue Tests
npx vitest run src/components/auth/__tests__ src/pages/__tests__

# E2E (bereits existierend)
npx playwright test e2e/auth.spec.js

# Ziel: Alle Tests grün, Unit-Coverage > 80%
```

---

## 10. Implementierungs-Checkliste

### Haupt-Agent — Vor Start (Pflicht)

- [ ] Plan vollständig gelesen (alle 10 Abschnitte)
- [ ] `frontend-design` Skill gelesen
- [ ] `vercel-react-best-practices` Skill gelesen
- [ ] Alle betroffenen Dateien geöffnet und geprüft
- [ ] i18n-Dateien geprüft: wo werden neue Keys hinzugefügt?
- [ ] `public/locales/de/`, `en/`, `ar/`, `ka/` lokalisiert
- [ ] Baseline: `npx vitest run src/components/auth src/pages/AuthPage`

### Phase 1 — SCSS (Agent 1)

- [ ] `AuthPage.module.scss`: formPanel Glass + svh + adaptive flex
- [ ] `AuthLayout.module.scss`: formPanel Glass + svh + adaptive flex
- [ ] `EmailVerificationPage.module.scss`: svh + verifyCard Glass
- [ ] `LoginForm.module.scss`: Glass-inputWrapper, kein --surface-2, kein --border
- [ ] `MultiStepRegisterForm.module.scss`: Glass-inputs + stepCircle/stepLine + termsBox/warningBox
- [ ] `ForgotPasswordRequestForm.module.scss`: Glass-inputWrapper
- [ ] `ResetPasswordForm.module.scss`: Glass-inputWrapper
- [ ] `VerifyEmailForm.module.scss`: Glass-codeInputs + Overflow-Guard
- [ ] `BrandingPanel.module.scss`: Glass-Badge + clamp Typography
- [ ] Autofill `--webkit-box-shadow` in allen SCSS auf `glass-bg` umstellen
- [ ] `@supports` Fallback auf jede neue Glass-Fläche
- [ ] Grep-Check: `var(--surface-2)` in Form-SCSS → darf NICHT mehr vorkommen
- [ ] Grep-Check: `border: 1px solid var(--border)` in Form-SCSS → darf NICHT mehr vorkommen

### Phase 2 — JSX (Agent 2)

- [ ] `AuthPage.jsx`: `springConfig` → `SPRING_CONFIG` außerhalb Render
- [ ] `AuthLayout.jsx`: `springTransition` + `panelVariants` außerhalb Render
- [ ] `ForgotPasswordRequestForm.jsx`: `parseApiError` importieren + verwenden
- [ ] `VerifyEmailPage.jsx`: Variants außerhalb Render
- [ ] `BrandingPanel.jsx`: verify-Mode in `contentMap` + i18n-Tagline
- [ ] `BrandingPanel.jsx`: Arrow-Direction für verify-Mode
- [ ] `EmailVerificationPage.jsx`: in `AuthLayout variant="verify"` einbetten
- [ ] Neue i18n-Keys in allen 4 Sprachdateien hinzufügen
- [ ] `AppRoutes.jsx`: Prüfen ob `VerifyEmailWrapper` noch korrekt → kein ProtectedRoute etc.

### Phase 3 — Tests (Agent 3)

- [ ] `auth/__tests__/LoginForm.test.jsx` erstellen
- [ ] `auth/__tests__/MultiStepRegisterForm.test.jsx` erstellen
- [ ] `auth/__tests__/ForgotPasswordRequestForm.test.jsx` erstellen
- [ ] `auth/__tests__/ResetPasswordForm.test.jsx` erstellen
- [ ] `auth/__tests__/VerifyEmailForm.test.jsx` erstellen
- [ ] `auth/__tests__/BrandingPanel.test.jsx` erstellen
- [ ] `pages/__tests__/AuthPage.test.jsx` erstellen

### Haupt-Agent — Finale Validierung

- [ ] `npx vitest run src/components/auth src/pages/AuthPage` → alle Tests grün
- [ ] Grep: `var(--surface-2)` in `src/components/auth/**/*.scss` → 0 Treffer
- [ ] Grep: `border: 1px solid var(--border)` in `src/components/auth/**/*.scss` → 0 Treffer
- [ ] Grep: `min-height: 100vh` in Auth-Dateien → korrekt durch 100svh ersetzt
- [ ] chrome DevTools: iPhone SE (375×667) simuliert → kein Overflow
- [ ] DevTools: S10e (360×760) → kein Overflow
- [ ] BrandingPanel mode="verify" → korrekter Content + Arrow
- [ ] EmailVerificationPage → AuthLayout korrekt, kein Standalone-Background mehr
- [ ] RTL mit `dir="rtl"` → Arrows + Input-Icons korrekt gespiegelt
- [ ] Reduced Motion → alle Transitions deaktiviert