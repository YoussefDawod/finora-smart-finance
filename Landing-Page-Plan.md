# Finora — Landing Page & Testimonials: Produktplan

> Dieser Plan beschreibt Vision, Aussehen, Inhalt und Funktionsweise der geplanten Landing Page sowie des integrierten Testimonials-Bereichs. Er dient als Diskussionsgrundlage **bevor** mit der Umsetzung begonnen wird.

---

## 1. Vision & Ziel

Finora braucht eine erste Anlaufstelle, die zwei Dinge gleichzeitig schafft:

1. **Vorstellen** — Wer ist Finora? Was kann es? Für wen ist es?
2. **Überzeugen** — Den Besucher dazu bringen, sich zu registrieren.

Die Landing Page ist der erste Eindruck. Sie soll nicht alles erklären — dafür gibt es die bestehenden Detailseiten (Features, Pricing, About). Sie soll neugierig machen, Vertrauen aufbauen und einen klaren nächsten Schritt anbieten.

---

## 2. Zielgruppe

- Privatpersonen, die ihre Finanzen besser im Griff haben wollen
- Einsteiger, die noch nie eine Finance-App benutzt haben
- Personen, die bestehende Apps zu komplex oder zu teuer finden
- Tech-affine Nutzer (kennen apps, erwarten modernes Design)

---

## 3. Route & Verhalten

| Besucher | Ergebnis |
|---|---|
| Nicht eingeloggt | Landing Page (`/`) wird angezeigt |
| Eingeloggt | Automatisch weiter zu `/dashboard` |

Die bestehenden Seiten `/features`, `/pricing`, `/about`, usw. bleiben unverändert. Die Landing Page verlinkt auf sie, ersetzt sie aber nicht.

---

## 4. Visueller Stil

**Hybrid-Ansatz**: Hell mit dunklen Akzenten.

- **Grundton**: Heller Hintergrund (nicht reines Weiß, eher ein warmes Off-White oder sehr helles Grau)
- **Dunkle Elemente**: Sektionen wie „Wie es funktioniert" oder der CTA-Banner können das dunkle App-Theme als Hintergrund verwenden — das zeigt dem Besucher einen Vorgeschmack auf das echte App-Feeling
- **Akzentfarbe**: Das bekannte Finora-Grün bleibt der Ankerpunkt — für Buttons, Highlights, Icons
- **Typografie**: Klar, modern, lesbar — Überschriften dürfen groß und mutig sein
- **App-Screengrabs**: Echte Screenshots (oder Mockups) der App tauchen auf der Seite auf — besonders im Hero und in „Wie es funktioniert" — damit User sofort sehen, was sie erwartet

---

## 5. Sektionen der Landing Page

### Sektion 1 — Hero

**Was es ist**: Der erste Bildschirm, den ein Besucher sieht. Kein Scrollen nötig.

**Elemente**:
- Kurze, prägnante **Headline** (1–2 Zeilen): z.B. *„Deine Finanzen. Klar. Einfach. Finora."*
- **Subheadline** (1 Satz): Was Finora macht, für wen
- **Zwei Buttons**: Primär → „Kostenlos starten" (zu `/register`), Sekundär → „Mehr erfahren" (scrollt zur Features-Sektion)
- **Visuelles Element** rechts/darunter: App-Screenshot oder animiertes Mockup (Dashboard-Ansicht)
- Optional: kleiner Trust-Hinweis unter den Buttons (z.B. *„Kostenlos · Kein Abo nötig · Keine Kreditkarte"*)

**Gefühl**: Modern, aufgeräumt, direkt. Kein Text-Overload.

---

### Sektion 2 — Features-Übersicht

**Was es ist**: Ein schneller Überblick über die wichtigsten Funktionen — wie eine „Appetizer"-Version der `/features`-Seite.

**Elemente**:
- Sektions-Titel: z.B. *„Alles, was du brauchst"*
- **4–6 Feature-Karten** in einem Grid (je: Icon + Titel + kurze Beschreibung)
- Vorgeschlagene Features für die Karten:
  - Transaktionen erfassen & kategorisieren
  - Einnahmen und Ausgaben im Überblick
  - Mehrsprachig (DE / EN / AR)
  - Import & Export
  - Sicherer Login mit JWT
  - Dark Mode (Hinweis auf App-Theme)
- **Link** am Ende: „Alle Features entdecken →" → `/features`

**Gefühl**: Informativ aber kompakt. Kein Overload. Jede Karte ist auf Anhieb verstehbar.

---

### Sektion 3 — Wie es funktioniert

**Was es ist**: Ein visueller 3-Schritte-Prozess — wie geht man von 0 zur ersten Auswertung?

**Elemente**:
- Sektions-Titel: z.B. *„In 3 Schritten zum Überblick"*
- **3 Schritte** (nummeriert, mit Icon + Text + optionalem App-Screenshot):

  | Schritt | Titel | Beschreibung |
  |---|---|---|
  | 1 | Erfassen | Transaktionen eintragen — manuell oder per Import. Einfach und schnell. |
  | 2 | Analysieren | Finora zeigt dir Einnahmen, Ausgaben, Kategorien und Verläufe — automatisch aufbereitet. |
  | 3 | Entscheiden | Mit klaren Zahlen bessere Entscheidungen treffen. Du behältst immer die Kontrolle. |

- Diese Sektion verwendet das **dunkle App-Theme** als Hintergrund → zeigt dem Besucher den echten App-Style

**Gefühl**: Strukturiert, nachvollziehbar, macht Lust auf die App.

---

### Sektion 4 — Testimonials / Wall of Love

**Was es ist**: Echte Bewertungen von echten Nutzern. Die „sozialer Beweis"-Sektion.

**Elemente**:
- Sektions-Titel: z.B. *„Was Nutzer sagen"* oder *„Wall of Love"*
- **Karten** je Testimonial (Sterne-Rating + Zitat + Name)
- Darstellung: horizontal scrollbares Karussell (Mobile) oder Grid mit 2–3 Spalten (Desktop)
- **Leer-Zustand** für den Anfang: Entweder 2–3 Demo-Testimonials als Platzhalter, oder eine freundliche Einladung (*„Sei einer der ersten, der eine Bewertung hinterlässt"*)

**Gefühl**: Authentisch, warm, menschlich — kein Corporate-Look.

*(Der genaue Ablauf wie Testimonials gesammelt und freigegeben werden → siehe Abschnitt 7)*

---

### Sektion 5 — CTA-Banner

**Was es ist**: Der finale Aufruf zum Handeln — am unteren Ende der Seite, kurz vor dem Footer.

**Elemente**:
- Kurze, motivierende Headline: z.B. *„Bereit loszulegen?"* oder *„Deine Finanzen warten."*
- 1 Button: „Jetzt kostenlos registrieren" → `/register`
- Optional: kleiner Hinweis auf kostenlosen Einstieg

**Stil**: Dunkler Hintergrund (passend zum App-Theme), helle Schrift, auffälliger grüner Button.

**Gefühl**: Final, klar, einladend — kein Druck, aber ein deutlicher Impuls.

---

## 6. Navigation auf der Landing Page

Die bestehende öffentliche Header-/Footer-Struktur bleibt unverändert.

- **Header**: Logo links, Navigation (Features, Pricing, About, Blog) + Buttons „Anmelden" / „Registrieren"
- **Footer**: Die 4 bestehenden Spalten (Company, Product, Resources, Legal) bleiben

Auf der Landing Page selbst gibt es keinen eigenen, separaten Header — der bestehende Public-Header reicht.

---

## 7. Testimonials-Feature: Wie es funktioniert

Das Testimonials-System hat **vier Phasen**:

### Phase 1 — Anfrage an den Nutzer

Nach einer gewissen Nutzungsdauer (z.B. nach 7 Tagen oder nach 10 erfassten Transaktionen) erscheint im App ein subtiler Hinweis:

> *„Wie findest du Finora bisher? Dein Feedback hilft uns."*

Dieser Hinweis erscheint z.B. als kleine Karte auf dem Dashboard oder als Modal — einmalig, nicht aufdringlich.

### Phase 2 — Bewertungs-Dialog

Ein einfaches Formular:
- **Sterne-Rating** (1–5)
- **Freitext** (optional, z.B. 2–3 Sätze)
- **Abschicken**-Button

Feedback wird immer gespeichert (privat, für interne Auswertung).

### Phase 3 — Öffentlichkeits-Consent

Nur wenn der Nutzer **4 oder 5 Sterne** gibt, erscheint eine zweite Frage:

> *„Darf dein Feedback öffentlich auf unserer Landing Page erscheinen?"*

- Ja → Testimonial geht zur Admin-Prüfung
- Nein → Feedback bleibt privat, kein Testimonial

Wichtig: Consent muss **explizit und freiwillig** sein (DSGVO-konform).

### Phase 4 — Admin-Freigabe & Anzeige

Ein Admin kann Testimonials im Admin-Bereich:
- **Freigeben** → wird öffentlich auf der Landing Page angezeigt
- **Ablehnen** → bleibt privat (kein Löschen des Feedbacks selbst)
- Optional: Testimonial-Text leicht kürzen

Freigegebene Testimonials erscheinen dann in **Sektion 4** der Landing Page.

---

## 8. Verbindung — Landing Page ↔ Restliche Seiten

| Landing Page Element | Verlinkt zu |
|---|---|
| „Alle Features entdecken" | `/features` |
| Pricing-Hinweis (falls vorhanden) | `/pricing` |
| Footer → About | `/about` |
| Footer → Blog | `/blog` |
| Footer → Contact | `/contact` |
| Footer → FAQ / Help | `/faq`, `/help` |
| „Kostenlos starten"-Button | `/register` |
| „Anmelden"-Header-Button | `/login` |

---

## 9. Rechtliche & datenschutzliche Überlegungen

- **Testimonials & DSGVO**: Expliziter Consent vor Veröffentlichung nötig — bereits eingeplant (Phase 3)
- **Datenspeicherung**: Bewertungen (auch private) werden gespeichert — muss in Datenschutzerklärung erwähnt werden
- **Name im Testimonial**: Nur Vorname + Nachname-Initial (z.B. „Max M.") — keine vollständigen Namen ohne ausdrückliche Zustimmung
- **Widerruf**: Nutzer sollte Consent later widerrufen können → Testimonial wird entfernt

---

## 10. Offene Fragen & Entscheidungen

Diese Punkte sind noch nicht entschieden — Diskussionsgrundlage:

### 10.1 — Sprache der Landing Page
Soll die Landing Page nur auf Deutsch sein, oder wird sie mehrsprachig (DE/EN/AR) — wie der Rest der App? Die bestehenden Seiten (Features, About, etc.) sind bereits i18n-fähig.

> **Empfehlung**: Von Anfang an mehrsprachig (das System ist bereits vorhanden), aber Deutsch als Default.

### 10.2 — Screenshot vs. Illustration vs. Animation im Hero
Das visuelle Element im Hero-Bereich ist entscheidend für den ersten Eindruck:
- **Option A**: Echter App-Screenshot (einfach, authentisch, aber statisch)
- **Option B**: Leicht gestyltes/gerahmtes Mockup (professioneller Eindruck)
- **Option C**: Subtile Animation (z.B. Zahlen, die hochlaufen) — aufwendiger

> **Empfehlung**: Option B mit echtem Screenshot in einem angedeuteten Browser/Device-Frame.

### 10.3 — Testimonials-Rollout: Demo-Daten zu Beginn?
Am Anfang gibt es keine echten Testimonials. Optionen:
- **Option A**: Sektion ist ausgeblendet, bis mindestens 3 echte Testimonials freigegeben sind
- **Option B**: 2–3 interne Test-Testimonials (von dir selbst als Demo-Placeholder) bis echte eintreffen
- **Option C**: Die Sektion erscheint mit einer Einladung: *„Sei der Erste, der eine Bewertung hinterlässt"*

> **Empfehlung**: Option A (Sektion erst einblenden wenn echte Daten da sind) — vertrauenswürdiger.

### 10.4 — Wann wird der Feedback-Trigger ausgelöst?
Optionen für den Zeitpunkt der Feedback-Anfrage:
- **Option A**: Nach X Tagen aktiver Nutzung (z.B. 7 Tage)
- **Option B**: Nach X erfassten Transaktionen (z.B. 10)
- **Option C**: Beide Bedingungen müssen erfüllt sein (7 Tage UND 10 Transaktionen)
- **Option D**: Manuell — Nutzer kann jederzeit selbst Feedback geben (z.B. über Einstellungen)

> **Empfehlung**: Option B oder C — aktive Nutzung ist aussagekräftiger als reiner Zeitfaktor.

### 10.5 — Testimonials-Anzeige-Format
- **Option A**: Horizontal scrollbares Karussell (beide Breiten)
- **Option B**: Masonry-Grid (wie Pinterest — unterschiedliche Höhen)
- **Option C**: Standard 3-Spalten-Grid (Desktop) / 1-Spalte (Mobile)

> **Empfehlung**: Option A für Mobile, Option C für Desktop — einfach, lesbar, wartbar.

---

## 11. Zusammenfassung — Was entsteht

| Was | Wie |
|---|---|
| Landing Page | 5 Sektionen, helles Design mit dunklen Akzenten |
| Route | `/` für nicht-eingeloggte User |
| Eingeloggte User | Auto-Redirect zu `/dashboard` |
| Testimonials-System | Feedback → Consent → Admin-Freigabe → Öffentlich |
| Bestehende Seiten | Bleiben erhalten — Landing Page verlinkt auf sie |
| Footer & Header | Unverändert |

---

*Stand: Planungsphase — keine technische Implementierung begonnen.*
