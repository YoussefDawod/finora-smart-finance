/**
 * @fileoverview Filter - Filterkomponente für Header
 * @description Dropdown-Filter mit verschiedenen Filteroptionen
 * Features: Typ-abhängige Kategoriefilterung
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiChevronDown } from 'react-icons/fi';
import { getCategoriesForType } from '@/config/categoryConstants';
import { translateCategory } from '@/utils/categoryTranslations';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  const activeType = value?.type || null;
  const activeCategory = value?.category || '';
  const startDate = value?.startDate || '';
  const endDate = value?.endDate || '';
  const hasActiveFilters = Boolean(activeType || activeCategory || startDate || endDate);

  // Kategorien basierend auf gewähltem Typ filtern
  const categoryOptions = useMemo(() => {
    // Wenn ein Typ gewählt ist, nur die entsprechenden Kategorien zeigen
    const relevantCategories = activeType 
      ? getCategoriesForType(activeType)
      : categories;
    
    return relevantCategories.map((category) => ({
      label: translateCategory(category, t),
      value: category,
    }));
  }, [categories, activeType, t]);

  const handleTypeChange = (nextType) => {
    const newType = activeType === nextType ? null : nextType;
    
    // Wenn der Typ geändert wird, prüfe ob die aktuelle Kategorie noch gültig ist
    if (newType && activeCategory) {
      const validCategories = getCategoriesForType(newType);
      const isCategoryValid = validCategories.includes(activeCategory);
      
      // Wenn die Kategorie nicht zum neuen Typ passt, lösche sie
      if (!isCategoryValid) {
        onChange?.({ 
          type: newType,
          category: null 
        });
        return;
      }
    }
    
    onChange?.({ type: newType });
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
      { label: t('filters.today'), value: 'today' },
      { label: t('filters.thisWeek'), value: 'week' },
      { label: t('filters.thisMonth'), value: 'month' },
      { label: t('filters.thisYear'), value: 'year' },
    ],
    type: [
      { label: t('transactions.income'), value: 'income' },
      { label: t('transactions.expense'), value: 'expense' },
    ],
  };

  return (
    <div className={styles.filterWrapper}>
      <button
        className={`${styles.filterBtn} ${isOpen || hasActiveFilters ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={t('filters.open')}
      >
        <FiFilter size={18} />
        <span>{t('filters.title')}</span>
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
              <h4 className={styles.filterTitle}>{t('filters.period')}</h4>
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
              <h4 className={styles.filterTitle}>{t('filters.type')}</h4>
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
              <h4 className={styles.filterTitle}>{t('filters.category')}</h4>
              <select
                className={styles.filterSelect}
                value={activeCategory}
                onChange={(e) => onChange?.({ category: e.target.value || null })}
              >
                <option value="">{t('filters.allCategories')}</option>
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
              <h4 className={styles.filterTitle}>{t('filters.date')}</h4>
              <div className={styles.dateRow}>
                <label className={styles.dateLabel}>
                  {t('filters.from')}
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className={styles.dateInput}
                  />
                </label>
                <label className={styles.dateLabel}>
                  {t('filters.to')}
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
                {t('filters.reset')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
