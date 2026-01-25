# Finora Smart Finance

> 🚀 Moderne Finanzverwaltung mit React + Node.js

Finora Smart Finance ist eine vollständige Finanz-App mit Frontend (React + Vite) und Backend (Express + MongoDB) in einem Monorepo.

## ✨ Features

- 📊 Übersichtliches Dashboard mit Echtzeit-Statistiken
- 💰 Einnahmen & Ausgaben tracken
- 📈 Interaktive Charts und Analysen
- 🔐 Sichere Authentifizierung (JWT + Refresh Tokens)
- 🌙 Dark/Light Mode mit Glass-Effekten
- 📱 Responsive Design (Mobile-First)
- 🌐 Mehrsprachig (DE, EN, AR, KA)
- ♿ Barrierefreiheit (WCAG 2.1)

## 📁 Monorepo-Struktur

```
expense-tracker/
├── finora-smart-finance-frontend/   # React 19 + Vite
│   ├── src/
│   │   ├── api/                     # API-Client & Services
│   │   ├── components/              # UI-Komponenten
│   │   ├── context/                 # React Context (Auth, Theme)
│   │   ├── hooks/                   # Custom Hooks
│   │   ├── pages/                   # Route-Komponenten
│   │   ├── styles/                  # SCSS + Design Tokens
│   │   └── utils/                   # Hilfsfunktionen
│   └── public/locales/              # i18n Übersetzungen
│
├── finora-smart-finance-api/        # Node.js + Express
│   └── src/
│       ├── controllers/             # Route-Handler
│       ├── services/                # Business-Logik
│       ├── validators/              # Input-Validierung
│       ├── models/                  # Mongoose Schemas
│       ├── middleware/              # Auth, Rate-Limiting
│       └── routes/                  # API-Endpunkte
│
├── tests/                           # E2E Tests (Playwright)
├── .husky/                          # Git Hooks
└── package.json                     # Monorepo Workspaces
```

## 🚀 Schnellstart

### Voraussetzungen

- Node.js 18+
- MongoDB (lokal oder Atlas)
- npm 9+

### Installation

```bash
# Repository klonen
git clone https://github.com/YoussefDawod/expense-tracker.git
cd expense-tracker

# Dependencies installieren (inkl. Workspaces)
npm install

# Umgebungsvariablen konfigurieren
cp finora-smart-finance-api/.env.example finora-smart-finance-api/.env
# .env bearbeiten: MONGODB_URI, JWT_SECRET, etc.
```

### Entwicklung

```bash
# Frontend starten (Port 3000)
npm run dev:frontend

# Backend starten (Port 5000)
npm run dev:api

# Oder beide parallel
npm run dev:frontend & npm run dev:api
```

### Production Build

```bash
npm run build
```

## 🔧 Umgebungsvariablen

### Frontend (`.env`)
| Variable | Beschreibung | Default |
|----------|--------------|---------|
| `VITE_API_URL` | Backend URL | `http://localhost:5000` |
| `VITE_API_TIMEOUT` | Request Timeout | `10000` |

### Backend (`.env`)
| Variable | Beschreibung | Erforderlich |
|----------|--------------|--------------|
| `MONGODB_URI` | MongoDB Connection | ✅ |
| `JWT_SECRET` | Access Token Secret | ✅ |
| `JWT_REFRESH_SECRET` | Refresh Token Secret | ✅ |
| `CORS_ORIGIN` | Erlaubte Origins | Nein |

## 🧪 Testing

### Frontend (Vitest)

```bash
cd finora-smart-finance-frontend
npm run test              # 69 Unit Tests
npm run test:coverage     # Mit Coverage-Report (~75%)
```

### Backend (Jest)

```bash
cd finora-smart-finance-api
npm run test              # 50 Unit Tests
npm run test:coverage     # Mit Coverage-Report
```

### E2E (Playwright)

```bash
npx playwright test
```

### Test-Statistiken

| Bereich | Tests | Coverage |
|---------|-------|----------|
| Frontend Hooks | 33 | ~82% |
| Frontend Utils | 36 | ~66% |
| Backend Auth | 20 | - |
| Backend Transactions | 30 | - |

## 🔧 Tech Stack

### Frontend

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| React | 19.x | UI-Framework |
| Vite | 7.x | Build Tool |
| SCSS Modules | - | Styling |
| Recharts | 2.x | Charts |
| Framer Motion | 11.x | Animationen |
| i18next | 25.x | i18n (HTTP-Backend) |

### Backend

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| Node.js | 18+ | Runtime |
| Express | 5.x | Web Framework |
| MongoDB | 7.x | Datenbank |
| Mongoose | 9.x | ODM |
| JWT | 9.x | Auth Tokens |

## 📊 Architektur

### Backend (MVC + Services)

```
Request → Route → Controller → Service → Model → MongoDB
                      ↓
                 Validator
```

### Frontend (Component-Based)

```
Component → Custom Hook → Context/API-Client → Backend
    ↓
  SCSS Module (Design Tokens)
```

### Auth Flow

```
Login → Access Token (15min) + Refresh Token (7d)
     → Automatic Refresh via Axios Interceptor
     → Secure HttpOnly Cookie (Refresh)
```

## 🛠️ Scripts

### Root (Monorepo)

| Script | Beschreibung |
|--------|--------------|
| `npm run dev:frontend` | Frontend Dev-Server |
| `npm run dev:api` | Backend Dev-Server |
| `npm run build` | Production Build |
| `npm run lint` | ESLint alle Workspaces |
| `npm run format` | Prettier |
| `npm run test` | Alle Tests |

### Pre-Commit Hooks (Husky)

- ESLint Fix
- Prettier Formatierung

## 🌐 API-Endpunkte

### Auth (`/api/auth`)
- `POST /register` – Neuer Account
- `POST /login` – Anmelden
- `POST /refresh` – Token erneuern
- `POST /logout` – Abmelden
- `POST /forgot-password` – Passwort vergessen
- `POST /reset-password` – Passwort zurücksetzen

### Transactions (`/api/transactions`)
- `GET /` – Alle Transaktionen
- `GET /:id` – Einzelne Transaktion
- `POST /` – Neue Transaktion
- `PUT /:id` – Aktualisieren
- `DELETE /:id` – Löschen
- `GET /stats` – Statistiken

### Users (`/api/users`)
- `GET /me` – Eigenes Profil
- `PUT /me` – Profil aktualisieren
- `PUT /me/password` – Passwort ändern
- `DELETE /me` – Account löschen

## 📝 Changelog

### v2.1.0 (2025)

#### Refactoring
- ✅ Backend: auth.js → Controller/Service/Validator Pattern
- ✅ Backend: transactions.js modularisiert
- ✅ Frontend: AuthContext & TransactionContext mit Reducer/Hooks
- ✅ Frontend: DashboardCharts (570 → 341 LOC)
- ✅ Frontend: TransactionForm (315 → 201 LOC)
- ✅ i18n: Dynamisches JSON-Laden via HTTP-Backend

#### Tooling
- ✅ Prettier + Husky + lint-staged
- ✅ Vitest (Frontend) + Jest (Backend)
- ✅ 119 Unit Tests, ~75% Coverage

#### Performance
- ✅ Bundle: ~600KB → ~500KB (-17%)
- ✅ Code Splitting (Charts, Motion, Axios)

## 📄 Lizenz

ISC © Youssef Dawod

## 🤝 Contributing

1. Fork erstellen
2. Feature-Branch (`git checkout -b feature/amazing`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing`)
5. Pull Request erstellen
