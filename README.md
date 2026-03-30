<div align="center">

# 💰 Finora Smart Finance

**Intelligente Finanzverwaltung für moderne Menschen**

![Status](https://img.shields.io/badge/status-production--ready-00d084?style=for-the-badge)
![License](https://img.shields.io/badge/license-ISC-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.1.0-purple?style=for-the-badge)

---

[📖 Frontend Docs](./finora-smart-finance-frontend/README.md) • [⚙️ Backend Docs](./finora-smart-finance-api/README.md) • [🐛 Issues](https://github.com/YoussefDawod/finora-smart-finance/issues)

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
| 📊 **Smart Dashboard** | Echtzeit-Statistiken, Charts (Area, Pie, Bar), Budget-Tracking, Orbital Savings Ring |
| 💰 **Transaktions-Management** | Schnelles Hinzufügen, Kategorisierung, Quota-Tracking, PDF-Export |
| 🎯 **Budgets & Alerts** | Budget-Limits pro Kategorie, Benachrichtigungen bei Überschreitung |
| 🔐 **Admin Panel** | Dashboard, User-Management, Transaktionen, Newsletter, Campaigns, Feedback, Audit-Log, Lifecycle |
| 🌍 **4 Sprachen** | Deutsch, English, العربية, ქართული (RTL Support) |
| 📧 **Newsletter & Campaigns** | Double-Opt-In, Template-basierte E-Mail-Kampagnen |
| 💬 **Kontakt & Feedback** | Kontaktformular mit Honeypot-Schutz, In-App Feedback-System |
| 🔐 **Bank-Level Sicherheit** | JWT Auth, Bcrypt Hashing, Rate Limiting, Helmet, HPP |
| 🌙 **Dark Mode** | Framer Motion Animationen, System-Preference Auto-Detect |
| 📱 **PWA** | Offline-fähig, installierbar, Service Worker mit Workbox |
| 🏠 **Landing Page** | Hero mit Device-Mockups, Features, How It Works, Testimonials, CTA |

---

## 💎 Warum Finora?

| ✨ | Vorteil | Details |
|---|---------|---------|
| 💎 | **Premium UX** | WCAG 2.1 AA, Glass-Morphism Design, flüssige Animationen |
| 🚀 | **Developer-Friendly** | 2811 Unit Tests, 8 E2E Tests, MVC-Pattern |
| 🌍 | **Global Ready** | 4 Sprachen, HTTP i18n Backend |
| 🔧 | **Production-Ready** | GitHub Actions CI/CD, ESLint, Prettier, Husky Pre-Commit |

---

## ⚡ Quick Start

```bash
# 1️⃣ Repository klonen
git clone https://github.com/YoussefDawod/finora-smart-finance.git
cd finora-smart-finance

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
| **Frontend** | React 19, Vite 7, SCSS Modules, Recharts, Framer Motion, PWA (Workbox) |
| **Backend** | Express 5, MongoDB, Mongoose 9, JWT, Bcrypt, Nodemailer |
| **Testing** | Vitest (1708 Tests), Jest (1103 Tests), Playwright (8 E2E Specs) |
| **Quality** | ESLint 9, Prettier 3, Husky, lint-staged, GitHub Actions CI/CD |

---

## 🧪 Testing & Qualität

```bash
npm run test              # Alle Unit Tests (Frontend + Backend)
npm run test:frontend     # Frontend (Vitest)
npm run test:api          # Backend (Jest)
npm run test:e2e          # E2E Tests (Playwright)
npm run lint              # Code-Qualität
```

| Metric | Wert |
|--------|------|
| **Unit Tests** | 2811 (1708 Frontend + 1103 Backend) |
| **Test Suites** | 140 (96 Frontend + 44 Backend) |
| **E2E Specs** | 8 (Playwright) |
| **ESLint Errors** | 0 |

---

## 🔒 Sicherheit

| Feature | Beschreibung |
|---------|-------------|
| 🔐 **JWT Auth** | Access (15min) + Refresh (7d) Tokens |
| 🔒 **Bcrypt** | 10 Rounds Password Hashing |
| 📧 **E-Mail-Verifizierung** | Double-Opt-In bei Registrierung |
| 🛡️ **CORS** | Whitelist erlaubter Origins |
| ⏱️ **Rate Limiting** | Schutz vor Brute-Force |
| 🧹 **MongoDB Sanitizer** | NoSQL-Injection-Schutz |
| 🪖 **Helmet & HPP** | HTTP-Header-Hardening |
| ✅ **Validation** | Zod Schema + Mongoose Validation |

---

## 🤝 Beitragen

```bash
# Fork & Clone
git clone https://github.com/YOUR_USERNAME/finora-smart-finance.git

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
| [Frontend README](./finora-smart-finance-frontend/README.md) | React, Hooks, Design System, PWA |
| [Backend README](./finora-smart-finance-api/README.md) | Express, API Endpoints, Admin CLI |
| [Admin API Reference](./finora-smart-finance-api/docs/ADMIN_API.md) | Admin Endpoints & Auth |
| [Design System](./docs/Projekt-Design.md) | Aurora Flow Design System |

---

## 📞 Support

| | |
|---|---|
| 🐛 **Bugs** | [GitHub Issues](https://github.com/YoussefDawod/finora-smart-finance/issues) |
| 💬 **Fragen** | [GitHub Discussions](https://github.com/YoussefDawod/finora-smart-finance/discussions) |

---

## 📄 Lizenz

**ISC License** © 2026 Yellow Developer

---

<div align="center">

**Made with ❤️ by Yellow Developer**

⭐ **Gefällt dir Finora? Gib uns einen Star!** ⭐

</div>
