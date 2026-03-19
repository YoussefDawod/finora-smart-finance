/**
 * @fileoverview Filter - Filterkomponente für Header
 * @description Dropdown-Filter mit verschiedenen Filteroptionen
 * Features: Typ-abhängige Kategoriefilterung
 */

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiChevronDown, FiX } from 'react-icons/fi';
import { getCategoriesForType } from '@/config/categoryConstants';
import { translateCategory } from '@/utils/categoryTranslations';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/hooks/useMotion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA_QUERIES } from '@/constants';
import DateInput from '@/components/common/DateInput/DateInput';
import styles from './Filter.module.scss';

const getPeriodRange = period => {
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

export default function Filter({ value, onChange, onClear, categories = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState(null);
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();
  const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
  const filterRef = useRef(null);

  // ── Click-Outside + Escape Handler ──────────
  // Auf Mobile übernimmt der Backdrop das Schließen → kein Click-Outside nötig
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const handleClickOutside = e => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isMobile]);

  const activeType = value?.type || null;
  const activeCategory = value?.category || '';
  const startDate = value?.startDate || '';
  const endDate = value?.endDate || '';
  const hasActiveFilters = Boolean(activeType || activeCategory || startDate || endDate);

  // Kategorien basierend auf gewähltem Typ filtern
  const categoryOptions = useMemo(() => {
    // Wenn ein Typ gewählt ist, nur die entsprechenden Kategorien zeigen
    const relevantCategories = activeType ? getCategoriesForType(activeType) : categories;

    return relevantCategories.map(category => ({
      label: translateCategory(category, t),
      value: category,
    }));
  }, [categories, activeType, t]);

  const handleTypeChange = nextType => {
    const newType = activeType === nextType ? null : nextType;

    // Wenn der Typ geändert wird, prüfe ob die aktuelle Kategorie noch gültig ist
    if (newType && activeCategory) {
      const validCategories = getCategoriesForType(newType);
      const isCategoryValid = validCategories.includes(activeCategory);

      // Wenn die Kategorie nicht zum neuen Typ passt, lösche sie
      if (!isCategoryValid) {
        onChange?.({
          type: newType,
          category: null,
        });
        return;
      }
    }

    onChange?.({ type: newType });
  };

  const handlePeriodChange = period => {
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

  // ── Shared filter content (desktop + mobile) ──
  const filterContent = (
    <>
      {/* Zeitraum */}
      <div className={styles.filterSection}>
        <h4 className={styles.filterTitle}>{t('filters.period')}</h4>
        <div className={styles.filterOptions}>
          {filterOptions.period.map(option => (
            <button
              key={option.value}
              className={`${styles.filterOption} ${
                activePeriod === option.value ? styles.selected : ''
              }`}
              onClick={() => handlePeriodChange(option.value)}
              role="checkbox"
              aria-checked={activePeriod === option.value}
            >
              <span className={styles.checkbox} aria-hidden="true" />
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
          {filterOptions.type.map(option => (
            <button
              key={option.value}
              className={`${styles.filterOption} ${
                activeType === option.value ? styles.selected : ''
              }`}
              onClick={() => handleTypeChange(option.value)}
              role="checkbox"
              aria-checked={activeType === option.value}
            >
              <span className={styles.checkbox} aria-hidden="true" />
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
          onChange={e => onChange?.({ category: e.target.value || null })}
        >
          <option value="">{t('filters.allCategories')}</option>
          {categoryOptions.map(option => (
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
          <DateInput
            label={t('filters.from')}
            value={startDate}
            onChange={val => handleDateChange('startDate', val)}
            ariaLabel={t('filters.from')}
          />
          <DateInput
            label={t('filters.to')}
            value={endDate}
            onChange={val => handleDateChange('endDate', val)}
            ariaLabel={t('filters.to')}
          />
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
    </>
  );

  return (
    <div className={styles.filterWrapper} ref={filterRef}>
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

      {/* Desktop – positioniertes Dropdown */}
      {!isMobile && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className={styles.filterDropdown}
              initial={shouldAnimate ? { opacity: 0, y: -8 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              exit={shouldAnimate ? { opacity: 0, y: -8 } : undefined}
              transition={{ duration: 0.15 }}
              role="dialog"
              aria-label={t('filters.title')}
            >
              {filterContent}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Mobile – Bottom Sheet via Portal */}
      {isMobile &&
        isOpen &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  className={styles.sheetBackdrop}
                  initial={shouldAnimate ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsOpen(false)}
                />
                <motion.div
                  className={styles.sheetPanel}
                  initial={shouldAnimate ? { y: '100%' } : false}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  role="dialog"
                  aria-label={t('filters.title')}
                >
                  <div className={styles.sheetHandle}>
                    <div className={styles.sheetHandleBar} />
                  </div>
                  <div className={styles.sheetHeader}>
                    <h3 className={styles.sheetTitle}>{t('filters.title')}</h3>
                    <button
                      type="button"
                      className={styles.sheetClose}
                      onClick={() => setIsOpen(false)}
                      aria-label={t('common.close')}
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                  <div className={styles.sheetBody}>{filterContent}</div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
