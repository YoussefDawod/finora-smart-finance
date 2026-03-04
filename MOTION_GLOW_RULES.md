# 🎬 Motion & Glow Usage Rules – Finora Smart-Finance

> **Version:** 1.1  
> **Status:** ✅ Implementiert  
> **Ziel:** Ruhig, vertrauenswürdig, finanz-fokussiert, performant  
> **Siehe auch:** [COLOR_USAGE_RULES.md](./COLOR_USAGE_RULES.md) für Farben & Tokens

---

## 1️⃣ System-Prinzipien

### Motion ist funktional – nicht dekorativ

**✅ Erlaubt:**
- Orientierung (Page Transitions)
- Feedback (Button Press, Form Validation)
- Statuswechsel (Loading → Loaded)
- Kontextwechsel (Modal Open/Close)

**❌ Nicht erlaubt:**
- Deko-Animation auf Finanzdaten
- Aufmerksamkeitseffekte auf Beträgen
- „Showcase"-Animationen im Kern-Flow

### Glow ist Branding – kein Informationsträger

- Glow darf **niemals Bedeutung tragen**
- `prefers-reduced-motion` ist **immer bindend**

### Accessibility ist Pflicht

Alle Motion-Komponenten müssen:
```jsx
const { shouldAnimate } = useMotion();

<motion.div
  initial={shouldAnimate ? 'hidden' : false}
  animate={shouldAnimate ? 'visible' : false}
/>
```

---

## 2️⃣ Token-Set

### Glow Tokens (`variables.scss`)

```scss
// Blur Sizes
--glow-blur-sm: 6px;
--glow-blur-md: 12px;
--glow-blur-lg: 20px;

// Spread Sizes
--glow-spread-sm: 0;
--glow-spread-md: 0;
--glow-spread-lg: 2px;

// Glow Colors (70% opacity)
--glow-primary: color-mix(in srgb, var(--primary) 70%, transparent);
--glow-accent: color-mix(in srgb, var(--accent) 70%, transparent);
--glow-success: color-mix(in srgb, var(--success) 70%, transparent);

// Presets
--glow-sm: 0 0 var(--glow-blur-sm) var(--glow-spread-sm) var(--glow-primary);
--glow-md: 0 0 var(--glow-blur-md) var(--glow-spread-md) var(--glow-primary);
--glow-lg: 0 0 var(--glow-blur-lg) var(--glow-spread-lg) var(--glow-primary);
```

### Motion Tokens (`variables.scss`)

```scss
// Durations
--motion-entrance-duration: var(--duration-normal);  // 250ms
--motion-exit-duration: var(--duration-fast);        // 150ms

// Easing
--motion-entrance-ease: var(--ease-decelerate);
--motion-exit-ease: var(--ease-accelerate);

// Stagger (nur für Listen OHNE Geldbeträge)
--motion-stagger-delay: 0.04s;

// Spring Config (Sidebar, Drawer, CategoryPicker, Menu)
--motion-spring-stiffness: 420;
--motion-spring-damping: 34;

// Scale Limits (Micro-Feedback only)
--motion-scale-hover: 1.02;
--motion-scale-active: 0.98;

// Y-Offset Limits
--motion-entrance-y: 12px;
--motion-exit-y: 8px;
```

---

## 3️⃣ Globale Motion-Regeln

| Animation | Eigenschaft | Limit |
|-----------|-------------|-------|
| **Entrance** | opacity + y | max ±12px |
| **Exit** | opacity + y | max ±8px |
| **Scale** | Micro-Feedback | 0.98 – 1.02 |
| **Spring** | Sidebar/Drawer/Menu | stiffness: 420, damping: 34 |

---

## 4️⃣ Component-Spezifische Regeln

### 🔘 Button

| Aspekt | Regel |
|--------|-------|
| Motion | Hover: scale 1.02, Active: scale 0.98 |
| Glow | ✅ nur Primary, nur Hover, nur Desktop |
| Datei | `Button.module.scss`, `Button.jsx` |

> 🎨 **Farben:** Siehe [COLOR_USAGE_RULES.md](./COLOR_USAGE_RULES.md#-button) für Button-Varianten

### 🧾 Input / Select / Textarea

| Aspekt | Regel |
|--------|-------|
| Motion | nur Border/Shadow Transition |
| Glow | ❌ verboten |

### 🪟 Modal / Dialog

| Aspekt | Regel |
|--------|-------|
| Motion | fade + y, backdropFadeIn |
| Glow | ❌ verboten |
| Datei | `Modal.jsx` (nutzt `modalVariants`) |

### 🃏 Card

| Aspekt | Regel |
|--------|-------|
| Motion | Hover-Lift: y: -2px |
| Glow | ⚠️ nur Container-Outline, kein innerer Glow |
| Klasse | `.card-interactive-glow` |

> 🎨 **Farben:** Siehe [COLOR_USAGE_RULES.md](./COLOR_USAGE_RULES.md#-card-summarycard-statcard) für Border-Farben

### 🔔 Toast

| Aspekt | Regel |
|--------|-------|
| Motion | slide + fade |
| Glow | ⚠️ **nur Icon-Wrapper** für `success` |
| Datei | `Toast.module.scss` |

> 🎨 **Farben:** Kein `--accent` in Toasts! Siehe [COLOR_USAGE_RULES.md](./COLOR_USAGE_RULES.md#-toast)

### 🦴 Skeleton

| Aspekt | Regel |
|--------|-------|
| Motion | nur shimmer |
| Glow | ❌ verboten |

### 📂 Sidebar / Menus

| Aspekt | Regel |
|--------|-------|
| Motion | slide + **spring erlaubt** |
| Glow | ❌ verboten |
| Datei | `Sidebar.jsx` (nutzt `MOTION_EASING.spring`) |

### 📊 Charts

| Aspekt | Regel |
|--------|-------|
| Motion | nur interne recharts Animation |
| Glow | ⚠️ nur Chart-Container-Outline |

---

## 5️⃣ Finanz-kritische Komponenten (GESPERRT)

Diese Komponenten sind **hart gesperrt**:

| Komponente | Glow | Attention Motion | Scale/Bounce/Pulse |
|------------|------|------------------|-------------------|
| SummaryCard | ❌ | ❌ | ❌ |
| DashboardCharts | ❌ | ❌ | ❌ |
| BudgetWidget | ❌ | ❌ | ❌ |
| QuotaIndicator | ❌ | ❌ | ❌ |
| TransactionList | ❌ | ❌ | ❌ |
| TransactionForm | ❌ | ❌ | ❌ |
| RecentTransactions | ❌ | ❌ | ❌ |
| AdminStatCard | ❌ | ❌ | ❌ |
| AdminTransactionTable | ❌ | ❌ | ❌ |
| AdminCharts | ❌ | ❌ | ❌ |
| PasswordStrength (Bar) | ⚠️ Gradient erlaubt | ❌ | ❌ |

> ⚠️ Für Farb-Regeln dieser Komponenten siehe [COLOR_USAGE_RULES.md](./COLOR_USAGE_RULES.md#5️⃣-finanz-kritische-komponenten)

---

## 6️⃣ Branding & Hero-Bereiche

### Logo

| Aspekt | Regel |
|--------|-------|
| Glow | ✅ erlaubt (--glow-md) |
| Animation | statisch oder langsamer Pulse (≥6s) |
| Klasse | `.glow-logo`, `.glow-logo-animated` |

### Auth Hero / Landing Hero

| Aspekt | Regel |
|--------|-------|
| Glow | ✅ erlaubt |
| Erlaubt | gradientShift, background glow layers |
| Verboten | Motion auf Formularen im Hero |

---

## 7️⃣ Page-Transitions

```jsx
// AppRoutes.jsx - KORREKT
const PageTransition = ({ children }) => {
  const { shouldAnimate } = useMotion();

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1 }}
      exit={shouldAnimate ? { opacity: 0, y: -8 } : { opacity: 1 }}
      transition={shouldAnimate ? { duration: 0.28 } : { duration: 0 }}
    >
      {children}
    </motion.div>
  );
};
```

**Limits:**
- y maximal 10px
- duration max 0.32s

---

## 8️⃣ Attention-Animationen

**Status:** ⚠️ stark eingeschränkt

| Erlaubt | Verboten |
|---------|----------|
| Formular-Validierung | Dashboard |
| Fehlgeschlagene Aktion | Admin |
| | Transaktionen |
| | Charts |

---

## 9️⃣ Performance-Regeln

Für Listen-Komponenten:

```jsx
// VERBOTEN auf Zeilenebene:
<AnimatePresence mode="popLayout">
  <motion.div layout /> // ❌ Performance-Problem
</AnimatePresence>

// ERLAUBT:
// - Container animation
// - Einzelne Row-Entrance nur beim initialen Mount
```

Betroffene Komponenten:
- TransactionList
- AdminAuditLogTable
- AdminTransactionTable

---

## 🔟 Verbotene Kombinationen

| Kombination | Status |
|-------------|--------|
| Glow + Motion auf demselben Element | ❌ |
| Glow auf Text | ❌ |
| Glow auf Zahlen | ❌ |
| Glow auf Inputs | ❌ |
| Pulse auf Buttons | ❌ |
| Bounce auf Modals | ❌ |
| Wiggle auf Navigation | ❌ |

---

## 📁 Technische Integration

| Zweck | Datei |
|-------|-------|
| Tokens | `src/styles/variables.scss` |
| Glow-Utilities | `src/styles/utilities/_glow.scss` |
| Motion-Presets | `src/utils/motionPresets.js` |
| Mixins | `src/styles/mixins.scss` |

> 📎 Gemeinsam mit [COLOR_USAGE_RULES.md](./COLOR_USAGE_RULES.md) - beide nutzen `variables.scss` und `mixins.scss`

---

## ✅ Checkliste für neue Komponenten

Bei jeder neuen Komponente prüfen:

1. **Zeigt sie Geld?** → Glow verboten, nur `--success`/`--error`/`--info` (siehe [COLOR_RULES](./COLOR_USAGE_RULES.md))
2. **Ist sie strukturell?** → nur Fade/Slide
3. **Ist sie Branding?** → Glow erlaubt
4. **Läuft sie durch `shouldAnimate`?** → Pflicht
5. **Hat sie Focus-States?** → Siehe [COLOR_RULES Focus](./COLOR_USAGE_RULES.md#3️⃣-focus--accessibility)

---

## 📊 Implementierungs-Status

| Bereich | Status |
|---------|--------|
| Token-Set (variables.scss) | ✅ |
| Glow-Utilities (_glow.scss) | ✅ |
| Motion-Presets (motionPresets.js) | ✅ |
| Button Glow + Motion | ✅ |
| Modal shouldAnimate | ✅ |
| Card Hover-Lift + Outline-Glow | ✅ |
| Toast Icon-Glow (success) | ✅ |
| Finanz-Komponenten gesperrt | ✅ |
| Sidebar Spring Motion | ✅ |
| Page-Transitions | ✅ |
| DashboardPage shouldAnimate | ✅ |
| TransactionsPage shouldAnimate | ✅ |
| ProfilePage shouldAnimate | ✅ |
| SettingsPage shouldAnimate | ✅ |
| Footer Social Icons shouldAnimate | ✅ |
| Footer Newsletter shouldAnimate | ✅ |
| BackToTop Scale-Limits (0.98–1.02) | ✅ |
| Datenschutz-Hinweis Spring + shouldAnimate | ✅ |
| Footer/Datenschutz-Hinweis reduced-motion | ✅ |

**Build:** ✅ 70 precache entries  
**Tests:** ✅ 1472 passed (76 Dateien)
