<div align="center">

# ⚙️ Finora Backend API

**Express 5 • MongoDB • Mongoose 9 • JWT**

![Node](https://img.shields.io/badge/node-20+-green?style=for-the-badge)
![Express](https://img.shields.io/badge/express-5-blue?style=for-the-badge)
![Tests](https://img.shields.io/badge/tests-1103_passing-00d084?style=for-the-badge)

[⬅️ Zurück zum Hauptprojekt](../README.md)

</div>

---

## 🚀 Quick Start

```bash
npm install              # Dependencies
cp .env.example .env     # Config erstellen
# MONGODB_URI eintragen
npm run dev              # Server starten (Port 5000)
```

---

## 🛠️ Tech Stack

| Bereich | Technologie |
|---------|-------------|
| **Core** | Express 5, Node.js 20+ |
| **Database** | MongoDB, Mongoose 9 |
| **Auth** | JWT (Access + Refresh), Bcrypt (10 Rounds) |
| **Validation** | Zod |
| **E-Mail** | Nodemailer (Verifizierung, Newsletter, Passwort-Reset) |
| **Security** | Helmet, HPP, CORS, Rate Limiting, MongoDB Sanitizer |
| **Testing** | Jest 30, Supertest |
| **Logging** | Custom Winston-based Logger |

---

## 📁 Struktur

```
src/
├── config/           # DB, Env, Swagger
├── controllers/      # Request Handler
│   └── auth/         # Auth Sub-Controllers (Login, Register, Verify, Password)
├── services/         # Business Logic (16 Services)
├── validators/       # Zod Validation Schemas
├── models/           # Mongoose Schemas (6 Models)
├── routes/           # Express Routes
│   └── users/        # User Sub-Routes
├── middleware/        # Auth, Error, Rate Limiter, Sanitizer, Logger, Quota
└── utils/            # Logger, E-Mail Service, Templates, Helpers
```

**Pattern:** MVC (Model-View-Controller)

---

## 📡 API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Beschreibung |
|--------|----------|-------------|
| POST | `/register` | User registrieren |
| POST | `/login` | Login (JWT Token) |
| POST | `/logout` | Logout |
| POST | `/refresh` | Token refresh |
| GET | `/verify-email` | E-Mail verifizieren |
| POST | `/resend-verification` | Verifizierungs-E-Mail erneut senden |
| POST | `/forgot-password` | Passwort vergessen |
| POST | `/reset-password` | Passwort zurücksetzen |

### Transactions (`/api/v1/transactions`)

| Method | Endpoint | Beschreibung |
|--------|----------|-------------|
| GET | `/list` | Alle Transaktionen (paginiert, gefiltert) |
| POST | `/create` | Neue Transaktion |
| PATCH | `/:id` | Transaktion updaten |
| DELETE | `/:id` | Transaktion löschen |
| GET | `/stats/summary` | Statistiken (Einkommen/Ausgaben/Saldo) |
| GET | `/stats/dashboard` | Dashboard-Charts Daten |
| GET | `/quota` | Transaktions-Quota abfragen |

### Users (`/api/v1/users`)

| Method | Endpoint | Beschreibung |
|--------|----------|-------------|
| GET | `/profile` | Profil abrufen |
| PATCH | `/profile` | Profil updaten |
| DELETE | `/account` | Account löschen |

### Newsletter (`/api/v1/newsletter`)

| Method | Endpoint | Beschreibung |
|--------|----------|-------------|
| POST | `/subscribe` | Newsletter abonnieren (Double-Opt-In) |
| GET | `/confirm` | Abo bestätigen |
| GET | `/unsubscribe` | Abmelden |
| GET | `/status` | Abo-Status prüfen |
| POST | `/toggle` | Abo ein-/ausschalten |

### Contact (`/api/v1/contact`)

| Method | Endpoint | Beschreibung |
|--------|----------|-------------|
| POST | `/` | Kontaktnachricht senden (Honeypot-geschützt) |

### Feedback (`/api/v1/feedback`)

| Method | Endpoint | Beschreibung |
|--------|----------|-------------|
| POST | `/` | Feedback senden |
| GET | `/` | Eigenes Feedback abrufen |

### Admin (`/api/v1/admin`) — Auth: JWT (Admin-Rolle) oder API-Key

| Method | Endpoint | Beschreibung |
|--------|----------|-------------|
| GET | `/stats` | Dashboard-Statistiken |
| GET | `/users` | Alle User (Suche/Filter/Pagination) |
| GET | `/users/:id` | User-Details |
| PATCH | `/users/:id` | User bearbeiten |
| DELETE | `/users/:id` | User löschen |
| POST | `/users/:id/ban` | User sperren |
| POST | `/users/:id/unban` | User entsperren |
| PATCH | `/users/:id/role` | Rolle ändern |
| POST | `/users/:id/reset-password` | Passwort zurücksetzen |
| GET | `/transactions` | Alle Transaktionen |
| GET | `/transactions/stats` | Transaktions-Statistiken |
| DELETE | `/transactions/:id` | Transaktion löschen |
| GET | `/subscribers` | Newsletter-Abonnenten |
| DELETE | `/subscribers/:id` | Abonnent löschen |
| POST | `/subscribers/:id/resend` | Bestätigung erneut senden |
| GET | `/campaigns` | Alle Kampagnen |
| POST | `/campaigns` | Kampagne erstellen |
| GET | `/campaigns/:id` | Kampagnen-Details |
| DELETE | `/campaigns/:id` | Kampagne löschen |
| POST | `/campaigns/:id/send` | Kampagne versenden |
| POST | `/campaigns/preview` | Kampagnen-Vorschau |
| GET | `/audit-log` | Audit-Log abrufen |
| GET | `/audit-log/stats` | Audit-Log Statistiken |
| GET | `/lifecycle/stats` | Lifecycle-Statistiken |

📖 **Detailliert:** [docs/ADMIN_API.md](./docs/ADMIN_API.md)

---

## 🗄️ Datenmodelle

| Model | Beschreibung |
|-------|-------------|
| **User** | Accounts, Rollen (admin/user/viewer), E-Mail-Verifizierung, Refresh Tokens |
| **Transaction** | Einnahmen/Ausgaben mit Kategorien, Budget-Tracking |
| **Subscriber** | Newsletter-Abonnenten mit Double-Opt-In |
| **Campaign** | E-Mail-Kampagnen für Newsletter |
| **AuditLog** | Admin-Aktionen Audit-Trail |
| **Feedback** | User-Feedback & Kontaktanfragen |

---

## 🛠️ Admin CLI

```bash
# User-Statistiken
npm run admin:stats

# Alle Users auflisten (mit Filtern)
npm run admin:list
npm run admin:list -- --role=admin --verified
npm run admin:list -- --search="youssef"

# User-Details abrufen
node admin-cli.js get <userId>

# User erstellen
node admin-cli.js create

# Passwort zurücksetzen
node admin-cli.js reset-password <userId> newPassword

# User sperren / entsperren
node admin-cli.js ban <userId> "Regelverstoß"
node admin-cli.js unban <userId>

# Rolle ändern
node admin-cli.js role <userId> admin
node admin-cli.js promote <userId>    # → admin
node admin-cli.js demote <userId>     # → user

# User löschen
node admin-cli.js delete <userId>

# Alle User löschen (Vorsicht!)
node admin-cli.js clean-all
```

---

## 🧪 Testing

```bash
npm run test              # Alle Tests
npm run test:watch        # Watch Mode
npm run test:coverage     # Coverage Report
```

| Bereich | Tests |
|---------|-------|
| Services | 500+ |
| Controllers | 200+ |
| Middleware | 100+ |
| Routes | 150+ |
| Validators | 100+ |
| **Total** | **1103 ✅ (44 Suites)** |

---

## 🔒 Sicherheit

| Feature | Beschreibung |
|---------|-------------|
| 🔐 **JWT** | Access (15min) + Refresh (7d) |
| 🔒 **Bcrypt** | 10 Rounds Hashing |
| 📧 **E-Mail-Verifizierung** | Double-Opt-In bei Registrierung |
| 🛡️ **CORS** | Origin Whitelist |
| ⏱️ **Rate Limit** | 100 Requests/15min |
| 🧹 **MongoDB Sanitizer** | NoSQL-Injection-Schutz |
| 🪖 **Helmet + HPP** | HTTP-Header-Hardening |
| ✅ **Validation** | Zod + Mongoose Schema |

---

## 🌍 Environment

```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finora
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:3000
```

---

## 📋 Scripts

| Command | Beschreibung |
|---------|--------------|
| `npm run dev` | Nodemon (Auto-Reload) |
| `npm start` | Production Server |
| `npm run test` | Tests |
| `npm run test:coverage` | Coverage Report |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run admin:stats` | User Stats |
| `npm run admin:list` | User List |

---

## 🔗 Links

- [📖 Frontend Docs](../finora-smart-finance-frontend/README.md)
- [📚 Admin API Reference](./docs/ADMIN_API.md)
- [🐛 Issues](https://github.com/YoussefDawod/finora-smart-finance/issues)

---

<div align="center">

**Made with ❤️ by Youssef Dawod**

</div>
