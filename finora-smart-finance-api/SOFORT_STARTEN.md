# 🎯 User-Verwaltung - SOFORT STARTEN

## ✅ Schritt 1: Server starten

```bash
cd finora-smart-finance-api
npm run dev
```

Warte bis du siehst: `🚀 Server started successfully`

---

## ✅ Schritt 2: Admin CLI testen

**Öffne ein NEUES Terminal** und führe aus:

```bash
cd finora-smart-finance-api

# Statistiken anzeigen
npm run admin:stats
```

**Erwartete Ausgabe:**
```
📊 User Statistics
==================
Total Users:       5
Verified:          3
Unverified:        2
Last 7 days:       1
Last 30 days:      3
Total Transactions: 42

👥 Recent Users:
  1. Max Mustermann (max@test.de) - ✅
  2. John Doe (john@test.de) - ⏳
  ...
```

---

## ✅ Schritt 3: User-Liste anzeigen

```bash
npm run admin:list
```

**Ausgabe:**
```
👥 Users (5 total)

1. [67890abcdef123456789]
   Name: Max Mustermann
   Email: max@test.de
   Status: ✅ Verifiziert
   Erstellt: 15.01.2024

2. [12345abcdef123456789]
   Name: testuser
   Email: keine
   Status: ⏳ Nicht verifiziert
   Erstellt: 20.01.2024
...
```

---

## ✅ Schritt 4: Passwort eines Users zurücksetzen

**Kopiere die User-ID** aus der Liste (z.B. `67890abcdef123456789`) und:

```bash
node admin-cli.js reset-password 67890abcdef123456789 test123
```

**Ausgabe:**
```
✅ Passwort erfolgreich zurückgesetzt auf: test123
```

Jetzt kannst du dich mit diesem User einloggen:
- **Name:** (der Name aus der Liste)
- **Passwort:** `test123`

---

## ✅ Schritt 5: User-Details anschauen

```bash
node admin-cli.js get 67890abcdef123456789
```

**Ausgabe:**
```
👤 User Details
================
ID:            67890abcdef123456789
Name:          Max Mustermann
Email:         max@test.de
Phone:         +49123456789
Verified:      ✅ Ja
Created:       15.01.2024, 10:30:15
Last Login:    20.01.2024, 14:25:00
Transactions:  15

Preferences:
  Theme:       dark
  Currency:    EUR
  Language:    de
```

---

## 🌐 Alternative: Browser/REST API nutzen

### 1. Server läuft? Öffne im Browser:

**Statistiken:**
```
http://localhost:3000/api/admin/stats
```

**User-Liste:**
```
http://localhost:3000/api/admin/users
```

**User suchen:**
```
http://localhost:3000/api/admin/users?search=max
```

### 2. Mit VS Code REST Client

1. Installiere Extension: **REST Client** (humao.rest-client)
2. Öffne Datei: [admin-api.http](admin-api.http)
3. Klicke auf "Send Request" über den Zeilen

---

## 🧪 Testworkflow: Neuen User erstellen und einloggen

### Schritt 1: User registrieren

**Im Browser oder mit cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "devuser", 
    "password": "Dev123!",
    "email": "dev@test.de"
  }'
```

### Schritt 2: User finden und ID kopieren

```bash
node admin-cli.js list --search devuser
```

Kopiere die User-ID (z.B. `abc123...`)

### Schritt 3: User verifizieren

```bash
curl -X PATCH http://localhost:3000/api/admin/users/abc123... \
  -H "Content-Type: application/json" \
  -d '{"isVerified": true}'
```

### Schritt 4: Passwort auf bekannten Wert setzen

```bash
node admin-cli.js reset-password abc123... test123
```

### Schritt 5: Im Frontend einloggen

- **Name:** devuser
- **Passwort:** test123

---

## 🗑️ Alle Testdaten löschen

**VORSICHT:** Löscht ALLE Users und Transaktionen!

```bash
node admin-cli.js clean-all
```

**Oder sicherer mit Bestätigung:**

```bash
curl -X DELETE http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"confirm": "DELETE_ALL_USERS"}'
```

---

## 📚 Weitere Hilfe

```bash
# Alle Befehle anzeigen
node admin-cli.js help

# Dokumentation lesen
# Siehe: docs/ADMIN_API.md
# Siehe: ADMIN_QUICK_START.md
```

---

## 🔧 Troubleshooting

**Problem:** `ECONNREFUSED` oder `Error: undefined`  
**Lösung:** Server läuft nicht. Starte in anderem Terminal: `npm run dev`

**Problem:** "Admin endpoints are only available in development mode"  
**Lösung:** Prüfe `.env` → `NODE_ENV=development` oder entferne die Zeile

**Problem:** "User nicht gefunden"  
**Lösung:** Falsche User-ID. Hole dir die richtige: `npm run admin:list`

**Problem:** CLI zeigt keine Daten  
**Lösung:** Noch keine User registriert. Erstelle einen über `/api/auth/register`

---

## 🎯 Deine nächsten Schritte

1. ✅ Server starten: `npm run dev`
2. ✅ Statistiken prüfen: `npm run admin:stats`
3. ✅ User-Liste: `npm run admin:list`
4. ✅ Passwort setzen: `node admin-cli.js reset-password <id> test123`
5. ✅ Im Frontend einloggen mit bekanntem Passwort

**Los geht's! 🚀**
