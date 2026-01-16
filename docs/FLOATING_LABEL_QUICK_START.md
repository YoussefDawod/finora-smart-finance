# 🎨 Floating Label Input - Quick Reference

## 🚀 Installation

```jsx
import { FloatingLabelInput } from '@/components/common';
```

## ⚡ Quick Examples

### Email Input
```jsx
<FloatingLabelInput 
  label="E-Mail"
  type="email"
  placeholder="you@example.com"
/>
```

### Password mit Toggle
```jsx
const [showPassword, setShowPassword] = useState(false);

<FloatingLabelInput 
  label="Passwort"
  type={showPassword ? 'text' : 'password'}
  iconRight={
    <button type="button" onClick={() => setShowPassword(!showPassword)}>
      {showPassword ? '👁️' : '👁️‍🗨️'}
    </button>
  }
/>
```

### Mit Error
```jsx
<FloatingLabelInput 
  label="Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
/>
```

### Mit Hint
```jsx
<FloatingLabelInput 
  label="Passwort"
  type="password"
  hint="Min. 8 Zeichen erforderlich"
/>
```

### Mit Character Counter
```jsx
<FloatingLabelInput 
  label="Bio"
  maxLength={100}
  showCharCount
/>
```

## 📏 Größen

```jsx
<FloatingLabelInput size="sm" label="Klein" />      {/* 16px */}
<FloatingLabelInput size="md" label="Mittel" />    {/* 24px - Standard */}
<FloatingLabelInput size="lg" label="Groß" />      {/* 32px */}
```

## 🎯 In Forms

```jsx
const [formData, setFormData] = useState({ email: '', password: '' });
const [errors, setErrors] = useState({});

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

<form>
  <FloatingLabelInput 
    id="email"
    label="E-Mail"
    name="email"
    type="email"
    value={formData.email}
    onChange={handleChange}
    error={errors.email}
    required
  />
</form>
```

## ✅ Features auf einen Blick

| Feature | Beispiel |
|---------|----------|
| **Floating Label** | Label bewegt sich bei Focus/Input |
| **Error State** | Rote Farbe, Error-Message |
| **Icons** | Left/Right Icons möglich |
| **Character Count** | Zeigt x/max an |
| **Größen** | sm, md (default), lg |
| **Disabled** | disabled-State |
| **Password Toggle** | Mit Eye-Icon |
| **Accessibility** | ARIA-Labels, Keyboard-Nav |
| **Dark Mode** | Automatische Theme-Anpassung |
| **Responsive** | Mobile-optimiert |

## 🎨 Styling

Das Component nutzt automatisch Theme-Variablen:

```scss
// Farben
--primary      // Focus/Active
--error        // Error-State
--tx           // Text
--surface-2    // Background

// Größen
--input-height    // Variable nach size
--input-font-size // Variable nach size
```

## 🔑 Wichtigste Props

```jsx
<FloatingLabelInput 
  // Inhalt
  label="Label-Text"           // Erforderlich für gutes UX
  type="email"                 // text, email, password, number, etc.
  placeholder="Platzhalter"
  value={value}
  
  // Validierung
  error="Error-Message"        // Zeigt Error mit roter Farbe
  hint="Hilfe-Text"            // Unter dem Input
  required                     // Zeigt * an
  
  // UI
  size="md"                    // sm, md, lg
  disabled={isLoading}
  
  // Icons
  icon={<Icon />}              // Links
  iconRight={<Icon />}         // Rechts
  
  // Character Counter
  maxLength={100}
  showCharCount
  
  // Events
  onChange={(e) => {...}}
  onFocus={(e) => {...}}
  onBlur={(e) => {...}}
/>
```

## 📝 Form Example (Complete)

```jsx
import { useState } from 'react';
import { FloatingLabelInput } from '@/components/common';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validierung...
  };

  return (
    <form onSubmit={handleSubmit}>
      <FloatingLabelInput
        id="email"
        label="E-Mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        required
      />

      <FloatingLabelInput
        id="password"
        label="Passwort"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        iconRight={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        }
        required
      />

      <button type="submit">Anmelden</button>
    </form>
  );
}
```

## 🎬 Animation Details

**Label Animation:**
- Schwebt 24px nach oben
- Verkleinert sich auf 85%
- Spring-Animation (~300ms)

**Focus Indicator:**
- Bottom-Border animiert zu 100% Breite
- Primary-Farbe

**Icons:**
- Wechsel der Farbe bei Focus
- Slight Scale-Up (1 → 1.1)

## ⌨️ Keyboard Navigation

- ✅ Tab zum Navigieren
- ✅ Enter/Space für Buttons
- ✅ Arrow-Keys in bestimmten Input-Types
- ✅ Escape zum Schließen (wenn modal)

## 🌙 Dark Mode

Das Component passt sich automatisch an:

```scss
// Light
--tx: #1f2937        // Dunkelgrau
--surface-2: #f3f4f6 // Hellgrau

// Dark
--tx: #f3f4f6        // Hellgrau
--surface-2: #1f2937 // Dunkelgrau
```

## 📞 Support & Links

- [Vollständige Dokumentation](./FLOATING_LABEL_INPUT.md)
- [Component Quelle](../src/components/common/FloatingLabelInput/)
- [WCAG Accessibility Standards](https://www.w3.org/WAI/WCAG21/quickref/)
