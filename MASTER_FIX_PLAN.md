# 🔧 MASTER FIX PLAN – Finora Smart Finance

**Erstellt:** 25.01.2026  
**Status:** Analyse abgeschlossen, Plan bereit zur Umsetzung

---

## 📋 Inhaltsverzeichnis

1. [Analyse des ursprünglichen Fix-Plans](#1-analyse-des-ursprünglichen-fix-plans)
2. [Identifizierte Probleme & Lücken](#2-identifizierte-probleme--lücken)
3. [Korrigierter Master-Plan](#3-korrigierter-master-plan)
4. [Phasen-Übersicht](#4-phasen-übersicht)
5. [Detaillierte Umsetzungsschritte](#5-detaillierte-umsetzungsschritte)
6. [Risiken & Abhängigkeiten](#6-risiken--abhängigkeiten)
7. [Erfolgskriterien](#7-erfolgskriterien)

---

## 1. Analyse des ursprünglichen Fix-Plans

### 1.1 Zusammenfassung der 11 vorgeschlagenen Commits

| # | Commit-Titel | Zielbereich | Bewertung |
|---|---|---|---|
| 1 | Verzeichnisstruktur anlegen + ProfilePage verschieben | Frontend | ❌ **FEHLERHAFT** – ProfilePage liegt bereits korrekt in `src/pages/ProfilePage/` |
| 2 | SCSS-Variablen statt harter Farbwerte | Frontend Styles | ⚠️ **TEILWEISE KORREKT** – Tokens existieren bereits in `variables.scss`, aber nicht überall genutzt |
| 3 | `!important` entfernen | Frontend Styles | ✅ **KORREKT** – 49 Treffer vorhanden |
| 4 | SCSS-Module vereinheitlichen | Frontend Styles | ✅ **KORREKT** – Duplikate erkennbar |
| 5 | ProfilePage.jsx aufteilen | Frontend | ✅ **KORREKT** – 895 LOC aktuell |
| 6 | DashboardCharts.jsx modularisieren | Frontend | ✅ **KORREKT** – 570 LOC aktuell |
| 7 | MultiStepRegisterForm.jsx aufteilen | Frontend | ✅ **KORREKT** – 656 LOC aktuell |
| 8 | Wiederverwendbare Komponenten extrahieren | Frontend | ⚠️ **TEILWEISE** – `components/common/` existiert bereits mit 27 Komponenten |
| 9 | i18n Übersetzungen aufteilen | Frontend | ✅ **KORREKT** – 2895 LOC in einer Datei |
| 10 | Linting/Prettier einrichten | Tooling | ⚠️ **VERALTET** – ESLint existiert bereits (Flat Config), Prettier fehlt |
| 11 | Tests & Dokumentation | Allgemein | ⚠️ **UNVOLLSTÄNDIG** – Backend komplett ignoriert |

### 1.2 Kritische Befunde

| Problem | Schweregrad | Beschreibung |
|---------|-------------|--------------|
| **Backend ignoriert** | 🔴 Kritisch | `auth.js` (900 LOC), `transactions.js` (695+ LOC) wurden nicht adressiert |
| **Falsche Annahmen** | 🟡 Mittel | ProfilePage liegt bereits korrekt, Button-Komponente existiert bereits |
| **Kontexte zu groß** | 🟡 Mittel | `TransactionContext.jsx` (506 LOC), `AuthContext.jsx` (438 LOC) nicht adressiert |
| **Keine Unit-Tests** | 🟡 Mittel | Nur E2E-Tests vorhanden, keine Komponenten-/API-Tests |
| **Reihenfolge suboptimal** | 🟡 Mittel | Styling vor Komponentenaufteilung ist riskant |

---

## 2. Identifizierte Probleme & Lücken

### 2.1 Was im Original-Plan FEHLT

| Bereich | Fehlender Schritt | Priorität |
|---------|-------------------|-----------|
| **Backend** | `auth.js` (900 LOC) in Module aufteilen | 🔴 Hoch |
| **Backend** | `transactions.js` in Controller/Service trennen | 🔴 Hoch |
| **Backend** | `emailService.js` (428 LOC) modularisieren | 🟡 Mittel |
| **Frontend** | `TransactionContext.jsx` (506 LOC) aufteilen | 🔴 Hoch |
| **Frontend** | `AuthContext.jsx` (438 LOC) aufteilen | 🔴 Hoch |
| **Frontend** | `ExportSection.jsx` (665 LOC) aufteilen | 🟡 Mittel |
| **Testing** | Unit-Tests für kritische Komponenten | 🟡 Mittel |
| **Testing** | API-Tests für Backend-Routen | 🟡 Mittel |
| **CI/CD** | Pre-Commit Hooks (Husky + lint-staged) | 🟢 Niedrig |
| **Dokumentation** | Frontend-README fehlt komplett | 🟢 Niedrig |

### 2.2 Was im Original-Plan FALSCH ist

| Fehler | Korrektur |
|--------|-----------|
| „ProfilePage verschieben" | Liegt bereits in `src/pages/ProfilePage/ProfilePage.jsx` |
| „Button.jsx neu erstellen" | Existiert bereits in `src/components/common/Button/` |
| `.eslintrc.cjs` erstellen | Projekt nutzt bereits ESLint Flat Config (`eslint.config.js`) |
| Styling vor Komponenten-Refactor | Risiko: Import-Pfade ändern sich, Styles brechen |

### 2.3 Reihenfolge-Probleme

Der ursprüngliche Plan führt Styling-Änderungen (Schritt 2-4) **vor** der Komponentenaufteilung (Schritt 5-8) durch. Dies ist problematisch:

- **Risiko:** Bei Komponentenaufteilung ändern sich Dateinamen und Import-Pfade
- **Konsequenz:** SCSS-Moduleänderungen müssen erneut angepasst werden
- **Lösung:** Erst Struktur, dann Styling

---

## 3. Korrigierter Master-Plan

### 3.1 Phasenstruktur

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 0: Vorbereitung & Tooling                               │
│  ─────────────────────────────────────────────────────────────  │
│  • Prettier einrichten                                          │
│  • Pre-Commit Hooks (Husky)                                     │
│  • Testing-Framework installieren                               │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 1: Backend-Refactoring                                   │
│  ─────────────────────────────────────────────────────────────  │
│  • auth.js → authController + authService + authValidation      │
│  • transactions.js → Controller/Service/Validation trennen      │
│  • emailService.js modularisieren (Templates auslagern)         │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 2: Frontend-Komponentenstruktur                          │
│  ─────────────────────────────────────────────────────────────  │
│  • ProfilePage.jsx in Subkomponenten aufteilen                  │
│  • DashboardCharts.jsx modularisieren                           │
│  • MultiStepRegisterForm.jsx aufteilen                          │
│  • ExportSection.jsx aufteilen                                  │
│  • Kontexte (Auth, Transaction) refaktorieren                   │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 3: Styling-Konsolidierung                                │
│  ─────────────────────────────────────────────────────────────  │
│  • Hardcoded Werte durch Tokens ersetzen                        │
│  • !important systematisch entfernen                            │
│  • SCSS-Duplikate zu Mixins konsolidieren                       │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 4: i18n & Übersetzungen                                  │
│  ─────────────────────────────────────────────────────────────  │
│  • translations.js in Namespaces aufteilen                      │
│  • Lazy-Loading für Sprachen einrichten                         │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 5: Testing & Qualitätssicherung                          │
│  ─────────────────────────────────────────────────────────────  │
│  • Unit-Tests für kritische Komponenten                         │
│  • API-Tests für Backend-Endpunkte                              │
│  • E2E-Test-Überprüfung nach Refactoring                        │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 6: Dokumentation & Cleanup                               │
│  ─────────────────────────────────────────────────────────────  │
│  • READMEs aktualisieren                                        │
│  • JSDoc für alle Module                                        │
│  • CHANGELOG erstellen                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Phasen-Übersicht

| Phase | Titel | Aufwand | Risiko | Abhängigkeiten |
|-------|-------|---------|--------|----------------|
| 0 | Vorbereitung & Tooling | 1-2h | Niedrig | Keine |
| 1 | Backend-Refactoring | 4-6h | Mittel | Phase 0 |
| 2 | Frontend-Komponentenstruktur | 6-8h | Hoch | Phase 0 |
| 3 | Styling-Konsolidierung | 4-6h | Mittel | Phase 2 |
| 4 | i18n & Übersetzungen | 2-3h | Niedrig | Phase 2 |
| 5 | Testing | 4-6h | Niedrig | Phase 1, 2 |
| 6 | Dokumentation & Cleanup | 2-3h | Niedrig | Alle |

**Geschätzte Gesamtdauer:** 23-34 Stunden

---

## 5. Detaillierte Umsetzungsschritte

---

### PHASE 0: Vorbereitung & Tooling

#### 0.1 Prettier einrichten (Frontend + Backend)

**Ziel:** Konsistente Code-Formatierung automatisieren

**Dateien erstellen:**

```
finora-smart-finance-frontend/.prettierrc
finora-smart-finance-frontend/.prettierignore
finora-smart-finance-api/.prettierrc
finora-smart-finance-api/.prettierignore
```

**Inhalt `.prettierrc`:**
```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 100
}
```

**package.json Scripts ergänzen:**
```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{js,jsx,scss}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,scss}\""
  }
}
```

#### 0.2 Pre-Commit Hooks (Optional, empfohlen)

**Installation:**
```bash
npm install -D husky lint-staged
npx husky init
```

#### 0.3 Testing-Framework (Vitest für Frontend)

**Installation:**
```bash
cd finora-smart-finance-frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**vite.config.js erweitern:**
```javascript
export default defineConfig({
  // ... existing config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
```

---

### PHASE 1: Backend-Refactoring

#### 1.1 auth.js aufteilen (900 LOC → ~4 Dateien)

**Aktuelle Struktur:**
```
src/routes/auth.js (900 LOC) – MONOLITHISCH
```

**Zielstruktur:**
```
src/
├── controllers/
│   └── authController.js      (~200 LOC) – Route-Handler
├── services/
│   └── authService.js         (~250 LOC) – Business-Logik
├── validators/
│   └── authValidation.js      (~100 LOC) – Validierungsfunktionen
└── routes/
    └── auth.js                (~150 LOC) – Nur Route-Definitionen
```

**Vorgehen:**

1. **authValidation.js erstellen:**
   - `validateName()`, `validatePassword()`, `validateEmail()` auslagern
   
2. **authService.js erstellen:**
   - `signAccessToken()`, `newRefreshToken()`, `sanitizeUser()` auslagern
   - Token-Generierung, User-Lookup, Password-Vergleich

3. **authController.js erstellen:**
   - Jeder Endpoint wird zu einer benannten Funktion
   - `registerUser`, `loginUser`, `refreshToken`, etc.

4. **auth.js refaktorieren:**
   - Nur Route-Definitionen bleiben
   - Controller-Funktionen importieren

**Beispiel auth.js (nach Refactoring):**
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerLimiter, loginLimiter } = require('../middleware/rateLimiter');

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
// ...

module.exports = router;
```

#### 1.2 transactions.js aufteilen (695 LOC → ~3 Dateien)

**Zielstruktur:**
```
src/
├── controllers/
│   └── transactionController.js   (~180 LOC)
├── services/
│   └── transactionService.js      (~200 LOC)
└── routes/
    └── transactions.js            (~100 LOC)
```

#### 1.3 emailService.js modularisieren (428 LOC)

**Zielstruktur:**
```
src/utils/
├── emailService.js            (~150 LOC) – Haupt-Service
└── emailTemplates/
    ├── verification.js        (~80 LOC)
    ├── passwordReset.js       (~80 LOC)
    └── emailChange.js         (~80 LOC)
```

---

### PHASE 2: Frontend-Komponentenstruktur

#### 2.1 ProfilePage.jsx aufteilen (895 LOC → ~5 Dateien)

**Zielstruktur:**
```
src/pages/ProfilePage/
├── ProfilePage.jsx                   (~150 LOC) – Container/Layout
├── ProfilePage.module.scss           (behalten)
├── components/
│   ├── ProfileHeader.jsx             (~80 LOC)
│   ├── ProfileEmailSection.jsx       (~200 LOC) – Email-Management
│   ├── ProfilePasswordSection.jsx    (~150 LOC) – Passwort ändern
│   ├── ProfileDeleteSection.jsx      (~100 LOC) – Account löschen
│   └── ProfileModals.jsx             (~200 LOC) – Alle Modals
└── hooks/
    └── useProfileForm.js             (~100 LOC) – Form-Logik
```

**Vorgehen:**

1. Custom Hook `useProfileForm.js` für Form-State extrahieren
2. Email-Management (Add/Remove/Verify) in eigene Komponente
3. Passwort-Änderung in eigene Komponente
4. Modals in separate Datei (oder einzeln)
5. Hauptkomponente orchestriert nur noch

#### 2.2 DashboardCharts.jsx modularisieren (570 LOC → ~4 Dateien)

**Zielstruktur:**
```
src/components/dashboard/DashboardCharts/
├── DashboardCharts.jsx               (~100 LOC) – Container
├── DashboardCharts.module.scss       (behalten)
├── components/
│   ├── TrendChart.jsx                (~150 LOC) – ComposedChart
│   ├── CategoryPieChart.jsx          (~120 LOC) – PieChart
│   ├── ChartTooltip.jsx              (~60 LOC) – Custom Tooltip
│   └── ChartLegend.jsx               (~50 LOC) – Custom Legend
└── utils/
    └── chartConfig.js                (~80 LOC) – CHART_TOKENS, Styles
```

#### 2.3 MultiStepRegisterForm.jsx aufteilen (656 LOC → ~5 Dateien)

**Zielstruktur:**
```
src/components/auth/MultiStepRegisterForm/
├── MultiStepRegisterForm.jsx              (~120 LOC) – Controller
├── MultiStepRegisterForm.module.scss      (behalten)
├── steps/
│   ├── PersonalInfoStep.jsx               (~150 LOC) – Schritt 1
│   ├── PasswordStep.jsx                   (~180 LOC) – Schritt 2
│   └── TermsStep.jsx                      (~100 LOC) – Schritt 3
├── components/
│   ├── PasswordStrengthIndicator.jsx      (~80 LOC)
│   └── StepIndicator.jsx                  (~50 LOC)
└── hooks/
    └── useRegistration.js                 (~100 LOC) – Form/Validation
```

#### 2.4 ExportSection.jsx aufteilen (665 LOC)

**Zielstruktur:**
```
src/components/settings/ExportSection/
├── ExportSection.jsx                 (~100 LOC) – Container
├── ExportSection.module.scss         (behalten)
└── components/
    ├── ExportFormatSelector.jsx      (~100 LOC)
    ├── ExportDateRange.jsx           (~120 LOC)
    ├── ExportPreview.jsx             (~150 LOC)
    └── ExportActions.jsx             (~80 LOC)
```

#### 2.5 TransactionContext.jsx refaktorieren (506 LOC)

**Zielstruktur:**
```
src/context/
├── TransactionContext.jsx            (~80 LOC) – Nur Provider
└── transaction/
    ├── transactionReducer.js         (~150 LOC) – Reducer
    ├── transactionActions.js         (~100 LOC) – Action Creators
    ├── transactionTypes.js           (~30 LOC) – Action Types
    └── useTransactionActions.js      (~150 LOC) – Custom Hook
```

#### 2.6 AuthContext.jsx refaktorieren (438 LOC)

**Zielstruktur:**
```
src/context/
├── AuthContext.jsx                   (~80 LOC) – Nur Provider
└── auth/
    ├── authReducer.js                (~100 LOC)
    ├── authActions.js                (~80 LOC)
    ├── authTypes.js                  (~20 LOC)
    └── useAuthActions.js             (~120 LOC)
```

---

### PHASE 3: Styling-Konsolidierung

#### 3.1 Hardcoded Werte durch Tokens ersetzen

**Betroffene Dateien (aus Audit):**
- `AuthLayout.module.scss` – 12 hardcoded rgba()
- `ResetPasswordForm.module.scss` – rgba(255, 255, 255, 0.3)
- `ForgotPasswordRequestForm.module.scss` – rgba(255, 255, 255, 0.3)

**Vorgehen:**

1. Neue Tokens in `variables.scss` ergänzen:
```scss
:root {
  --glass-white-15: rgba(255, 255, 255, 0.15);
  --glass-white-30: rgba(255, 255, 255, 0.3);
  --glass-black-15: rgba(0, 0, 0, 0.15);
  --glass-black-20: rgba(0, 0, 0, 0.2);
}
```

2. In allen betroffenen Dateien ersetzen

#### 3.2 !important systematisch entfernen (49 Vorkommen)

**Kategorien:**

| Kategorie | Dateien | Vorgehen |
|-----------|---------|----------|
| Accessibility | `accessibility.scss` | **BEHALTEN** – Notwendig für Screenreader |
| Utility Classes | `_responsive.scss` | **BEHALTEN** – Utilities benötigen !important |
| Animations | `animations.scss` | Prüfen, ggf. Spezifität erhöhen |
| Component Overrides | `DashboardCharts.module.scss`, `MainLayout.module.scss` | Spezifität erhöhen |

**Sichere Entfernungen (~25 von 49):**
- Component-Module: CSS Modules haben bereits hohe Spezifität
- Layout-Overrides: Selektoren präziser machen

#### 3.3 SCSS-Duplikate konsolidieren

**Neue Mixins in `mixins.scss`:**

```scss
// Form-Gruppe (wiederkehrend in auth-Formularen)
@mixin form-group {
  margin-bottom: var(--space-lg);
  
  label {
    display: block;
    margin-bottom: var(--space-sm);
    font-weight: var(--fw-m);
  }
}

// Glass-Card (wiederkehrend in AuthLayout, Modals)
@mixin glass-card {
  background: linear-gradient(
    135deg,
    var(--glass-white-15) 0%,
    var(--glass-white-05) 100%
  );
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-white-10);
  border-radius: var(--r-xl);
}

// Focus-Ring (konsistent)
@mixin focus-ring {
  &:focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }
}
```

---

### PHASE 4: i18n & Übersetzungen

#### 4.1 translations.js aufteilen (2895 LOC → Namespaces)

**Zielstruktur:**
```
src/i18n/
├── index.js                    (~50 LOC) – i18n-Konfiguration
├── locales/
│   ├── de/
│   │   ├── common.json         (~200 Zeilen)
│   │   ├── auth.json           (~300 Zeilen)
│   │   ├── dashboard.json      (~200 Zeilen)
│   │   ├── transactions.json   (~250 Zeilen)
│   │   ├── settings.json       (~200 Zeilen)
│   │   ├── profile.json        (~300 Zeilen)
│   │   └── validation.json     (~150 Zeilen)
│   └── en/
│       ├── common.json
│       ├── auth.json
│       └── ... (analog)
```

**Vorgehen:**

1. JSON-Dateien aus `translations.js` extrahieren
2. `i18n/index.js` auf Backend-basiertes Loading umstellen:

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'de',
    ns: ['common', 'auth', 'dashboard', 'transactions', 'settings', 'profile', 'validation'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

3. Vite-Config für Static Assets anpassen

---

### PHASE 5: Testing & Qualitätssicherung

#### 5.1 Unit-Tests für kritische Komponenten

**Priorität 1 – Custom Hooks:**
```
src/hooks/__tests__/
├── useAuth.test.js
├── useForm.test.js
├── useDebounce.test.js
└── useLocalStorage.test.js
```

**Priorität 2 – Utility-Funktionen:**
```
src/utils/__tests__/
├── formatters.test.js
├── validators.test.js
└── helpers.test.js
```

**Priorität 3 – Kritische Komponenten:**
```
src/components/__tests__/
├── Button.test.jsx
├── Input.test.jsx
└── Toast.test.jsx
```

#### 5.2 API-Tests (Backend)

**Installation:**
```bash
cd finora-smart-finance-api
npm install -D jest supertest
```

**Teststruktur:**
```
finora-smart-finance-api/
├── __tests__/
│   ├── auth.test.js
│   ├── transactions.test.js
│   └── users.test.js
```

#### 5.3 E2E-Tests nach Refactoring prüfen

Bestehende Playwright-Tests durchlaufen lassen:
```bash
npx playwright test
```

---

### PHASE 6: Dokumentation & Cleanup

#### 6.1 READMEs aktualisieren

- `finora-smart-finance-frontend/README.md` erstellen
- Root `README.md` mit aktuellem Architektur-Diagramm

#### 6.2 JSDoc für alle neuen Module

**Beispiel:**
```javascript
/**
 * @module services/authService
 * @description Geschäftslogik für Authentifizierung
 */

/**
 * Generiert ein Access-Token für einen User
 * @param {Object} user - Mongoose User-Dokument
 * @returns {string} JWT Access-Token
 */
function signAccessToken(user) {
  // ...
}
```

#### 6.3 CHANGELOG erstellen

```markdown
# Changelog

## [2.1.0] - 2026-XX-XX

### Changed
- Backend: auth.js in Controller/Service/Validation aufgeteilt
- Backend: transactions.js modularisiert
- Frontend: ProfilePage in Subkomponenten aufgeteilt
- Frontend: DashboardCharts modularisiert
- Frontend: MultiStepRegisterForm aufgeteilt
- Frontend: Kontexte (Auth, Transaction) refaktoriert
- Styling: !important-Nutzung reduziert (49 → ~15)
- Styling: Hardcoded Werte durch Tokens ersetzt
- i18n: Übersetzungen in Namespaces aufgeteilt

### Added
- Prettier-Konfiguration
- Unit-Tests für Hooks und Utilities
- API-Tests für Backend

### Fixed
- SCSS-Duplikate konsolidiert
```

---

## 6. Risiken & Abhängigkeiten

### 6.1 Risikomatrix

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|--------|-------------------|------------|------------|
| Import-Pfade brechen nach Refactoring | Hoch | Hoch | Alias-Pfade (`@/`) nutzen, IDE-Refactoring |
| SCSS-Styles nach Umbenennung kaputt | Mittel | Mittel | Manuelles Testing nach jeder Phase |
| E2E-Tests schlagen fehl | Mittel | Mittel | Nach Phase 2 und 3 jeweils E2E-Suite laufen lassen |
| Backend-API-Änderungen brechen Frontend | Niedrig | Hoch | Backend zuerst refaktorieren, API-Verträge beibehalten |

### 6.2 Abhängigkeiten

```
Phase 0 ────────────────────────────────────────────────┐
    │                                                   │
    ├──► Phase 1 (Backend) ─────────────────────────────┤
    │                                                   │
    ├──► Phase 2 (Frontend Struktur) ───────────────────┤
    │         │                                         │
    │         ├──► Phase 3 (Styling) ───────────────────┤
    │         │                                         │
    │         └──► Phase 4 (i18n) ──────────────────────┤
    │                                                   │
    └──► Phase 5 (Testing) ─────────────────────────────┤
                                                        │
                                 Phase 6 (Doku) ◄───────┘
```

---

## 7. Erfolgskriterien

### 7.1 Quantitative Ziele

| Metrik | Vorher | Nachher | Ziel erreicht? |
|--------|--------|---------|----------------|
| Größte JS-Datei (Backend) | 900 LOC | < 250 LOC | ☐ |
| Größte JSX-Datei (Frontend) | 895 LOC | < 250 LOC | ☐ |
| !important-Vorkommen | 49 | < 20 | ☐ |
| Hardcoded Farben in Modulen | 16 | 0 | ☐ |
| translations.js LOC | 2895 | 0 (aufgeteilt) | ☐ |
| Unit-Test-Coverage (Hooks) | 0% | > 60% | ☐ |

### 7.2 Qualitative Ziele

- [ ] Jede Datei hat eine klar definierte Verantwortlichkeit
- [ ] Neue Entwickler können einzelne Module isoliert verstehen
- [ ] Styling-Änderungen erfordern nur Token-Anpassungen
- [ ] Alle E2E-Tests laufen nach Refactoring durch
- [ ] Build-Zeit bleibt stabil oder verbessert sich

---

## Nächste Schritte

1. **Entscheidung:** Welche Phase zuerst? (Empfehlung: Phase 0 → Phase 1 → Phase 2)
2. **Branching-Strategie:** Feature-Branch pro Phase oder pro Commit?
3. **Review-Prozess:** Nach jeder Phase Review oder am Ende?

---

*Dieser Plan ersetzt den ursprünglichen Fix-Plan in `PROJECT_AUDIT_REPORT.md` ab Zeile 206.*
