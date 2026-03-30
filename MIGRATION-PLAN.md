# 🔄 Migrations-Plan: Domain-Migration zu finora.yellowdeveloper.de

> **Stand:** 30. März 2026  
> **Alte Domain:** `finora.dawoddev.com` / `api.finora.dawoddev.com` (abgeschaltet, All-Inkl gekündigt)  
> **Neue Domain:** `finora.yellowdeveloper.de` / `api.finora.yellowdeveloper.de`  
> **Alte Emails:** `noreply@finora.dawoddev.com`, `info@finora.dawoddev.com`, `privacy@finora.app`, `datenschutz@finora.app`  
> **Neue Email:** `finora@yellowdeveloper.de` (eine Email für alles)  
> **Hosting:** Render.com (unverändert — Custom Domains)  
> **SMTP:** Netcup `mxf90a.netcup.net:465` SSL/TLS  
> **Developer-Name:** „Yellow Developer" (bisher „Youssef Dawod")  
> **Developer-Link:** `https://yellowdeveloper.de` (bisher `https://dawoddev.com`)

---

## Phase 1: DNS & Render Custom Domain (manuell)

| # | Aufgabe | Wo |
|---|---------|-----|
| 1 | Custom Domain `finora.yellowdeveloper.de` hinzufügen | Render Dashboard → Frontend Static Site → Settings → Custom Domains |
| 2 | Custom Domain `api.finora.yellowdeveloper.de` hinzufügen | Render Dashboard → API Web Service → Settings → Custom Domains |
| 3 | CNAME `finora` → Render Static-Site-Ziel setzen | Netcup DNS-Verwaltung für `yellowdeveloper.de` |
| 4 | CNAME `api.finora` → Render Web-Service-Ziel setzen | Netcup DNS-Verwaltung für `yellowdeveloper.de` |
| 5 | SSL-Zertifikat (Let's Encrypt) abwarten | Render macht das automatisch nach DNS-Propagation |

---

## Phase 2: Render Environment Variables (manuell)

### API Web Service (Backend)

| Variable | Neuer Wert |
|----------|------------|
| `FRONTEND_URL` | `https://finora.yellowdeveloper.de` |
| `API_URL` | `https://api.finora.yellowdeveloper.de` |
| `CORS_ORIGIN` | `https://finora.yellowdeveloper.de` |
| `COOKIE_DOMAIN` | `.finora.yellowdeveloper.de` |
| `SMTP_HOST` | `mxf90a.netcup.net` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `finora@yellowdeveloper.de` |
| `SMTP_PASS` | *(neues Passwort)* |
| `SMTP_FROM` | `"Finora" <finora@yellowdeveloper.de>` |
| `CONTACT_EMAIL` | `finora@yellowdeveloper.de` |

### Frontend Static Site

| Variable | Neuer Wert |
|----------|------------|
| `VITE_API_URL` | `https://api.finora.yellowdeveloper.de` |

---

## Phase 3: Backend-Code (6 Dateien)

### 3.1 `finora-smart-finance-api/src/config/env.js` (~10 Stellen)

| Zeile (ca.) | Alt | Neu |
|-------------|-----|-----|
| 73 | `"Finora" <noreply@finora.dawoddev.com>` | `"Finora" <finora@yellowdeveloper.de>` |
| 75 | `info@finora.dawoddev.com` | `finora@yellowdeveloper.de` |
| 81 | `https://api.finora.dawoddev.com` | `https://api.finora.yellowdeveloper.de` |
| 82 | `https://finora.dawoddev.com` | `https://finora.yellowdeveloper.de` |
| 83 | `.finora.dawoddev.com` | `.finora.yellowdeveloper.de` |
| 89 | `https://finora.app` (CORS default) | `https://finora.yellowdeveloper.de` |
| 120 | `"Finora" <noreply@finora.dawoddev.com>` | `"Finora" <finora@yellowdeveloper.de>` |
| 122 | `info@finora.dawoddev.com` | `finora@yellowdeveloper.de` |
| 166 | `"Finora Test" <test@finora.dawoddev.com>` | `"Finora Test" <finora@yellowdeveloper.de>` |
| 168 | `info@finora.dawoddev.com` | `finora@yellowdeveloper.de` |

### 3.2 `finora-smart-finance-api/src/utils/emailService/emailTransport.js`

| Zeile (ca.) | Alt | Neu |
|-------------|-----|-----|
| 119 | `"Finora" <noreply@finora.dawoddev.com>` | `"Finora" <finora@yellowdeveloper.de>` |

### 3.3 `finora-smart-finance-api/src/utils/emailService/contactEmails.js`

| Zeile (ca.) | Alt | Neu |
|-------------|-----|-----|
| 21 | `info@finora.dawoddev.com` | `finora@yellowdeveloper.de` |

### 3.4 `finora-smart-finance-api/src/utils/cookieConfig.js`

| Zeile (ca.) | Änderung |
|-------------|----------|
| 32 | Kommentar: `finora.dawoddev.com` → `finora.yellowdeveloper.de` |

### 3.5 `finora-smart-finance-api/src/utils/emailTemplates/baseLayout.js`

| Zeile (ca.) | Alt | Neu |
|-------------|-----|-----|
| 7 | Kommentar: `Roundcube (All-Inkl)` | `Roundcube (Netcup)` |

### 3.6 `finora-smart-finance-api/.env.example`

| Zeile (ca.) | Alt | Neu |
|-------------|-----|-----|
| 63 | `SMTP_USER=noreply@yourdomain.com` | `SMTP_USER=finora@yellowdeveloper.de` |
| 65 | `SMTP_FROM="Finora" <noreply@yourdomain.com>` | `SMTP_FROM="Finora" <finora@yellowdeveloper.de>` |
| 70 | `CONTACT_EMAIL=info@yourdomain.com` | `CONTACT_EMAIL=finora@yellowdeveloper.de` |

---

## Phase 4: Frontend SEO & Config (1 Datei)

### 4.1 `finora-smart-finance-frontend/index.html` (5 Stellen)

| Zeile (ca.) | Alt | Neu |
|-------------|-----|-----|
| 19 | `connect-src 'self' https://api.finora.dawoddev.com` | `connect-src 'self' https://api.finora.yellowdeveloper.de` |
| 85 | `og:url` → `https://finora.app/` | `https://finora.yellowdeveloper.de/` |
| 88 | `og:image` → `https://finora.app/og-image.png` | `https://finora.yellowdeveloper.de/og-image.png` |
| 94 | `twitter:url` → `https://finora.app/` | `https://finora.yellowdeveloper.de/` |
| 97 | `twitter:image` → `https://finora.app/og-image.png` | `https://finora.yellowdeveloper.de/og-image.png` |

---

## Phase 5: Frontend — Footer, Help (2 Dateien)

### 5.1 `finora-smart-finance-frontend/src/components/layout/Footer/FooterBottom.jsx`

| Zeile (ca.) | Alt | Neu |
|-------------|-----|-----|
| 21 | `href="https://dawoddev.com"` | `href="https://yellowdeveloper.de"` |
| 26 | `Youssef Dawod` | `Yellow Developer` |

### 5.2 `finora-smart-finance-frontend/src/pages/HelpPage.jsx`

| Zeile (ca.) | Alt | Neu |
|-------------|-----|-----|
| 31 | `mailto:info@finora.dawoddev.com` | `mailto:finora@yellowdeveloper.de` |

### Keine Änderung nötig

| Datei | Grund |
|-------|-------|
| `FooterNav.jsx` | GitHub + LinkedIn bleiben (gleiche Accounts) |
| `ExportSection.jsx` | GitHub + LinkedIn bleiben |

---

## Phase 6: Übersetzungsdateien — Rechtliche Texte (4 Dateien, je ~12 Stellen)

### Globale Ersetzungen (Suchen & Ersetzen)

| Suche | Ersetze durch |
|-------|---------------|
| `info@finora.dawoddev.com` | `finora@yellowdeveloper.de` |
| `datenschutz@finora.app` | `finora@yellowdeveloper.de` |
| `privacy@finora.app` | `finora@yellowdeveloper.de` |

### Betroffene Dateien

| # | Datei | Stellen (ca.) |
|---|-------|---------------|
| 1 | `public/locales/de/translation.json` | L1023, 1045, 1047, 1152, 1197, 1354, 1356, 1571, 1620, 1631, 1641, 1648, 2350 |
| 2 | `public/locales/en/translation.json` | L1024, 1046, 1048, 1153, 1198, 1355, 1357, 1572, 1621, 1632, 1642, 1649, 2351 |
| 3 | `public/locales/ar/translation.json` | L1024, 1046, 1048, 1153, 1198, 1355, 1572, 1621, 1632, 1642, 2351 |
| 4 | `public/locales/ka/translation.json` | L1024, 1046, 1048, 1153, 1198, 1355, 1357, 1572, 1621, 1632, 1642, 1649, 2352 |

### Inhaltliche Änderungen pro Sprache

#### Copyright-Zeile (alle 4 Sprachen)

```
Alt: "copyright": "© {{year}} Finora. <link>Youssef Dawod</link>"
Neu: "copyright": "© {{year}} Finora. <link>Yellow Developer</link>"
```

#### About-Seite Developer-Info (alle 4 Sprachen)

```
Alt:  "name": "Youssef Dawod"
Neu:  "name": "Yellow Developer"

Alt:  "description": "...Youssef Dawod..."
Neu:  "description": "...Yellow Developer..."
```

#### Impressum — Betreiber-Name (alle 4 Sprachen)

```
Betreiber: Youssef Dawod (BLEIBT! — § 5 TMG Pflicht)
Website:   https://yellowdeveloper.de (NEU)
Email:     finora@yellowdeveloper.de (NEU)
Adresse:   Bahnhofstraße 1, 29614 Soltau (BLEIBT)
```

> ⚠️ **Wichtig:** Im Impressum MUSS der echte Name (Youssef Dawod) stehen bleiben — das ist gesetzlich vorgeschrieben (§ 5 TMG). Nur der Developer-Anzeigename im Footer und in der About-Seite wird zu „Yellow Developer".

#### Datenschutz — Hosting-Provider

```
Bleibt: Render Services, Inc. (Hosting ändert sich nicht!)
Bleibt: "eigener SMTP-Server" (generisch, kein Provider-Name)
```

---

## Phase 7: Backend-Tests (2 Dateien)

### 7.1 `finora-smart-finance-api/__tests__/utils/adminEmails.test.js`

| Zeile (ca.) | Alt | Neu |
|-------------|-----|-----|
| 28 | `https://api.finora.com/api/v1/auth/verify-email?token=...` | `https://api.finora.yellowdeveloper.de/api/v1/auth/verify-email?token=...` |
| 30 | `backendBaseUrl: 'https://api.finora.com'` | `backendBaseUrl: 'https://api.finora.yellowdeveloper.de'` |
| 37 | `frontendUrl: 'https://app.finora.com'` | `frontendUrl: 'https://finora.yellowdeveloper.de'` |
| 257 | `loginLink: 'https://app.finora.com/login'` | `loginLink: 'https://finora.yellowdeveloper.de/login'` |

### 7.2 `finora-smart-finance-api/__tests__/utils/newsletterTemplates.test.js`

| Zeile (ca.) | Alt | Neu |
|-------------|-----|-----|
| 18 | `https://finora.app/newsletter/unsubscribe/tok123` | `https://finora.yellowdeveloper.de/newsletter/unsubscribe/tok123` |

---

## Phase 8: Dokumentation (3 Dateien)

### READMEs aktualisieren

| Datei | Änderung |
|-------|----------|
| `README.md` | L176, L182: „Youssef Dawod" → „Yellow Developer" |
| `finora-smart-finance-api/README.md` | L277: „Youssef Dawod" → „Yellow Developer" |
| `finora-smart-finance-frontend/README.md` | L233: „Youssef Dawod" → „Yellow Developer" |

> **Hinweis:** GitHub-URLs (`github.com/YoussefDawod`) bleiben — der GitHub-Account ändert sich nicht.

---

## Phase 9: Verifizierung

### Automatisiert

- [ ] `cd finora-smart-finance-api && npx jest --no-coverage` — alle 1103+ Tests müssen bestehen
- [ ] `grep -rn "dawoddev" .` — darf KEINE Treffer mehr haben (außer package-lock.json/node_modules)
- [ ] `grep -rn "finora\.app" .` — darf KEINE Treffer mehr haben
- [ ] `grep -rn "noreply@" .` — darf KEINE Treffer mehr haben
- [ ] `grep -rn "info@finora" .` — darf KEINE Treffer mehr haben

### Manuell (nach Deploy)

- [ ] `https://finora.yellowdeveloper.de` — Frontend lädt
- [ ] `https://api.finora.yellowdeveloper.de/api/health` — 200 OK
- [ ] Login funktioniert (Cookie-Domain `.finora.yellowdeveloper.de`)
- [ ] Registration → Verification-Email kommt an (Netcup SMTP)
- [ ] Password-Reset → Email kommt an
- [ ] Kontaktformular → Email kommt bei `finora@yellowdeveloper.de` an
- [ ] Newsletter Double-Opt-In → Confirmation + Welcome Email
- [ ] Impressum → korrekter Name (Youssef Dawod), Email (`finora@yellowdeveloper.de`)
- [ ] Datenschutz → korrekte Email, korrekte Hosting-Info
- [ ] Footer → „© 2026 Finora. Yellow Developer"
- [ ] OG/Twitter Preview testen (LinkedIn Post Preview, Twitter Card Validator)
- [ ] PWA installierbar, Manifest korrekt

---

## Zusammenfassung: Betroffene Dateien

| # | Datei | Typ | Änderungen |
|---|-------|-----|------------|
| 1 | `finora-smart-finance-api/src/config/env.js` | Config | ~10 Stellen: Domain, Email, CORS, Cookie |
| 2 | `finora-smart-finance-api/src/utils/emailService/emailTransport.js` | Config | 1 Stelle: Default from |
| 3 | `finora-smart-finance-api/src/utils/emailService/contactEmails.js` | Config | 1 Stelle: Default Empfänger |
| 4 | `finora-smart-finance-api/src/utils/cookieConfig.js` | Config | Kommentar |
| 5 | `finora-smart-finance-api/src/utils/emailTemplates/baseLayout.js` | Config | Kommentar: All-Inkl → Netcup |
| 6 | `finora-smart-finance-api/.env.example` | Config | 3 Stellen: SMTP, Contact |
| 7 | `finora-smart-finance-frontend/index.html` | SEO | 5 Stellen: CSP, OG, Twitter |
| 8 | `finora-smart-finance-frontend/.../FooterBottom.jsx` | UI | Developer-Name + Link |
| 9 | `finora-smart-finance-frontend/src/pages/HelpPage.jsx` | UI | mailto-Link |
| 10 | `finora-smart-finance-frontend/public/locales/de/translation.json` | i18n/Recht | ~13 Stellen |
| 11 | `finora-smart-finance-frontend/public/locales/en/translation.json` | i18n/Recht | ~13 Stellen |
| 12 | `finora-smart-finance-frontend/public/locales/ar/translation.json` | i18n/Recht | ~11 Stellen |
| 13 | `finora-smart-finance-frontend/public/locales/ka/translation.json` | i18n/Recht | ~13 Stellen |
| 14 | `finora-smart-finance-api/__tests__/utils/adminEmails.test.js` | Test | 4 URLs |
| 15 | `finora-smart-finance-api/__tests__/utils/newsletterTemplates.test.js` | Test | 1 URL |
| 16 | `README.md` | Docs | Developer-Name |
| 17 | `finora-smart-finance-api/README.md` | Docs | Developer-Name |
| 18 | `finora-smart-finance-frontend/README.md` | Docs | Developer-Name |

**Gesamt: 18 Dateien, ~80+ Einzeländerungen**

---

## Entscheidungen

| Thema | Entscheidung |
|-------|-------------|
| **dawoddev.com** | Komplett entfernt (All-Inkl gekündigt) |
| **finora.app** | Komplett entfernt (durch finora.yellowdeveloper.de ersetzt) |
| **noreply@ / info@** | Komplett entfernt (durch finora@yellowdeveloper.de ersetzt) |
| **Developer-Name (Footer/About)** | „Yellow Developer" mit Link `yellowdeveloper.de` |
| **Impressum (rechtlich)** | Youssef Dawod bleibt (§ 5 TMG Pflicht) |
| **Impressum-Adresse** | Bahnhofstraße 1, 29614 Soltau (unverändert) |
| **Social Links** | GitHub + LinkedIn bleiben (gleiche Accounts) |
| **Hosting** | Render.com bleibt (Custom Domains) |
| **SMTP** | Netcup `mxf90a.netcup.net:465` SSL/TLS |
| **Cookie-Domain** | `.finora.yellowdeveloper.de` (sicher: nur Frontend + API) |
| **Alte Domain** | Abschalten, kein Redirect |
| **Hosting-Provider in Datenschutz** | Bleibt „Render Services, Inc." (Hosting unverändert) |
| **SMTP-Provider in Datenschutz** | Bleibt „eigener SMTP-Server" (generisch) |
