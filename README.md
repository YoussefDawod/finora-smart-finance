<div align="center">

# 💰 Finora Smart Finance

**Intelligente Finanzverwaltung für moderne Menschen**

![Status](https://img.shields.io/badge/status-production--ready-00d084?style=for-the-badge)
![License](https://img.shields.io/badge/license-ISC-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.1.0-purple?style=for-the-badge)

---

[🎬 Live Demo](#) • [📖 Frontend Docs](./finora-smart-finance-frontend/README.md) • [⚙️ Backend Docs](./finora-smart-finance-api/README.md) • [🐛 Issues](https://github.com/YoussefDawod/expense-tracker/issues)

</div>

---

## 🚀 Überblick

**Finora** ist eine Enterprise-ready Finanz-Management-Plattform, die dir hilft, deine Einnahmen und Ausgaben intelligent zu verwalten. Mit wunderschönem Design, Echtzeit-Analysen und Bank-Level Sicherheit.

### 🎯 Die Finora Philosophie

> **Finanzen sollten nicht kompliziert sein.**
>
> 🎨 **Wunderschönes Design** – Freude statt Frustration  
> 🤖 **Intelligente Automatisierung** – Weniger manuelle Arbeit  
> 📊 **Echte Insights** – Nicht nur Zahlen, sondern Verständnis  
> 🔐 **Vollständige Sicherheit** – Deine Daten in sicheren Händen

---

## ⭐ Kernfunktionen

| Feature | Beschreibung |
|---------|-------------|
| 📊 **Smart Dashboard** | Echtzeit-Statistiken, Charts (Pie, Bar, Line), Trend-Analyse |
| 💰 **Transaktions-Management** | Schnelles Hinzufügen, automatische Kategorisierung, Tags |
| 🎯 **Sparziele & Budgets** | Budget-Limits, Progress Tracking, Notifikationen |
| 🔐 **Admin Panel** | Dashboard, User-Management, Transaktions-Übersicht, Newsletter, Audit-Log |
| 🌍 **4 Sprachen** | Deutsch, English, العربية, ქართული (RTL Support) |
| 🔐 **Bank-Level Sicherheit** | JWT Auth, Bcrypt Hashing, Rate Limiting |
| 🌙 **Dark Mode** | Framer Motion Animationen |

---

## 💎 Warum Finora?

| ✨ | Vorteil | Details |
|---|---------|---------|
| 💎 | **Premium UX** | WCAG 2.1 AA, flüssige Animationen, durchdachte Patterns |
| 🚀 | **Developer-Friendly** | 1638+ Unit Tests, MVC-Pattern |
| 🌍 | **Global Ready** | 4 Sprachen, HTTP i18n Backend, Multi-Currency |
| 🔧 | **Production-Ready** | GitHub Actions CI/CD, ESLint, Prettier |

---

## ⚡ Quick Start

```bash
# 1️⃣ Repository klonen
git clone https://github.com/YoussefDawod/expense-tracker.git
cd expense-tracker

# 2️⃣ Dependencies installieren
npm install

# 3️⃣ Environment konfigurieren
cd finora-smart-finance-api
cp .env.example .env
# MONGODB_URI eintragen
cd ..

# 4️⃣ Starten
npm run dev:frontend &    # React 🎨 Port 3000
npm run dev:api &         # Express ⚙️ Port 5000
```

✅ Öffne **http://localhost:3000**

---

## 📊 Tech Stack

| Layer | Technologie |
|-------|-------------|
| **Frontend** | React 19, Vite 7, SCSS Modules, Recharts, Framer Motion |
| **Backend** | Express 5, MongoDB, Mongoose, JWT, Bcrypt |
| **Testing** | Vitest (1176 Tests), Jest (462 Tests) |
| **Quality** | ESLint 9, Prettier 3, Husky, GitHub Actions |

---

## 🧪 Testing & Qualität

```bash
npm run test              # Alle Tests
npm run test:frontend     # Frontend (Vitest)
npm run test:api          # Backend (Jest)
npm run lint              # Code-Qualität
```

| Metric | Wert |
|--------|------|
| **Unit Tests** | 1638+ (1176 Frontend + 462 Backend) |
| **Test Suites** | 79 (57 Frontend + 22 Backend) |
| **ESLint Errors** | 0 |
| **Build Size** | ~500KB |

---

## 🔒 Sicherheit

| Feature | Beschreibung |
|---------|-------------|
| 🔐 **JWT Auth** | Access (15min) + Refresh (7d) Tokens |
| 🔒 **Bcrypt** | 10 Rounds Password Hashing |
| 🛡️ **CORS** | Whitelist erlaubter Origins |
| ⏱️ **Rate Limiting** | Schutz vor Brute-Force |
| ✅ **Validation** | Zod Schema + MongoDB Validation |

---

## 🤝 Beitragen

```bash
# Fork & Clone
git clone https://github.com/YOUR_USERNAME/expense-tracker.git

# Feature Branch
git checkout -b feature/amazing-feature

# Entwickeln & Testen
npm run test && npm run lint

# Commit & Push
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
```

**Merge-Anforderungen:** ✅ Tests grün • ✅ ESLint clean • ✅ Build erfolgreich

---

## 📚 Dokumentation

| Dokument | Beschreibung |
|----------|-------------|
| [Frontend README](./finora-smart-finance-frontend/README.md) | React, Hooks, Design System |
| [Backend README](./finora-smart-finance-api/README.md) | Express, API Endpoints, Admin CLI |
| [Admin API Reference](./finora-smart-finance-api/docs/ADMIN_API.md) | Admin Endpoints |
| [Changelog](./CHANGELOG.md) | Alle Änderungen |

---

## 📞 Support

| | |
|---|---|
| 🐛 **Bugs** | [GitHub Issues](https://github.com/YoussefDawod/expense-tracker/issues) |
| 💬 **Fragen** | [GitHub Discussions](https://github.com/YoussefDawod/expense-tracker/discussions) |
| 📧 **Kontakt** | contact@example.com |

---

## 📄 Lizenz

**ISC License** © 2026 Youssef Dawod

---

<div align="center">

**Made with ❤️ by Youssef Dawod**

⭐ **Gefällt dir Finora? Gib uns einen Star!** ⭐

</div>
