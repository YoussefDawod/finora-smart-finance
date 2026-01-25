# 🛠️ Admin API - User Management Guide

Dieses Dokument erklärt, wie du als Entwickler im Development-Modus deine User verwalten kannst.

## ⚠️ Wichtig

Die Admin-Endpunkte sind **NUR im Development-Modus** verfügbar (`NODE_ENV !== 'production'`).  
In Production werden sie automatisch blockiert.

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
node admin-cli.js reset-password <userId> neuesPasswort123
```

### Option 2: REST API (Postman/cURL/Browser)

Basis-URL: `http://localhost:3000/api/admin`

---

## 📊 API Endpunkte

### 1. **Statistiken abrufen**

```http
GET /api/admin/stats
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
GET /api/admin/users?page=1&limit=50&search=&sortBy=createdAt&order=desc
```

**Query Parameter:**
- `page` (default: 1) - Seite
- `limit` (default: 50) - Max. Anzahl
- `search` - Suche nach Name/Email
- `sortBy` (default: 'createdAt') - Sortierfeld
- `order` (default: 'desc') - asc/desc
- `isVerified` - true/false Filter
- `showSensitive` - true/false (zeigt auch sensitive Felder)

**Beispiele:**
```bash
# Alle Users
curl http://localhost:3000/api/admin/users

# Nur verifizierte
curl http://localhost:3000/api/admin/users?isVerified=true

# Suche nach "john"
curl http://localhost:3000/api/admin/users?search=john

# Mit sensitiven Daten (passwordHash, tokens, etc.)
curl http://localhost:3000/api/admin/users?showSensitive=true
```

---

### 3. **Einzelnen User abrufen**

```http
GET /api/admin/users/:id
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
PATCH /api/admin/users/:id
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
curl -X PATCH http://localhost:3000/api/admin/users/60d5ec49f1b2c72b8c8e4f1a \
  -H "Content-Type: application/json" \
  -d '{"isVerified": true}'
```

---

### 5. **User löschen**

```http
DELETE /api/admin/users/:id
```

⚠️ Löscht auch alle Transaktionen des Users!

**Beispiel:**
```bash
curl -X DELETE http://localhost:3000/api/admin/users/60d5ec49f1b2c72b8c8e4f1a
```

---

### 6. **Passwort zurücksetzen**

```http
POST /api/admin/users/:id/reset-password
Content-Type: application/json

{
  "newPassword": "neupasswort123"
}
```

**Beispiel:**
```bash
curl -X POST http://localhost:3000/api/admin/users/60d5ec49f1b2c72b8c8e4f1a/reset-password \
  -H "Content-Type: application/json" \
  -d '{"newPassword": "test123"}'
```

---

### 7. **ALLE Users löschen** ⚠️

```http
DELETE /api/admin/users
Content-Type: application/json

{
  "confirm": "DELETE_ALL_USERS"
}
```

⚠️⚠️⚠️ **VORSICHT**: Löscht ALLE Users und ALLE Transaktionen!

**Beispiel:**
```bash
curl -X DELETE http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"confirm": "DELETE_ALL_USERS"}'
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
node admin-cli.js reset-password <userId> test123

# 4. User verifizieren (falls nötig)
curl -X PATCH http://localhost:3000/api/admin/users/<userId> \
  -H "Content-Type: application/json" \
  -d '{"isVerified": true}'
```

### Alle Testdaten löschen

```bash
# Mit CLI
node admin-cli.js clean-all

# Oder mit API
curl -X DELETE http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"confirm": "DELETE_ALL_USERS"}'

# Oder mit MongoDB
mongosh "mongodb://localhost:27017/finora-dev" --eval "
  db.users.deleteMany({});
  db.transactions.deleteMany({});
"
```

---

## 📝 Notizen

- Die Admin-Routen haben **keine Authentifizierung** im Development-Modus
- In Production würdest du hier Admin-Auth oder IP-Whitelist hinzufügen
- User-Passwörter werden automatisch gehasht (bcrypt)
- Beim Löschen eines Users werden auch alle seine Transaktionen gelöscht

---

## 🔐 Security Hinweise

**Für Production:**
1. Admin-Routes mit separatem Admin-JWT schützen
2. IP-Whitelist verwenden
3. Rate Limiting für Admin-Endpunkte
4. Audit-Log für alle Admin-Aktionen
5. Oder komplett deaktivieren/entfernen

**Beispiel Production-Schutz:**
```javascript
// In admin.js
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // Option 1: Komplett blockieren
    return res.status(403).json({ message: 'Not available in production' });
    
    // Option 2: Admin-Token prüfen
    // const adminToken = req.headers['x-admin-token'];
    // if (adminToken !== process.env.ADMIN_SECRET) {
    //   return res.status(401).json({ message: 'Unauthorized' });
    // }
  }
  next();
});
```

---

## 🐛 Troubleshooting

**"Admin endpoints are only available in development mode"**
→ Setze `NODE_ENV=development` in deiner `.env`

**"ECONNREFUSED"**
→ API-Server läuft nicht. Starte mit `npm run dev`

**"User nicht gefunden"**
→ Prüfe User-ID mit `node admin-cli.js list`

---

## 📚 Weitere Ressourcen

- User Model: [src/models/User.js](../src/models/User.js)
- Admin Routes: [src/routes/admin.js](../src/routes/admin.js)
- Server Config: [server.js](../server.js)
