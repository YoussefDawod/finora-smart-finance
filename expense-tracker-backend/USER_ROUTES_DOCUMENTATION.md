# User Routes Documentation

Umfassende Dokumentation aller User-Management Endpoints für Authentication, Profile Management und Datenschutz.

## 📋 Übersicht

| Route | Methode | Auth | Beschreibung |
|-------|---------|------|-------------|
| `/api/users/me` | GET | ✅ | Aktuellen User abrufen |
| `/api/users/me` | PUT | ✅ | Profil aktualisieren |
| `/api/users/me` | DELETE | ✅ | Account permanent löschen |
| `/api/users/change-password` | POST | ✅ | Passwort ändern |
| `/api/users/change-email` | POST | ✅ | Email ändern (Token-Verifikation) |
| `/api/users/verify-email-change` | GET | ❌ | Email-Change verifizieren |
| `/api/users/preferences` | PUT | ✅ | Einstellungen aktualisieren |
| `/api/users/export-data` | POST | ✅ | Daten als JSON exportieren |
| `/api/users/transactions` | DELETE | ✅ | Alle Transaktionen löschen |

---

## 🔐 1. GET /api/users/me

Ruft Informationen des aktuellen Users ab.

### Authentication
**Required:** Bearer Token (JWT)

### Response
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "lastName": "Doe",
    "avatar": "https://...",
    "phone": "+49 123 456789",
    "isVerified": true,
    "preferences": {
      "theme": "dark",
      "currency": "EUR",
      "timezone": "Europe/Berlin",
      "language": "de",
      "emailNotifications": true
    },
    "lastLogin": "2026-01-09T10:30:00Z",
    "createdAt": "2025-12-01T08:00:00Z",
    "updatedAt": "2026-01-09T10:30:00Z"
  }
}
```

### Fehler
- **401 Unauthorized** - Token ungültig oder abgelaufen
- **404 Not Found** - User nicht gefunden

---

## ✏️ 2. PUT /api/users/me

Aktualisiert das User-Profil.

### Authentication
**Required:** Bearer Token

### Request Body
```json
{
  "name": "John",
  "lastName": "Doe",
  "phone": "+49 123 456789",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Validierungen
- `name`: String (optional)
- `lastName`: String (optional)
- `phone`: String, gültiges Format oder leer (optional)
- `avatar`: String (URL) oder null (optional)

### Response
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John",
    "lastName": "Doe",
    ...
  }
}
```

### Fehler
- **400 Bad Request** - Validierungsfehler
- **404 Not Found** - User nicht gefunden

---

## 🔑 3. POST /api/users/change-password

Ändert das Benutzer-Passwort.

### Authentication
**Required:** Bearer Token

### Request Body
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

### Validierungen
- Aktuelles Passwort muss korrekt sein
- Neues Passwort muss sich vom aktuellen unterscheiden
- Passwort-Anforderungen:
  - Mindestens 8 Zeichen
  - Mindestens 1 Großbuchstabe
  - Mindestens 1 Kleinbuchstabe
  - Mindestens 1 Ziffer
- Passwörter müssen übereinstimmen

### Response
```json
{
  "success": true,
  "message": "Passwort erfolgreich geändert"
}
```

### Fehler
- **400 Bad Request** - Validierungsfehler
  - Aktuelles Passwort falsch
  - Passwort erfüllt nicht die Anforderungen
  - Passwörter stimmen nicht überein
- **401 Unauthorized** - Token ungültig

**⚠️ Hinweis:** Nach erfolgreicher Passwort-Änderung werden alle Refresh-Tokens invalidiert. User muss sich neu anmelden.

---

## 📧 4. POST /api/users/change-email

Leitet den Email-Änderungsprozess ein (mit Token-Verifizierung).

### Authentication
**Required:** Bearer Token

### Request Body
```json
{
  "newEmail": "newemail@example.com",
  "password": "CurrentPassword123"
}
```

### Validierungen
- Passwort muss korrekt sein
- Neue Email muss gültiges Format haben
- Neue Email darf nicht bereits registriert sein
- Neue Email muss sich von aktueller unterscheiden

### Response
```json
{
  "success": true,
  "message": "Bestätigungs-Email gesendet",
  "verificationLink": "http://localhost:3001/verify-email-change?token=abc123..." // nur in DEV
}
```

### Prozess
1. **Token wird generiert** und in User-Dokument gespeichert (24h Gültigkeit)
2. **Verifizierungs-Email** wird an neue Adresse gesendet
3. **User klickt Link** in Email → redirects to `/api/users/verify-email-change?token=...`
4. **Backend validiert Token** und aktualisiert Email
5. **Frontend zeigt Erfolgs-Meldung**

### Email-Inhalt
```
Hallo John,

bitte bestätige deine neue Email-Adresse durch Klick auf diesen Link:

http://localhost:3001/verify-email-change?token=YOUR_TOKEN_HERE

Dieser Link ist 24 Stunden lang gültig.

---
Expense Tracker Team
```

### Fehler
- **400 Bad Request** - Validierungsfehler
- **409 Conflict** - Email bereits registriert

---

## ✅ 5. GET /api/users/verify-email-change

Verifiziert die Email-Änderung mittels Token.

### Authentication
**Not Required** - Öffentlicher Endpoint (Token in Query-Parametern)

### Query Parameter
```
?token=abc123def456...
```

### Response - Erfolg
```json
{
  "success": true,
  "message": "Email erfolgreich geändert",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "newemail@example.com",
    ...
  }
}
```

### Implementierung im Backend
```javascript
GET /api/users/verify-email-change?token=abc123

1. Token aus Query extrahieren
2. Token hashen (SHA256)
3. User mit emailChangeToken === tokenHash suchen
4. emailChangeExpires validieren (nicht abgelaufen?)
5. user.email = user.newEmailPending
6. Cleanup: emailChangeToken, emailChangeNewEmail, emailChangeExpires
7. Speichern und Response
```

### Fehler
- **400 Bad Request**
  - Token fehlt
  - Token ungültig
  - Token abgelaufen

---

## ⚙️ 6. PUT /api/users/preferences

Aktualisiert Benutzer-Einstellungen.

### Authentication
**Required:** Bearer Token

### Request Body
```json
{
  "theme": "dark",
  "currency": "EUR",
  "timezone": "Europe/Berlin",
  "language": "de",
  "emailNotifications": true
}
```

### Enum-Werte

#### theme
- `light` - Helles Design
- `dark` - Dunkles Design
- `system` - Folgt Systemeinstellung

#### currency
- `USD` - US Dollar
- `EUR` - Euro
- `GBP` - Britisches Pfund
- `CHF` - Schweizer Franken
- `JPY` - Japanischer Yen

#### language
- `en` - English
- `de` - Deutsch
- `fr` - Français

#### timezone
Beliebige IANA-Timezone, z.B.:
- `Europe/Berlin`
- `Europe/London`
- `America/New_York`
- `Asia/Tokyo`

#### emailNotifications
- `true` - Notifications aktiviert
- `false` - Notifications deaktiviert

### Response
```json
{
  "success": true,
  "data": {
    "theme": "dark",
    "currency": "EUR",
    "timezone": "Europe/Berlin",
    "language": "de",
    "emailNotifications": true
  }
}
```

### Fehler
- **400 Bad Request** - Ungültige Enum-Werte

---

## 🗑️ 7. DELETE /api/users/me

Löscht den Account permanent mit allen zugehörigen Daten.

### Authentication
**Required:** Bearer Token

### Request Body
```json
{
  "password": "CurrentPassword123"
}
```

### Validierungen
- Passwort muss korrekt sein

### Cascade-Löschen
- User-Dokument wird gelöscht
- **Alle Transaktionen des Users werden gelöscht** (CASCADE)
- Alle Refresh-Tokens werden invalidiert

### Response
```json
{
  "success": true,
  "message": "Account wurde dauerhaft gelöscht",
  "data": {
    "deletedTransactions": 42
  }
}
```

### Fehler
- **400 Bad Request** - Passwort falsch
- **401 Unauthorized** - Token ungültig
- **404 Not Found** - User nicht gefunden

⚠️ **Warnung:** Diese Operation ist nicht umkehrbar!

---

## 📊 8. POST /api/users/export-data

Exportiert alle User-Daten und Transaktionen als JSON-Datei.

### Authentication
**Required:** Bearer Token

### Request Body
Keine erforderlich

### Daten in Export
```json
{
  "exportedAt": "2026-01-09T10:30:00.000Z",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John",
    "lastName": "Doe",
    "phone": "+49 123 456789",
    "avatar": "https://...",
    "createdAt": "2025-12-01T08:00:00Z",
    "preferences": {
      "theme": "dark",
      "currency": "EUR",
      "timezone": "Europe/Berlin",
      "language": "de",
      "emailNotifications": true
    }
  },
  "transactions": [
    {
      "id": "507f1f77bcf86cd799439012",
      "amount": 45.99,
      "category": "Lebensmittel",
      "type": "expense",
      "description": "Supermarkt",
      "date": "2026-01-07",
      "createdAt": "2026-01-07T15:30:00Z"
    }
  ]
}
```

### Response
**Content-Type:** `application/json`
**Content-Disposition:** `attachment; filename="expense-tracker-export-USERID-TIMESTAMP.json"`

Datei wird direkt zum Download angeboten.

### Fehler
- **401 Unauthorized** - Token ungültig
- **404 Not Found** - User nicht gefunden

---

## 🧹 9. DELETE /api/users/transactions

Löscht alle Transaktionen des Users (Account bleibt erhalten).

### Authentication
**Required:** Bearer Token

### Request Body
```json
{
  "password": "CurrentPassword123"
}
```

### Validierungen
- Passwort muss korrekt sein

### Response
```json
{
  "success": true,
  "message": "Alle Transaktionen wurden gelöscht",
  "data": {
    "deletedCount": 42
  }
}
```

### Fehler
- **400 Bad Request** - Passwort falsch
- **401 Unauthorized** - Token ungültig

---

## 🔒 Sicherheitsfeatures

### Passwort-Hashing
- **Methode:** bcryptjs
- **Salt Rounds:** 10
- **Speicherung:** passwordHash (nie plaintext)

### Token-Management
- **Access Token:** 1 Stunde Gültigkeit
- **Refresh Token:** 7 Tage Gültigkeit
- **Token-Rotation:** Neue Tokens bei jedem Refresh
- **Invalidierung:** Bei Passwort-Änderung & Account-Löschung

### Sensitive Fields
Folgende Felder werden **nie** in API-Responses zurückgegeben:
- `passwordHash`
- `twoFactorSecret`
- `verificationToken`
- `passwordResetToken`
- `emailChangeToken`
- `refreshTokens`

### Email-Verifizierung
- **Token-Format:** 64-Zeichen Hex-String (SHA256-Hash)
- **Gültigkeit:** 24 Stunden
- **Speicherung:** gehashed im Datenankt (nicht plaintext)

---

## 🧪 Test-Beispiele

### cURL

#### GET /api/users/me
```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### PUT /api/users/me
```bash
curl -X PUT http://localhost:5000/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"name":"John","lastName":"Doe"}'
```

#### POST /api/users/change-password
```bash
curl -X POST http://localhost:5000/api/users/change-password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword":"OldPass123",
    "newPassword":"NewPass123",
    "confirmPassword":"NewPass123"
  }'
```

#### POST /api/users/export-data
```bash
curl -X POST http://localhost:5000/api/users/export-data \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  > expense-tracker-export.json
```

### Frontend (JavaScript)

```javascript
// Get current user
const response = await fetch('/api/users/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data: user } = await response.json();

// Update profile
await fetch('/api/users/me', {
  method: 'PUT',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'John' })
});

// Change password
await fetch('/api/users/change-password', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    currentPassword: 'Old123',
    newPassword: 'New123',
    confirmPassword: 'New123'
  })
});

// Export data
const response = await fetch('/api/users/export-data', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'expense-tracker-export.json';
a.click();
```

---

## 📝 Logging

Alle User-Operationen werden geloggt:

```
[INFO] User 507f1f77bcf86cd799439011 updated profile
[INFO] User 507f1f77bcf86cd799439011 changed password
[INFO] Email change token generated for user 507f1f77bcf86cd799439011 (new: new@email.com)
[INFO] User 507f1f77bcf86cd799439011 verified email change (old@email.com -> new@email.com)
[INFO] User 507f1f77bcf86cd799439011 updated preferences
[INFO] User 507f1f77bcf86cd799439011 exported data (42 transactions)
[WARN] User 507f1f77bcf86cd799439011 account permanently deleted
[INFO] Deleted 42 transactions for user 507f1f77bcf86cd799439011
```

---

## 🔄 Error Handling

Alle Responses folgen einem konsistenten Format:

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error
```json
{
  "success": false,
  "message": "Kurzbeschreibung",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### HTTP Status Codes
| Code | Bedeutung |
|------|-----------|
| 200 | OK - Operation erfolgreich |
| 400 | Bad Request - Validierungsfehler |
| 401 | Unauthorized - Auth erforderlich |
| 404 | Not Found - Resource nicht gefunden |
| 409 | Conflict - Ressource existiert bereits |
| 500 | Server Error - Interner Fehler |

---

## 🚀 Integration mit Frontend

### AuthService Methods
```javascript
// User Profil
authService.updateProfile(name)
authService.changeEmail(newEmail)
authService.verifyEmailChange(token)
authService.deleteAccount(email)

// Passwort
authService.changePassword(currentPassword, newPassword)

// Einstellungen
authService.updatePreferences(preferences)

// Export & Cleanup
authService.exportData()
authService.deleteTransactions(password)
```

Siehe [Frontend API Documentation](../expense-tracker-frontend/README.md) für Details.

---

## 📞 Support

Bei Fragen oder Problemen:
- Logs prüfen: `logs/error-YYYY-MM-DD.log`
- GitHub Issues: [Repo-Link]
- Email: support@example.com
