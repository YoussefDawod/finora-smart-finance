<div align="center">

# 🎨 Finora Frontend

**React 19 • Vite 7 • SCSS Modules • Recharts**

![React](https://img.shields.io/badge/react-19-blue?style=for-the-badge)
![Vite](https://img.shields.io/badge/vite-7-646cff?style=for-the-badge)
![Tests](https://img.shields.io/badge/tests-1176_passing-00d084?style=for-the-badge)

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
| **Styling** | SCSS Modules, CSS Variables |
| **UI** | Recharts 2, Framer Motion 11 |
| **i18n** | i18next (DE, EN, AR, KA) |
| **Validation** | Zod |
| **Testing** | Vitest 4, React Testing Library |

---

## 📁 Struktur

```
src/
├── api/              # Axios Client + Services
├── components/       # React Components
│   ├── auth/         # Login, Register
│   ├── common/       # Button, Input, Modal
│   ├── dashboard/    # Charts, Summary Cards
│   ├── transactions/ # TransactionForm, List
│   ├── admin/        # AdminStatCard, Tables, DetailModals
│   └── layout/       # MainLayout, AdminLayout, Sidebar
├── hooks/            # Custom Hooks (inkl. useAdmin*)
├── context/          # Auth, Theme, Toast Context
├── pages/            # Route Pages
│   └── admin/        # Dashboard, Users, Transactions, Subscribers, AuditLog
├── styles/           # SCSS + Design Tokens
├── i18n/             # 4 Sprachen (HTTP Backend)
└── utils/            # Helpers, Validators
```

---

## 🧪 Testing

```bash
npm run test              # Alle Tests
npm run test:ui           # Interactive UI
npm run test:coverage     # Coverage Report
```

| Bereich | Coverage |
|---------|----------|
| Hooks | ~82% |
| Utils | ~66% |
| Validators | 100% |
| Admin Panel | 57 Suites |
| **Gesamt** | **1176 Tests, 57 Suites** |

---

## 🎨 Design System

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

---

## 🌐 Internationalization

| Sprache | Code | RTL |
|---------|------|-----|
| 🇩🇪 Deutsch | de | ❌ |
| 🇬🇧 English | en | ❌ |
| 🇸🇦 العربية | ar | ✅ |
| 🇬🇪 ქართული | ka | ❌ |

---

## 📋 Scripts

| Command | Beschreibung |
|---------|--------------|
| `npm run dev` | Dev Server |
| `npm run build` | Production Build |
| `npm run preview` | Preview Build |
| `npm run test` | Tests |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## 🔗 Links

- [📖 Backend Docs](../finora-smart-finance-api/README.md)
- [📝 Changelog](../CHANGELOG.md)
- [🐛 Issues](https://github.com/YoussefDawod/expense-tracker/issues)

---

<div align="center">

**Made with ❤️ by Youssef Dawod**

</div>
