<div align="center">

# 🎨 Finora Frontend

**React 19 • Vite 7 • SCSS Modules • Recharts • PWA**

![React](https://img.shields.io/badge/react-19-blue?style=for-the-badge)
![Vite](https://img.shields.io/badge/vite-7-646cff?style=for-the-badge)
![Tests](https://img.shields.io/badge/tests-1708_passing-00d084?style=for-the-badge)

[⬅️ Zurück zum Hauptprojekt](../README.md)

</div>

---

## 🚀 Quick Start

```bash
npm install          # Dependencies
npm run dev          # Dev Server (Port 3000)
npm run build        # Production Build
npm run test         # Tests ausführen
```

---

## 🛠️ Tech Stack

| Bereich | Technologie |
|---------|-------------|
| **Core** | React 19, Vite 7, React Router 6 |
| **Styling** | SCSS Modules, CSS Variables, Glass-Morphism Design |
| **UI** | Recharts 2, Framer Motion 11 |
| **i18n** | i18next (DE, EN, AR, KA) mit HTTP Backend |
| **Validation** | Zod |
| **PDF** | jsPDF + jsPDF-AutoTable |
| **PWA** | VitePWA (Workbox, Service Worker) |
| **Testing** | Vitest 4, React Testing Library, Playwright (E2E) |

---

## 📁 Struktur

```
src/
├── api/              # Axios Client, Services, Error Handler, Token Refresh
├── components/
│   ├── admin/        # AdminStatCard, Tables, DetailModals, Charts, Campaigns
│   ├── auth/         # Login, Register, ForgotPassword, ResetPassword, VerifyEmail
│   ├── common/       # Button, Input, Modal, Toast, Filter, Search, CommandBar
│   ├── dashboard/    # HeroMetric, GlassPanel, FlowChart, BudgetBar, OrbitalRing
│   ├── feedback/     # FeedbackForm, FeedbackPrompt, ConsentDialog
│   ├── settings/     # BudgetSettings, ExportSection
│   ├── transactions/ # TransactionForm, List, CategoryPicker, Quota
│   ├── ui/           # SensitiveData
│   └── layout/       # MainLayout, AdminLayout, Sidebar
├── hooks/            # 28 Custom Hooks
├── context/          # Auth, Theme, Toast, Motion, CookieConsent, Transaction
├── pages/            # 24 Seiten (siehe unten)
├── config/           # Navigation, Kategorien, Admin-Navigation
├── constants/        # Animations, Breakpoints, Languages, Campaign Templates
├── styles/           # SCSS Design Tokens, Themes, Components, Utilities
├── i18n/             # 4 Sprachen (HTTP Backend)
├── validators/       # Password, Transaction Form Schema
└── utils/            # Formatter, Export, CategoryIcons, Retry, Preferences
```

---

## 📄 Seiten (24)

| Bereich | Seiten |
|---------|--------|
| **Marketing** | Landing Page, Features, Pricing, Blog, FAQ, About |
| **Auth** | Login, Register, Forgot Password, Reset Password, E-Mail Verifizierung |
| **App** | Dashboard, Transaktionen, Einstellungen, Profil, Kontakt |
| **Admin** | Dashboard, Users, Transaktionen, Subscribers, Campaigns, Feedbacks, Audit-Log, Lifecycle |
| **Legal** | Impressum, Datenschutz, AGB |
| **Sonstige** | Help, 404 Not Found |

---

## 🪝 Custom Hooks (28)

| Hook | Beschreibung |
|------|-------------|
| `useAuth` | Auth-State & Token-Management |
| `useTransactions` | CRUD-Operationen für Transaktionen |
| `useTransactionForm` | Formular-State für Transaktionen |
| `useBudget` | Budget-Tracking & Alerts |
| `useDashboardChartData` | Chart-Daten Aufbereitung |
| `useProfile` | User-Profil |
| `useFeedback` | Feedback-Submission |
| `useLifecycle` | Lifecycle-Features |
| `useAdmin*` | 8 Admin-Hooks (Dashboard, Users, Transactions, Subscribers, Campaigns, Feedbacks, AuditLog, Lifecycle) |
| `useTheme` | Dark/Light Mode |
| `useMotion` | Animations-Präferenzen |
| `useForm` | Generisches Formular-Management |
| `useDebounce` | Debounce-Utility |
| `useMediaQuery` | Responsive Breakpoints |
| `useClickOutside` | Click-outside Detection |
| `useOnlineStatus` | Online/Offline Status |
| `useAbortSignal` | Request Abort-Management |
| `useCookieConsent` | Cookie-Consent State |
| `useCssVariables` | CSS-Variable Management |
| `useViewerGuard` | Viewer-Rolle Schutz |
| `useToast` | Toast Notifications |

---

## 🧪 Testing

```bash
npm run test              # Alle Unit Tests
npm run test:ui           # Interactive UI
npm run test:coverage     # Coverage Report
npm run test:e2e          # Playwright E2E Tests
npm run test:e2e:headed   # E2E mit Browser-Fenster
npm run test:e2e:report   # E2E Report anzeigen
```

### Unit Tests (Vitest)

| Bereich | Suites |
|---------|--------|
| Hooks | 28 |
| Components | 40+ |
| Utils & Validators | 15+ |
| Pages | 10+ |
| **Gesamt** | **1708 Tests, 96 Suites** |

### E2E Tests (Playwright)

| Spec | Beschreibung |
|------|-------------|
| `auth.spec.js` | Login, Register, Passwort-Reset Flows |
| `dashboard.spec.js` | Dashboard Funktionalität |
| `transactions.spec.js` | Transaktions-Management |
| `settings.spec.js` | Einstellungen |
| `navigation.spec.js` | Navigation & Routing |
| `i18n.spec.js` | Sprachumschaltung |
| `responsive-a11y.spec.js` | Responsive Design & Accessibility |

---

## 🎨 Design System (Aurora Flow)

### CSS Variables

```scss
// Brand Colors
--primary: #4f46e5;
--secondary: #22c55e;
--accent: #14b8a6;

// Semantic
--success: #10b981;
--error: #ef4444;
--warning: #f59e0b;

// Spacing
--space-xs: 0.5rem;
--space-md: 1rem;
--space-lg: 1.5rem;
```

### Themes

| Theme | Status |
|-------|--------|
| Light Mode | ✅ Default |
| Dark Mode | ✅ Supported |
| System Preference | ✅ Auto-detect |

### Design Features

- Glass-Morphism Panels mit Backdrop-Blur
- Framer Motion Animationen (reduce-motion respektiert)
- SCSS Modules mit BEM-Naming
- WCAG 2.1 AA Konformität
- RTL Support für Arabisch

---

## 🌐 Internationalization

| Sprache | Code | RTL |
|---------|------|-----|
| 🇩🇪 Deutsch | de | ❌ |
| 🇬🇧 English | en | ❌ |
| 🇸🇦 العربية | ar | ✅ |
| 🇬🇪 ქართული | ka | ❌ |

---

## 📱 PWA

- **Offline-fähig** mit Workbox Service Worker
- **Installierbar** auf Desktop & Mobile
- **i18n Caching** (24h TTL für Übersetzungsdateien)
- **Navigation Fallback** für SPA-Routing
- **Auto-Update** Strategy

---

## 📋 Scripts

| Command | Beschreibung |
|---------|--------------|
| `npm run dev` | Dev Server (Port 3000) |
| `npm run build` | Production Build |
| `npm run preview` | Preview Build |
| `npm run test` | Vitest Unit Tests |
| `npm run test:ui` | Vitest Interactive UI |
| `npm run test:coverage` | Coverage Report |
| `npm run test:e2e` | Playwright E2E Tests |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## 🔗 Links

- [📖 Backend Docs](../finora-smart-finance-api/README.md)
- [🎨 Design System](../docs/Projekt-Design.md)
- [🐛 Issues](https://github.com/YoussefDawod/finora-smart-finance/issues)

---

<div align="center">

**Made with ❤️ by Yellow Developer**

</div>
