# Expense Tracker – Frontend (React + Vite)

Modernes React-Frontend mit robustem API-Client, Token-Refresh, Caching, Retry & SWR-Hooks.

## 🚀 Setup

```bash
# Dependencies installieren
npm install

# Entwicklung starten
npm run dev

# Linting
npm run lint

# Formatierung (Prettier)
npm run format
npm run format:check

# Produktion bauen
npm run build
npm run preview
```

## 🔧 Umgebungsvariablen

- `VITE_API_URL` – Basis-URL der API (Default: `http://localhost:5000/api`)
- `VITE_API_TIMEOUT` – Request-Timeout in ms (optional)

## 🧠 Architektur

- `src/api/client.js` – Custom API Client (Fetch + Timeout + Retry + Dedup + Cache)
- `src/api/authInterceptor.js` – Registriert Token-Refresh-Handler
- `src/api/authService.js` – Token-Management (Access/Refresh)
- `src/api/transactionService.js` – Domänenspezifische API-Operationen
- `src/hooks/useStaleWhileRevalidate.js` – SWR-Strategie für schnelle UIs
- `src/hooks/useAPIHook.js` – Generischer Wrapper für API-Funktionen

## 📦 Build & CI

Siehe Monorepo-Workflow in `.github/workflows/ci.yml` (Frontend-Job: lint + build).

## 📝 Hinweise

- Veralteter Hook `useApi` ist entfernt/gesperrt. Bitte `useAPIHook` oder `useStaleWhileRevalidate` verwenden.
- PWA-Meta-Tags sind im `index.html` aktualisiert (`mobile-web-app-capable`).
