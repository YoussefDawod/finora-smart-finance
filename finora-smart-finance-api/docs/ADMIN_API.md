# 🛠️ Admin API - Vollständige Referenz

Dieses Dokument dokumentiert alle Admin-API-Endpunkte der Finora Smart Finance Plattform.

## 🔐 Authentifizierung

Die Admin-Endpunkte sind geschützt durch:

1. **JWT Bearer Token** (empfohlen) – User muss die `admin`-Rolle haben
2. **API-Key Fallback** (für CLI/serverseitige Integrationen) – Header `x-admin-key`

```bash
# Option 1: JWT
curl -H "Authorization: Bearer <jwt-token>" http://localhost:3000/api/v1/admin/stats

# Option 2: API-Key
curl -H "x-admin-key: <your-key>" http://localhost:3000/api/v1/admin/stats
```

> **Hinweis:** Authentifizierung ist in **allen** Umgebungen erforderlich (JWT oder API-Key).

---

## 🚀 Schnellstart

### Option 1: CLI Tool (Empfohlen)

```bash
cd finora-smart-finance-api

# Statistiken anzeigen
node admin-cli.js stats

# Alle Users auflisten
node admin-cli.js list

# User suchen
node admin-cli.js list --search john

# User-Details anzeigen
node admin-cli.js get <userId>

# Passwort zurücksetzen
node admin-cli.js reset-password <userId> NeuesSicheresPasswort123!
```

### Option 2: REST API (Postman/cURL/Browser)

Basis-URL: `http://localhost:3000/api/v1/admin`

---

## 📊 API Endpunkte

### 1. **Statistiken abrufen**

```http
GET /api/v1/admin/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 10,
      "verifiedUsers": 7,
      "unverifiedUsers": 3,
      "usersLast7Days": 2,
      "usersLast30Days": 5,
      "totalTransactions": 142
    },
    "recentUsers": [...]
  }
}
```

---

### 2. **Alle Users auflisten**

```http
GET /api/v1/admin/users?page=1&limit=50&search=&sortBy=createdAt&order=desc
```

**Query Parameter:**
- `page` (default: 1) - Seite
- `limit` (default: 50) - Max. Anzahl
- `search` - Suche nach Name/Email
- `sortBy` (default: 'createdAt') - Sortierfeld
- `order` (default: 'desc') - asc/desc
- `isVerified` - true/false Filter
- `showSensitive` - true/false (zeigt sensitive Felder; wird in Production ignoriert)

**Beispiele:**
```bash
# Alle Users
curl http://localhost:3000/api/v1/admin/users

# Nur verifizierte
curl http://localhost:3000/api/v1/admin/users?isVerified=true

# Suche nach "john"
curl http://localhost:3000/api/v1/admin/users?search=john

# Mit sensitiven Daten (passwordHash, tokens, etc.)
# Hinweis: In Production wird showSensitive ignoriert
curl http://localhost:3000/api/v1/admin/users?showSensitive=true
```

---

### 3. **Einzelnen User abrufen**

```http
GET /api/v1/admin/users/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      ...
    },
    "stats": {
      "transactionCount": 15,
      "memberSince": "2024-01-15T10:00:00Z",
      "lastActivity": "2024-01-20T14:30:00Z"
    }
  }
}
```

---

### 4. **User bearbeiten**

```http
PATCH /api/v1/admin/users/:id
Content-Type: application/json

{
  "name": "Neuer Name",
  "email": "neue@email.com",
  "isVerified": true,
  "lastName": "Mustermann",
  "phone": "+49123456789"
}
```

**Beispiel:**
```bash
curl -X PATCH http://localhost:3000/api/v1/admin/users/60d5ec49f1b2c72b8c8e4f1a \
  -H "Content-Type: application/json" \
  -d '{"isVerified": true}'
```

---

### 5. **User löschen**

```http
DELETE /api/v1/admin/users/:id
```

⚠️ Löscht auch alle Transaktionen des Users!

**Beispiel:**
```bash
curl -X DELETE http://localhost:3000/api/v1/admin/users/60d5ec49f1b2c72b8c8e4f1a
```

---

### 6. **Passwort zurücksetzen**

```http
POST /api/v1/admin/users/:id/reset-password
Content-Type: application/json

{
  "newPassword": "neupasswort123"
}
```

**Beispiel:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/users/60d5ec49f1b2c72b8c8e4f1a/reset-password \
  -H "Content-Type: application/json" \
  -d '{"newPassword": "NeuesSicheresPasswort123!"}'
```

---

### 7. **ALLE Users löschen** ⚠️

`reason` ist ein Pflichtfeld für diesen Endpunkt.

```http
DELETE /api/v1/admin/users
Content-Type: application/json

{
  "confirm": "DELETE_ALL_USERS",
  "reason": "Bereinigung von Testdaten"
}
```

⚠️⚠️⚠️ **VORSICHT**: Löscht ALLE Users und ALLE Transaktionen!
`reason` ist für diesen Request verpflichtend.

**Beispiel:**
```bash
curl -X DELETE http://localhost:3000/api/v1/admin/users \
  -H "Content-Type: application/json" \
  -d '{"confirm": "DELETE_ALL_USERS", "reason": "Bereinigung von Testdaten"}'
```

---

## 🔍 Weitere Methoden zur User-Verwaltung

### Option 3: Direkt in MongoDB (mongosh)

```bash
# MongoDB Shell öffnen
mongosh "mongodb://localhost:27017/finora-dev"

# Alle Users anzeigen
db.users.find().pretty()

# User zählen
db.users.countDocuments()

# User suchen
db.users.find({ name: /john/i })

# User löschen
db.users.deleteOne({ _id: ObjectId("60d5ec49f1b2c72b8c8e4f1a") })

# Alle Users löschen
db.users.deleteMany({})
db.transactions.deleteMany({})
```

### Option 4: MongoDB Compass (GUI)

1. Download: https://www.mongodb.com/try/download/compass
2. Verbinden mit: `mongodb://localhost:27017`
3. Datenbank: `finora-dev`
4. Collection: `users`

---

## 🎯 Praktische Workflows

### Testuser anlegen und Passwort kennen

```bash
# 1. User registrieren (über Frontend oder API)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "testuser", "password": "Test123!", "email": "test@example.com"}'

# 2. User-ID herausfinden
node admin-cli.js list --search testuser

# 3. Passwort auf bekannten Wert setzen
node admin-cli.js reset-password <userId> NeuesSicheresPasswort123!

# 4. User verifizieren (falls nötig)
curl -X PATCH http://localhost:3000/api/v1/admin/users/<userId> \
  -H "Content-Type: application/json" \
  -d '{"isVerified": true}'
```

### Alle Testdaten löschen (mit Bestätigungsgrund)

```bash
# Mit CLI
node admin-cli.js clean-all

# Oder mit API
curl -X DELETE http://localhost:3000/api/v1/admin/users \
  -H "Content-Type: application/json" \
  -d '{"confirm": "DELETE_ALL_USERS", "reason": "Bereinigung von Testdaten"}'

# Oder mit MongoDB
mongosh "mongodb://localhost:27017/finora-dev" --eval "
  db.users.deleteMany({});
  db.transactions.deleteMany({});
"
```

---

## 📝 Notizen

- Authentifizierung (JWT oder API-Key) ist in **allen Umgebungen** erforderlich
- User-Passwörter werden automatisch gehasht (bcrypt)
- Beim Löschen eines Users werden auch alle seine Transaktionen gelöscht
- Alle Admin-Aktionen werden im Audit-Log protokolliert

---

## 🔐 Security Hinweise

**Für Production:**
1. Admin-Routes mit separatem Admin-JWT schützen ✅ (implementiert)
2. Rate Limiting für Admin-Endpunkte ✅ (implementiert)
3. Audit-Log für alle Admin-Aktionen ✅ (implementiert)
4. API-Key sicher verwalten/rotieren und nur serverseitig nutzen
5. IP-Whitelist verwenden (optional)

---

### 8. **User sperren (Ban)**

```http
PATCH /api/v1/admin/users/:id/ban
Content-Type: application/json

{
  "reason": "Regelverstoß"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "isBanned": true, "banReason": "Regelverstoß", "bannedAt": "..." }
  }
}
```

---

### 9. **User entsperren (Unban)**

```http
PATCH /api/v1/admin/users/:id/unban
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "isBanned": false, "banReason": null, "bannedAt": null }
  }
}
```

---

### 10. **Rolle ändern**

```http
PATCH /api/v1/admin/users/:id/role
Content-Type: application/json

{
  "role": "admin"
}
```

Erlaubte Rollen: `user`, `admin`

---

### 11. **Alle Transaktionen auflisten**

```http
GET /api/v1/admin/transactions?page=1&limit=50&type=expense&category=food&startDate=2024-01-01&endDate=2024-12-31
```

**Query Parameter:**
- `page`, `limit` – Pagination
- `type` – `income` oder `expense`
- `category` – Kategorie-Filter
- `search` – Beschreibung durchsuchen
- `startDate`, `endDate` – Zeitraum-Filter
- `sortBy`, `order` – Sortierung

---

### 12. **Transaktions-Statistiken**

```http
GET /api/v1/admin/transactions/stats
```

---

### 13. **Einzelne Transaktion abrufen**

```http
GET /api/v1/admin/transactions/:id
```

---

### 14. **Transaktion löschen**

```http
DELETE /api/v1/admin/transactions/:id
```

---

### 15. **Newsletter-Abonnenten auflisten**

```http
GET /api/v1/admin/subscribers?page=1&limit=50&language=de&isConfirmed=true
```

**Query Parameter:**
- `page`, `limit` – Pagination
- `language` – `de`, `en`, `ar`, `ka`
- `isConfirmed` – `true`/`false`
- `search` – Email durchsuchen

---

### 16. **Subscriber-Statistiken**

```http
GET /api/v1/admin/subscribers/stats
```

---

### 17. **Einzelnen Subscriber abrufen**

```http
GET /api/v1/admin/subscribers/:id
```

---

### 18. **Subscriber löschen**

```http
DELETE /api/v1/admin/subscribers/:id
```

---

### 19. **Audit-Log abrufen**

```http
GET /api/v1/admin/audit-log?page=1&limit=50&action=USER_BANNED&startDate=2024-01-01
```

Beispiel für neue Action-Typen:

```http
GET /api/v1/admin/audit-log?action=TRANSACTION_DELETED
GET /api/v1/admin/audit-log?action=SUBSCRIBER_DELETED
```

**Query Parameter:**
- `page`, `limit` – Pagination
- `action` – Filter nach Aktionstyp:
  - **User-Verwaltung:** `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`, `USER_BANNED`, `USER_UNBANNED`, `USER_ROLE_CHANGED`, `USER_PASSWORD_RESET`, `ALL_USERS_DELETED`
  - **Transaktionen & Subscriber:** `TRANSACTION_DELETED`, `SUBSCRIBER_DELETED`
  - **Data Export:** `DATA_EXPORT`
  - **System:** `ADMIN_LOGIN`, `SETTINGS_CHANGED`
  - **Transaction Lifecycle:** `TRANSACTION_QUOTA_REACHED`, `RETENTION_REMINDER_SENT`, `RETENTION_FINAL_WARNING_SENT`, `TRANSACTIONS_AUTO_DELETED`, `USER_EXPORT_CONFIRMED`
  - **Admin Lifecycle:** `RETENTION_RESET_BY_ADMIN`, `RETENTION_MANUAL_TRIGGER`, `RETENTION_SCHEDULED_RUN`
  - **User-Auth-Events:** `USER_LOGIN`, `USER_LOGIN_FAILED`, `USER_REGISTERED`, `USER_ACCOUNT_LOCKED`, `PASSWORD_CHANGED`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`, `EMAIL_CHANGED`
- `search` – Freitext-Suche in `adminName`, `targetUserName` und `details`
- `adminId` – Filter nach ausführendem Admin
- `targetUserId` – Filter nach Ziel-User
- `sortBy`, `order` – Sortierung (Default: `createdAt` DESC)
- `startDate`, `endDate` – Zeitraum-Filter

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "...",
        "action": "USER_BANNED",
        "performedBy": { "_id": "...", "name": "Admin" },
        "target": { "_id": "...", "name": "User" },
        "details": { "reason": "Spam" },
        "ipAddress": "127.0.0.1",
        "createdAt": "2024-01-20T14:30:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 15, "pages": 1 }
  }
}
```

---

### 20. **Audit-Log Statistiken**

```http
GET /api/v1/admin/audit-log/stats
```

---

### 21. **User erstellen**

```http
POST /api/v1/admin/users
Content-Type: application/json

{
  "name": "Neuer User",
  "password": "SicheresPasswort123!",
  "email": "user@example.com",
  "role": "user",
  "isVerified": false
}
```

**Request Body:**
- `name` (string, Pflicht) – 3–50 Zeichen
- `password` (string, Pflicht) – Muss Passwort-Validierung bestehen
- `email` (string, optional) – Valide E-Mail-Adresse
- `role` (string, optional) – `user` oder `admin` (Default: `user`)
- `isVerified` (boolean, optional) – Default: `false`
- `lastName` (string, optional) – Max 50 Zeichen
- `phone` (string, optional) – Max 20 Zeichen

**Response (201):**
```json
{
  "success": true,
  "message": "User erfolgreich erstellt",
  "data": { "...sanitized user..." }
}
```

**Fehler:** `409` bei `NAME_TAKEN` / `EMAIL_TAKEN`, `400` bei Validierungsfehlern.
**Audit-Log:** `USER_CREATED`

---

### 22. **User-Liste als CSV exportieren**

```http
GET /api/v1/admin/users/export
```

**Response:** CSV-Datei (Content-Type: `text/csv; charset=utf-8`)

CSV-Felder: `Name, Email, Role, Verified, Active, Registered, Last Login`

> Hinweis: Kein JSON — direkter Datei-Download. Sensitive Felder (Passwort-Hash, Tokens) werden **nicht** exportiert.

**Audit-Log:** `DATA_EXPORT` (details: `{ type: 'users', format: 'csv' }`)

---

### 23. **Transaktionen als CSV exportieren**

```http
GET /api/v1/admin/transactions/export
```

**Response:** CSV-Datei (Content-Type: `text/csv; charset=utf-8`)

CSV-Felder: `Date, Description, Category, Type, Amount, User Name, User Email`

> Hinweis: Kein JSON — direkter Datei-Download.

**Audit-Log:** `DATA_EXPORT` (details: `{ type: 'transactions', format: 'csv' }`)

---

### 24. **User mit Transaktions-Statistiken**

```http
GET /api/v1/admin/transactions/users?page=1&limit=15&search=&sort=-transactionCount
```

**Query Parameter:**
- `page` (default: 1) – Seite
- `limit` (default: 15, max: 100) – Max. Anzahl
- `search` – Suche nach Name/Email
- `sort` – Sortierfeld mit optionalem `-` Prefix für absteigend. Erlaubte Felder: `transactionCount`, `totalIncome`, `totalExpense`, `lastTransactionDate`, `name`, `email`, `createdAt`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "transactionCount": 42,
        "totalIncome": 5000,
        "totalExpense": 3200,
        "lastTransactionDate": "2026-02-15T...",
        "role": "user",
        "isVerified": true,
        "createdAt": "..."
      }
    ],
    "pagination": { "total": 150, "page": 1, "pages": 10, "limit": 15 }
  }
}
```

---

### 25. **Lifecycle-Statistiken**

```http
GET /api/v1/admin/lifecycle/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "config": {
      "retentionMonths": 12,
      "gracePeriodMonths": 3,
      "finalWarningDays": 7,
      "reminderCooldownDays": 14,
      "quotaLimit": 150
    },
    "usersInFinalWarningPhase": [...],
    "usersInRemindingPhase": [...],
    "usersWithExport": [...],
    "usersApproachingQuota": [...]
  }
}
```

> Jede User-Liste enthält max. 50 Einträge. `usersApproachingQuota` zeigt User mit ≥120 monatlichen Transaktionen (Limit: 150).

---

### 26. **Lifecycle-Detail eines Users**

```http
GET /api/v1/admin/lifecycle/users/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "...sanitized user..." },
    "lifecycle": { "...lifecycle status..." },
    "quota": { "...quota status..." },
    "transactionBreakdown": {
      "total": 100,
      "olderThan12Months": 30,
      "within12Months": 70
    }
  }
}
```

**Fehler:** `404` mit Code `USER_NOT_FOUND`

---

### 27. **Retention-Status zurücksetzen**

```http
POST /api/v1/admin/lifecycle/users/:id/reset
```

Setzt alle Retention-Flags eines Users zurück (`reminderStartedAt`, `finalWarningSentAt`, etc.).

**Response:**
```json
{
  "success": true,
  "message": "Retention-Status zurückgesetzt"
}
```

**Fehler:** `404` mit Code `USER_NOT_FOUND`
**Audit-Log:** `RETENTION_RESET_BY_ADMIN`

---

### 28. **Retention-Verarbeitung manuell auslösen**

```http
POST /api/v1/admin/lifecycle/trigger
```

Führt den täglichen Retention-Cron-Job manuell aus. Kann bei vielen Usern länger dauern.

**Response:**
```json
{
  "success": true,
  "message": "Retention-Verarbeitung abgeschlossen",
  "data": { "...verarbeitete Stats (Erinnerungen, Löschungen, Fehler)..." }
}
```

**Audit-Log:** `RETENTION_MANUAL_TRIGGER`

---

## 🐛 Troubleshooting

**"ECONNREFUSED"**
→ API-Server läuft nicht. Starte mit `npm run dev`

**"User nicht gefunden"**
→ Prüfe User-ID mit `node admin-cli.js list`

---

## 📚 Weitere Ressourcen

- User Model: [src/models/User.js](../src/models/User.js)
- Admin Routes: [src/routes/admin.js](../src/routes/admin.js)
- Server Config: [server.js](../server.js)
