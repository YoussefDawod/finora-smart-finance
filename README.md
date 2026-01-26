<div align="center">

# 💰 Finora Smart Finance

**Intelligente Finanzverwaltung für moderne Menschen**

![Status](https://img.shields.io/badge/status-production--ready-00d084?style=for-the-badge&logo=checkmark)
![License](https://img.shields.io/badge/license-ISC-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.1.0-purple?style=for-the-badge)

---

[🎬 Live Demo](#) • [📖 Frontend Docs](./finora-smart-finance-frontend/README.md) • [⚙️ Backend Docs](./finora-smart-finance-api/README.md) • [🐛 Issues](https://github.com/YoussefDawod/expense-tracker/issues)

</div>

---

## 🚀 Überblick

**Finora** ist eine Enterprise-ready Finanz-Management-Plattform, die dir hilft, deine Einnahmen und Ausgaben intelligent zu verwalten. Mit wunderschönem Design, Echtzeit-Analysen und Bank-Level Sicherheit – alles was du für vollständige finanzielle Kontrolle brauchst.

> [!TIP]
> ### 🎯 Die Finora Philosophie
> 
> **Finanzen sollten nicht kompliziert sein.**
>
> Finora macht dich zum Meister deiner Finanzen mit:
> - 🎨 **Wunderschönem Design** – Freude statt Frustration
> - 🤖 **Intelligenter Automatisierung** – Weniger manuelle Arbeit
> - 📊 **Echten Insights** – Nicht nur Zahlen, sondern Verständnis
> - 🔐 **Vollständiger Sicherheit** – Deine Daten in sicheren Händen

---

## ⭐ Kernfunktionen

<table>
<tr>
<td width="50%">

### 📊 Intelligentes Dashboard

**Live-Übersicht deiner Finanzen**

- Echtzeit Statistiken & KPIs
- Interactive Charts (Pie, Bar, Line)
- Kategorie-Breakdown
- Trend-Analyse über Monate

</td>
<td width="50%">

### 💰 Transaktions-Management

**Volle Kontrolle über jede Transaktion**

- Schnelles Hinzufügen/Bearbeiten
- Automatische Kategorisierung
- Tags & Notizen pro Transaktion
- Bulk-Operationen möglich

</td>
</tr>
<tr>
<td width="50%">

### 🎯 Sparziele & Budgets

**Erreiche deine finanziellen Ziele**

- Automatische Sparziele
- Budget-Limits pro Kategorie
- Echtzeit Progress Tracking
- Notifikationen bei Limits

</td>
<td width="50%">

### 🌍 Global & Mehrsprachig

**Für die internationale Bühne vorbereitet**

- 4 Sprachen: Deutsch, English, العربية, ქართული
- Dynamisches HTTP i18n System
- Lokale Formatierung (Währung, Datum)
- RTL-Support für arabische Nutzer

</td>
</tr>
<tr>
<td width="50%">

### 🔐 Bank-Level Sicherheit

**Deine Daten sind sicher**

- JWT Token Authentication
- Bcrypt Password Hashing (10 Rounds)
- HTTPS/TLS Verschlüsselung
- Rate Limiting gegen Brute-Force

</td>
<td width="50%">

### 🌙 Dark Mode & Themes

**Design, das zu dir passt**

- Auto Dark/Light Mode
- Glass-Morphism UI
- Framer Motion Animationen
- Vollständig responsive

</td>
</tr>
</table>

---

## 💎 Warum Finora wählen?

> [!NOTE]
> ### 💎 Premium User Experience
> 
> Finora fühlt sich gut an – mit sorgfältig gestalteten Komponenten, flüssigen Animationen und durchdachten UX-Patterns. **WCAG 2.1 AA** zertifiziert für volle Barrierefreiheit.

> [!TIP]
> ### 🚀 Developer-Friendly
> 
> Saubere, dokumentierte Architektur mit **119 Unit Tests** & **75% Coverage**. MVC-Pattern, einfach zu erweitern.

> [!IMPORTANT]
> ### 🌍 Global Ready
> 
> 4 Sprachen + HTTP-Backend für i18n. Multi-Currency Support, RTL-ready, Timezone-aware.

> [!WARNING]
> ### 🔧 Produktion-Ready
> 
> Vollständig getestet mit **GitHub Actions CI/CD**, ESLint + Prettier Linting, Error Tracking & Monitoring.

---

## 🎯 Perfekt für...

| Wer | Was | Wie Finora hilft |
|-----|-----|-----------------|
| **👨‍💼 Freelancer** | Einnahmen-Tracking & Steuern | Income Dashboard + Report Export |
| **👨‍👩‍👧‍👦 Familien** | Gemeinsames Budget | Multi-User + Sparziele |
| **🌍 Expats** | Multi-Currency Verwaltung | 4 Sprachen + Auto-Umrechnung |

---

## ⚡ Installation & Quick Start

### 📋 Systemanforderungen

```bash
✅ Node.js 18 oder höher
✅ npm 9+ oder yarn 4+
✅ MongoDB 6+ (lokal oder Atlas)
✅ Git 2.40+
```

### 🚀 Schnellstart (3 Minuten)

```bash
# 1️⃣ Repository klonen
git clone https://github.com/YoussefDawod/expense-tracker.git
cd expense-tracker

# 2️⃣ Abhängigkeiten installieren (beide Workspaces)
npm install

# 3️⃣ Environment konfigurieren
cd finora-smart-finance-api
cp .env.example .env
# Öffne .env und trage deine MONGODB_URI ein
cd ..

# 4️⃣ Starte beide Services
npm run dev:frontend &    # React Frontend 🎨 auf Port 3000
npm run dev:api &         # Express API ⚙️ auf Port 5000

# Browser öffnen
open http://localhost:3000
```

**✅ Fertig!** Du solltest jetzt die Finora App sehen! 🎉

### 📚 Detaillierte Dokumentation

- **Frontend Setup:** [finora-smart-finance-frontend/README.md](./finora-smart-finance-frontend/README.md)
- **Backend Setup:** [finora-smart-finance-api/README.md](./finora-smart-finance-api/README.md)
- **API Reference:** [finora-smart-finance-api/docs/ADMIN_API.md](./finora-smart-finance-api/docs/ADMIN_API.md)
- **Changelog:** [CHANGELOG.md](./CHANGELOG.md)

---

## 📱 Plattform-Support

<div align="center">

| 🖥️ Desktop | 📱 Mobile | 🌐 Browser |
|-----------|----------|-----------|
| ✅ Windows | ✅ iOS | ✅ Chrome 120+ |
| ✅ macOS | ✅ Android | ✅ Firefox 121+ |
| ✅ Linux | ✅ Tablet | ✅ Safari 17+ |

**Progressive Web App** → Funktioniert auch offline!

</div>

---

## 🧪 Qualität & Testing

<div style="background: linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #a78bfa; margin: 20px 0;">

Finora wird mit **119 automatisierten Tests** ausgeliefert:

```bash
# Alle Tests durchführen
npm run test

# Frontend Tests nur (Vitest)
npm run test:frontend

# Backend Tests nur (Jest)
> [!TIP]
> Finora wird mit **119 automatisierten Tests** ausgeliefert:
> 
> ```bash
> npm run test              # Alle Tests
> npm run test:frontend    # Nur Frontend (Vitest)
> npm run test:api         # Nur Backend (Jest)
> npm run lint             # Code-Qualität
> ```
> 
> **Qualitätsmetriken:**
> 
> | Metric | Wert | Status |
> |--------|------|--------|
> | **Unit Tests** | 69 Frontend + 50 Backend | ✅ 119 Total |
> | **Test Coverage** | ~75% | ✅ Excellent |
> | **ESLint Errors** | 0 | ✅ Clean |
> | **Build Size** | ~500KB | ✅ Optimized |RS Protection** – Verhindert unauthorized requests  
✅ **Rate Limiting** – Schutz vor Brute-Force Attacken  
✅ **Input Validation** – Alle Daten validiert vor DB-Speicherung  
✅ **HTTPS Only** – TLS 1.3 Encryption  
✅ **MongoDB Validation** – Schema-Level Datenschutz  
✅ **HTTP Security Headers** – HSTS, CSP, X-Frame-Options  
> [!WARNING]
> Finora schützt deine finanziellen Daten mit **Enterprise-Grade Sicherheit**:
> 
> ✅ **JWT Authentication** – Sichere Token mit Access (15min) & Refresh (7d)  
> ✅ **Bcrypt Hashing** – Passwörter mit 10 Rounds verschlüsselt  
> ✅ **CORS Protection** – Verhindert unauthorized requests  
> ✅ **Rate Limiting** – Schutz vor Brute-Force Attacken  
> ✅ **Input Validation** – Alle Daten validiert vor DB-Speicherung  
> ✅ **HTTPS Only** – TLS 1.3 Encryption  
> ✅ **MongoDB Validation** – Schema-Level Datenschutz  
> ✅ **HTTP Security Headers** – HSTS, CSP, X-Frame-Options
## 🤝 Beitragen

Wir freuen uns über Beiträge der Community! 🎉

### 🔄 Entwicklungs-Workflow
> [!IMPORTANT]
> Wir freuen uns über Beiträge der Community! 🎉
> 
> ### 🔄 Entwicklungs-Workflow
> 
> ```bash
> # 1️⃣ Fork das Projekt auf GitHub
> # https://github.com/YoussefDawod/expense-tracker/fork
> 
> # 2️⃣ Clone dein Fork
> git clone https://github.com/YOUR_USERNAME/expense-tracker.git
> cd expense-tracker
> 
> # 3️⃣ Feature Branch erstellen
> git checkout -b feature/amazing-feature
> 
> # 4️⃣ Code schreiben & testen
> npm run dev:frontend &
> npm run dev:api &
> 
> # 5️⃣ Tests durchführen
> npm run test           # Alle Tests
> npm run lint           # Code Qualität checken
> 
> # 6️⃣ Commit (Pre-commit Hook läuft automatisch!)
> git add .
> git commit -m "feat: add amazing feature"
> 
> # 7️⃣ Push & Pull Request
> git push origin feature/amazing-feature
> # → GitHub: Create Pull Request
> ```
> 
> ### ✅ Was wir checken
> 
> - ✅ Alle Tests bestehen (Frontend + Backend)
> - ✅ ESLint + Prettier Checks erfolgreich
> - ✅ Build erfolgreich
> - ✅ Code-Style konsistent
> - ✅ Keine Breaking Changes (außer Version Bump)
## 📝 Changelog & Versionierung

**Version 2.1.0** (Aktuelle Version)
- ✅ 6-Phase Refactoring completed
- ✅ 119 Unit Tests hinzugefügt
- ✅ GitHub Actions CI/CD Setup
- ✅ Improved Performance (~17% Bundle Reduction)

Vollständiger Changelog: [CHANGELOG.md](./CHANGELOG.md)

---

## 📞 Support & Community

<table>
<tr>
<td>

**🐛 Bug Reports**  
[GitHub Issues](https://github.com/YoussefDawod/expense-tracker/issues)

</td>
<td>

**💬 Fragen & Diskussionen**  
[GitHub Discussions](https://github.com/YoussefDawod/expense-tracker/discussions)

</td>
<td>

**📧 Direkter Kontakt**  
contact@example.com

</td>
<td>

**🌐 Live Demo**  
[finora.example.com](#)

</td>
</tr>
</table>

---

## 📄 Lizenz & Rechtliches

**ISC License** © 2026 Youssef Dawod

Du kannst Finora frei verwenden, modifizieren und verbreiten unter den Bedingungen der ISC Lizenz.

- 📋 [Vollständige Lizenz](./LICENSE)
- 🔐 [Datenschutzrichtlinie](./PRIVACY.md)
- ⚖️ [Nutzungsbedingungen](./TERMS.md)

---

## 👨‍💻 Über den Creator

**Youssef Dawod** – Full-Stack Developer

Spezialisiert auf moderne Web-Technologien, mit Fokus auf UX/DX und Code Quality.

[GitHub](https://github.com/YoussefDawod) • [LinkedIn](https://www.linkedin.com/in/youssef-dawod-203273215/) 

---

## 🙏 Danksagungen

Finora wurde gebaut mit Inspiration von:
- [Recharts](https://recharts.org/) – Data Visualization
- [Framer Motion](https://www.framer.com/motion/) – Animations
- [i18next](https://www.i18next.com/) – Internationalization

---

<div align="center">

**Made with ❤️ by Youssef Dawod**

⭐ **Wenn dir Finora gefällt, gib uns einen Star!** ⭐

[![Star on GitHub](https://img.shields.io/github/stars/YoussefDawod/expense-tracker?style=social)](https://github.com/YoussefDawod/expense-tracker)

[⬆️ Back to Top](#-finora-smart-finance)

</div>
