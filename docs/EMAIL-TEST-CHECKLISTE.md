# Finora Email-System — Manuelle Test-Checkliste

> Nach dem Deploy von Commit `69223e3` (Email-Fixes + SPA-Redirects + Diagnostics-Cleanup)
> Alle Tests: 1103 Backend + 1708 Frontend ✅

---

## 1. Registrierung & Verifizierung

- [ ] **1.1** Neuen Account mit Email registrieren (`POST /api/auth/register`)
- [ ] **1.2** Verifizierungs-Email im Postfach prüfen (Betreff: „Bestätige deine Email-Adresse")
- [ ] **1.3** Link in der Email klicken → sollte zu `finora.yellowdeveloper.de/verify-email?success=true` weiterleiten
- [ ] **1.4** Welcome-Email prüfen (Betreff: „Willkommen bei Finora!")
- [ ] **1.5** Mit dem verifizierten Account einloggen → sollte funktionieren

## 2. Login-Benachrichtigung

- [ ] **2.1** Mit verifiziertem Account einloggen
- [ ] **2.2** Security-Alert-Email prüfen (Betreff: „Neue Anmeldung in deinem Konto")
- [ ] **2.3** IP-Adresse und User-Agent in der Email prüfen

## 3. Passwort zurücksetzen (GEFIXT — war 404)

- [ ] **3.1** Auf `/forgot-password` gehen → Reset-Email anfordern
- [ ] **3.2** Email prüfen (Betreff: „Passwort zurücksetzen")
- [ ] **3.3** Link in der Email klicken → `finora.yellowdeveloper.de/forgot-password?token=xxx`
- [ ] **3.4** Seite sollte **NICHT** 404 zeigen (SPA `_redirects` Fix)
- [ ] **3.5** Neues Passwort eingeben und absenden
- [ ] **3.6** Mit neuem Passwort einloggen → sollte funktionieren
- [ ] **3.7** Password-Change-Alert-Email prüfen (Betreff: „Passwort geändert")
- [ ] **3.8** **Bonus**: Reset-Link als eingeloggter User klicken → sollte trotzdem Reset-Formular zeigen (PublicRoute-Fix)

## 4. Email ändern (GEFIXT — war raw JSON)

- [ ] **4.1** Als eingeloggter User: Email ändern (`POST /api/v1/users/change-email`)
- [ ] **4.2** Verifizierungs-Email an die **neue** Adresse prüfen
- [ ] **4.3** Link klicken → sollte zu `finora.yellowdeveloper.de/verify-email?success=true&type=email-change` weiterleiten
- [ ] **4.4** Seite sollte Erfolgs-Meldung anzeigen (NICHT raw JSON)
- [ ] **4.5** Mit neuer Email einloggen → sollte funktionieren

## 5. Email hinzufügen (Gast-User → Email-User)

- [ ] **5.1** Als Gast-User (ohne Email): Email hinzufügen (`POST /api/v1/users/add-email`)
- [ ] **5.2** Verifizierungs-Email an die neue Adresse prüfen
- [ ] **5.3** Link klicken → Backend bestätigt, Redirect zur Frontend-Seite
- [ ] **5.4** Prüfen dass Email dem Account hinzugefügt wurde

## 6. Admin Kampagne an Subscriber (WAR BLOCKIERT — SMTP war tot)

- [ ] **6.1** Als Admin einloggen
- [ ] **6.2** Neue Kampagne erstellen (`POST /api/admin/campaigns`)
- [ ] **6.3** Kampagne senden (`POST /api/admin/campaigns/:id/send`)
- [ ] **6.4** Prüfen: Alle bestätigten Subscriber sollten die Email erhalten
- [ ] **6.5** Unsubscribe-Link in der Kampagne-Email klicken → Status-Seite angezeigt
- [ ] **6.6** Kampagne-Status prüfen: sollte `sent` sein mit korrekten Success/Fail-Zahlen

> **Hinweis**: Beim letzten Test war SMTP noch auf Render Free blockiert. Nach dem Starter-Upgrade ($7/Mo) sollte es jetzt funktionieren. Bei 0 Empfängern: prüfen ob Subscriber in der DB mit `isConfirmed: true` existieren.

## 7. Newsletter (Double Opt-In)

- [ ] **7.1** Newsletter abonnieren (`POST /api/newsletter/subscribe`)
- [ ] **7.2** Bestätigungs-Email prüfen (Betreff: „Bitte bestätige dein Abonnement")
- [ ] **7.3** Bestätigungs-Link klicken → Status-Seite mit Erfolg
- [ ] **7.4** Welcome-Email prüfen (Betreff: „Willkommen beim Finora Newsletter!")
- [ ] **7.5** Unsubscribe-Link klicken → Status-Seite mit Abmeldung
- [ ] **7.6** Goodbye-Email prüfen

## 8. Kontaktformular

- [ ] **8.1** Kontaktformular absenden (`POST /api/contact`)
- [ ] **8.2** Email an `finora@yellowdeveloper.de` prüfen
- [ ] **8.3** Reply-To sollte die Absender-Adresse sein

## 9. Admin: User erstellen mit Credentials-Email

- [ ] **9.1** Als Admin: Neuen User mit Email erstellen (`POST /api/admin/users`)
- [ ] **9.2** Credentials-Email prüfen (Betreff: „Deine Zugangsdaten")
- [ ] **9.3** Link und Passwort in der Email prüfen
- [ ] **9.4** Mit den Credentials einloggen → sollte funktionieren

## 10. SMTP-Diagnose (Admin)

- [ ] **10.1** `GET /api/admin/smtp-test` aufrufen
- [ ] **10.2** Antwort sollte `{ ok: true }` sein + SMTP-Config-Details

## 11. SPA Routing (GEFIXT — `_redirects`)

Folgende URLs direkt im Browser eingeben (kein Klick, sondern URL-Leiste):

- [ ] **11.1** `finora.yellowdeveloper.de/dashboard` → Dashboard (oder Login-Redirect)
- [ ] **11.2** `finora.yellowdeveloper.de/settings` → Settings-Seite
- [ ] **11.3** `finora.yellowdeveloper.de/forgot-password` → Reset-Formular
- [ ] **11.4** `finora.yellowdeveloper.de/verify-email?token=test` → Verifizierungs-Seite
- [ ] **11.5** `finora.yellowdeveloper.de/impressum` → Impressum
- [ ] **11.6** `finora.yellowdeveloper.de/privacy` → Datenschutz
- [ ] **11.7** Keine Seite sollte 404 "Not Found" zeigen

## 12. Transaktions-Benachrichtigungen

- [ ] **12.1** Email-Benachrichtigungen in den Einstellungen aktivieren
- [ ] **12.2** Neue Transaktion erstellen
- [ ] **12.3** Transaktions-Email prüfen
- [ ] **12.4** Benachrichtigungen deaktivieren → keine Email bei nächster Transaktion

## 13. Budget-Alerts

- [ ] **13.1** Budget für eine Kategorie setzen (z.B. 100 € für "Essen")
- [ ] **13.2** Ausgabe erstellen die >50% des Budgets ausmacht
- [ ] **13.3** Budget-Alert-Email prüfen

---

## Zusammenfassung: Was wurde gefixt

| Problem | Fix | Datei |
|---|---|---|
| Email-Änderung zeigte raw JSON | `res.json()` → `res.redirect()` nach Frontend | `emailRoutes.js` |
| Passwort-Reset-Link → 404 | `_redirects` mit `/* /index.html 200` | `public/_redirects` (neu) |
| Reset-Link als eingeloggter User → Dashboard-Redirect | PublicRoute erlaubt `/forgot-password?token=` | `AppRoutes.jsx` |
| AuthPage-Redirect bei Token | useEffect überspringt Redirect bei `isForgotMode && resetToken` | `AuthPage.jsx` |
| Startup-TCP-Diagnose (6 Targets) | `testTcp()` + `runSmtpDiagnostics()` entfernt | `emailTransport.js` |

---

## Priorität für den ersten Test

**Fang hier an** (die Fixes betreffen diese direkt):

1. ✳️ **Test 3** — Passwort zurücksetzen (war 404)
2. ✳️ **Test 4** — Email ändern (war raw JSON)
3. ✳️ **Test 6** — Admin Kampagne (war SMTP blockiert)
4. ✳️ **Test 11** — SPA Routing direkte URLs
