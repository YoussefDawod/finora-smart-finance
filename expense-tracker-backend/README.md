# Expense Tracker - Backend

Eine moderne REST-API für Ausgaben-Management mit Node.js, Express und MongoDB.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5.x
- **Database:** MongoDB (Mongoose ODM)
- **Extras:** CORS, dotenv

## 📦 Installation

```bash
# 1. Repo klonen
git clone <repo-url>
cd expense-tracker-backend

# 2. Dependencies installieren
npm install

# 3. .env Datei erstellen und MongoDB URI eintragen
cp .env.example .env

# 4. Server starten (mit Auto-Reload)
npm run dev
```

Server läuft auf: http://localhost:5000

## 📡 API-Routen

### Health Check
- `GET /api/health` - Server-Status und MongoDB-Verbindung

### Transactions

#### POST /api/transactions
Neue Transaktion erstellen

**Body:**
```json
{
  "amount": 45.99,
  "category": "Lebensmittel",
  "description": "Supermarkt",
  "type": "expense",
  "date": "2026-01-07",
  "tags": ["groceries"],
  "notes": "Optional"
}
```
**Response:** 201 Created

#### GET /api/transactions
Alle Transaktionen abrufen (mit Filterung und Paginierung)

**Query Parameter:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `type` (income | expense)
- `category` (z.B. Lebensmittel)
- `startDate` (YYYY-MM-DD)
- `endDate` (YYYY-MM-DD)
- `sort` (date | amount, default: date)
- `order` (asc | desc, default: desc)

**Beispiel:**
```
GET /api/transactions?type=expense&category=Lebensmittel&page=1&limit=10
```
**Response:** 200 OK

#### GET /api/transactions/:id
Einzelne Transaktion abrufen

**Response:** 200 OK oder 404 Not Found

#### GET /api/transactions/stats/summary
Zusammenfassung (Einnahmen, Ausgaben, Saldo)

**Query Parameter:**
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "totalIncome": 0,
  "totalExpense": 45.99,
  "balance": -45.99,
  "transactionCount": 1
}
```

#### PUT /api/transactions/:id
Transaktion aktualisieren (alle Felder optional)

**Body:**
```json
{
  "amount": 99.50,
  "category": "Transport",
  "description": "Updated",
  "notes": "Optional"
}
```
**Response:** 200 OK | 400 Bad Request | 404 Not Found

#### DELETE /api/transactions/:id
Einzelne Transaktion löschen

**Response:** 200 OK | 404 Not Found

#### DELETE /api/transactions?confirm=true
Alle Transaktionen löschen (⚠️ GEFÄHRLICH!)

**Query Parameter:**
- `confirm=true` (erforderlich für Sicherheit)

**Response:** 200 OK | 400 Bad Request

## 🏁 Development & Linting

```bash
# Lint prüfen
npm run lint

# Lint automatisch beheben
npm run lint:fix
```

## 🚀 Production Deployment

### Prerequisites
- Node.js 20+
- PM2 (`npm install -g pm2`)
- Nginx reverse proxy
- SSL Certificate

### Server Setup (One-time)
```bash
cd /var/www/expense-tracker-backend
npm ci --production
nano .env.production # Add secrets
pm2 start ecosystem.config.js
pm2 save
sudo nano /etc/nginx/sites-available/expense-tracker
sudo systemctl restart nginx
```

### Deploy Updates
```bash
./deploy.sh
```

### Monitor
```bash
pm2 status
pm2 logs expense-tracker-api
```

## 🌍 API Live URL

- **Production:** https://expense-tracker.youssefdawod.com/api/transactions
- **Health Check:** https://expense-tracker.youssefdawod.com/api/health

## 📋 Status

- [x] MongoDB Atlas Cluster verbunden
- [x] Transaction Model (Mongoose Schema)
- [x] CRUD Endpoints (POST, GET, PUT, DELETE)
- [x] Fehlerbehandlung & Logging
- [x] Environment Configuration
- [x] Production Deployment Setup
- [ ] Frontend (React + Vite)

## 👨‍💻 Autor

Youssef Dawod

## 📄 Lizenz

ISC