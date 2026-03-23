# Finora — Landing Page & Feedback/Testimonials: Implementierungsplan

> Vollständiger Implementierungsplan basierend auf Codebase-Analyse und abgestimmten Entscheidungen. Alle offenen Fragen sind geklärt.

---

## 1. Vision & Ziel

Finora bekommt eine Landing Page als erste Anlaufstelle, die zwei Dinge gleichzeitig schafft:

1. **Vorstellen** — Wer ist Finora? Was kann es? Für wen ist es?
2. **Überzeugen** — Den Besucher dazu bringen, die App auszuprobieren (Guest-Mode) oder sich zu registrieren.

Die Landing Page ist der erste Eindruck — sie soll neugierig machen, Vertrauen aufbauen und einen klaren nächsten Schritt anbieten. Für bestehende Detailseiten (Features, Pricing, About) wird auf die Unterseiten verlinkt.

**Wichtig**: Die App unterstützt vollständigen Guest-Mode (ohne Registrierung). Alle CTAs bieten deshalb immer zwei Wege: *Direkt ausprobieren* (→ `/dashboard`) ODER *Kostenlos registrieren* (→ `/register`).

---

## 2. Zielgruppe

- Privatpersonen, die ihre Finanzen besser im Griff haben wollen
- Einsteiger, die noch nie eine Finance-App benutzt haben
- Personen, die bestehende Apps zu komplex oder zu teuer finden
- Tech-affine Nutzer (kennen Apps, erwarten modernes Design)

---

## 3. Route & Verhalten

| Besucher | Ergebnis |
|---|---|
| Nicht eingeloggt | Landing Page (`/`) wird angezeigt |
| Eingeloggt | Automatisch weiter zu `/dashboard` |

**Technisch**: `RootRedirect` in `AppRoutes.jsx` wird angepasst — prüft `isAuthenticated` aus `useAuth()`. Eingeloggte User → `/dashboard` (mit Query-Params), alle anderen → `LandingPage`.

Die bestehenden Seiten `/features`, `/pricing`, `/about`, usw. bleiben unverändert. Die Landing Page verlinkt auf sie, ersetzt sie aber nicht.

---

## 4. Visueller Stil & Theme

### Bestehendes Aurora-Theme beibehalten

Die Landing Page nutzt **exakt das bestehende Theme-System** — keine neuen Themes, keine Sonderbehandlung:

- **`data-theme="light"` / `data-theme="dark"`** auf `<html>` (via `ThemeContext.jsx`)
- Alle CSS-Variablen aus `themes/light.scss` und `themes/dark.scss`
- Glass-Morphism Tokens (`--glass-bg`, `--glass-border`, `--glass-blur`)
- Aurora-Gradient Tokens (`--aurora-1/2/3`, `--aurora-gradient`)
- Spacing, Typografie, Z-Index aus `variables.scss`
- Responsive Mixins aus `mixins.scss` (`@include mobile`, `@include tablet`, `@include desktop`)

### Theme-Erkennung (Browser-basiert)

Das bestehende `ThemeContext.jsx` erkennt bereits `prefers-color-scheme` automatisch:
- **Initialisierung**: localStorage → System Preference → Light (Fallback)
- **Cross-Tab Sync** über `storage` Event
- Nutzer kann über Einstellungen/Sidebar wechseln (Light / Dark / System)

→ Kein zusätzlicher Aufwand. Alles was neu gebaut wird, unterstützt automatisch beide Themes durch Nutzung der CSS-Variablen.

### Sprach-Erkennung (Browser-basiert)

Die App unterstützt **4 Sprachen**: Deutsch (de), English (en), العربية (ar), ქართული (ka).

**Automatische Erkennung**: Das i18n-System (`src/i18n/index.js`) nutzt bereits `navigator.language` / `navigator.languages` zur Erkennung. Falls die Browser-Sprache keine der 4 unterstützten Sprachen ist → Fallback auf **Deutsch**.

RTL wird automatisch gesetzt für Arabisch (`document.documentElement.dir = 'rtl'`).

### Design-Philosophie

- **Keine hardcodierten Farben** — nur CSS-Variablen
- **Keine neuen Themes** — Aurora Light + Dark reichen
- **Glass-Morphism** als durchgehendes Gestaltungselement
- **Aurora BrandingBackground** auf der Landing Page (wie auf bestehenden Public Pages)
- **Organische Formen** als Differenzierungsmerkmal (siehe Sektionen)

---

## 5. Sektionen der Landing Page

### Design-Prinzipien für alle Sektionen

**Organische Kartenformen** — um aus dem Standard-Rechteck auszubrechen:
- `border-radius: 50% 10% 50% 10%` (Blob-Form)
- `border-radius: 10% 50% 10% 50%` (umgekehrter Blob)
- `border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%` (organische Tropfen)
- Verschiedene Varianten für verschiedene Karten — keine zwei Karten sehen gleich aus

**Animationen** (Framer Motion):
- Scroll-triggered Reveals (Intersection Observer) — Sektionen erscheinen beim Scrollen
- Staggered Entry für Karten-Grids (jede Karte fadeIn + slideUp mit `delay * index`)
- Hover-Lift auf allen interaktiven Elementen (`translateY(-4px)` + Glow)
- Zahlen-Counter im Hero (Animated Number: z.B. „10.000+ Transaktionen erfasst")
- Parallax-Effekte auf Hintergrund-Elementen

**Dual-CTA-Prinzip** — überall wo ein Aufruf zum Handeln steht:
- Primär: „Jetzt ausprobieren" → `/dashboard` (Guest-Mode)
- Sekundär: „Kostenlos registrieren" → `/register`

---

### Sektion 1 — Hero

**Was es ist**: Der erste Bildschirm. Kein Scrollen nötig. Muss sofort überzeugen.

**Layout**:
- **Desktop**: Zweispaltig — Text links, App-Mockup rechts
- **Tablet**: Zweispaltig gestaucht oder Text oben, Mockup unten
- **Mobile**: Einspaltig — Text oben, Mockup darunter (kleiner)

**Elemente**:
- **Headline** (1–2 Zeilen): Gradient-Text via `background-clip: text` mit Aurora-Farben
  - DE: *„Deine Finanzen. Klar. Einfach. Finora."*
  - EN: *„Your Finances. Clear. Simple. Finora."*
  - AR / KA: Übersetzungen passend
- **Subheadline** (1 Satz): Was Finora macht, für wen
- **Zwei Buttons**:
  - Primär (gefüllt, Glow-Effekt): „Jetzt ausprobieren" → `/dashboard`
  - Sekundär (Ghost/Outline): „Kostenlos registrieren" → `/register`
- **Trust-Badges**: Unter den Buttons als horizontale Chips
  - *„Kostenlos · Keine Registrierung nötig · 4 Sprachen · Dark Mode"*
- **App-Mockup**: Device-Frames mit echten Screenshots
  - SVG Device-Frames aus `/public/Gerät-Mockups/` (monitor.svg, device-tablet.svg, device-mobile.svg)
  - Echte App-Screenshots aus `/public/Screenshots/` (Screenshot-Monitor.png, Screenshot-Tablet.png, Screenshot-Mobile.png)
  - Framer Motion: leichtes Float-Animation (y ±8px, rotate ±2°)
  - Responsive: passender Device-Frame je nach Viewport (Desktop→Monitor, Tablet→Tablet, Mobile→Handy)
- **Animated Counter** (optional): *„Bereits X Transaktionen erfasst"* — Zähler-Animation beim Laden

**Gefühl**: Modern, mutig, lebendig. Headline ist das Erste was ins Auge springt.

---

### Sektion 2 — Features-Übersicht

**Was es ist**: Appetizer-Version der `/features`-Seite. Schnell scanbar.

**Layout**: Bento-Grid — nicht alle Karten gleich groß:
- 2 große Feature-Karten (Span 2 Spalten) + 4 kleinere (je 1 Spalte)
- **Mobile**: Horizontales Karussell (Snap-Scroll) — leicht links/rechts wischbar
- **Tablet**: 2-Spalten Grid
- **Desktop**: 3-Spalten Bento-Grid mit 2 hervorgehobenen Karten

**Karten-Design**:
- Jede Karte hat eine **eigene organische `border-radius`-Variante**
- Glass-Morphism Hintergrund (`color-mix(in srgb, var(--glass-bg) 65%, transparent)`)
- Icon (Feather Icon) in einem farbigen Kreis mit Aurora-Gradient
- Titel + 1-Zeilen-Beschreibung
- Hover: Glow + Lift + Border-Color-Change zu `var(--primary)`

**Features auf den Karten** (6 Stück):
1. **Transaktionen** — Erfassen, kategorisieren, filtern (Icon: FiCreditCard)
2. **Dashboard** — Einnahmen/Ausgaben auf einen Blick (Icon: FiBarChart2)
3. **4 Sprachen** — DE, EN, AR, KA — mit automatischer Erkennung (Icon: FiGlobe)
4. **Import & Export** — CSV Import/Export (Icon: FiDownload)
5. **Ohne Anmeldung nutzbar** — Voller Guest-Mode mit LocalStorage (Icon: FiUnlock)
6. **Light & Dark Mode** — Passt sich dem Browser an (Icon: FiMoon)

**Ende der Sektion**: Link „Alle Features entdecken →" → `/features`

**Animation**: Karten staggered fadeInUp beim Scroll-Reveal.

---

### Sektion 3 — Wie es funktioniert

**Was es ist**: 3-Schritte-Prozess. Visuell, klar, motivierend.

**Layout**:
- **Desktop**: Horizontal — 3 Schritte nebeneinander, verbunden durch eine animierte Linie/Pfad
- **Tablet**: Horizontal, kompakter
- **Mobile**: Vertikal gestapelt, Linie als vertikaler Connector

**Hintergrund**: Aurora-Gradient-Sektion (dunkler Bereich — Kontrast zu den hellen Sektionen darum) → zeigt dem Besucher das echte App-Feeling

**3 Schritte**:

| # | Titel | Beschreibung | Icon |
|---|---|---|---|
| 1 | Erfassen | Transaktionen eintragen — manuell oder per Import. Einfach und schnell. | FiEdit3 |
| 2 | Analysieren | Einnahmen, Ausgaben, Kategorien und Verläufe — automatisch aufbereitet. | FiTrendingUp |
| 3 | Entscheiden | Mit klaren Zahlen bessere Entscheidungen treffen. Du behältst die Kontrolle. | FiCheckCircle |

**Jeder Schritt**:
- Große Nummer (Gradient-Text) + Icon
- Titel + Beschreibung
- Optional: App-Screenshot neben dem Schritt (User liefert Mockups)
- Organische Karten-Form (jeder Schritt andere `border-radius`)

**Verbindungslinie**: SVG-Pfad (Desktop: horizontal geschwungen, Mobile: vertikal) — animiert per Framer Motion Scroll-Progress

**Animation**: Schritte erscheinen sequenziell (staggered) beim Scrollen. Nummern zählen von 0 hoch.

---

### Sektion 4 — Testimonials / Wall of Love

**Was es ist**: Echte Bewertungen von echten Nutzern. Nur sichtbar wenn mindestens 1 freigegebenes Feedback im System existiert.

**Sichtbarkeit**:
- **0 Feedbacks** → Gesamte Sektion wird **nicht gerendert**
- **≥ 1 Feedback** → Sektion erscheint

**Layout**:
- **Desktop**: 3-Spalten-Grid
- **Tablet**: 2-Spalten-Grid
- **Mobile**: Horizontales Karussell (Snap-Scroll, Dots-Indicator)

**Testimonial-Karte**:
- Sterne-Rating (1–5, visuell mit ausgefüllten/leeren Sternen)
- Zitat (Feedback-Text)
- Name: **BenutzerName** des Users wird automatisch übernommen (kein Vor-/Nachname-System)
- Organische `border-radius`-Varianten (rotierend per Index)
- Glass-Morphism Hintergrund
- Dezentes Anführungszeichen-Icon als Deko

**Daten**: Abgerufen über öffentliches API-Endpoint `GET /api/feedback/public` (nur freigegebene Feedbacks, anonymisiert)

**Animation**: Karten staggered fadeIn. Karussell auto-scroll auf Mobile (pausiert bei Touch).

---

### Sektion 5 — CTA-Banner

**Was es ist**: Finaler Aufruf zum Handeln — kurz vor dem Footer.

**Design**: Volle Breite, Aurora-Gradient Hintergrund (dunkel), auffällig.

**Elemente**:
- Headline: *„Bereit loszulegen?"* / *„Deine Finanzen warten."*
- **Zwei Buttons** (Dual-CTA):
  - Primär: „Jetzt ausprobieren" → `/dashboard` (groß, Glow)
  - Sekundär: „Kostenlos registrieren" → `/register`
- Kleiner Trust-Hinweis: *„Kostenlos · Keine Kreditkarte nötig"*

**Form**: Großzügige Padding, zentriert, organische Container-Form (abgerundete Kanten oben)

**Animation**: FadeInUp beim Scroll-Reveal. Buttons pulsieren leicht.

---

## 6. Section-Timeline-Navigator (Fixed)

**Was es ist**: Ein fixierter, scrollbarer Navigation-Indicator am Rand — zeigt dem Besucher wo er sich befindet und erlaubt direktes Springen zwischen Sektionen.

**Position**:
- **Desktop**: Rechter Rand, vertikal zentriert, fixed
- **Tablet**: Rechter Rand, kleiner, fixed
- **Mobile**: Unterer Rand, horizontal, fixed (wie eine Bottom-Dot-Navigation)

**Elemente** (pro Sektion):
- Icon (passend zu Finora: FiHome, FiGrid, FiZap, FiHeart, FiArrowRight)
- Aktive Sektion: hervorgehoben (primary-Farbe, Glow)
- Inaktive: dezent (glass-border, gedimmt)
- Verbindungslinie zwischen den Dots/Icons
- Tooltip (Desktop): Sektionsname beim Hover

**Verhalten**:
- Klick → smooth-scroll zur Sektion (`scrollIntoView({ behavior: 'smooth' })`)
- Automatische Erkennung der aktiven Sektion via Intersection Observer
- Verschwindet beim Scrollen zum Footer
- **Browser-Scrollbar wird versteckt** — der Timeline-Navigator übernimmt die Orientierungs-Funktion vollständig

**Stil**: Glass-Morphism Panel, organisch abgerundet, Aurora-Akzente.

---

## 7. Navigation — Header & Footer

### PublicNav (Header)

Bestehender `PublicNav` wird **unverändert importiert** und auf der Landing Page benutzt (über `PublicLayout`).

**Einzige Anpassung — Hamburger-Menü auf Mobile/Tablet**:
- Auf der Landing Page und allen Public Pages: Hamburger-Menü **ausblenden** (nur Logo + Auth-Buttons)
- Erst ab `/dashboard` (MainLayout) erscheint das Hamburger-Menü
- Begründung: Auf Public Pages gibt es den Section-Timeline-Navigator und die PublicNav-Links — ein Hamburger-Menü ist doppelt

### Footer

Bestehender `Footer` wird **unverändert** importiert. Keine Änderungen.

---

## 8. Feedback-System: Vollständiger Ablauf

### 8.1 — Feedback-Funktion (immer verfügbar)

Unter **Einstellungen** oder **Profil** (eingeloggter Bereich) gibt es ab Tag 1 einen Feedback-Bereich:

- Erreichbar über Einstellungen → Abschnitt „Feedback" (oder eigene Unterseite)
- **Formular**: Sterne-Rating (1–5) + Freitext (optional)
- **Zustand**:
  - Kein Feedback abgegeben → Formular anzeigen
  - Feedback bereits abgegeben → Feedback anzeigen (readonly) mit Info *„Danke für dein Feedback!"*
  - Funktion erscheint erst wieder, wenn Admin das alte Feedback löscht

### 8.2 — Feedback-Trigger (einmalige Benachrichtigung)

**Auslöser**: BEIDE Bedingungen müssen erfüllt sein:
- ≥ 7 Tage seit Registrierung/erster Nutzung
- ≥ 10 erfasste Transaktionen

**Anzeige**: Dezente Benachrichtigungskarte (z.B. auf dem Dashboard oder als Banner):

> *„Wie findest du Finora bisher? Dein Feedback hilft uns."*
> [Feedback geben] (Button → navigiert zu Feedback-Bereich in Einstellungen)
> [✕] (Schließen-Button)

**Regeln**:
- Wird **exakt einmal** angezeigt (Flag in User-Daten oder localStorage)
- Nutzer kann Schließen oder zum Feedback navigieren
- Erscheint NICHT wenn bereits Feedback abgegeben wurde

### 8.3 — Motivations-Texte (kontextabhängig)

Basierend auf der Anzahl der Feedbacks im System wird ein Motivations-Text angezeigt:

| Feedbacks im System | Text |
|---|---|
| 0 | *„Sei der Erste, der eine Bewertung hinterlässt!"* |
| 1–2 | *„Sei einer der ersten 3 Bewerter!"* |
| 3–9 | *„Sei einer der ersten 10 Bewerter!"* |
| ≥ 10 | Kein extra Motivations-Text |

Diese Texte erscheinen im Feedback-Bereich und in der Trigger-Benachrichtigung.

### 8.4 — Consent-Dialog (ab 4 Sterne)

Wenn der Nutzer **4 oder 5 Sterne** gibt, erscheint nach dem Absenden ein Consent-Dialog:

> *„Darf dein Feedback öffentlich auf unserer Seite erscheinen?"*
> *Dein Name wird anonymisiert angezeigt (z.B. „Max M.").*
>
> [Ja, gerne] [Nein, danke]

- **Ja** → `consentGiven: true` → geht zur Admin-Prüfung
- **Nein** → `consentGiven: false` → bleibt privat
- Bei < 4 Sternen: Kein Consent-Dialog, Feedback bleibt immer privat

### 8.5 — Admin-Bereich: Feedback-Management

Neuer Bereich im Admin-Panel: **„Feedbacks"** (`/admin/feedbacks`)

**Funktionen**:
- **Liste aller Feedbacks** — mit Filter (alle / ≥4 Sterne / consent gegeben / veröffentlicht)
- **Feedback-Details**: Rating, Text, User (anonymisiert für Viewer-Rolle!), Datum, Consent-Status
- **Aktionen** (nur Admin-Rolle):
  - **Freigeben** → `published: true` — erscheint auf Landing Page
  - **Zurückziehen** → `published: false` — verschwindet von Landing Page
  - **Löschen** → Feedback komplett entfernen (User kann danach erneut Feedback geben)
- **Sensible Daten**: Für `viewer`-Rolle werden User-Namen und E-Mails **geblurrt/maskiert** — nur Admin sieht Klardaten
- **Statistiken**: Durchschnittliche Bewertung, Anzahl Feedbacks, Veröffentlichungsquote

### 8.6 — Öffentliche Anzeige

Freigegebene Feedbacks (`published: true`) werden über ein öffentliches API-Endpoint abgerufen:
- Nur: Rating, Text (ggf. gekürzt), anonymisierter Name, Datum
- Keine User-IDs, E-Mails oder sensiblen Daten

---

## 9. Verbindung — Landing Page ↔ Restliche App

| Landing Page Element | Verlinkt zu |
|---|---|
| „Jetzt ausprobieren"-Button | `/dashboard` (Guest-Mode) |
| „Kostenlos registrieren"-Button | `/register` |
| „Alle Features entdecken" | `/features` |
| Pricing-Erwähnung | `/pricing` |
| Footer → About | `/about` |
| Footer → Blog | `/blog` |
| Footer → Contact | `/contact` |
| Footer → FAQ / Help | `/faq`, `/help` |
| „Anmelden"-Header-Button | `/login` |

---

## 10. Rechtliche & datenschutzliche Überlegungen

- **Testimonials & DSGVO**: Expliziter Consent vor Veröffentlichung — Consent-Dialog (Phase 8.4)
- **Doppelte Checkbox beim Feedback-Abgeben**: 
  1. Checkbox 1: *„Ich bestätige, dass mein Feedback ehrlich ist"*
  2. Checkbox 2: *„Ich stimme der Speicherung meines Feedbacks gemäß der Datenschutzerklärung zu"*
  - Beide müssen aktiviert sein, bevor das Feedback abgeschickt werden kann
- **Datenspeicherung & Aufbewahrung**:
  - Standard-Feedbacks (< 4 Sterne): **1 Jahr Speicherdauer** im System, danach automatisch gelöscht
  - Feedbacks ≥ 4 Sterne mit Consent: **Unbegrenzt gespeichert** (wichtig für Landing Page Testimonials)
  - Admin kann jederzeit manuell löschen (unabhängig von Aufbewahrungsfrist)
- **Name im Testimonial**: BenutzerName des Users wird automatisch übernommen
- **Widerruf**: Nutzer kann über Einstellungen sein Feedback sehen und den Consent widerrufen → Admin wird benachrichtigt, Testimonial wird automatisch depubliziert
- **Keine Fake-Daten**: Nur echte, freigegebene Feedbacks werden öffentlich angezeigt

---

## 11. Technische Implementierung — Phasen

### Phase 1: Landing Page (Frontend)

**Neue Dateien**:
- `src/pages/LandingPage/LandingPage.jsx`
- `src/pages/LandingPage/LandingPage.module.scss`
- `src/pages/LandingPage/sections/HeroSection.jsx`
- `src/pages/LandingPage/sections/HeroSection.module.scss`
- `src/pages/LandingPage/sections/FeaturesSection.jsx`
- `src/pages/LandingPage/sections/FeaturesSection.module.scss`
- `src/pages/LandingPage/sections/HowItWorksSection.jsx`
- `src/pages/LandingPage/sections/HowItWorksSection.module.scss`
- `src/pages/LandingPage/sections/TestimonialsSection.jsx`
- `src/pages/LandingPage/sections/TestimonialsSection.module.scss`
- `src/pages/LandingPage/sections/CTASection.jsx`
- `src/pages/LandingPage/sections/CTASection.module.scss`
- `src/pages/LandingPage/components/SectionTimeline.jsx`
- `src/pages/LandingPage/components/SectionTimeline.module.scss`
- `src/pages/LandingPage/components/TestimonialCard.jsx`
- `src/pages/LandingPage/components/FeatureCard.jsx`
- `src/pages/LandingPage/components/StepCard.jsx`

**Geänderte Dateien**:
- `src/AppRoutes.jsx` — `/` Route → LandingPage (Guest) oder Redirect (Auth)
- `public/locales/de/translation.json` — Landing Page Texte
- `public/locales/en/translation.json` — Landing Page Texte
- `public/locales/ar/translation.json` — Landing Page Texte
- `public/locales/ka/translation.json` — Landing Page Texte

**Abhängigkeiten**: Keine neuen npm-Pakete nötig (Framer Motion, react-i18next, react-router-dom sind bereits installiert)

### Phase 2: Feedback Backend (API)

**Neue Dateien**:
- `src/models/Feedback.js` — Mongoose Schema (user, rating, text, consentGiven, published, createdAt)
- `src/routes/feedback.js` — Routes
- `src/controllers/feedbackController.js` — CRUD + Admin-Endpunkte
- `src/validators/feedbackValidation.js` — Zod/Joi Validierung
- `__tests__/controllers/feedbackController.test.js`
- `__tests__/validators/feedbackValidation.test.js`

**Geänderte Dateien**:
- `server.js` — Feedback-Routes registrieren
- `src/routes/admin.js` — Admin-Feedback-Endpunkte hinzufügen

**API-Endpunkte**:
- `POST /api/feedback` — User erstellt Feedback (auth required)
- `GET /api/feedback/mine` — User sieht eigenes Feedback (auth required)
- `PATCH /api/feedback/mine/consent` — User ändert Consent (auth required)
- `DELETE /api/feedback/mine` — User löscht eigenes Feedback (auth required)
- `GET /api/feedback/public` — Öffentliche Testimonials (kein auth)
- `GET /api/feedback/count` — Anzahl Feedbacks (kein auth, für Motivations-Texte)
- `GET /admin/feedbacks` — Admin: alle Feedbacks
- `PATCH /admin/feedbacks/:id/publish` — Admin: freigeben
- `PATCH /admin/feedbacks/:id/unpublish` — Admin: zurückziehen
- `DELETE /admin/feedbacks/:id` — Admin: löschen

### Phase 3: Feedback Frontend (In-App)

**Neue Dateien**:
- `src/components/feedback/FeedbackForm.jsx` — Rating + Text Formular
- `src/components/feedback/FeedbackForm.module.scss`
- `src/components/feedback/ConsentDialog.jsx` — Post-Submit Consent
- `src/components/feedback/ConsentDialog.module.scss`
- `src/components/feedback/FeedbackPrompt.jsx` — Dashboard-Trigger-Benachrichtigung
- `src/components/feedback/FeedbackPrompt.module.scss`
- `src/hooks/useFeedback.js` — Feedback State + API Calls
- `src/api/feedback.js` — API Client-Funktionen

**Geänderte Dateien**:
- `src/pages/SettingsPage/SettingsPage.jsx` — Feedback-Bereich hinzufügen
- `src/pages/DashboardPage/DashboardPage.jsx` — FeedbackPrompt einbinden
- `public/locales/*/translation.json` — Feedback-Texte (4 Sprachen)

### Phase 4: Admin Feedback Panel

**Neue Dateien**:
- `src/pages/admin/AdminFeedbackPage.jsx`
- `src/pages/admin/AdminFeedbackPage.module.scss`
- `src/hooks/useAdminFeedback.js`
- `src/api/adminFeedback.js`

**Geänderte Dateien**:
- `src/AppRoutes.jsx` — Admin-Route `/admin/feedbacks`
- `src/config/navigation.js` — Admin-Nav-Item hinzufügen (falls vorhanden)

### Phase 5: Tests

**Neue Test-Dateien**:
- `e2e/landing-page.spec.js` — Landing Page E2E
- `e2e/feedback.spec.js` — Feedback-Flow E2E
- `src/test/pages/LandingPage.test.jsx` — Unit Tests
- `src/test/components/FeedbackForm.test.jsx`
- `__tests__/controllers/feedbackController.test.js` — API Tests

**Prüfungen**:
- Alle 4 Sprachen korrekt geladen
- RTL (Arabisch) korrekt gerendert
- Responsive auf Mobile/Tablet/Desktop
- Keine ESLint-Fehler, keine Warnungen
- Build erfolgreich

---

## 12. Zusammenfassung

| Was | Wie |
|---|---|
| Landing Page | 5 Sektionen + Section-Timeline-Navigator |
| Design | Bestehendes Aurora-Theme (Light + Dark), Glass-Morphism, organische Formen |
| Route | `/` für Gäste, auto-redirect für eingeloggte User |
| Guest-Mode | Dual-CTA überall: Ausprobieren + Registrieren |
| Sprachen | 4 Sprachen (DE/EN/AR/KA), Browser-Erkennung, RTL |
| Feedback-System | Einstellungen → Formular → Consent → Admin-Freigabe |
| Trigger | Nach 7 Tagen + 10 Transaktionen, einmalig |
| Admin-Panel | Neuer Feedback-Bereich, Viewer-Blur, volle Kontrolle |
| Testimonials | Nur echte Daten, Sektion dynamisch ein-/ausgeblendet |
| Header & Footer | Unverändert importiert |
| Tests | Unit + E2E, alle Sprachen, Responsive, ESLint-frei |

---

*Stand: Plan genehmigt — Implementierung bereit.*
