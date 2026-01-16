# ♿ Accessibility Features

## Übersicht

Diese Anwendung folgt den **WCAG 2.1 Level AA** Richtlinien für Barrierefreiheit und bietet umfassende Unterstützung für Tastaturnavigation, Screenreader und assistive Technologien.

## 🎯 Implementierte Features

### 1. **Enhanced Focus States**

#### Globale Focus-Indikatoren
- Klare, sichtbare Focus-Ringe für alle interaktiven Elemente
- Konsistente 2px Outline mit zusätzlichem Box-Shadow
- Theme-aware Farben (passt sich an Light/Dark/Glass Theme an)

#### Focus-Variablen
```scss
--focus-ring-color: var(--primary, #6366f1);
--focus-ring-width: 2px;
--focus-ring-offset: 2px;
--focus-ring-opacity: 0.5;
```

#### Spezielle Focus-Styles für:
- **Buttons**: Outline + Box-Shadow
- **Links**: Outline + Background-Highlight in Textinhalten
- **Inputs**: Inset Focus mit Border-Highlight
- **Checkboxes/Radio**: Offset Focus-Ring
- **Cards**: Transform + Enhanced Shadow
- **Navigation**: Background-Highlight

### 2. **Keyboard Navigation Detection**

```javascript
// Automatische Erkennung von Tastatur-Navigation
initKeyboardNavigation();
```

**Features:**
- Erkennt Tab-Taste für Keyboard-User
- Fügt `.keyboard-user` Klasse zum Body hinzu
- Entfernt Klasse bei Maus-Nutzung
- Zeigt Focus-Indikatoren nur für Keyboard-User
- Pulse-Animation beim ersten Tab

### 3. **Skip to Content Link**

```html
<a href="#main-content" class="skip-to-content">
  Zum Hauptinhalt springen
</a>
```

**Features:**
- Versteckt bis Tab-Focus
- Springt direkt zum Hauptinhalt
- Verbessert Navigation für Screenreader-Nutzer
- Automatisch eingefügt beim App-Start

### 4. **ARIA Support**

#### Implementierte ARIA-Attribute:
- `role="main"` für Hauptinhalt
- `role="alert"` für Toast-Notifications
- `aria-live="polite"` für dynamische Updates
- `aria-label` für Icon-Buttons
- `tabindex="-1"` für programmatischen Focus

### 5. **High Contrast Mode Support**

```scss
@media (prefers-contrast: high) {
  :root {
    --focus-ring-width: 3px;
    --focus-ring-offset: 3px;
  }
}
```

**Features:**
- Vergrößerte Focus-Ringe (3px)
- Erhöhter Kontrast
- Bessere Sichtbarkeit

### 6. **Reduced Motion Support**

```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Features:**
- Deaktiviert Animationen für Motion-sensitive User
- Behält essentielle Focus-Transitions
- Respektiert OS-Einstellung

### 7. **Screen Reader Only Content**

```html
<span class="sr-only">Zusätzliche Informationen für Screenreader</span>
```

**Utilities:**
- `.sr-only` - Versteckt visuell, aber für Screenreader verfügbar
- `.sr-only-focusable` - Sichtbar bei Focus

## 📦 Verwendete Dateien

### Styles
- `/src/styles/accessibility.scss` - Hauptdatei für A11y-Styles
- `/src/styles/globals.scss` - Globale Focus-States
- `/src/styles/mixins.scss` - Wiederverwendbare Focus-Mixins

### JavaScript
- `/src/utils/keyboardNavigation.js` - Keyboard-Detection & Skip-Link
- `/src/main.jsx` - Initialisierung

### Components
- `/src/components/layout/MainLayout/MainLayout.jsx` - Main-Content ID

## 🧰 Verwendung der Focus-Mixins

### Button mit Standard-Focus
```scss
.myButton {
  @include button-base;
  // Enthält bereits focus-ring
}
```

### Custom Focus-Ring
```scss
.myElement {
  @include focus-ring;
}
```

### Inset Focus (für Inputs)
```scss
.myInput {
  @include focus-ring-inset;
}
```

### Custom Color Focus
```scss
.errorButton {
  @include focus-ring-custom(var(--error-color), var(--error-rgb));
}
```

## ⌨️ Keyboard Shortcuts

### Navigation
- `Tab` - Nächstes Element
- `Shift + Tab` - Vorheriges Element
- `Enter` - Aktivieren
- `Space` - Aktivieren (Buttons, Checkboxes)
- `Escape` - Modals/Dropdowns schließen

### Skip Link
- `Tab` (beim Laden) - Zeigt Skip-Link an
- `Enter` - Springt zum Hauptinhalt

## 🧪 Testing

### Tastatur-Navigation testen
1. Laden Sie die Seite
2. Drücken Sie `Tab` mehrfach
3. Alle interaktiven Elemente sollten klare Focus-Ringe zeigen
4. Focus-Order sollte logisch sein (top-to-bottom, left-to-right)

### Screenreader-Testing
- **Windows**: NVDA, JAWS
- **macOS**: VoiceOver (`Cmd + F5`)
- **Linux**: Orca

### Browser-DevTools
```javascript
// Console-Check für Focus
document.activeElement
```

## 📝 Best Practices

### Focus Management
```jsx
// Programmatischer Focus nach Action
const handleSubmit = () => {
  // ... submit logic
  document.getElementById('success-message')?.focus();
};
```

### Custom Interactive Elements
```jsx
<div
  role="button"
  tabIndex={0}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
  onClick={handleClick}
>
  Custom Button
</div>
```

### Focus Trap (Modals)
```jsx
// Verhindert Focus außerhalb von Modal
<div data-focus-trap>
  <Modal />
</div>
```

## 🎨 Visual Focus Indicators

### Standard-Element
```
┌─────────────────┐
│  Focus Element  │  ← 2px primary outline
│                 │  ← 2px offset
└─────────────────┘  ← Box-shadow halo
```

### High-Contrast Mode
```
┌─────────────────┐
│  Focus Element  │  ← 3px outline (dicker)
│                 │  ← 3px offset (größer)
└─────────────────┘
```

## 🚀 Performance

- CSS-basiert (keine JS-Overhead)
- `:focus-visible` nutzt Browser-native Detection
- Lazy-loaded Keyboard-Detection
- Minimal Bundle-Size Impact

## 📚 Ressourcen

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN: Focus](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
- [WebAIM: Keyboard Accessibility](https://webaim.org/techniques/keyboard/)

## ✅ Checkliste

- [x] Alle interaktiven Elemente sind fokussierbar
- [x] Focus-Order ist logisch
- [x] Focus-Indikatoren sind deutlich sichtbar
- [x] Skip-Link vorhanden
- [x] ARIA-Labels für Icon-Buttons
- [x] Keyboard-Shortcuts funktionieren
- [x] Reduced Motion unterstützt
- [x] High Contrast Mode unterstützt
- [x] Screenreader-kompatibel

---

**Maintainer**: Expense Tracker Team
**Zuletzt aktualisiert**: Januar 2026
