# usePasswordChange Hook - Documentation

## Overview

Custom React Hook für die Passwort-Änderungsfunktionalität mit vollständiger Validierung, Passwort-Stärke-Berechnung und Fehlerbehandlung.

## Features

- ✅ **Real-time Password Strength** - Berechnet Passwort-Stärke während des Tippens
- ✅ **Requirement Checker** - Prüft alle 5 Anforderungen (Länge, Groß-, Kleinbuchstaben, Ziffern, Sonderzeichen)
- ✅ **Password Visibility Toggle** - Zeige/Verberge Passwörter mit Button
- ✅ **Match Validation** - Validiere dass neue und confirm Passwort übereinstimmen
- ✅ **Error Handling** - Detaillierte Fehlermeldungen für Validierung und API
- ✅ **API Integration** - Ruft `POST /api/users/change-password` auf
- ✅ **Loading State** - Zeigt Loading während API-Call
- ✅ **Success Notifications** - Toast-Benachrichtigungen
- ✅ **Auto-Reset** - Formular wird nach Erfolg automatisch geleert
- ✅ **Accessibility** - ARIA-Labels, Keyboard-Navigation

## Installation

Das Hook wird bereits importiert in `SettingsPage.jsx`. Um es in anderen Komponenten zu nutzen:

```jsx
import usePasswordChange from '../hooks/usePasswordChange';

const MyComponent = () => {
  const {
    form,
    loading,
    error,
    success,
    passwordStrength,
    handlePasswordChange,
    handleChangePassword,
    // ... weitere Returns
  } = usePasswordChange();

  return (
    // Komponente
  );
};
```

## API

### State Properties

```javascript
{
  // Form Data
  form: {
    currentPassword: '',    // Aktuelles Passwort
    newPassword: '',        // Neues Passwort
    confirmPassword: '',    // Passwort-Bestätigung
  },

  // UI State
  loading: false,           // Loading während API-Call
  error: null,             // Error-Message oder null
  success: false,          // Success-Flag
  passwordStrength: 'weak', // 'weak' | 'medium' | 'strong'
  
  // Sichtbarkeit
  showPassword: {
    current: false,
    new: false,
    confirm: false,
  },

  // Validierung
  requirements: {
    length: false,     // >= 8 Zeichen
    uppercase: false,  // Min. 1 Großbuchstabe
    lowercase: false,  // Min. 1 Kleinbuchstabe
    number: false,     // Min. 1 Ziffer
    special: false,    // Min. 1 Sonderzeichen
  },
  failedRequirements: ['Mindestens 8 Zeichen', ...], // Array fehlender Anforderungen
}
```

### Handler Functions

#### `handlePasswordChange(event)`
Wird auf Input-Fields aufgerufen. Aktualisiert Form-State und berechnet Passwort-Stärke.

```jsx
<input
  type="password"
  name="newPassword"
  value={form.newPassword}
  onChange={handlePasswordChange}
/>
```

#### `handleChangePassword(event)`
Form-Submission Handler. Validiert alles und sendet API-Call.

```jsx
<form onSubmit={handleChangePassword}>
  {/* Form Fields */}
</form>
```

#### `togglePasswordVisibility(field)`
Toggle Passwort-Sichtbarkeit.

```jsx
<button onClick={() => togglePasswordVisibility('new')}>
  {showPassword.new ? '👁️' : '👁️‍🗨️'}
</button>
```

#### `resetForm()`
Setzt Form auf initialen State zurück.

```jsx
resetForm();
```

#### `clearError()`
Löscht Error-Message.

```jsx
clearError();
```

### Validation Functions

#### `validateCurrentPassword(password)`
```javascript
// Returns: boolean
const isValid = validateCurrentPassword('MyPassword123');
```

#### `validateNewPassword(password)`
```javascript
// Returns: { isValid: boolean, requirements: {...}, failedRequirements: string[] }
const validation = validateNewPassword('NewPassword123!');
// {
//   isValid: true,
//   requirements: { length: true, uppercase: true, ... },
//   failedRequirements: []
// }
```

#### `validatePasswordMatch(newPassword, confirmPassword)`
```javascript
// Returns: boolean
const match = validatePasswordMatch('NewPass123', 'NewPass123');
```

#### `calculatePasswordStrength(password)`
```javascript
// Returns: 'weak' | 'medium' | 'strong'
const strength = calculatePasswordStrength('WeakPass123');
// 'weak'
```

## Password Requirements

Alle 5 Anforderungen müssen erfüllt sein:

1. **Länge**: Mindestens 8 Zeichen
2. **Großbuchstaben**: Min. 1 (A-Z)
3. **Kleinbuchstaben**: Min. 1 (a-z)
4. **Ziffern**: Min. 1 (0-9)
5. **Sonderzeichen**: Min. 1 (!@#$%^&*...)

### Beispiele

✅ `MyNewPassword123!` - Erfüllt alle Anforderungen (STRONG)
⚠️ `MyNewPassword123` - Keine Sonderzeichen (MEDIUM)
❌ `short` - Zu kurz, keine Anforderungen (WEAK)

## Passwort-Stärke-Levels

- **WEAK** (🔴): 0-2 Anforderungen erfüllt
- **MEDIUM** (🟡): 3 Anforderungen erfüllt
- **STRONG** (🟢): 4-5 Anforderungen erfüllt

## Error Handling

Hook behandelt folgende Fehler automatisch:

```javascript
// Validierungsfehler
{
  error: "Neues Passwort erfüllt nicht die Anforderungen: Mindestens 8 Zeichen, Sonderzeichen"
}

// API-Fehler (400)
{
  error: "Aktuelles Passwort ist falsch"
}

// API-Fehler (401)
{
  error: "Authentifizierung erforderlich. Bitte melden Sie sich erneut an."
}

// Server-Fehler (500)
{
  error: "Fehler beim Ändern des Passworts"
}
```

## Integration mit SettingsPage

Die `SettingsPage.jsx` nutzt den Hook in der Security-Tab:

```jsx
const SettingsPage = () => {
  const {
    form: passwordForm,
    loading: passwordLoading,
    error: passwordError,
    success: passwordSuccess,
    passwordStrength,
    showPassword,
    requirements: passwordRequirements,
    failedRequirements,
    handlePasswordChange,
    handleChangePassword,
    togglePasswordVisibility,
  } = usePasswordChange();

  return (
    <div className="settings">
      {/* Security Tab */}
      <section>
        <h2>Passwort ändern</h2>
        
        <form onSubmit={handleChangePassword}>
          {/* Current Password Input */}
          <input
            type={showPassword.current ? 'text' : 'password'}
            name="currentPassword"
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange}
          />

          {/* New Password Input */}
          <input
            type={showPassword.new ? 'text' : 'password'}
            name="newPassword"
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
          />

          {/* Strength Indicator */}
          <div className={`password-strength password-strength--${passwordStrength}`}>
            <div className="password-strength__fill"></div>
            <span className="password-strength__label">
              {passwordStrength === 'weak' && '⚠️ Schwach'}
              {passwordStrength === 'medium' && '⚠️ Mittel'}
              {passwordStrength === 'strong' && '✓ Sicher'}
            </span>
          </div>

          {/* Requirements Checklist */}
          <ul className="password-requirements__list">
            <li className={passwordRequirements.length ? 'met' : ''}>
              {passwordRequirements.length ? '✓' : '○'} Mindestens 8 Zeichen
            </li>
            {/* ... weitere Requirements */}
          </ul>

          {/* Confirm Password Input */}
          <input
            type={showPassword.confirm ? 'text' : 'password'}
            name="confirmPassword"
            value={passwordForm.confirmPassword}
            onChange={handlePasswordChange}
          />

          {/* Error Message */}
          {passwordError && (
            <div className="alert alert--danger">{passwordError}</div>
          )}

          {/* Success Message */}
          {passwordSuccess && (
            <div className="alert alert--success">
              ✓ Passwort erfolgreich geändert!
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={passwordLoading || failedRequirements.length > 0}
          >
            {passwordLoading ? 'Wird geändert...' : 'Passwort ändern'}
          </button>
        </form>
      </section>
    </div>
  );
};
```

## Styling

Alle Styles sind in `src/styles/settings.scss` definiert:

- `.password-input-wrapper` - Password Input mit Toggle Button
- `.password-toggle` - Eye-Icon Toggle Button
- `.password-requirements` - Requirements Checklist
- `.password-strength` - Strength Indicator mit Progress Bar
- `.password-match` - Match Indicator

## Accessibility

Hook ist vollständig accessible:

```jsx
<input
  id="newPassword"
  aria-invalid={!!error}
  aria-describedby="password-requirements password-error"
/>

<div id="password-requirements" className="password-requirements" role="status">
  {/* Anforderungen */}
</div>

<div id="password-error" className="alert" role="alert">
  {error}
</div>
```

Features:
- ✅ ARIA-Labels auf alle Inputs
- ✅ `aria-invalid` für Error-States
- ✅ `aria-describedby` für Hilfe-Text
- ✅ `role="status"` für Live-Updates
- ✅ `role="alert"` für Error-Messages
- ✅ Keyboard-Navigation (Tab, Enter, Space)
- ✅ Focus Management
- ✅ Disabled State Management

## Testing

```javascript
import usePasswordChange from '../hooks/usePasswordChange';

describe('usePasswordChange', () => {
  it('should validate password strength', () => {
    const { result } = renderHook(() => usePasswordChange());
    
    const strength = result.current.calculatePasswordStrength('WeakPass123');
    expect(strength).toBe('weak');

    const strength2 = result.current.calculatePasswordStrength('StrongPass123!');
    expect(strength2).toBe('strong');
  });

  it('should validate password match', () => {
    const { result } = renderHook(() => usePasswordChange());
    
    const isMatch = result.current.validatePasswordMatch('Pass123', 'Pass123');
    expect(isMatch).toBe(true);

    const isNotMatch = result.current.validatePasswordMatch('Pass123', 'Pass124');
    expect(isNotMatch).toBe(false);
  });

  it('should handle password change submission', async () => {
    const { result } = renderHook(() => usePasswordChange());
    
    act(() => {
      result.current.handlePasswordChange({
        target: { name: 'currentPassword', value: 'OldPass123' }
      });
      result.current.handlePasswordChange({
        target: { name: 'newPassword', value: 'NewPass123!' }
      });
      result.current.handlePasswordChange({
        target: { name: 'confirmPassword', value: 'NewPass123!' }
      });
    });

    await act(async () => {
      await result.current.handleChangePassword({ preventDefault: () => {} });
    });

    expect(result.current.success).toBe(true);
  });
});
```

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile Browsers (iOS Safari, Chrome Android)

## Performance

- Keine unnötigen Re-Renders durch `useCallback`
- Optimierte Dependency Arrays
- Efficient State Updates mit Closure

## Future Enhancements

- [ ] Passwort-History (letzte 5 Passwörter nicht erlaubt)
- [ ] Passwort-Verfallsdatum
- [ ] Passwort-Complexity-Meter (unterschiedliche Algorithmen)
- [ ] Passwort-Generator-Integration
- [ ] Two-Factor Authentication nach Passwort-Änderung
