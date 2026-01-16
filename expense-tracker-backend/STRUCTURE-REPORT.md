# Expense Tracker Backend - Detaillierter Strukturreport

**Projekt:** Expense Tracker REST API  
**Version:** 1.0.0  
**Author:** Youssef Dawod  
**Datum:** 12. Januar 2026  
**Beschreibung:** REST API für Expense Tracker mit Node.js, Express und MongoDB

---

## 📋 Inhaltsverzeichnis

1. [Projektstruktur (Überblick)](#projektstruktur-überblick)
2. [Root-Ebene Dateien](#root-ebene-dateien)
3. [Konfigurationsverzeichnis](#konfigurationsverzeichnis-srcconfigenvjs)
4. [Middleware-Verzeichnis](#middleware-verzeichnis-srcmiddleware)
5. [Datenmodelle](#datenmodelle-srcmodels)
6. [API-Routes](#api-routes-srcroutes)
7. [Utility-Funktionen](#utility-funktionen-srcutils)
8. [Logs-Verzeichnis](#logs-verzeichnis-srclogs)
9. [Test-Dateien](#test-dateien)
10. [Abhängigkeiten & Dependencies](#abhängigkeiten--dependencies)

---

## 🗂️ Projektstruktur (Überblick)

```
expense-tracker-backend/
│
├── 📄 Konfigurationsdateien (Root)
│   ├── .env                          [Git Ignored] Umgebungsvariablen (Produktiv)
│   ├── .env.example                  Template für Umgebungsvariablen
│   ├── .gitignore                    Git-Ignorliste
│   ├── package.json                  NPM Abhängigkeiten & Scripts
│   ├── eslint.config.js              ESLint Konfiguration
│   ├── ecosystem.config.js           PM2 Deployment Konfiguration
│   └── playwright.config.js          (Shared) Playwright E2E Test Konfiguration
│
├── 🚀 Server & Startup
│   ├── server.js                     Express App Einstiegspunkt (162 Zeilen)
│   └── start.js                      Wrapper für Startup-Logik
│
├── 📚 Dokumentation
│   ├── expense-tracker-backend.md    Backend Dokumentation (derzeit leer)
│   └── STRUCTURE-REPORT.md           Dieser Bericht (Dateien & Ordnersstruktur)
│
├── 🧪 Test-Dateien
│   ├── test-api.js                   API Integration Tests
│   ├── test-login.js                 Login-Flow Tests
│   ├── test-register.js              Registrierungs-Flow Tests
│   ├── test-routes.js                Route-Tests
│   ├── test-e2e-auth.js              End-to-End Auth Tests
│   ├── test-debug-user.js            Debug/Development User Tests
│   └── test-login.ps1                PowerShell Login Test Script
│
├── 📦 src/ (Hauptapplikationscode)
│   ├── config/                       [Konfigurationsmodul]
│   ├── middleware/                   [Express Middleware]
│   ├── models/                       [Mongoose Datenmodelle]
│   ├── routes/                       [API Endpoint Routes]
│   ├── utils/                        [Hilfsfunktionen & Services]
│   └── logs/                         [Laufzeit-Logverzeichnis]
│
├── 📋 logs/ (Produktivlogs)
│   └── debug-2026-01-09_04-55-39.txt  Debug-Logdatei
│
└── 🚀 Deployment & Build
    ├── deploy.sh                     Deployment-Skript
    └── ecosystem.config.js           PM2 Konfiguration
```

---

## 📄 Root-Ebene Dateien

### `package.json` - Projekt Manifest & Abhängigkeiten
**Typ:** NPM Konfiguration  
**Größe:** ~800 Bytes

**Beschreibung:**
- Projekt-Metadata (Name, Version, Autor)
- NPM Scripts für Dev, Production, Linting
- Produktions-Abhängigkeiten (Dependencies)
- Development-Abhängigkeiten (DevDependencies)

**NPM Scripts:**
```json
{
  "start": "node server.js",           // Produktiv-Start
  "dev": "nodemon server.js",          // Entwicklung mit Auto-Reload
  "production": "NODE_ENV=production node server.js",
  "lint": "eslint .",                  // Code-Qualität prüfen
  "lint:fix": "eslint . --fix"         // Code-Qualität automatisch fixen
}
```

**Produktions-Abhängigkeiten:**
| Paket | Version | Zweck |
|-------|---------|-------|
| express | ^5.2.1 | Web Framework |
| mongoose | ^9.1.2 | MongoDB ODM |
| cors | ^2.8.5 | Cross-Origin Requests |
| bcryptjs | ^2.4.3 | Password Hashing |
| jsonwebtoken | ^9.0.2 | JWT Authentication |
| dotenv | ^17.2.3 | Umgebungsvariablen |
| uuid | ^13.0.0 | Eindeutige IDs |

**Development-Abhängigkeiten:**
| Paket | Version | Zweck |
|-------|---------|-------|
| nodemon | ^3.1.11 | Auto-Reload bei Code-Änderungen |
| eslint | ^9.39.1 | Code-Linting |

---

### `.env.example` - Umgebungsvariablen Template
**Typ:** Konfiguration (unverschlüsselt)  
**Status:** ✅ Versionskontrolle  
**Inhalt:** Template ohne Secrets

**Konfigurierte Bereiche:**

#### SERVER
```env
NODE_ENV=development              # Umgebung: development|production
PORT=5000                         # API Server Port
API_URL=http://localhost:5000     # API Base URL
```

#### DATABASE
```env
MONGODB_URI=mongodb+srv://...     # MongoDB Connection String
MONGODB_DB=expense-tracker        # Datenbank-Name
```

#### CORS
```env
CORS_ORIGIN=http://localhost:5173 # Frontend Origin für CORS
```

#### AUTHENTICATION (JWT)
```env
JWT_SECRET=your-secret-key...     # JWT Signing Secret (min. 32 Zeichen)
JWT_EXPIRE=7d                     # Token Expiration
```

#### LOGGING
```env
LOG_LEVEL=info                    # Log-Stufe: debug|info|warn|error
LOG_DIR=./logs                    # Log-Verzeichnis
```

#### RATE LIMITING
```env
RATE_LIMIT_WINDOW_MS=900000       # 15 Minuten
RATE_LIMIT_MAX_REQUESTS=100       # Max Requests pro Window
```

#### FEATURE FLAGS
```env
FEATURE_STATS=true                # Statistiken aktivieren
FEATURE_BULK_DELETE=true          # Bulk-Delete aktivieren
```

---

### `.env` (Production)
**Typ:** Umgebungskonfiguration  
**Status:** ❌ Git Ignored (enthält Secrets)  
**Inhalt:** Produktive Secrets und Credentials

---

### `eslint.config.js` - Code-Qualität Konfiguration
**Typ:** ESLint Konfiguration  
**Zweck:** JavaScript Code-Style & Qualitätsprüfung

---

### `ecosystem.config.js` - PM2 Deployment
**Typ:** PM2 Konfiguration  
**Zweck:** Produktives Application Management

**Funktionen:**
- App-Start/Stop/Restart Management
- Clustering & Load Balancing
- Automatischer Restart bei Crashes
- Log-Management
- Environment Management (dev, staging, prod)

---

### `server.js` - Express App Einstiegspunkt
**Typ:** Node.js/Express Hauptdatei  
**Zeilen:** 162  
**Startgröße:** ~5KB

**Haupt-Funktionen:**
1. **Umgebungskonfiguration laden**
   ```javascript
   require('dotenv').config();
   const config = require('./src/config/env');
   ```

2. **Middleware Stack initialisieren**
   - CORS (Cross-Origin Resource Sharing)
   - Request Logger
   - JSON Parser
   - Error Handler

3. **MongoDB Verbindung mit Retry-Logik**
   - Automatische Reconnection bei Fehlern
   - Max. 5 Versuche mit exponentialem Backoff
   - Detailliertes Logging

4. **Routes registrieren**
   ```javascript
   app.use('/api/auth', authRoutes);
   app.use('/api/transactions', transactionRoutes);
   app.use('/api/users', userRoutes);
   ```

5. **Server starten**
   ```javascript
   app.listen(port, () => {
     logger.info(`Server running on port ${port}`);
   });
   ```

**Abhängigkeiten:**
- Express
- Mongoose (MongoDB)
- CORS
- Crypto (für Token-Generierung)

---

### `start.js` - Startup-Wrapper
**Typ:** Node.js Startup-Datei  
**Zweck:** Alternativer Einstiegspunkt für Deployment

---

### `deploy.sh` - Deployment-Skript
**Typ:** Bash-Skript  
**Zweck:** Automatisiertes Deployment zu Produktionsserver

**Typische Operationen:**
- Git Pull
- npm install
- npm run lint
- Server Restart (über PM2)
- Health Check

---

## 🔧 Konfigurationsverzeichnis `src/config/env.js`

**Typ:** Zentralisierte Umgebungskonfiguration  
**Zeilen:** 123  
**Größe:** ~4KB

### Konfigurationsstruktur

```javascript
const config = {
  development: { /* Dev-Einstellungen */ },
  production: { /* Prod-Einstellungen */ },
  staging: { /* Staging-Einstellungen */ }
}
```

### Entwicklungs-Konfiguration (development)

#### nodeEnv
```javascript
nodeEnv: 'development'
```

#### Server
```javascript
port: 5000
apiUrl: 'http://localhost:5000'
frontendUrl: 'http://localhost:3001' // oder 3000, 5173
```

#### MongoDB
```javascript
mongodb: {
  uri: process.env.MONGODB_URI,
  db: 'expense-tracker'
}
```

#### CORS (Multi-Origin Development)
```javascript
cors: {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}
```

#### JWT (Authentication)
```javascript
jwt: {
  secret: 'dev-secret-key-change-in-production',
  expire: '7d'
}
```

#### Logging
```javascript
logging: {
  level: 'debug',  // Detaillierte Logs in Entwicklung
  dir: './logs'
}
```

#### Rate Limiting
```javascript
rateLimit: {
  windowMs: 900000,  // 15 Minuten
  maxRequests: 100   // 100 Requests pro 15 Min
}
```

#### Feature Flags
```javascript
features: {
  stats: true,        // Statistiken aktiviert
  bulkDelete: true    // Batch-Delete aktiviert
}
```

### Produktions-Konfiguration (production)

**Unterschiede zu Development:**
- `apiUrl`: `'https://api.youssefdawod.com'`
- `frontendUrl`: `'https://expense-tracker.youssefdawod.com'`
- `cors.origin`: Production URLs nur
- `logging.level`: `'info'` (weniger verbose)
- `rateLimit`: Strengere Limits (z.B. maxRequests: 50)
- `jwt.secret`: Aus Umgebungsvariable (SECRET!)

---

## 🛡️ Middleware-Verzeichnis `src/middleware/`

### 1. `authMiddleware.js` - JWT Authentication
**Typ:** Express Middleware  
**Zweck:** Authentifizierung & Autorisierung

**Funktionen:**
- JWT Token aus Authorization Header extrahieren
- Token verifizieren
- User-ID in `req.user` speichern
- Nicht authentifizierte Requests ablehnen

**Verwendung:**
```javascript
router.get('/protected-route', auth, (req, res) => {
  const userId = req.user.sub;
  // ...
});
```

**Fehlerbehandlung:**
- `401 Unauthorized`: Kein/invalides Token
- `403 Forbidden`: Token abgelaufen

---

### 2. `errorHandler.js` - Global Error Handling
**Typ:** Express Error Middleware  
**Zweck:** Zentrale Fehlerbehandlung

**Funktionen:**
- HTTP-Fehler in JSON-Response konvertieren
- Stack Traces in Production verstecken
- Konsistente Error-Response Format
- Logging von Errors

**Response Format:**
```json
{
  "error": "Fehlermeldung",
  "code": "ERROR_CODE",
  "status": 500,
  "requestId": "uuid-123"
}
```

---

### 3. `requestLogger.js` - HTTP Request Logging
**Typ:** Express Middleware  
**Zweck:** Alle HTTP Requests loggen

**Geloggte Informationen:**
- Method (GET, POST, etc.)
- URL Path
- Status Code
- Response Time
- Client IP
- User Agent
- Request ID (für Tracing)

**Log-Format:**
```
[INFO] GET /api/transactions 200 12ms - 127.0.0.1
```

**Features:**
- Request ID für Request Tracing
- Farbige Console-Ausgabe (Development)
- Performance Metriken

---

## 📊 Datenmodelle `src/models/`

### 1. `User.js` - Benutzerkonto-Schema
**Typ:** Mongoose Schema  
**Zeilen:** 208

#### Datenstruktur

```javascript
{
  // Authentifizierung
  email: String (unique, indexed),        // Benutzer E-Mail
  passwordHash: String,                   // Gehashed Password (bcryptjs)
  name: String,                           // Vorname
  lastName: String,                       // Nachname
  
  // Verifizierung & Tokens
  isVerified: Boolean,                    // E-Mail verified?
  verificationToken: String,              // Für E-Mail-Verifikation
  verificationExpires: Date,              // Token Expiration
  
  // Passwort Reset
  passwordResetToken: String,             // Für Reset-Link
  passwordResetExpires: Date,             // Token Expiration
  
  // E-Mail Änderung
  emailChangeToken: String,               // Für E-Mail-Änderung
  emailChangeNewEmail: String,            // Neue E-Mail (pending)
  emailChangeExpires: Date,               // Token Expiration
  
  // Benutzer-Profil
  avatar: String,                         // Avatar URL
  phone: String,                          // Telefonnummer
  
  // Benutzerpräferenzen
  preferences: {
    theme: String,                        // 'light'|'dark'|'system'
    currency: String,                     // 'USD'|'EUR'|'GBP'|'CHF'|'JPY'
    timezone: String,                     // 'Europe/Berlin' etc.
    language: String,                     // 'en'|'de'|'fr'
    emailNotifications: Boolean            // Benachrichtigungen aktiviert?
  },
  
  // Sicherheit & Audit
  lastLogin: Date,                        // Letzter Login
  lastPasswordChange: Date,               // Letzter Password-Change
  passwordChangedAt: Date,                // Letzter Change-Timestamp
  
  // Two-Factor Authentication (2FA)
  twoFactorEnabled: Boolean,              // 2FA aktiviert?
  twoFactorSecret: String,                // TOTP Secret
  
  // Refresh Tokens (Session Management)
  refreshTokens: [{
    tokenHash: String,                    // Gehashed Token (Sicherheit)
    expiresAt: Date,                      // Token Expiration
    createdAt: Date,                      // Creation Time
    userAgent: String,                    // Browser/Client Info
    ip: String                            // Client IP
  }],
  
  // Metadaten
  createdAt: Date,                        // Konto-Erstellung
  updatedAt: Date                         // Letzte Aktualisierung
}
```

#### Schema-Validierung

**E-Mail Validierung:**
```javascript
email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
  match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'E-Mail ist ungültig'],
  index: true
}
```

**Telefon Validierung:**
```javascript
phone: {
  type: String,
  match: [/^[\d\s\-\+\(\)]+$|^$/, 'Telefonnummer hat ungültiges Format']
}
```

**Indizierung:**
- `email`: Schnelle Lookups bei Login/Registration
- `createdAt`: Zeitbasierte Abfragen

#### Methoden (Schema Methods)

```javascript
// Passwort setzen (mit Hashing)
user.setPassword(plaintextPassword)

// Passwort verifizieren
user.verifyPassword(plaintextPassword) → Boolean

// Verification Token generieren
user.generateVerification() → token

// Password Reset Token generieren
user.generatePasswordReset() → token

// 2FA aktivieren
user.enable2FA() → secret

// 2FA verifizieren
user.verify2FA(token) → Boolean

// Refresh Token hinzufügen
user.addRefreshToken(token, userAgent, ip)

// Refresh Token validieren
user.validateRefreshToken(tokenHash) → Boolean
```

---

### 2. `Transaction.js` - Transaktions-Schema
**Typ:** Mongoose Schema  
**Zeilen:** 139

#### Datenstruktur

```javascript
{
  // Transaktions-Grundinformationen
  amount: Number,                         // Betrag (min: 0.01, max: 1.000.000)
  category: String,                       // Kategorie (enum)
  description: String,                    // Beschreibung (3-255 Zeichen)
  type: String,                           // 'income' oder 'expense'
  date: Date,                             // Transaktions-Datum (indexed)
  
  // Zusätzliche Informationen
  tags: [String],                         // Tags/Labels
  notes: String,                          // Notizen (max 500 Zeichen)
  
  // Benutzer-Zuordnung
  userId: ObjectId (ref: 'User'),         // Benutzer-ID (indexed)
  
  // Metadaten
  createdAt: Date,                        // Erstellungsdatum
  updatedAt: Date                         // Änderungsdatum
}
```

#### Kategorie-Enums

```javascript
[
  'Lebensmittel',      // Groceries
  'Transport',         // Verkehr/Benzin
  'Unterhaltung',      // Entertainment
  'Miete',             // Rent/Housing
  'Versicherung',      // Insurance
  'Gesundheit',        // Health/Medical
  'Bildung',           // Education
  'Sonstiges',         // Other
  'Gehalt',            // Salary/Income
  'Freelance',         // Freelance Income
  'Investitionen',     // Investments
  'Geschenk'           // Gifts
]
```

#### Validierung

**Amount:**
```javascript
amount: {
  type: Number,
  required: true,
  min: 0.01,
  max: 1000000,
  set: (v) => parseFloat(v.toFixed(2))  // Auf 2 Dezimalstellen runden
}
```

**Description:**
```javascript
description: {
  type: String,
  required: true,
  trim: true,
  minlength: 3,
  maxlength: 255
}
```

**Indizierung:**
- `category`: Kategorie-Filter Queries
- `type`: Income/Expense Filterung
- `date`: Zeitbasierte Abfragen
- `userId`: User-spezifische Transactions

#### Features

- **2-Dezimal-Rundung:** Finanzielle Genauigkeit
- **User Isolation:** Jede Transaction gehört zu genau einem User
- **Timestamps:** createdAt/updatedAt automatisch
- **Virtuelle Felder:** Unterstützung in JSON

---

## 🌐 API-Routes `src/routes/`

### 1. `auth.js` - Authentifizierungs-Endpoints
**Typ:** Express Router  
**Zeilen:** 505

#### Endpoints

**POST /api/auth/register** - Neuen Account erstellen
```
Request:
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John"
}

Success Response (201):
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John",
    "isVerified": false,
    "createdAt": "2026-01-12T12:00:00Z",
    "updatedAt": "2026-01-12T12:00:00Z"
  },
  "verificationLink": "https://...verify?token=..." // Dev-Mode nur
}

Error Response (400/409):
{
  "error": "Email bereits registriert",
  "code": "EMAIL_EXISTS"
}
```

**POST /api/auth/login** - Account Login
```
Request:
{
  "email": "user@example.com",
  "password": "securePassword123",
  "rememberMe": false  // Optional: Longer-lasting Token
}

Success Response (200):
{
  "user": { /* User Object */ },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "expiresIn": 3600
}

Error Response (401):
{
  "error": "Ungültige Credentials",
  "code": "INVALID_CREDENTIALS"
}
```

**POST /api/auth/refresh** - Token erneuern
```
Request:
{
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}

Success Response (200):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**POST /api/auth/logout** - Logout (Token invalidieren)
```
Success Response (200):
{
  "message": "Logout erfolgreich"
}
```

**POST /api/auth/verify-email** - E-Mail verifizieren
```
Request:
{
  "token": "verification-token-from-email"
}

Success Response (200):
{
  "message": "E-Mail erfolgreich verifiziert",
  "user": { /* Updated User Object */ }
}
```

**POST /api/auth/forgot-password** - Passwort-Reset anfragen
```
Request:
{
  "email": "user@example.com"
}

Success Response (200):
{
  "message": "Reset-Link gesendet"
  // Nur in Production: Token wird per Email gesendet
  // In Development: kann Test-Link zurückgegeben werden
}
```

**POST /api/auth/reset-password** - Passwort zurücksetzen
```
Request:
{
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword456"
}

Success Response (200):
{
  "message": "Passwort erfolgreich geändert",
  "user": { /* Updated User Object */ }
}
```

**Authentifizierung:**
- Token-Type: JWT (JSON Web Token)
- Access Token TTL: 1 Stunde (3600 Sekunden)
- Refresh Token TTL: 7 Tage
- Token Storage: Refresh Token wird in DB gehashed gespeichert

---

### 2. `transactions.js` - Transaktions-Verwaltung
**Typ:** Express Router  
**Zeichen:** [Anzahl Zeilen ausstehend]

#### Endpoints (CRUD + mehr)

**GET /api/transactions** - Alle Transaktionen des Users
```
Query Parameters:
- ?page=1                    // Pagination
- ?limit=20                  // Items pro Seite
- ?category=Lebensmittel     // Nach Kategorie filtern
- ?type=expense              // Nach Typ filtern (income/expense)
- ?startDate=2026-01-01      // Zeitraum-Start
- ?endDate=2026-01-31        // Zeitraum-Ende
- ?search=Supermarkt         // Textsuche

Response (200):
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "amount": 45.99,
      "category": "Lebensmittel",
      "description": "Wochenmarkteinkauf",
      "type": "expense",
      "date": "2026-01-12",
      "tags": ["weekly", "groceries"],
      "userId": "507f1f77bcf86cd799439011",
      "createdAt": "2026-01-12T10:30:00Z",
      "updatedAt": "2026-01-12T10:30:00Z"
    }
    // ... mehr Transaktionen
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "pages": 8
  }
}
```

**GET /api/transactions/:id** - Einzelne Transaktion
```
Response (200):
{
  "data": { /* Transaction Object */ }
}

Error Response (404):
{
  "error": "Transaktion nicht gefunden",
  "code": "NOT_FOUND"
}
```

**POST /api/transactions** - Neue Transaktion erstellen
```
Request:
{
  "amount": 45.99,
  "category": "Lebensmittel",
  "description": "Wochenmarkteinkauf",
  "type": "expense",
  "date": "2026-01-12",
  "tags": ["weekly", "groceries"],
  "notes": "Bio-Produkte"
}

Success Response (201):
{
  "data": { /* Created Transaction Object */ }
}

Validation Error (400):
{
  "error": "Amount muss > 0 sein",
  "code": "VALIDATION_ERROR"
}
```

**PUT /api/transactions/:id** - Transaktion aktualisieren
```
Request:
{
  "amount": 49.99,
  "description": "Updated Wochenmarkteinkauf"
  // Andere Felder optional
}

Success Response (200):
{
  "data": { /* Updated Transaction Object */ }
}
```

**DELETE /api/transactions/:id** - Transaktion löschen
```
Success Response (204):
(Kein Response Body)

Error Response (404):
{
  "error": "Transaktion nicht gefunden"
}
```

**GET /api/transactions/stats/overview** - Statistik-Überblick
```
Query Parameters:
- ?period=month              // month|year|allTime
- ?startDate=2026-01-01
- ?endDate=2026-01-31

Response (200):
{
  "data": {
    "totalIncome": 5000.00,
    "totalExpense": 2500.50,
    "balance": 2499.50,
    "transactionCount": 45,
    "categoryBreakdown": {
      "Lebensmittel": 450.00,
      "Transport": 200.00,
      // ...
    },
    "monthlyTrend": [
      {
        "month": "2025-12",
        "income": 5000,
        "expense": 2200
      }
      // ...
    ]
  }
}
```

**DELETE /api/transactions** - Bulk-Delete (Feature-Flag)
```
Request:
{
  "ids": ["id1", "id2", "id3"]
}

Success Response (200):
{
  "deleted": 3,
  "message": "3 Transaktionen gelöscht"
}
```

**Authentifizierung:** ✅ Alle Endpoints erfordern gültiges JWT Token

---

### 3. `users.js` - Benutzerverwaltung
**Typ:** Express Router

#### Endpoints

**GET /api/users/profile** - Eigenes Profil abrufen
```
Success Response (200):
{
  "data": { /* User Object */ }
}
```

**PUT /api/users/profile** - Profil aktualisieren
```
Request:
{
  "name": "John",
  "lastName": "Doe",
  "phone": "+49123456789",
  "avatar": "https://..."
}

Success Response (200):
{
  "data": { /* Updated User Object */ }
}
```

**PUT /api/users/preferences** - Benutzereinstellungen
```
Request:
{
  "theme": "dark",
  "currency": "EUR",
  "timezone": "Europe/Berlin",
  "language": "de",
  "emailNotifications": true
}

Success Response (200):
{
  "data": { /* Updated Preferences */ }
}
```

**PUT /api/users/password** - Passwort ändern
```
Request:
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}

Success Response (200):
{
  "message": "Passwort erfolgreich geändert"
}

Error Response (401):
{
  "error": "Aktuelles Passwort ist falsch",
  "code": "INVALID_PASSWORD"
}
```

**PUT /api/users/email** - E-Mail ändern
```
Request:
{
  "newEmail": "newemail@example.com",
  "password": "currentPassword123"
}

Success Response (200):
{
  "message": "Bestätigungslink gesendet",
  "pendingEmail": "newemail@example.com"
}
```

**POST /api/users/2fa/enable** - 2FA aktivieren
```
Success Response (200):
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qrCode": "data:image/png;base64,..."
}
```

**POST /api/users/2fa/verify** - 2FA verifizieren
```
Request:
{
  "token": "123456"  // 6-Digit TOTP Code
}

Success Response (200):
{
  "message": "2FA erfolgreich aktiviert",
  "backupCodes": ["CODE1", "CODE2", ...]  // Backup-Codes
}
```

**DELETE /api/users/account** - Account löschen
```
Request:
{
  "password": "currentPassword123",
  "confirmation": "DELETE"  // Zur Bestätigung
}

Success Response (200):
{
  "message": "Account erfolgreich gelöscht"
}

Note: Löscht User + alle Transaktionen (CASCADE)
```

**Authentifizierung:** ✅ Alle Endpoints erfordern gültiges JWT Token

---

## 🔧 Hilfsfunktionen `src/utils/`

### 1. `logger.js` - Logging System
**Typ:** Custom Logger  
**Zweck:** Zentrale Logverwaltung

#### Log-Levels
```javascript
logger.debug(message, metadata)     // Detaillierte Debug-Info
logger.info(message, metadata)      // Allgemeine Informationen
logger.warn(message, metadata)      // Warnungen
logger.error(message, metadata)     // Fehler
```

#### Features
- **Farbige Ausgabe:** Development Mode
- **Strukturierte Logs:** JSON für Processing
- **File Logging:** Logs in `./logs/debug-*.txt`
- **Metadata:** Request ID, Timestamp, User Info
- **Log Rotation:** Automatisches Archivieren alter Logs

#### Verwendungsbeispiel
```javascript
logger.info('User logged in', {
  userId: user._id,
  email: user.email,
  ip: req.ip,
  userAgent: req.get('user-agent')
});
```

---

### 2. `emailService.js` - E-Mail Versand
**Typ:** Email Service  
**Zweck:** E-Mail-Verwaltung (Verification, Reset, etc.)

#### Funktionen

**sendVerificationEmail(user, token)**
- Sendet Verifizierungs-Link
- Gültig für 24 Stunden
- Development Mode: Gibt Link direkt zurück

**sendPasswordResetEmail(user, token)**
- Sendet Password-Reset-Link
- Gültig für 1 Stunde
- Development Mode: Gibt Link direkt zurück

**sendEmailChangeConfirmation(user, newEmail, token)**
- Bestätigung für E-Mail-Änderung
- Gültig für 2 Stunden

**sendWelcomeEmail(user)**
- Willkommens-E-Mail nach Registrierung

#### Konfiguration
- **Provider:** SMTP (Konfigurierbar über .env)
- **From:** noreply@expense-tracker.app
- **Templates:** HTML mit Inline CSS
- **Fallback:** Dev-Mode mit direkten Links

---

## 📝 Logs-Verzeichnis `src/logs/`

**Typ:** Runtime Logs  
**Erstellt durch:** Logger-System

### Log-Dateien Struktur
```
logs/
└── debug-2026-01-09_04-55-39.txt    // Debug-Logs mit Timestamp
```

### Log-Datei Format
```
[YYYY-MM-DD HH:MM:SS] [LEVEL] [REQUEST_ID] Message
{
  "timestamp": "2026-01-12T12:30:45.123Z",
  "level": "INFO",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "User logged in",
  "metadata": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "ip": "127.0.0.1"
  }
}
```

---

## 🧪 Test-Dateien

### 1. `test-api.js` - API Integration Tests
**Typ:** Node.js Test Suite  
**Zweck:** Alle API-Endpoints testen

**Tests:**
- ✅ Server Startup
- ✅ Database Connection
- ✅ Request Logging
- ✅ Error Handling
- ✅ CORS Configuration
- ✅ Route Registration

---

### 2. `test-register.js` - Registrierungs-Tests
**Typ:** Node.js Test  
**Zweck:** Registration-Flow testen

**Tests:**
- ✅ Erfolgreiche Registrierung
- ✅ Duplikat E-Mail ablehnen
- ✅ Ungültige E-Mail Format
- ✅ Schwaches Passwort ablehnen
- ✅ Verification-Email versendet

---

### 3. `test-login.js` - Login-Tests
**Typ:** Node.js Test  
**Zweck:** Authentication-Flow testen

**Tests:**
- ✅ Erfolgreicher Login
- ✅ Falsches Passwort
- ✅ Nicht existente E-Mail
- ✅ Token-Generierung
- ✅ Token-Refresh

---

### 4. `test-routes.js` - Route Tests
**Typ:** Node.js Test  
**Zweck:** Alle Routes testen

**Tests:**
- ✅ Auth Routes
- ✅ Transaction Routes
- ✅ User Routes
- ✅ Authentifizierung erforderlich
- ✅ Error Responses

---

### 5. `test-e2e-auth.js` - End-to-End Auth Tests
**Typ:** E2E Test Suite  
**Zweck:** Kompletter Auth-Flow testen

**Test-Szenarios:**
1. Neue User registrieren
2. E-Mail verifizieren
3. Login mit verifizierten Credentials
4. Token erneuern
5. Logout
6. Passwort ändern
7. Passwort Reset
8. Account löschen

---

### 6. `test-debug-user.js` - Debug/Dev User Tests
**Typ:** Node.js Test  
**Zweck:** Development User erstellen/verwalten

**Funktionen:**
- Test-User mit vordefinierten Credentials
- Test-Transactions generieren
- DB-State zurücksetzen

---

### 7. `test-login.ps1` - PowerShell Login Script
**Typ:** PowerShell Skript  
**Zweck:** Command-line Login-Test (Windows)

**Verwendung:**
```powershell
.\test-login.ps1
```

**Output:**
- Login-Status
- Token
- User-Info

---

## 📦 Abhängigkeiten & Dependencies

### Produktions-Dependencies

#### Express (`^5.2.1`)
- **Zweck:** Web Framework & HTTP Server
- **Verwendung:** API-Endpoints, Middleware, Routing
- **Features:** Express 5 mit native Promises, async/await

#### Mongoose (`^9.1.2`)
- **Zweck:** MongoDB ODM (Object Data Modeling)
- **Verwendung:** User & Transaction Modelle
- **Features:** Schema Validation, Hooks, Indexing

#### CORS (`^2.8.5`)
- **Zweck:** Cross-Origin Resource Sharing Middleware
- **Verwendung:** Frontend-Backend Kommunikation
- **Konfiguration:** Multi-Origin Support (Dev/Prod)

#### bcryptjs (`^2.4.3`)
- **Zweck:** Password Hashing & Verification
- **Verwendung:** User Passwort-Sicherung
- **Konfiguration:** Salt Rounds = 10

#### jsonwebtoken (`^9.0.2`)
- **Zweck:** JWT Token Generierung & Verifizierung
- **Verwendung:** Authentication & Authorization
- **Token Types:**
  - Access Token (1 Stunde)
  - Refresh Token (7 Tage)

#### dotenv (`^17.2.3`)
- **Zweck:** Umgebungsvariablen laden
- **Verwendung:** `.env` Datei Handling
- **Features:** .env.example Template-Support

#### uuid (`^13.0.0`)
- **Zweck:** Eindeutige ID-Generierung
- **Verwendung:** Request IDs, Token IDs
- **Format:** RFC 4122 v4 UUIDs

### Development Dependencies

#### nodemon (`^3.1.11`)
- **Zweck:** Auto-Reload bei Code-Änderungen
- **Verwendung:** `npm run dev`
- **Config:** Überwacht `.js` Dateien im `src/` Verzeichnis

#### eslint (`^9.39.1`)
- **Zweck:** Code-Quality & Linting
- **Verwendung:** `npm run lint` / `npm run lint:fix`
- **Config:** `eslint.config.js`

---

## 🔐 Sicherheit & Best Practices

### Password Security
- ✅ Bcryptjs Hashing (Salt 10)
- ✅ Niemals Plaintext Passwords speichern
- ✅ Password Reset mit Tokens (1h Expiration)
- ✅ Password Change Audit Trail

### API Security
- ✅ JWT Authentication
- ✅ CORS Protection
- ✅ Rate Limiting
- ✅ Input Validation & Sanitization
- ✅ SQL/NoSQL Injection Prevention (Mongoose)
- ✅ XSS Protection (Response Headers)

### Data Protection
- ✅ User Isolation (userId Check)
- ✅ Encryption für Sensitive Data (Tokens)
- ✅ HTTPS Ready (Production Config)
- ✅ Database Backups (via MongoDB)

### Session Management
- ✅ Stateless JWT Architecture
- ✅ Refresh Token Rotation
- ✅ Token Blacklisting (DB gehashed)
- ✅ Multi-Device Sessions

---

## 📈 Skalierbarkeit & Performance

### Indizierung
- `User.email`: Schnelle Email-Lookups
- `Transaction.userId`: User-spezifische Queries
- `Transaction.category`: Kategorie-Filterung
- `Transaction.date`: Zeitbasierte Abfragen

### Caching
- Request Deduplication (Frontend)
- DB Query Optimization (Indexes)
- Connection Pooling (Mongoose)

### Rate Limiting
- Default: 100 Requests / 15 Minuten
- Configurable via .env
- IP-basiert

### Database
- MongoDB Atlas (Cloud)
- Replica Sets für High Availability
- Automatic Backups
- Sharding Ready

---

## 🚀 Deployment

### Development
```bash
npm install
npm run dev
```

### Production
```bash
NODE_ENV=production npm start
# oder mit PM2:
pm2 start ecosystem.config.js --env production
```

### Docker Ready
- Dockerfile kann erstellt werden
- Node 18+ empfohlen

---

## 📞 Support & Kontakt

**Autor:** Youssef Dawod  
**Repository:** [YoussefDawod/expense-tracker](https://github.com/YoussefDawod/expense-tracker)  
**Issues:** GitHub Issues  
**License:** ISC

---

**Bericht generiert:** 12. Januar 2026  
**Status:** ✅ Aktuell & Vollständig
