# Finora API

REST-API für Finora - Smart Finance. Gebaut mit Node.js, Express und MongoDB.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5.x
- **Database:** MongoDB (Mongoose ODM)
- **Extras:** CORS, dotenv

## 📦 Installation

```bash
# 1. Repo klonen
git clone <repo-url>
cd finora-api

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

## 👤 User Routes

### GET /api/users/me
Aktuellen User abrufen (Auth erforderlich)

**Response:** `{ success: true, data: user }`

### PUT /api/users/me
User-Profil aktualisieren

**Body:**
```json
{
  "name": "John",
  "lastName": "Doe",
  "phone": "+49 123 456789",
  "avatar": "https://..."
}
```

### POST /api/users/change-password
Passwort ändern (Auth erforderlich)

**Body:**
```json
{
  "currentPassword": "old...",
  "newPassword": "secure...",
  "confirmPassword": "secure..."
}
```

**Validierungen:**
- Aktuelles Passwort korrekt
- Neues Passwort ≠ altes Passwort
- Passwort-Anforderungen: 8+ Zeichen, Groß-, Kleinbuchstaben, Ziffern
- Passwörter stimmen überein

### POST /api/users/change-email
Email ändern (mit Verifizierungs-Token)

**Body:**
```json
{
  "newEmail": "new@example.com",
  "password": "current..."
}
```

**Response:** Email-Bestätigung an neue Adresse

### GET /api/users/verify-email-change?token=...
Email-Change verifizieren (Token aus Email-Link)

**Aktion:**
- Token validieren
- Email aktualisieren
- Tokens entfernen

### PUT /api/users/preferences
Benutzer-Einstellungen aktualisieren

**Body:**
```json
{
  "theme": "dark",
  "currency": "EUR",
  "timezone": "Europe/Berlin",
  "language": "de",
  "emailNotifications": true
}
```

**Enum-Werte:**
- theme: `light | dark | system`
- currency: `USD | EUR | GBP | CHF | JPY`
- language: `en | de | fr`

### DELETE /api/users/me
Account permanent löschen (Cascade: alle Transaktionen werden gelöscht)

**Body:** `{ password: "current..." }`

### POST /api/users/export-data
Alle User-Daten exportieren (JSON-Download)

**Response:** JSON-Datei mit User-Info + alle Transaktionen

### DELETE /api/users/transactions
Alle Transaktionen löschen (Account bleibt erhalten)

**Body:** `{ password: "current..." }`

**Response:** `{ success: true, data: { deletedCount } }`

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
cd /var/www/finora-api
npm ci --production
nano .env.production # Add secrets
pm2 start ecosystem.config.js
pm2 save
sudo nano /etc/nginx/sites-available/finora
sudo systemctl restart nginx
```

### Deploy Updates
```bash
./deploy.sh
```

### Monitor
```bash
pm2 status
pm2 logs finora-api
```

## 🌍 API Live URL

- **Production:** https://api.finora.app/api/transactions
- **Health Check:** https://api.finora.app/api/health

## 📋 Status

- [x] MongoDB Atlas Cluster verbunden
- [x] Transaction Model (Mongoose Schema)
- [x] CRUD Endpoints (POST, GET, PUT, DELETE)
- [x] User Model mit erweiterten Feldern
- [x] User Routes (Profile, Settings, Email, Data Export)
- [x] Fehlerbehandlung & Logging
- [x] Environment Configuration
- [x] Production Deployment Setup
- [ ] Frontend (React + Vite)

## 👨‍💻 Autor

Youssef Dawod

## 📄 Lizenz

ISC