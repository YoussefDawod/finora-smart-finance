<div align="center">

# ⚙️ Finora Backend API

**Express 5 • MongoDB • Mongoose • JWT**

![Node](https://img.shields.io/badge/node-18+-green?style=for-the-badge)
![Express](https://img.shields.io/badge/express-5-blue?style=for-the-badge)
![Tests](https://img.shields.io/badge/tests-50_passing-00d084?style=for-the-badge)

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
| **Core** | Express 5, Node.js 18+ |
| **Database** | MongoDB 7, Mongoose 9 |
| **Auth** | JWT, Bcrypt (10 Rounds) |
| **Validation** | Zod |
| **Testing** | Jest 30, Supertest |

---

## 📁 Struktur

```
src/
├── controllers/      # Request Handler
├── services/         # Business Logic
├── validators/       # Zod Validation
├── models/           # Mongoose Schemas
├── routes/           # Express Routes
├── middleware/       # Auth, Error, Rate Limiter
└── utils/            # Logger, Email Service
```

**Pattern:** MVC (Model-View-Controller)

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Beschreibung |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registrieren |
| POST | `/api/auth/login` | Login (JWT Token) |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Token refresh |

### Transactions

| Method | Endpoint | Beschreibung |
|--------|----------|-------------|
| GET | `/api/transactions` | Alle Transaktionen |
| POST | `/api/transactions` | Neue Transaktion |
| GET | `/api/transactions/:id` | Einzelne Transaktion |
| PATCH | `/api/transactions/:id` | Updaten |
| DELETE | `/api/transactions/:id` | Löschen |
| GET | `/api/transactions/stats` | Statistiken |

### Users

| Method | Endpoint | Beschreibung |
|--------|----------|-------------|
| GET | `/api/users/profile` | Profil abrufen |
| PATCH | `/api/users/profile` | Profil updaten |
| DELETE | `/api/users/account` | Account löschen |

📖 **Detailliert:** [docs/ADMIN_API.md](./docs/ADMIN_API.md)

---

## 🛠️ Admin CLI

```bash
# User-Statistiken
npm run admin:stats

# Alle Users auflisten
npm run admin:list

# Passwort zurücksetzen
node admin-cli.js reset-password <userId> newPassword

# User löschen
node admin-cli.js delete-user <userId>
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
| Auth Validation | 20 |
| Transaction Validation | 30 |
| **Total** | **50 ✅** |

---

## 🔒 Sicherheit

| Feature | Beschreibung |
|---------|-------------|
| 🔐 **JWT** | Access (15min) + Refresh (7d) |
| 🔒 **Bcrypt** | 10 Rounds Hashing |
| 🛡️ **CORS** | Origin Whitelist |
| ⏱️ **Rate Limit** | 100 Requests/15min |
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
| `npm run lint` | ESLint |
| `npm run admin:stats` | User Stats |
| `npm run admin:list` | User List |

---

## 🔗 Links

- [📖 Frontend Docs](../finora-smart-finance-frontend/README.md)
- [📚 API Reference](./docs/ADMIN_API.md)
- [🐛 Issues](https://github.com/YoussefDawod/expense-tracker/issues)

---

<div align="center">

**Made with ❤️ by Youssef Dawod**

</div>
