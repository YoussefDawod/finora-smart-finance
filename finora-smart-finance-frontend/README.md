<div align="center">

# 🎨 Finora Frontend

**React 19 • Vite 7 • SCSS Modules • Recharts**

![React](https://img.shields.io/badge/react-19-blue?style=for-the-badge)
![Vite](https://img.shields.io/badge/vite-7-646cff?style=for-the-badge)
![Tests](https://img.shields.io/badge/tests-69_passing-00d084?style=for-the-badge)

Modernes Frontend mit Glass-Morphism Design, 4 Sprachen & Dark Mode.

[⬅️ Zurück zum Hauptprojekt](../README.md)

</div>

---

## 🚀 Quick Start

```bash
# Dependencies installieren
npm install

# Dev Server (Port 3000)
npm run dev

# Production Build
npm run build

# Tests ausführen
npm run test
```

---

## 🛠️ Tech Stack

**Core:**
- React 19 – Latest React mit Compiler
- Vite 7 – ~500KB Bundle
- SCSS Modules – Scoped Styling
- React Router 6 – Client-side Routing

**UI/UX:**
- Recharts 2 – Interactive Charts
- Framer Motion 11 – Smooth Animations
- CSS Variables – Design System

**i18n & Validation:**
- i18next – 4 Sprachen (DE, EN, AR, KA)
- Zod – Schema Validation

**Testing:**
- Vitest 4 – Unit Tests (69 passing)
- React Testing Library – Component Tests

---

## 📁 Projekt-Struktur

> [!NOTE]
> ```
> src/
> ├── api/              # Axios Client + Services
> ├── components/       # React Components
> │   ├── auth/         # Login, Register
> │   ├── common/       # Button, Input, Modal
> │   ├── dashboard/    # Charts, Cards
> │   └── transactions/ # TransactionForm, List
> ├── hooks/            # Custom Hooks (useAuth, useForm, etc.)
> ├── context/          # React Context (Auth, Theme, Toast)
> ├── pages/            # Route Pages
> ├── styles/           # SCSS Modules + Design Tokens
> ├── i18n/             # 4 Sprachen (HTTP Backend)
> └── utils/            # Helpers, Validators, Formatters
> ```

---

## 🧪 Testing

> [!TIP]
> ```bash
> npm run test              # Alle Tests
> npm run test:ui           # Interactive UI
> npm run test:coverage     # Mit Coverage Report
> ```
> 
> **Test Coverage:**
> - Hooks: ~82%
> - Utils: ~66%
> - Validators: 100%

---

## 🎨 Design System

> [!NOTE]
> ### CSS Variables (Design Tokens)
> 
> ```scss
> // Brand Colors
> --primary: #4f46e5;    // Indigo
> --secondary: #22c55e;  // Green
> --accent: #14b8a6;     // Teal
> 
> // Semantic Colors
> --success: #10b981;
> --error: #ef4444;
> --warning: #f59e0b;
> 
> // Spacing Scale
> --space-xs: 0.5rem;
> --space-md: 1rem;
> --space-lg: 1.5rem;
> 
> // Typography
> --fs-sm: 0.875rem;
> --fs-md: 1rem;
> --fs-lg: 1.125rem;
> ```
> 
> ### Themes
> 
> ✅ Light Mode (Default)  
> ✅ Dark Mode  
> ✅ Glass-Morphism Effects  
> ✅ System Preference Detection

---

## 🌐 Internationalization

<div style="background: linear-gradient(135deg, #fef3c7 0%, #fef08a 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #ca8a04; margin: 15px 0;">

**Unterstützte Sprachen:**
> [!IMPORTANT]
> **Unterstützte Sprachen:**
> 
> 🇩🇪 **Deutsch** (de)  
> 🇬🇧 **English** (en)  
> 🇸🇦 **العربية** (ar) – RTL Support  
> 🇬🇪 **ქართული** (ka)
> 
> **i18next HTTP Backend** – Translations on-demand laden
## 📋 Verfügbare Scripts

| Command | Beschreibung |
|---------|--------------|
| `npm run dev` | Dev Server starten (Port 3000) |
| `npm run build` | Production Build |
| `npm run preview` | Preview Production Build |
| `npm run test` | Tests ausführen |
| `npm run test:ui` | Vitest UI öffnen |
| `npm run lint` | ESLint Check |
| `npm run format` | Prettier Format |

---

## 🔗 Wichtige Links

- [📖 API Dokumentation](../finora-smart-finance-api/README.md)
- [📝 Changelog](../CHANGELOG.md)
- [🐛 Issues](https://github.com/YoussefDawod/expense-tracker/issues)

---

<div align="center">

**Made with ❤️ by Youssef Dawod**

[⬆️ Back to Top](#-finora-frontend)

</div>
