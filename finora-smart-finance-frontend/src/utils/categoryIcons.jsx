/**
 * @fileoverview Category Icons - Zentrale Icon-Definitionen für Kategorien
 * @description Ersetzt Emojis durch react-icons für konsistentes, professionelles Design
 */

/* eslint-disable react-refresh/only-export-components */

import {
  FiBriefcase,
  FiGift,
  FiTrendingUp,
  FiShoppingCart,
  FiTruck,
  FiFilm,
  FiShield,
  FiHome,
  FiBook,
  FiHeart,
  FiDollarSign,
  FiMoreHorizontal,
  FiAward,
  FiCpu,
  FiAlertCircle,
  FiInbox,
  FiBarChart2,
  FiShoppingBag,
  FiMap,
  FiMonitor,
  FiCoffee,
  FiActivity,
  FiPackage,
  FiPercent,
  FiUsers,
} from 'react-icons/fi';

// ============================================================================
// CATEGORY ICON COMPONENTS
// ============================================================================

/**
 * Icon-Mapping für Kategorien
 * Jede Kategorie hat ein zugehöriges react-icons Icon
 * Synchronisiert mit: src/config/categoryConstants.js
 */
export const CATEGORY_ICONS = {
  // ══════════════════════════════════════════════════════════════════════
  // EINNAHMEN (Income Categories)
  // ══════════════════════════════════════════════════════════════════════
  Gehalt: FiBriefcase,
  Freelance: FiCpu,
  Investitionen: FiTrendingUp,
  Geschenk: FiGift,
  Bonus: FiAward,
  Nebenjob: FiUsers,
  Cashback: FiPercent,
  Vermietung: FiHome,

  // ══════════════════════════════════════════════════════════════════════
  // AUSGABEN (Expense Categories)
  // ══════════════════════════════════════════════════════════════════════
  Lebensmittel: FiShoppingCart,
  Transport: FiTruck,
  Unterhaltung: FiFilm,
  Miete: FiHome,
  Versicherung: FiShield,
  Gesundheit: FiHeart,
  Bildung: FiBook,
  Kleidung: FiShoppingBag,
  Reisen: FiMap,
  Elektronik: FiMonitor,
  Restaurant: FiCoffee,
  Sport: FiActivity,
  Haushalt: FiPackage,

  // ══════════════════════════════════════════════════════════════════════
  // SONSTIGES (beide Typen)
  // ══════════════════════════════════════════════════════════════════════
  Sonstiges: FiMoreHorizontal,
};

/**
 * Standard-Icon für unbekannte Kategorien
 */
export const DEFAULT_CATEGORY_ICON = FiDollarSign;

/**
 * Utility Icons für States
 */
export const STATE_ICONS = {
  error: FiAlertCircle,
  empty: FiInbox,
  chart: FiBarChart2,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gibt das Icon für eine Kategorie zurück
 * @param {string} category - Name der Kategorie
 * @returns {React.ComponentType} - Icon-Komponente
 */
export const getCategoryIcon = (category) => {
  return CATEGORY_ICONS[category] || DEFAULT_CATEGORY_ICON;
};

/**
 * Rendert ein Kategorie-Icon mit optionalen Props
 * @param {string} category - Name der Kategorie
 * @param {object} props - Zusätzliche Props für das Icon
 * @returns {JSX.Element} - Gerendertes Icon
 */
export const CategoryIcon = ({ category, ...props }) => {
  const IconComponent = getCategoryIcon(category);
  return <IconComponent {...props} />;
};

export default CATEGORY_ICONS;
