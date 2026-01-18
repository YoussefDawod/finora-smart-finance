/**
 * @fileoverview Filter - Filterkomponente für Header
 * @description Dropdown-Filter mit verschiedenen Filteroptionen
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiChevronDown } from 'react-icons/fi';
import styles from './Filter.module.scss';

const getPeriodRange = (period) => {
  const today = new Date();
  const end = new Date(today);
  let start = new Date(today);

  switch (period) {
    case 'today': {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'week': {
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'month': {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'year': {
      start = new Date(today.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    default:
      return { startDate: null, endDate: null };
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

export default function Filter({
  value,
  onChange,
  onClear,
  categories = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState(null);

  const activeType = value?.type || null;
  const activeCategory = value?.category || '';
  const startDate = value?.startDate || '';
  const endDate = value?.endDate || '';
  const hasActiveFilters = Boolean(activeType || activeCategory || startDate || endDate);

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({ label: category, value: category }));
  }, [categories]);

  const handleTypeChange = (nextType) => {
    onChange?.({
      type: activeType === nextType ? null : nextType,
    });
  };

  const handlePeriodChange = (period) => {
    const next = period === activePeriod ? null : period;
    setActivePeriod(next);
    if (!next) {
      onChange?.({ startDate: null, endDate: null });
      return;
    }
    const { startDate: start, endDate: end } = getPeriodRange(next);
    onChange?.({ startDate: start, endDate: end });
  };

  const handleDateChange = (field, nextValue) => {
    setActivePeriod(null);
    onChange?.({ [field]: nextValue || null });
  };

  const filterOptions = {
    period: [
      { label: 'Heute', value: 'today' },
      { label: 'Diese Woche', value: 'week' },
      { label: 'Dieser Monat', value: 'month' },
      { label: 'Dieses Jahr', value: 'year' },
    ],
    type: [
      { label: 'Einnahmen', value: 'income' },
      { label: 'Ausgaben', value: 'expense' },
    ],
  };

  return (
    <div className={styles.filterWrapper}>
      <button
        className={`${styles.filterBtn} ${isOpen || hasActiveFilters ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Filter öffnen"
      >
        <FiFilter size={18} />
        <span>Filter</span>
        <FiChevronDown size={16} className={styles.chevron} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.filterDropdown}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {/* Zeitraum */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterTitle}>Zeitraum</h4>
              <div className={styles.filterOptions}>
                {filterOptions.period.map((option) => (
                  <button
                    key={option.value}
                    className={`${styles.filterOption} ${
                      activePeriod === option.value ? styles.selected : ''
                    }`}
                    onClick={() => handlePeriodChange(option.value)}
                  >
                    <span className={styles.checkbox} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterDivider} />

            {/* Typ */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterTitle}>Typ</h4>
              <div className={styles.filterOptions}>
                {filterOptions.type.map((option) => (
                  <button
                    key={option.value}
                    className={`${styles.filterOption} ${
                      activeType === option.value ? styles.selected : ''
                    }`}
                    onClick={() => handleTypeChange(option.value)}
                  >
                    <span className={styles.checkbox} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterDivider} />

            {/* Kategorie */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterTitle}>Kategorie</h4>
              <select
                className={styles.filterSelect}
                value={activeCategory}
                onChange={(e) => onChange?.({ category: e.target.value || null })}
              >
                <option value="">Alle Kategorien</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterDivider} />

            {/* Datum */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterTitle}>Datum</h4>
              <div className={styles.dateRow}>
                <label className={styles.dateLabel}>
                  Von
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className={styles.dateInput}
                  />
                </label>
                <label className={styles.dateLabel}>
                  Bis
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className={styles.dateInput}
                  />
                </label>
              </div>
            </div>

            <div className={styles.filterFooter}>
              <button
                className={styles.clearButton}
                type="button"
                onClick={() => {
                  setActivePeriod(null);
                  onClear?.();
                }}
              >
                Filter zurücksetzen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
