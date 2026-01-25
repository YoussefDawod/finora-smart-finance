# Changelog

Alle wichtigen Änderungen an diesem Projekt werden hier dokumentiert.

Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

## [2.1.0] - 2025-01-XX

### 🏗️ Refactoring

#### Backend (Phase 1)
- **auth.js** in Controller/Service/Validator Pattern aufgeteilt:
  - `src/controllers/authController.js` - Route-Handler
  - `src/services/authService.js` - Business-Logik
  - `src/validators/authValidation.js` - Input-Validierung
- **transactions.js** modularisiert:
  - `src/controllers/transactionController.js`
  - `src/services/transactionService.js`
  - `src/validators/transactionValidation.js`
- **emailService.js** verbessert mit Template-System

#### Frontend Context (Phase 2)
- **TransactionContext** aufgeteilt:
  - `context/transactionReducer.js` - State-Logik
  - `hooks/useTransactions.js` - API-Integration
- **AuthContext** refaktoriert:
  - `context/authReducer.js` - State-Logik
  - `hooks/useAuth.js` - Auth-Logik

#### Frontend Components (Phase 3)
- **DashboardCharts.jsx** (570 → 341 LOC):
  - `hooks/useDashboardChartData.js` - Daten-Transformation
  - `hooks/useCssVariables.js` - CSS-Variablen-Auflösung
  - `components/dashboard/charts/PieChartCard.jsx`
  - `components/dashboard/charts/LineChartCard.jsx`
  - `components/dashboard/charts/BarChartCard.jsx`
  - `components/dashboard/charts/ChartTooltip.jsx`
- **TransactionForm.jsx** (315 → 201 LOC):
  - `hooks/useTransactionForm.js` - Form-Logik
  - `validators/transactionFormSchema.js` - Zod-Schema

#### i18n (Phase 4)
- **translations.js** in JSON-Dateien extrahiert:
  - `public/locales/de/translation.json`
  - `public/locales/en/translation.json`
  - `public/locales/ar/translation.json`
  - `public/locales/ka/translation.json`
- i18next HTTP-Backend für dynamisches Laden

### 🧪 Testing (Phase 5)

#### Frontend (Vitest) - 69 Tests
- **Hooks Tests:**
  - `useDebounce.test.js` - 6 Tests
  - `useLocalStorage.test.js` - 11 Tests
  - `useForm.test.js` - 16 Tests
- **Utility Tests:**
  - `validators.test.js` - 31 Tests
  - `formatters.test.js` - 5 Tests

#### Backend (Jest) - 50 Tests
- **Validation Tests:**
  - `authValidation.test.js` - 20 Tests
  - `transactionValidation.test.js` - 29 Tests

### 🛠️ Tooling (Phase 0)

#### Hinzugefügt
- **Prettier** für konsistente Code-Formatierung
  - `.prettierrc` Konfiguration
  - Integration mit ESLint
- **Husky** für Git Hooks
  - Pre-commit Hook für Linting
- **lint-staged** für inkrementelles Linting
- **Vitest** als Frontend Test-Runner
  - `vitest.config.js`
  - JSDOM-Umgebung
  - React Testing Library
- **Jest** für Backend-Tests
  - `jest.config.js`
  - Supertest für API-Tests

### 📄 Dokumentation (Phase 6)

- `README.md` komplett überarbeitet:
  - Monorepo-Struktur visualisiert
  - Tech-Stack-Tabellen
  - API-Endpunkte dokumentiert
  - Architektur-Diagramme
- `finora-smart-finance-frontend/README.md` erstellt:
  - Folder-Struktur
  - Scripts-Dokumentation
  - Design-System
  - Testing-Guide
- `CHANGELOG.md` erstellt

### 🐛 Bugfixes

- **Chart-Farben im Dark Mode:** CSS-Variablen werden jetzt zur Laufzeit aufgelöst
  - Problem: Recharts ignorierte `var(--color)` in SVG-Elementen
  - Lösung: `useCssVariables` Hook mit MutationObserver

### ⚡ Performance

- Bundle-Größe reduziert: ~600KB → ~500KB (-17%)
- Dynamisches i18n-Laden (nur aktive Sprache)
- Code Splitting für:
  - Recharts (~150KB)
  - Framer Motion (~100KB)
  - Axios (~25KB)

---

## [2.0.0] - 2024-XX-XX

### Hinzugefügt
- React 19 Upgrade
- Vite 7 als Build-Tool
- SCSS Modules für Styling
- i18n Support (DE, EN, AR, KA)
- Dark/Light Mode
- JWT Refresh Token Flow
- Transaction Statistics API

### Geändert
- Express 4 → Express 5
- Mongoose 8 → Mongoose 9
- Komplett neues UI-Design

---

## [1.0.0] - 2024-XX-XX

### Initiales Release
- Basic CRUD für Transaktionen
- User-Authentifizierung (JWT)
- MongoDB-Integration
- React Frontend mit Bootstrap
