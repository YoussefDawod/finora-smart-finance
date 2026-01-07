# Expense Tracker (Monorepo)

Frontend (React + Vite) und Backend (Express + MongoDB) in einem gemeinsamen Repository.

## 📁 Struktur

- `expense-tracker-frontend/` – React-App mit robustem API-Layer
- `expense-tracker-backend/` – Node.js/Express REST-API
- `.github/workflows/ci.yml` – CI-Pipeline für Lint/Build

## 🚀 Schnellstart

```bash
# Frontend
cd expense-tracker-frontend
npm install
npm run dev

# Backend
cd ../expense-tracker-backend
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
- Einfache Auth-Endpunkte (`/api/auth/login`, `/refresh`, `/logout`)

## 🗂️ Repositories: Monorepo vs. Multi-Repo

- **Monorepo (Empfehlung hier):** Synchronisierte Änderungen, einfache CI, einheitliche Versionierung.
- **Multi-Repo:** Unabhängige Deploys/Versionierung, mehr Overhead bei Cross-Änderungen.

### Migration zu Monorepo (Schritte)

1. Neues Root-Git-Repo im Projektordner initialisieren (falls noch nicht vorhanden).
2. Historie aus bestehenden Repos zusammenführen (optional) via `git subtree` oder `git filter-repo`.
3. Entferne/konvertiere nested Repos (`.git` Ordner in Unterordnern) – stattdessen nur ein Root-Repo.
4. CI/Workflows ins Root verschieben.

> Hinweis: Wenn du bestehende GitHub-Repos behalten willst, können wir alternativ eine **GitHub Organisation** mit zwei Repos nutzen und ein drittes "Meta-Repo" als Monorepo anlegen, das beide via `subtree` einbindet.

## 📄 Lizenz
ISC
