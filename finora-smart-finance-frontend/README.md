# Finora Smart Finance – Frontend

> 🎨 Modernes React 19 Frontend mit Vite + SCSS Modules

## 🛠️ Tech Stack

- **React 19** – Latest React with improved performance
- **Vite 7** – Lightning-fast build tool
- **SCSS Modules** – Scoped styling with design tokens
- **React Router 6** – Client-side routing
- **React Query (TanStack)** – Server state management
- **Recharts** – Interactive charts & visualizations
- **Framer Motion** – Smooth animations
- **i18next** – Internationalization (de/en/ar/ka)
- **Zod** – Schema validation

## 📁 Struktur

```
src/
├── api/                    # API-Client & Services
│   ├── client.js           # Axios instance with interceptors
│   ├── authService.js      # Auth API calls
│   ├── transactionService.js
│   └── userService.js
├── components/
│   ├── auth/               # Login, Register, Password forms
│   ├── common/             # Button, Input, Modal, Toast, etc.
│   ├── dashboard/          # SummaryCards, Charts
│   ├── layout/             # Navbar, Sidebar, Footer
│   ├── settings/           # Theme, Export, Profile sections
│   └── transactions/       # TransactionForm, TransactionList
├── config/                 # App configuration
├── context/                # React Context (Auth, Theme, Toast)
│   ├── AuthContext.jsx
│   ├── ThemeContext.jsx
│   └── TransactionContext.jsx
├── hooks/                  # Custom Hooks
│   ├── useAuth.js
│   ├── useDebounce.js
│   ├── useCssVariables.js
│   ├── useForm.js
│   ├── useLocalStorage.js
│   └── useTransactions.js
├── i18n/                   # Internationalization
│   └── index.js            # i18next config with http-backend
├── pages/                  # Route components
│   ├── AuthPage/
│   ├── DashboardPage.jsx
│   ├── ProfilePage/
│   ├── SettingsPage/
│   └── TransactionsPage.jsx
├── styles/                 # Global styles
│   ├── _variables.scss     # Design tokens
│   ├── mixins.scss         # SCSS mixins
│   ├── themes/             # Light/Dark themes
│   └── index.scss          # Entry point
├── utils/                  # Utility functions
│   ├── formatters.js       # Currency, date formatting
│   ├── validators.js       # Input validation
│   └── helpers.js          # General helpers
└── test/                   # Test setup
    └── setup.js            # Vitest configuration
```

## 🚀 Schnellstart

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Production Build
npm run build

# Tests ausführen
npm run test

# Tests mit Coverage
npm run test:coverage
```

## 🧪 Testing

- **Vitest** – Unit testing framework
- **React Testing Library** – Component testing
- **Jest-DOM** – DOM assertions

```bash
npm run test           # Run tests
npm run test:ui        # Interactive UI
npm run test:coverage  # With coverage report
```

### Test Coverage

| Bereich | Coverage |
|---------|----------|
| Hooks | ~82% |
| Utils | ~66% |
| Validators | 100% |

## 🎨 Design System

### CSS Variables (Design Tokens)

```scss
// Farben
--primary: #4f46e5;
--success: #10b981;
--error: #ef4444;
--warning: #f59e0b;

// Spacing
--space-xs: 0.25rem;
--space-sm: 0.5rem;
--space-md: 1rem;
--space-lg: 1.5rem;

// Typography
--fs-xs: 0.75rem;
--fs-sm: 0.875rem;
--fs-md: 1rem;
--fs-lg: 1.25rem;
```

### Theme Support

- Light Mode (default)
- Dark Mode
- Glass Effects (optional)
- System preference detection

## 🌐 i18n (Internationalization)

Unterstützte Sprachen:
- 🇩🇪 Deutsch (de)
- 🇬🇧 English (en)
- 🇸🇦 العربية (ar) – RTL
- 🇬🇪 ქართული (ka)

Übersetzungen werden dynamisch via HTTP-Backend geladen:
```
public/locales/{lang}/translation.json
```

## 📦 Build & Bundle

### Chunks (Code Splitting)

| Chunk | Beschreibung |
|-------|--------------|
| vendor | React, React-DOM, Router |
| motion | Framer Motion |
| charts | Recharts |
| icons | React Icons |
| axios | HTTP Client |

### Bundle-Größe

- Main Bundle: ~500 KB (gzipped: ~148 KB)
- CSS: ~248 KB (gzipped: ~39 KB)

## 🔧 Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm run dev` | Entwicklungsserver (Port 3000) |
| `npm run build` | Production Build |
| `npm run preview` | Preview Production Build |
| `npm run lint` | ESLint prüfen |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier formatieren |
| `npm run test` | Tests ausführen |

## 📝 Lizenz

ISC © Youssef Dawod
