# 🚀 Quick Start - Loading States

## Installation in bestehenden Components

### 1️⃣ Spinner in Buttons

```jsx
import { Spinner } from '@/components/common';

// In JSX:
<button disabled={isLoading}>
  {isLoading ? (
    <>
      <Spinner size="sm" />
      <span>Wird geladen...</span>
    </>
  ) : (
    'Senden'
  )}
</button>
```

---

### 2️⃣ Skeleton in Listen

```jsx
import { LoadingCard } from '@/components/common';

// In Render:
{loading ? (
  <>
    <LoadingCard type="transaction" />
    <LoadingCard type="transaction" />
    <LoadingCard type="transaction" />
  </>
) : (
  items.map(item => <ItemComponent key={item.id} item={item} />)
)}
```

---

### 3️⃣ LoadingOverlay für Page-Übergänge

```jsx
import { LoadingOverlay } from '@/components/common';

// Im Component:
<LoadingOverlay 
  isVisible={isNavigating}
  message="Seite wird geladen..."
/>
```

---

## ✅ Bereits implementiert

- ✅ **LoginForm** - Spinner beim Anmelden
- ✅ **RegisterForm** - Spinner beim Registrieren  
- ✅ **RecentTransactions** - Skeleton Loading
- ✅ **VerifyEmailForm** - Loading States
- ✅ **ResetPasswordForm** - Loading States

---

## 🎯 Zu implementieren

- [ ] Dashboard-Page mit LoadingOverlay
- [ ] IncomeExpenseChart mit Skeleton
- [ ] CategoryBreakdown mit Skeleton
- [ ] TransactionList mit LoadingCards
- [ ] Search mit Spinner
- [ ] Filter mit Spinner

---

## 📝 Checkliste für neue Features

Wenn neue Data-Fetching Features hinzugefügt werden:

- [ ] `const [loading, setLoading] = useState(false);` hinzufügen
- [ ] Loading-State in try/finally setzen
- [ ] Während Loading:
  - [ ] Button: Spinner anzeigen
  - [ ] Liste: LoadingCards anzeigen
  - [ ] Page: LoadingOverlay anzeigen
- [ ] Error-Handling mit Toast
- [ ] Loading-State auch bei Fehler zurücksetzen

---

## 🔗 Links

- [Vollständige Dokumentation](./LOADING_STATES.md)
- [Spinner Component](../src/components/common/Spinner/Spinner.jsx)
- [Skeleton Component](../src/components/common/Skeleton/Skeleton.jsx)
- [LoadingOverlay Component](../src/components/common/LoadingOverlay/LoadingOverlay.jsx)
- [LoadingCard Component](../src/components/common/LoadingCard/LoadingCard.jsx)
