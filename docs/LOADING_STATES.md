# Loading States & Skeleton Loading Dokumentation

## 📋 Übersicht

Die Expense Tracker Application implementiert ein umfassendes Loading-State-System mit:

- **Spinner Components** für API-Calls und Formulare
- **Skeleton Loading** für progressives Content-Laden
- **Loading Overlays** für Page-Übergänge
- **Loading Cards** für Platzhalter-Content

## 🎯 Komponenten

### 1. **Spinner Component**

Animierter Lade-Spinner für async Operationen.

#### Verwendung:

```jsx
import { Spinner } from '@/components/common';

// Standardgröße (md)
<Spinner />

// Benutzerdefinierte Größe
<Spinner size="lg" color="primary" />

// In Formularen
{isLoading ? (
  <>
    <Spinner size="sm" />
    <span>Anmelden...</span>
  </>
) : (
  'Anmelden'
)}
```

#### Größen-Optionen:
- `sm` - 16px (für Buttons)
- `md` - 24px (Standard)
- `lg` - 32px (für Modals)
- `xl` - 48px (für Full-Screen)

#### Farben:
- `primary` (Standard)
- `success`
- `error`
- `warning`
- `info`

---

### 2. **Skeleton Component**

Shimmer-Animation für Progressive Loading.

#### Verwendung:

```jsx
import { Skeleton } from '@/components/common';

// Single line
<Skeleton width="100%" height="20px" />

// Multiple lines
<Skeleton 
  count={3} 
  width="100%" 
  height="60px" 
  gap="12px" 
/>

// Circle (für Avatare)
<Skeleton 
  variant="circle" 
  width="48px" 
  height="48px" 
/>
```

#### Varianten:
- `line` (Standard)
- `circle`
- `rect`

#### Props:
- `width` - CSS width (default: '100%')
- `height` - CSS height (default: '20px')
- `count` - Anzahl der Skeletons (default: 1)
- `variant` - Typ des Skeleton (default: 'line')
- `gap` - Abstand zwischen Elementen (default: '12px')
- `borderRadius` - Border-Radius (default: 'var(--radius-md)')

---

### 3. **LoadingOverlay Component**

Full-Screen Loading-Overlay für Navigation.

#### Verwendung:

```jsx
import { LoadingOverlay } from '@/components/common';

// Simple overlay
<LoadingOverlay isVisible={isLoading} />

// Mit Nachricht
<LoadingOverlay 
  isVisible={isLoading} 
  message="Seite wird geladen..."
  spinnerSize="lg"
/>

// Full-Screen (keine Transparenz)
<LoadingOverlay 
  isVisible={isLoading}
  fullScreen={true}
/>
```

#### Props:
- `isVisible` - Overlay anzeigen (default: false)
- `message` - Optionale Nachricht (default: 'Wird geladen...')
- `spinnerSize` - Spinner-Größe (default: 'lg')
- `fullScreen` - Vollbild-Modus (default: false)

---

### 4. **LoadingCard Component**

Skeleton-Card für verschiedene Content-Typen.

#### Verwendung:

```jsx
import { LoadingCard } from '@/components/common';

// Transaction-Card
<LoadingCard type="transaction" />

// Chart-Card
<LoadingCard type="chart" />

// List-Item
<LoadingCard type="listItem" />

// Stats-Card
<LoadingCard type="stats" />

// Default
<LoadingCard />

// Multiple Loading Cards
{isLoading ? (
  <>
    <LoadingCard type="transaction" />
    <LoadingCard type="transaction" />
    <LoadingCard type="transaction" />
  </>
) : (
  // Actual content
)}
```

#### Card-Typen:
- `transaction` - Für Transaktionslisten
- `chart` - Für Chart-Container
- `listItem` - Für List-Items
- `stats` - Für Statistik-Anzeigen
- `default` - Standard-Card

---

## 🎨 Implementierungsbeispiele

### Beispiel 1: Form mit Loading State

```jsx
import { useState } from 'react';
import { Spinner } from '@/components/common';
import styles from './LoginForm.module.scss';

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // API Call
      await loginUser(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        disabled={isLoading}
        placeholder="E-Mail"
      />
      <button disabled={isLoading} type="submit">
        {isLoading ? (
          <>
            <Spinner size="sm" />
            <span>Anmelden...</span>
          </>
        ) : (
          'Anmelden'
        )}
      </button>
    </form>
  );
}
```

### Beispiel 2: Liste mit Skeleton Loading

```jsx
import { useState, useEffect } from 'react';
import { LoadingCard } from '@/components/common';

export default function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions().then(data => {
      setTransactions(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="list">
      {loading ? (
        <>
          <LoadingCard type="transaction" />
          <LoadingCard type="transaction" />
          <LoadingCard type="transaction" />
        </>
      ) : (
        transactions.map(tx => (
          <TransactionItem key={tx.id} transaction={tx} />
        ))
      )}
    </div>
  );
}
```

### Beispiel 3: Page mit Loading Overlay

```jsx
import { LoadingOverlay } from '@/components/common';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsLoading(false);
  };

  return (
    <>
      <LoadingOverlay 
        isVisible={isLoading}
        message="Dashboard wird aktualisiert..."
      />
      <button onClick={handleRefresh}>Aktualisieren</button>
      {/* Page content */}
    </>
  );
}
```

### Beispiel 4: Dashboard mit verschiedenen Loading-States

```jsx
import { Skeleton, LoadingCard } from '@/components/common';

export default function Dashboard() {
  const { transactions, loading: txLoading } = useTransactions();
  const { stats, loading: statsLoading } = useStats();

  return (
    <div className="dashboard">
      {/* Stats Section */}
      <div className="stats">
        {statsLoading ? (
          <>
            <LoadingCard type="stats" />
            <LoadingCard type="stats" />
            <LoadingCard type="stats" />
          </>
        ) : (
          stats.map(stat => <StatCard key={stat.id} {...stat} />)
        )}
      </div>

      {/* Chart Section */}
      <div className="charts">
        {txLoading ? (
          <LoadingCard type="chart" />
        ) : (
          <Chart data={transactions} />
        )}
      </div>

      {/* Transactions Section */}
      <div className="transactions">
        {txLoading ? (
          <>
            <LoadingCard type="transaction" />
            <LoadingCard type="transaction" />
          </>
        ) : (
          transactions.map(tx => <TransactionRow key={tx.id} {...tx} />)
        )}
      </div>
    </div>
  );
}
```

---

## 🎬 Animation & Styling

### Skeleton Shimmer Animation
```scss
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Spinner Rotation Animation
```scss
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### LoadingOverlay Fade-In
```scss
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## ♿ Accessibility Features

Alle Loading-Komponenten implementieren:

- `role="status"` oder `role="alert"` für Screen Reader
- `aria-busy="true"` für Lade-Zustände
- `aria-label="Inhalt wird geladen"` für Kontext
- `aria-live="polite"` für Spinner-Updates
- Support für `prefers-reduced-motion`

```jsx
<Skeleton 
  role="status"
  aria-busy="true"
  aria-label="Transaktionsdaten werden geladen"
/>
```

---

## 🚀 Best Practices

### 1. **Immer Loading-State beim API-Call verwenden**
```jsx
const [loading, setLoading] = useState(false);

const handleFetch = async () => {
  setLoading(true);
  try {
    await fetchData();
  } finally {
    setLoading(false);
  }
};
```

### 2. **Skeleton für Progressive Loading, Spinner für Buttons**
```jsx
// Für Formulare/Buttons
<button>{isLoading ? <Spinner /> : 'Senden'}</button>

// Für Listen/Content
<div>{isLoading ? <LoadingCard /> : <Content />}</div>
```

### 3. **LoadingOverlay nur für kritische Operations**
```jsx
// Nicht für jeden API-Call
<LoadingOverlay isVisible={isLoading} />

// Nur für Page-Übergänge oder wichtige Aktionen
<LoadingOverlay isVisible={navigating} />
```

### 4. **Immer Fehlerbehandlung implementieren**
```jsx
const handleSubmit = async () => {
  setLoading(true);
  try {
    await api.call();
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 📊 Performance-Tipps

1. **Verwende Skeleton statt Spinner für große Listen**
   - Bessere UX beim Scrollen
   - Weniger CPU-Last

2. **Memoize Loading-States**
   ```jsx
   const isLoading = useMemo(() => loading, [loading]);
   ```

3. **Nutze debounce für häufige Updates**
   ```jsx
   const debouncedLoading = useDebounce(loading, 300);
   ```

---

## 🔗 Integration mit bestehenden Components

### Mit Forms
- LoginForm ✅
- RegisterForm ✅
- ResetPasswordForm ✅
- VerifyEmailForm ✅

### Mit Dashboard
- RecentTransactions ✅
- IncomeExpenseChart (Bereit)
- CategoryBreakdown (Bereit)
- StatisticCard (Bereit)

---

## 🧪 Testing

```jsx
import { render } from '@testing-library/react';
import { Spinner, LoadingCard } from '@/components/common';

describe('Spinner', () => {
  it('should render with different sizes', () => {
    const { container: sm } = render(<Spinner size="sm" />);
    const { container: lg } = render(<Spinner size="lg" />);
    expect(sm).toBeInTheDocument();
    expect(lg).toBeInTheDocument();
  });
});

describe('LoadingCard', () => {
  it('should render transaction variant', () => {
    const { container } = render(<LoadingCard type="transaction" />);
    expect(container).toBeInTheDocument();
  });
});
```

---

## 📝 Changelog

### Version 1.0.0
- ✅ Skeleton Component mit Shimmer-Animation
- ✅ Spinner mit mehreren Größen
- ✅ LoadingOverlay für Full-Screen Loading
- ✅ LoadingCard mit verschiedenen Varianten
- ✅ Accessibility-Support
- ✅ Responsive Design
