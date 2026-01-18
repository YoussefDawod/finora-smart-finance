# Finora - Smart Finance

> 🚀 Moderne Finanzverwaltung mit React + Node.js

Finora ist eine vollständige Finanz-App mit Frontend (React + Vite) und Backend (Express + MongoDB) in einem Monorepo.

## ✨ Features

- 📊 Übersichtliches Dashboard mit Echtzeit-Statistiken
- 💰 Einnahmen & Ausgaben tracken
- 📈 Interaktive Charts und Analysen
- 🔐 Sichere Authentifizierung (JWT)
- 🌙 Dark/Light Mode
- 📱 Responsive Design

## 📁 Struktur

- `finora-frontend/` – React 19 App mit Vite + SCSS
- `finora-api/` – Node.js/Express REST-API
- `.github/workflows/ci.yml` – CI-Pipeline für Lint/Build

## 🚀 Schnellstart

```bash
# Frontend
cd finora-frontend
npm install
npm run dev

# Backend
cd ../finora-api
npm install
npm run dev
```

## 🔧 Umgebungsvariablen

- Frontend: `.env` mit `VITE_API_URL`, optional `VITE_API_TIMEOUT`
- Backend: `.env` mit `MONGODB_URI`, optional `JWT_SECRET`, `CORS_ORIGIN`

## 🧪 CI

Siehe `.github/workflows/ci.yml`:
- Frontend Job: `npm ci`, `npm run lint`, `npm run build`
- Backend Job: `npm ci`, `npm run lint`

## 🧭 Architektur

- Token-Refresh & Interceptors (Frontend)
- Dedup/Retry/Cache im API-Client
- Transaktions-CRUD & Statistiken (Backend)
- Auth-Endpunkte (`/api/auth/login`, `/refresh`, `/logout`)

## 📄 Lizenz
ISC
