# 🎯 User-Verwaltung - Schnellübersicht für Development

## Alle verfügbaren Methoden

### ⚡ Schnellste Methode: CLI Tool

```bash
cd finora-smart-finance-api

# Alle verfügbaren Befehle anzeigen
node admin-cli.js help

# Oder mit npm scripts
npm run admin help
npm run admin:stats        # User-Statistiken
npm run admin:list         # User-Liste
```

---

## 📋 Die 4 Methoden im Überblick

| Methode | Schwierigkeit | Empfohlen für |
|---------|--------------|---------------|
| **1. CLI Tool** | ⭐ Einfach | Schnelle Übersichten, tägliche Arbeit |
| **2. REST API** | ⭐⭐ Mittel | Detaillierte Kontrolle, Skripte |
| **3. MongoDB Compass** | ⭐⭐ Mittel | Visuelle Datenbank-Verwaltung |
| **4. mongosh Shell** | ⭐⭐⭐ Fortgeschritten | Komplexe Queries, Bulk-Operations |

---

## 1️⃣ CLI Tool (Empfohlen für Development)

```bash
# Statistiken anzeigen
node admin-cli.js stats
# Ausgabe: Anzahl Users, Verifiziert/Unverif., Letzte Registrierungen

# Alle Users auflisten  
node admin-cli.js list
# Zeigt: ID, Name, Email, Status, Erstelldatum

# User suchen
node admin-cli.js list --search max
# Sucht in Name und Email

# User-Details mit Transaktionen
node admin-cli.js get <userId>

# Passwort zurücksetzen auf "test123"
node admin-cli.js reset-password <userId> test123

# User löschen
node admin-cli.js delete <userId>

# ALLE Users löschen (⚠️ VORSICHT)
node admin-cli.js clean-all
```

---

## 2️⃣ REST API (HTTP Requests)

### Mit VS Code REST Client Extension

1. Installiere Extension: `humao.rest-client`
2. Öffne: `admin-api.http`
3. Klicke auf "Send Request" über jeder Zeile

### Mit cURL (Terminal)

```bash
# Statistiken
curl http://localhost:3000/api/admin/stats

# User-Liste
curl http://localhost:3000/api/admin/users

# User suchen
curl http://localhost:3000/api/admin/users?search=max

# User-Details
curl http://localhost:3000/api/admin/users/<userId>

# User verifizieren
curl -X PATCH http://localhost:3000/api/admin/users/<userId> \
  -H "Content-Type: application/json" \
  -d '{"isVerified": true}'

# Passwort zurücksetzen
curl -X POST http://localhost:3000/api/admin/users/<userId>/reset-password \
  -H "Content-Type: application/json" \
  -d '{"newPassword": "test123"}'

# User löschen
curl -X DELETE http://localhost:3000/api/admin/users/<userId>
```

### Mit Browser (nur GET-Requests)

Öffne im Browser:
- `http://localhost:3000/api/admin/stats`
- `http://localhost:3000/api/admin/users`
- `http://localhost:3000/api/admin/users/<userId>`

---

## 3️⃣ MongoDB Compass (GUI Tool)

```bash
# 1. Download von mongodb.com/try/download/compass
# 2. Verbinden mit: mongodb://localhost:27017
# 3. Datenbank: finora-dev
# 4. Collection: users
```

**Vorteile:**
- Visuell, keine Kommandozeile
- Einfaches Bearbeiten von Dokumenten
- Filter-Builder
- Export/Import

---

## 4️⃣ mongosh (MongoDB Shell)

```bash
# MongoDB Shell starten
mongosh "mongodb://localhost:27017/finora-dev"

# Alle Users anzeigen
db.users.find().pretty()

# User zählen
db.users.countDocuments()

# User nach Name suchen
db.users.find({ name: /max/i })

# Nur Name und Email
db.users.find({}, { name: 1, email: 1, isVerified: 1 })

# User verifizieren
db.users.updateOne(
  { _id: ObjectId("...") }, 
  { $set: { isVerified: true } }
)

# User löschen
db.users.deleteOne({ _id: ObjectId("...") })

# ALLE löschen
db.users.deleteMany({})
db.transactions.deleteMany({})
```

---

## 🎓 Typische Workflows

### Workflow 1: "Ich habe einen Testuser und weiß das Passwort nicht mehr"

```bash
# 1. User-ID finden
node admin-cli.js list --search testuser

# 2. Passwort zurücksetzen
node admin-cli.js reset-password <userId> test123

# 3. Jetzt kannst du dich einloggen mit:
#    Name: testuser
#    Passwort: test123
```

### Workflow 2: "Wie viele Users habe ich und wer sind sie?"

```bash
# Schnelle Übersicht
node admin-cli.js stats

# Detaillierte Liste
node admin-cli.js list
```

### Workflow 3: "Ich will alle Testdaten löschen und neu anfangen"

```bash
# Option A: Mit CLI
node admin-cli.js clean-all

# Option B: Mit API
curl -X DELETE http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"confirm": "DELETE_ALL_USERS"}'

# Option C: Mit mongosh
mongosh "mongodb://localhost:27017/finora-dev" --eval "
  db.users.deleteMany({});
  db.transactions.deleteMany({});
"
```

### Workflow 4: "User muss verifiziert sein, aber Email kommt nicht an"

```bash
# 1. User-ID finden
node admin-cli.js list --search username

# 2. Manuell verifizieren mit API
curl -X PATCH http://localhost:3000/api/admin/users/<userId> \
  -H "Content-Type: application/json" \
  -d '{"isVerified": true}'

# Oder direkt in mongosh
mongosh "mongodb://localhost:27017/finora-dev" --eval "
  db.users.updateOne(
    { name: 'username' },
    { \$set: { isVerified: true } }
  )
"
```

---

## 📁 Wichtige Dateien

```
finora-smart-finance-api/
├── admin-cli.js           # CLI Tool für User-Verwaltung
├── admin-api.http         # REST API Beispiele
├── docs/
│   └── ADMIN_API.md       # Ausführliche Dokumentation
└── src/
    └── routes/
        └── admin.js       # Admin API Endpunkte
```

---

## ⚙️ Setup-Checklist

- [x] Admin-Route erstellt (`src/routes/admin.js`)
- [x] In Server registriert (`server.js`)
- [x] CLI Tool verfügbar (`admin-cli.js`)
- [x] REST API Beispiele (`admin-api.http`)
- [x] Dokumentation (`docs/ADMIN_API.md`)
- [x] npm Scripts (`npm run admin`)

---

## 🛡️ Wichtige Hinweise

⚠️ **Nur Development-Modus**
- Alle Admin-Endpunkte funktionieren NUR wenn `NODE_ENV !== 'production'`
- In Production automatisch blockiert
- Keine Authentifizierung im Development!

🔐 **Für Production**
- Admin-Routes komplett entfernen oder
- Mit Admin-Token schützen oder
- IP-Whitelist verwenden

---

## 🆘 Troubleshooting

**"Admin endpoints are only available in development mode"**
→ Prüfe `.env`: `NODE_ENV=development` (oder nicht gesetzt)

**"ECONNREFUSED"**
→ API-Server läuft nicht. Starte mit `npm run dev`

**CLI zeigt nichts**
→ Server läuft nicht oder falsche Port. Check `http://localhost:3000`

**"User nicht gefunden"**
→ Prüfe User-ID: `node admin-cli.js list`

---

## 📞 Schnellreferenz

| Aufgabe | Befehl |
|---------|--------|
| Übersicht | `npm run admin:stats` |
| User-Liste | `npm run admin:list` |
| User suchen | `node admin-cli.js list --search max` |
| User-Details | `node admin-cli.js get <id>` |
| Passwort reset | `node admin-cli.js reset-password <id> test123` |
| User löschen | `node admin-cli.js delete <id>` |
| Alles löschen | `node admin-cli.js clean-all` |

**Dokumentation:** `docs/ADMIN_API.md`  
**HTTP Requests:** `admin-api.http`
