<div align="center">

# ⚙️ Finora Backend API

**Express 5 • MongoDB • Mongoose • JWT**

![Node](https://img.shields.io/badge/node-18+-green?style=for-the-badge)
![Express](https://img.shields.io/badge/express-5-blue?style=for-the-badge)
![Tests](https://img.shields.io/badge/tests-50_passing-00d084?style=for-the-badge)

REST API mit JWT Authentication, MongoDB & Admin CLI Tools.

[⬅️ Zurück zum Hauptprojekt](../README.md)

</div>

---

## 🚀 Quick Start

```bash
# Dependencies installieren
npm install

# .env konfigurieren
cp .env.example .env
# MONGODB_URI eintragen

# Server starten (Port 5000)
npm run dev
```

**Server läuft auf:** http://localhost:5000

---

## 🛠️ Tech Stack

**Core:**
- Express 5 – Modern Web Framework
- MongoDB 7 – NoSQL Database
- Mongoose 9 – ODM mit Validation
- Node.js 18+ – Runtime

**Security:**
- JWT – Token Authentication
- Bcrypt – Password Hashing (10 Rounds)
- CORS – Origin Protection
- Rate Limiter – Brute-Force Schutz

**Quality:**
- Jest 30 – Unit Tests (50 passing)
- Supertest – API Testing
- ESLint 9 – Code Linting

---

## 📁 Projekt-Struktur

> [!NOTE]
> ```
> src/
> ├── controllers/      # Request Handler
> ├── services/         # Business Logic
> ├── validators/       # Input Validation (Zod)
> ├── models/           # Mongoose Schemas
> ├── routes/           # Express Routes
> ├── middleware/       # Auth, Error Handler, Rate Limiter
> └── utils/            # Logger, Email Service
> ```
> 
> **MVC Pattern** – Saubere Trennung von Concerns

---

## 📡 API Endpoints

> [!TIP]
> ### Authentication
> 
> ```bash
> POST   /api/auth/register      # User registrieren
> POST   /api/auth/login         # Login (JWT Token)
> POST   /api/auth/logout        # Logout
> POST   /api/auth/refresh       # Token refresh
> ```
> 
> ### Transactions
> 
> ```bash
> GET    /api/transactions       # Alle Transaktionen
> POST   /api/transactions       # Neue Transaktion
> GET    /api/transactions/:id   # Einzelne Transaktion
> PATCH  /api/transactions/:id   # Transaktion updaten
> DELETE /api/transactions/:id   # Transaktion löschen
> GET    /api/transactions/stats # Statistiken
> ```
> 
> ### Users
> 
> ```bash
> GET    /api/users/profile      # User-Profil
> PATCH  /api/users/profile      # Profil updaten
> DELETE /api/users/account      # Account löschen
> ```
> 
> 📖 **Detaillierte API-Docs:** [docs/ADMIN_API.md](./docs/ADMIN_API.md)

---

## 🛠️ Admin CLI Tools

> [!IMPORTANT]
> Entwickler-Tools für User-Verwaltung:
> 
> ```bash
> # User-Übersicht
> npm run admin:stats
> 
> # Alle Users auflisten
> npm run admin:list
> 
> # Passwort zurücksetzen
> node admin-cli.js reset-password <userId> newPassword123
> 
> # User löschen
> node admin-cli.js delete-user <userId>
> ```

---

## 🧪 Testing

<div style="background: linear-gradient(135deg, #fef3c7 0%, #fef08a 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #ca8a04; margin: 15px 0;">

```bash
> [!TIP]
> ```bash
> npm run test              # Alle Tests
> npm run test:watch        # Watch Mode
> npm run test:coverage     # Mit Coverage Report
> ```
> 
> **Test Coverage:**
> - Auth Validation: 20 Tests
> - Transaction Validation: 30 Tests
> - Total: 50 Tests passing ✅
## 🔐 Sicherheits-Features

✅ **JWT Tokens** – Access (15min) + Refresh (7d)  
✅ **Bcrypt Hashing** – 10 Rounds Password Encryption  
✅ **CORS Protection** – Whitelist erlaubter Origins  
✅ **Rate Limiting** – Max 100 Requests/15min  
✅ **Input Validation** – Zod Schema Validation  
✅ **MongoDB Validation** – Schema-Level Protection  
✅ **HTTP Security Headers** – HSTS, CSP

---

## 🌍 Environment Variables

```bash
# .env Beispiel
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finora
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key
CORS_ORIGIN=http://localhost:3000
```

---

## 📋 Verfügbare Scripts

| Command | Beschreibung |
|---------|--------------|
| `npm run dev` | Server mit Nodemon (Auto-Reload) |
| `npm start` | Production Server |
| `npm run test` | Tests ausführen |
| `npm run lint` | ESLint Check |
| `npm run admin:stats` | User-Statistiken |
| `npm run admin:list` | Alle Users auflisten |

---

## 🔗 Wichtige Links

- [📖 Frontend Dokumentation](../finora-smart-finance-frontend/README.md)
- [📚 API Reference](./docs/ADMIN_API.md)
- [📝 Changelog](../CHANGELOG.md)
- [🐛 Issues](https://github.com/YoussefDawod/expense-tracker/issues)

---

<div align="center">

**Made with ❤️ by Youssef Dawod**

[⬆️ Back to Top](#️-finora-backend-api)

</div>
