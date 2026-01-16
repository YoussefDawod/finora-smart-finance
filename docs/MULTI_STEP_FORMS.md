# 🎯 Multi-Step Form System - Dokumentation

## Übersicht

Das **Multi-Step Form System** ermöglicht die Aufteilung langer Formulare in mehrere Schritte für bessere Benutzerfreundlichkeit.

### ✨ Features

- **Step Navigation** - Vor/Zurück zwischen Schritten
- **Progress Tracking** - Visueller Fortschrittsanzeige
- **Per-Step Validation** - Validierung für jeden Schritt
- **Step Indicators** - Numerische oder bildliche Schrittanzeige
- **Animated Transitions** - Smooth Übergänge zwischen Schritten
- **Responsive Design** - Mobile-optimiert
- **Accessibility** - ARIA-Labels und Keyboard-Navigation

## 📦 Komponenten

### 1. MultiStepForm (Container)

Der Container verwaltet alle Steps und deren Navigation.

```jsx
import { MultiStepForm } from '@/components/common';

<MultiStepForm
  steps={[
    { title: 'Schritt 1', content: <Step1 /> },
    { title: 'Schritt 2', content: <Step2 /> },
    { title: 'Schritt 3', content: <Step3 /> },
  ]}
  onComplete={handleComplete}
  validateStep={validateStep}
/>
```

#### Props

| Prop | Type | Default | Beschreibung |
|------|------|---------|-------------|
| `steps` | Array | [] | Array von Step-Objekten mit title und content |
| `onComplete` | Function | null | Callback wenn alle Steps abgeschlossen |
| `onStepChange` | Function | null | Callback bei Step-Wechsel |
| `showProgress` | Boolean | true | Progress-Bar anzeigen |
| `showStepTitles` | Boolean | true | Step-Titel anzeigen |
| `nextLabel` | String | 'Weiter' | Button-Label für nächster Schritt |
| `prevLabel` | String | 'Zurück' | Button-Label für vorheriger Schritt |
| `completeLabel` | String | 'Fertig' | Button-Label zum Abschließen |
| `canGoBack` | Boolean | true | Zurück-Navigation erlauben |
| `validateStep` | Function | null | Step-Validierungs-Funktion |

### 2. MultiStepRegisterForm

Beispiel-Implementierung für ein Registrierungsformular in 3 Schritten.

```jsx
import { MultiStepRegisterForm } from '@/components/auth';

<MultiStepRegisterForm />
```

## 🎨 Visualisierung

### Progress Bar
```
████░░░░░░░░░░░░░░░░░░  33%
Schritt 1 von 3 - Persönliche Daten
```

### Step Indicators
```
[1] → [2] → [3]
```

Completed Steps zeigen Checkmark:
```
[✓] → [2] → [3]
```

## 📋 Verwendungsbeispiel: 3-Step Registration

```jsx
const steps = [
  {
    title: 'Persönliche Daten',
    content: (
      <div>
        <input name="name" placeholder="Name" />
        <input name="email" type="email" placeholder="E-Mail" />
      </div>
    ),
  },
  {
    title: 'Passwort',
    content: (
      <div>
        <input name="password" type="password" placeholder="Passwort" />
        <input name="confirmPassword" type="password" placeholder="Bestätigen" />
      </div>
    ),
  },
  {
    title: 'Bedingungen',
    content: (
      <div>
        <input type="checkbox" name="agreeToTerms" />
        <label>Bedingungen akzeptieren</label>
      </div>
    ),
  },
];

const validateStep = async (step) => {
  const errors = {};
  
  if (step === 0) {
    if (!formData.name) errors.name = 'Name erforderlich';
    if (!formData.email) errors.email = 'E-Mail erforderlich';
  } else if (step === 1) {
    if (!formData.password) errors.password = 'Passwort erforderlich';
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwörter stimmen nicht überein';
    }
  } else if (step === 2) {
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'Bedingungen akzeptieren erforderlich';
    }
  }
  
  return errors;
};

const handleComplete = async () => {
  await register(formData);
};

<MultiStepForm
  steps={steps}
  onComplete={handleComplete}
  validateStep={validateStep}
/>
```

## 🎯 Step Structure

Jeder Step ist ein Objekt mit:

```jsx
{
  title: 'Step-Titel',      // Wird in Progress angezeigt
  content: <ReactElement>   // JSX-Inhalt des Schritts
}
```

## ✅ Validierung

Die `validateStep` Funktion wird vor dem Wechsel zum nächsten Schritt aufgerufen:

```jsx
const validateStep = async (step) => {
  const errors = {};
  
  if (step === 0) {
    // Validiere Schritt 1
  } else if (step === 1) {
    // Validiere Schritt 2
  } else if (step === 2) {
    // Validiere Schritt 3
  }
  
  // Rückgabe von Fehlern (leer = gültig)
  return errors;
};
```

Wenn Fehler zurückgegeben werden:
- ❌ Schritt-Wechsel blockiert
- ⚠️ Error-Summary angezeigt
- 🔴 Relevante Felder markiert

## 🎬 Animations

### Step-Transition
```
Ausgehend: opacity: 0, x: -20px
Eingehend: opacity: 1, x: 0
Duration: 300ms
```

### Progress-Bar
```
Smooth width animation
Duration: 400ms
Easing: easeOut
```

## 📱 Responsive Breakpoints

| Screen | Änderung |
|--------|----------|
| Desktop (>768px) | Normal |
| Tablet (480-768px) | Kompaktere Abstände |
| Mobile (<480px) | Buttons full-width, Stack |

## ♿ Accessibility

- ✅ `aria-label` für Step-Buttons
- ✅ `aria-current` für aktiven Step
- ✅ Keyboard-Navigation (Tab, Enter, Arrows)
- ✅ Screen Reader Support
- ✅ `role="alert"` für Error-Messages
- ✅ Focus-Management

```jsx
// Automatisch vom Component verwaltet
aria-current="step"          // Auf aktivem Step
aria-label="Schritt 2 - Passwort"
role="alert"                 // Error-Summary
```

## 🌙 Dark Mode

Das Component passt sich automatisch an Theme-Variablen an:

```scss
--primary        // Primary-Farbe
--surface        // Background
--border         // Border-Farbe
--tx             // Text-Farbe
--error          // Error-Farbe
--success        // Success-Farbe
```

## 📊 Real-World Example: MultiStepRegisterForm

Die Implementierung spaltet die Registrierung in 3 intuitive Schritte auf:

### Schritt 1: Persönliche Daten
- Name-Eingabe
- E-Mail-Eingabe
- Validierung: Länge, Format

### Schritt 2: Passwort
- Passwort-Eingabe
- Passwort-Bestätigung
- Stärke-Indikator
- Validierung: Länge, Komplexität

### Schritt 3: Bedingungen
- Nutzungsbedingungen anzeigen
- Acceptance-Checkbox
- Validierung: Muss akzeptiert sein

## 🚀 Best Practices

1. **Clear Step Titles** - Nutzer sollen wissen, wo sie sind
   ```jsx
   { title: 'Persönliche Daten', content: ... }
   ```

2. **Per-Step Validation** - Nur aktuellen Step validieren
   ```jsx
   if (step === 0) { /* validate step 1 */ }
   ```

3. **Meaningful Errors** - Klare Error-Messages
   ```jsx
   errors.password = 'Passwort zu schwach'  ✅
   errors.password = 'Invalid'              ❌
   ```

4. **Progress Visual** - Immer Progress-Bar zeigen
   ```jsx
   showProgress={true}  // Standard
   ```

5. **Back Navigation** - Erlaube Zurück-Navigation
   ```jsx
   canGoBack={true}  // Ermöglicht Korrektur
   ```

## 🔗 Integration

### Mit Floating Label Inputs
```jsx
<FloatingLabelInput
  label="E-Mail"
  value={formData.email}
  onChange={handleChange}
/>
```

### Mit Loading States
```jsx
{isLoading ? <Spinner /> : 'Weiter'}
```

### Mit Toast Notifications
```jsx
toast.error('Ungültige E-Mail')
toast.success('Schritt abgeschlossen')
```

## 📚 Vollständiges Beispiel

```jsx
import { MultiStepForm, FloatingLabelInput } from '@/components/common';
import { useState } from 'react';

export function MyMultiStepForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = async (step) => {
    const errors = {};
    
    if (step === 0) {
      if (!formData.username) errors.username = 'Username erforderlich';
      if (!formData.email) errors.email = 'E-Mail erforderlich';
    } else if (step === 1) {
      if (!formData.password) errors.password = 'Passwort erforderlich';
    }
    
    return errors;
  };

  const handleComplete = async () => {
    console.log('Form completed:', formData);
  };

  const steps = [
    {
      title: 'Account Info',
      content: (
        <div>
          <FloatingLabelInput
            label="Username"
            value={formData.username}
            onChange={handleChange}
            name="username"
          />
          <FloatingLabelInput
            label="E-Mail"
            type="email"
            value={formData.email}
            onChange={handleChange}
            name="email"
          />
        </div>
      ),
    },
    {
      title: 'Sicherheit',
      content: (
        <FloatingLabelInput
          label="Passwort"
          type="password"
          value={formData.password}
          onChange={handleChange}
          name="password"
        />
      ),
    },
  ];

  return (
    <MultiStepForm
      steps={steps}
      onComplete={handleComplete}
      validateStep={validateStep}
      nextLabel="Weiter"
      completeLabel="Registrieren"
    />
  );
}
```

## 🐛 Troubleshooting

**Problem:** Step-Navigation funktioniert nicht
- Überprüfe: `validateStep` gibt korrekte Fehler zurück

**Problem:** Validation wird übersprungen
- Überprüfe: `validateStep` ist keine async-Funktion?

**Problem:** Back-Button disabled
- Überprüfe: `canGoBack={true}` ist gesetzt

## 📖 Weitere Ressourcen

- [Framer Motion Docs](https://www.framer.com/motion/)
- [React Forms Best Practices](https://react.dev/learn/sharing-state-between-components)
- [Form Validation Patterns](https://www.patterns.dev/)
