# 🎨 Floating Label Input - Dokumentation

## Übersicht

Das **FloatingLabelInput** Component bietet eine moderne, animierte Input-Komponente mit schwebendem Label. Das Label bewegt sich elegant nach oben, wenn der Input fokussiert wird oder einen Wert hat.

## ✨ Features

- **Animated Floating Label** - Label schwebt sanft nach oben bei Focus/Value
- **Spring Animation** - Smooth, natürliche Bewegung
- **Error States** - Visuelle Fehler-Rückmeldung
- **Character Counter** - Optionale Zeichenbegrenzung
- **Icons Support** - Links und rechts Icons
- **Accessibility** - ARIA-Labels und Screen Reader Support
- **Responsive** - Automatisch angepasste Größen
- **Reduced Motion** - Support für Bewegungsempfindlichkeit

## 📦 Installation & Import

```jsx
import { FloatingLabelInput } from '@/components/common';
```

## 🎯 Verwendungsbeispiele

### Basis-Verwendung

```jsx
<FloatingLabelInput 
  label="E-Mail"
  type="email"
  placeholder="you@example.com"
/>
```

### Mit Error-Handling

```jsx
const [email, setEmail] = useState('');
const [error, setError] = useState('');

const handleChange = (e) => {
  const value = e.target.value;
  setEmail(value);
  
  // Validate in real-time
  if (!value) {
    setError('E-Mail ist erforderlich');
  } else if (!/\S+@\S+\.\S+/.test(value)) {
    setError('Ungültige E-Mail-Adresse');
  } else {
    setError('');
  }
};

<FloatingLabelInput 
  label="E-Mail"
  type="email"
  value={email}
  onChange={handleChange}
  error={error}
/>
```

### Mit Hint-Text

```jsx
<FloatingLabelInput 
  label="Passwort"
  type="password"
  hint="Mindestens 8 Zeichen erforderlich"
/>
```

### Mit Charakter-Counter

```jsx
<FloatingLabelInput 
  label="Beschreibung"
  placeholder="Beschreiben Sie sich..."
  maxLength={100}
  showCharCount={true}
/>
```

### Mit Icons

```jsx
import { Mail, Lock } from 'lucide-react';

<FloatingLabelInput 
  label="E-Mail"
  icon={<Mail size={20} />}
/>

<FloatingLabelInput 
  label="Passwort"
  type="password"
  iconRight={<Lock size={20} />}
/>
```

### Mit Passwort-Toggle

```jsx
const [showPassword, setShowPassword] = useState(false);

<FloatingLabelInput 
  label="Passwort"
  type={showPassword ? 'text' : 'password'}
  iconRight={
    <button
      onClick={() => setShowPassword(!showPassword)}
      type="button"
    >
      {showPassword ? '👁️' : '👁️‍🗨️'}
    </button>
  }
/>
```

### Größen

```jsx
// Small
<FloatingLabelInput size="sm" label="Klein" />

// Medium (default)
<FloatingLabelInput size="md" label="Mittel" />

// Large
<FloatingLabelInput size="lg" label="Groß" />
```

## 📋 Props Reference

| Prop | Type | Default | Beschreibung |
|------|------|---------|-------------|
| `label` | string | '' | Label-Text |
| `type` | string | 'text' | Input-Typ (text, email, password, number, etc.) |
| `placeholder` | string | '' | Platzhalter-Text |
| `value` | string | '' | Input-Wert |
| `error` | string | '' | Error-Nachricht |
| `hint` | string | '' | Hilfe-Text unter Input |
| `required` | boolean | false | Required-Indikator (*) |
| `disabled` | boolean | false | Deaktiviert |
| `size` | 'sm' \| 'md' \| 'lg' | 'md' | Input-Größe |
| `icon` | React.ReactNode | null | Icon links |
| `iconRight` | React.ReactNode | null | Icon rechts |
| `showCharCount` | boolean | false | Charakter-Counter anzeigen |
| `maxLength` | number | null | Max Zeichen |
| `className` | string | '' | Custom CSS-Klasse |
| `onChange` | Function | null | Change-Handler |
| `onFocus` | Function | null | Focus-Handler |
| `onBlur` | Function | null | Blur-Handler |

## 🎬 Animation Details

### Label Animation
- **Y-Position**: 0 (normal) → -24px (floating)
- **Scale**: 1 (normal) → 0.85 (floating)
- **Timing**: Spring animation (stiffness: 120, damping: 12)
- **Duration**: ~300ms

### Focus Indicator
- Animierter Bottom-Border
- Farbe: `var(--primary)`
- Animation: ScaleX 0 → 1

### Icons Animation
- Color Change bei Focus
- Scale 1 → 1.1
- Smooth Transition

## 🎨 Styling & Customization

### CSS Custom Properties (in Komponente)

```scss
// Sizes
--input-height: 40px
--label-font-size: 0.875rem
--input-font-size: 1rem
--padding: 0.75rem 1rem
```

### Theme Integration

Das Component nutzt automatisch Theme-Variablen:

```scss
--primary      // Focus-Farbe
--error        // Error-Farbe
--warning      // Warning-Farbe
--tx           // Text-Farbe
--tx-muted     // Muted Text-Farbe
--surface-2    // Background
--surface-3    // Hovered Background
--border       // Border-Farbe
--radius-md    // Border-Radius
```

## ♿ Accessibility

Das Component folgt WCAG 2.1 Standards:

```jsx
// Automatisch gesetzt:
- aria-invalid={hasError}
- aria-describedby={error ? 'id-error' : hint ? 'id-hint' : undefined}
- role="status" für Error-Messages
- aria-label für Icons und Buttons
- Keyboard-Navigation vollständig unterstützt
- Screen Reader freundlich
```

## 🔌 Integration mit Forms

### Controlled Component Pattern

```jsx
const [formData, setFormData] = useState({
  email: '',
  password: ''
});

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

<FloatingLabelInput 
  id="email"
  label="E-Mail"
  value={formData.email}
  onChange={handleChange}
/>
```

### Mit React Hook Form

```jsx
import { useForm, Controller } from 'react-hook-form';

export function LoginForm() {
  const { control, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="email"
        control={control}
        rules={{ required: 'E-Mail erforderlich' }}
        render={({ field, fieldState: { error } }) => (
          <FloatingLabelInput 
            {...field}
            label="E-Mail"
            type="email"
            error={error?.message}
          />
        )}
      />
    </form>
  );
}
```

## 🌙 Dark Mode Support

Das Component unterstützt automatisch Dark Mode durch Theme-Variablen:

```scss
// Light Mode
--tx: #1f2937
--surface-2: #f3f4f6

// Dark Mode
--tx: #f3f4f6
--surface-2: #1f2937
```

## 📱 Responsive Behavior

```scss
// Default (größer)
--input-height: 40px
--input-font-size: 1rem

// Mobile (< 640px)
--input-height: 40px (angepasst von lg)
--input-font-size: 1rem (angepasst)
```

## 🚀 Performance

- Einsatz von `forwardRef` für Direktzugriff
- `useCallback` für optimierte Event-Handler
- Framer Motion für GPU-beschleunigte Animationen
- Kein unnötiges Re-Rendering

## 🧪 Testing

```jsx
import { render, screen, userEvent } from '@testing-library/react';
import { FloatingLabelInput } from '@/components/common';

describe('FloatingLabelInput', () => {
  it('should float label on focus', async () => {
    render(<FloatingLabelInput label="Test" />);
    const input = screen.getByRole('textbox');
    
    await userEvent.click(input);
    // Label sollte nach oben animiert sein
  });

  it('should show error message', () => {
    render(
      <FloatingLabelInput 
        label="Email" 
        error="Invalid email" 
      />
    );
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('should count characters', () => {
    render(
      <FloatingLabelInput 
        label="Bio"
        maxLength={100}
        showCharCount
      />
    );
    // Character counter sollte sichtbar sein
  });
});
```

## 🎯 Best Practices

1. **Immer ein Label setzen** für bessere UX
   ```jsx
   <FloatingLabelInput label="E-Mail" /> ✅
   <FloatingLabelInput /> ❌
   ```

2. **Error in Real-Time validieren**
   ```jsx
   {errors.email && <FloatingLabelInput error={errors.email} />}
   ```

3. **Hint für komplexe Anforderungen**
   ```jsx
   <FloatingLabelInput 
     hint="Min. 8 Zeichen, Zahlen und Sonderzeichen"
   />
   ```

4. **Icons für bessere UX**
   ```jsx
   <FloatingLabelInput icon={<Mail />} />
   ```

5. **Disabled State bei Loading**
   ```jsx
   <FloatingLabelInput disabled={isLoading} />
   ```

## 📚 Related Components

- `Input` - Basis-Input ohne Floating Label
- `Textarea` - Mehrzeiliger Text Input
- `FloatingLabelTextarea` - Textarea mit Floating Label
- `Select` - Dropdown-Select
- `Checkbox` - Checkbox-Input

## 🔗 Links

- [Source Code](../src/components/common/FloatingLabelInput/)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [WCAG 2.1 Accessibility](https://www.w3.org/WAI/WCAG21/quickref/)
