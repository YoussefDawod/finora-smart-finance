# Theme System Setup - v2 (Light/Dark + Glassmorphic Extension)

## Overview
The theme system has been completely redesigned to separate light/dark themes from the glassmorphic effect.

### Architecture
- **Light/Dark Theme**: Primary theme selection via `data-theme="light|dark"` attribute
- **Glassmorphic Effect**: Optional effect layer via `data-glass="true|false"` attribute
- Both attributes are applied simultaneously to the `<html>` element

## Components & Files

### Core Infrastructure

#### 1. **ThemeContext** (`src/context/ThemeContext.jsx`)
- **State**: 
  - `theme`: 'light' | 'dark' (primary theme)
  - `useGlass`: boolean (glass effect enabled/disabled)
  - `systemPreference`: 'light' | 'dark' (OS preference)
  - `isInitialized`: boolean (initialization complete)
  
- **Actions**:
  - `setTheme(newTheme)` - Set light or dark
  - `toggleTheme()` - Toggle between light and dark
  - `setGlassEnabled(enabled)` - Enable/disable glass effect
  - `toggleGlass()` - Toggle glass effect on/off
  - `resetToSystemPreference()` - Reset theme to system preference

- **Features**:
  - System preference auto-detection via `window.matchMedia('(prefers-color-scheme: dark)')`
  - localStorage persistence (keys: `et-theme-preference`, `et-glass-preference`)
  - Cross-tab synchronization via `storage` event listener
  - Proper cleanup of event listeners on unmount

#### 2. **useTheme Hook** (`src/hooks/useTheme.js`)
- Returns full ThemeContext value with all state and actions
- Example usage:
  ```jsx
  const { theme, useGlass, toggleTheme, toggleGlass } = useTheme();
  ```

#### 3. **ThemeSelector Component** (`src/components/common/ThemeSelector/ThemeSelector.jsx`)
Professional dropdown menu for theme management:
- **Trigger Button**: Shows current theme icon (☀️/🌙) + label + chevron
- **Design Section**: 
  - Light button
  - Dark button  
  - System preference button with hint
- **Effects Section**:
  - Glassmorphic toggle switch (custom component)
- **Features**:
  - Click-outside to close
  - Accessibility attributes (role, aria-*)
  - Responsive design (fixed position on mobile)
  - Proper initialization check (waits for ThemeContext)

#### 4. **ThemeSelector Styling** (`src/components/common/ThemeSelector/ThemeSelector.module.scss`)
- Professional dropdown styling with:
  - Smooth animations (slideDown)
  - Hover/active states with color-mix
  - Custom toggle switch styling
  - Responsive mobile positioning
  - Reduced motion support

### CSS Variables & Themes

#### Light Theme (`src/styles/themes/light.scss`)
- Defines CSS variables for light mode
- Applied via `:root` selector and `[data-theme="light"]`

#### Dark Theme (`src/styles/themes/dark.scss`)
- Defines CSS variables for dark mode
- Applied via `[data-theme="dark"]` selector
- Uses `@media (prefers-color-scheme: dark)` for fallback

#### Glassmorphic Extension (`src/styles/themes/glassmorphic.scss`)
- **Now uses**: `[data-glass="true"]` selector (not a separate theme!)
- Overrides surface, border, and shadow variables
- Works with BOTH light and dark themes:
  - `[data-glass="true"]` - Generic glass properties
  - `[data-theme="dark"][data-glass="true"]` - Dark glass
  - `[data-theme="light"][data-glass="true"]` - Light glass
- Features:
  - `--glass-blur: 16px` for backdrop-filter
  - Transparent surfaces: `rgba(255, 255, 255, 0.1)` etc.
  - Animated gradient background on body
  - Automatic blur effect on headers, sidebars, footers

### HTML & Layout

#### Initial Attributes (`index.html`)
```html
<html lang="de" data-theme="light" data-glass="false">
```
- Prevents flash of wrong theme on page load
- ThemeContext updates these during initialization

#### Sidebar Integration (`src/components/layout/Sidebar/Sidebar.jsx`)
- Imports ThemeSelector from common components
- Displays in footer section (both desktop & mobile)
- Removed old inline theme buttons

## Initialization Flow

1. **Page Load**:
   - `index.html` loads with default `data-theme="light"` `data-glass="false"`
   - Browser renders with light theme CSS variables
   - No flash of unstyled content (FOUC)

2. **ThemeProvider Mount**:
   - Loads preferences from localStorage (if available)
   - Detects system preference via `matchMedia`
   - Priority: localStorage → system preference → light
   - Applies both `data-theme` and `data-glass` to `<html>`
   - Sets `isInitialized = true`

3. **Component Rendering**:
   - ThemeSelector waits for `isInitialized`
   - Shows current theme and glass toggle
   - All components use CSS variables from current theme

4. **User Interaction**:
   - User clicks theme button in ThemeSelector
   - Context updates state and DOM attributes
   - CSS cascade automatically applies new variables
   - Preferences saved to localStorage
   - Cross-tab sync notifies other browser tabs

## CSS Variable Cascade

```
<html data-theme="dark" data-glass="true">
  ↓
[data-theme="dark"] { /* CSS variables */ }
↓
[data-glass="true"] { /* Override some variables */ }
↓
[data-theme="dark"][data-glass="true"] { /* Dark + Glass specific */ }
↓
All descendant elements inherit and use these variables
```

## Testing Checklist

- [ ] Light theme applies correctly
- [ ] Dark theme applies correctly
- [ ] Glass effect works on light theme
- [ ] Glass effect works on dark theme
- [ ] System preference auto-detection works
- [ ] Theme persists on page reload
- [ ] Cross-tab sync works (open 2 tabs, change theme in one)
- [ ] ThemeSelector dropdown opens/closes
- [ ] Toggle switch animates smoothly
- [ ] Mobile responsive layout works
- [ ] No console errors
- [ ] Smooth transitions between themes
- [ ] Glass blur effect visible in supported browsers

## localStorage Structure

```json
{
  "et-theme-preference": "light",    // or "dark"
  "et-glass-preference": "true"      // or "false"
}
```

## Event Flow

```
User clicks theme button
  ↓
ThemeSelector calls setTheme('dark') or toggleGlass()
  ↓
ThemeContext updates state & applies DOM attributes
  ↓
CSS cascade applies new variables
  ↓
Components re-render with new colors
  ↓
localStorage saved
  ↓
storage event fires in other tabs
  ↓
Other tabs update and sync theme
```

## Browser Support

- **System Preference Detection**: All modern browsers (Chrome 76+, Firefox 67+, Safari 12.1+)
- **CSS Variables**: All modern browsers
- **Glassmorphic (backdrop-filter)**: Chrome 76+, Firefox 103+, Safari 9+
- **Fallback**: Without backdrop-filter, glass mode still applies transparent colors

## Notes

- The old THEMES.GLASS constant has been removed (now useGlass: boolean)
- The old `setTheme('glass')` API no longer exists
- New API: `setGlassEnabled(true)` or `toggleGlass()`
- All SCSS files refactored to use theme variables instead of hardcoded colors
- No hardcoded hex colors (#fff, #6366f1, etc.) remain - all use CSS variables
