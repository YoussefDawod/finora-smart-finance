/**
 * @fileoverview DashboardFilter Component
 * @description Kompakte Dropdown-Filter Komponente für Monats-/Jahresauswahl
 * 
 * FEATURES:
 * - Dropdown-Button zeigt aktuellen Monat an
 * - Monat/Jahr Navigation im Dropdown
 * - Quick Select für häufige Zeiträume
 * - Responsive Design (immer neben "Neue Transaktion" Button)
 * - RTL Support (Arabisch)
 * - Mehrsprachig (DE, EN, AR, KA)
 */

import { useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiCalendar, FiCheck } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useClickOutside } from '@/hooks';
import styles from './DashboardFilter.module.scss';

/**
 * Formatiert Monat und Jahr für die Anzeige
 */
function formatMonthDisplay(month, year, locale = 'de', format = 'long') {
  const date = new Date(year, month - 1, 1);
  const localeMap = {
    'ar': 'ar-SA',
    'en': 'en-US',
    'ka': 'ka-GE',
    'de': 'de-DE',
  };
  
  return date.toLocaleDateString(localeMap[locale] || 'de-DE', {
    month: format,
    year: 'numeric',
  });
}

/**
 * Kurze Monatsanzeige für den Button
 */
function formatShortMonth(month, year, locale = 'de') {
  const date = new Date(year, month - 1, 1);
  const localeMap = {
    'ar': 'ar-SA',
    'en': 'en-US',
    'ka': 'ka-GE',
    'de': 'de-DE',
  };
  
  return date.toLocaleDateString(localeMap[locale] || 'de-DE', {
    month: 'short',
    year: '2-digit',
  });
}

export default function DashboardFilter({
  selectedMonth,
  selectedYear,
  onMonthChange,
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  // Defaults
  const currentDate = new Date();
  const month = selectedMonth ?? currentDate.getMonth() + 1;
  const year = selectedYear ?? currentDate.getFullYear();

  // ─────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────
  const goToPrevMonth = useCallback(() => {
    let newMonth = month - 1;
    let newYear = year;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    
    onMonthChange?.(newMonth, newYear);
  }, [month, year, onMonthChange]);

  const goToNextMonth = useCallback(() => {
    let newMonth = month + 1;
    let newYear = year;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    
    onMonthChange?.(newMonth, newYear);
  }, [month, year, onMonthChange]);

  const selectQuickOption = useCallback((offset) => {
    const now = new Date();
    let newMonth = now.getMonth() + 1;
    let newYear = now.getFullYear();
    
    for (let i = 0; i < offset; i++) {
      newMonth -= 1;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
    }
    
    onMonthChange?.(newMonth, newYear);
    setIsOpen(false);
  }, [onMonthChange]);

  const goToCurrentMonth = useCallback(() => {
    const now = new Date();
    onMonthChange?.(now.getMonth() + 1, now.getFullYear());
    setIsOpen(false);
  }, [onMonthChange]);

  // ─────────────────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────────────────────────────
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return month === now.getMonth() + 1 && year === now.getFullYear();
  }, [month, year]);

  const displayLabel = useMemo(() => {
    return formatShortMonth(month, year, i18n.language);
  }, [month, year, i18n.language]);

  const fullMonthLabel = useMemo(() => {
    return formatMonthDisplay(month, year, i18n.language, 'long');
  }, [month, year, i18n.language]);

  const quickOptions = useMemo(() => [
    { key: 'current', label: t('dashboard.filter.currentMonth', 'Aktueller Monat'), offset: 0 },
    { key: 'last1', label: t('dashboard.filter.last1Month', 'Letzter Monat'), offset: 1 },
    { key: 'last3', label: t('dashboard.filter.last3Months', 'Letzte 3 Monate'), offset: 3 },
    { key: 'last6', label: t('dashboard.filter.last6Months', 'Letzte 6 Monate'), offset: 6 },
  ], [t]);

  // Prüfe welche Quick-Option aktuell ausgewählt ist
  const activeQuickOption = useMemo(() => {
    const now = new Date();
    const nowMonth = now.getMonth() + 1;
    const nowYear = now.getFullYear();
    
    for (const opt of quickOptions) {
      let checkMonth = nowMonth;
      let checkYear = nowYear;
      
      for (let i = 0; i < opt.offset; i++) {
        checkMonth -= 1;
        if (checkMonth < 1) {
          checkMonth = 12;
          checkYear -= 1;
        }
      }
      
      if (checkMonth === month && checkYear === year) {
        return opt.key;
      }
    }
    return null;
  }, [month, year, quickOptions]);

  // ─────────────────────────────────────────────────────────────────────
  // OUTSIDE CLICK
  // ─────────────────────────────────────────────────────────────────────
  useClickOutside(dropdownRef, () => setIsOpen(false));

  // RTL-aware Icons
  const PrevIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const NextIcon = isRTL ? FiChevronLeft : FiChevronRight;

  return (
    <div 
      className={`${styles.filterWrapper} ${isRTL ? styles.rtl : ''}`}
      ref={dropdownRef}
    >
      {/* Trigger Button */}
      <motion.button
        type="button"
        className={styles.filterButton}
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.97 }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('dashboard.filter.selectPeriod', 'Zeitraum wählen')}
      >
        <FiCalendar className={styles.buttonIcon} />
        <span className={styles.buttonLabel}>{displayLabel}</span>
        <FiChevronDown 
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} 
        />
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.dropdown}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="listbox"
            aria-label={t('dashboard.filter.selectPeriod', 'Zeitraum wählen')}
          >
            {/* Navigation Header */}
            <div className={styles.navHeader}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={goToPrevMonth}
                aria-label={t('dashboard.filter.previousMonth', 'Vorheriger Monat')}
              >
                <PrevIcon size={18} />
              </button>

              <div className={styles.monthDisplayBox}>
                <span className={styles.monthText}>{fullMonthLabel}</span>
              </div>

              <button
                type="button"
                className={styles.navBtn}
                onClick={goToNextMonth}
                aria-label={t('dashboard.filter.nextMonth', 'Nächster Monat')}
              >
                <NextIcon size={18} />
              </button>
            </div>

            {/* Quick Select Options */}
            <div className={styles.quickOptions}>
              {quickOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`${styles.quickOption} ${activeQuickOption === opt.key ? styles.quickOptionActive : ''}`}
                  onClick={() => selectQuickOption(opt.offset)}
                  aria-selected={activeQuickOption === opt.key}
                  role="option"
                >
                  <span>{opt.label}</span>
                  {activeQuickOption === opt.key && (
                    <FiCheck className={styles.checkIcon} size={14} />
                  )}
                </button>
              ))}
            </div>

            {/* Current Month Button (if not already current) */}
            {!isCurrentMonth && (
              <button
                type="button"
                className={styles.todayBtn}
                onClick={goToCurrentMonth}
              >
                <FiCalendar size={14} />
                <span>{t('dashboard.filter.goToToday', 'Zu heute')}</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
