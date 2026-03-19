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
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiCheck,
  FiX,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useClickOutside } from '@/hooks';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA_QUERIES } from '@/constants';
import { useMotion } from '@/hooks/useMotion';
import DateInput from '@/components/common/DateInput/DateInput';
import styles from './DashboardFilter.module.scss';

/**
 * Formatiert Monat und Jahr für die Anzeige
 */
function formatMonthDisplay(month, year, locale = 'de', format = 'long') {
  const date = new Date(year, month - 1, 1);
  const localeMap = {
    ar: 'ar-SA',
    en: 'en-US',
    ka: 'ka-GE',
    de: 'de-DE',
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
    ar: 'ar-SA',
    en: 'en-US',
    ka: 'ka-GE',
    de: 'de-DE',
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
  startDate,
  endDate,
}) {
  const { t, i18n } = useTranslation();
  const { shouldAnimate } = useMotion();
  const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
  const isRTL = i18n.language === 'ar';
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  // Defaults
  const currentDate = new Date();
  const month = selectedMonth ?? currentDate.getMonth() + 1;
  const year = selectedYear ?? currentDate.getFullYear();

  // ─────────────────────────────────────────────────────────────────────
  // PERIOD MODE DETECTION (month / year / custom)
  // ─────────────────────────────────────────────────────────────────────
  const periodMode = useMemo(() => {
    if (!startDate || !endDate) return 'month';
    const s = new Date(startDate + 'T00:00:00');
    const e = new Date(endDate + 'T00:00:00');
    // Ganzes Jahr?
    if (
      s.getMonth() === 0 &&
      s.getDate() === 1 &&
      e.getMonth() === 11 &&
      e.getDate() === 31 &&
      s.getFullYear() === e.getFullYear()
    ) {
      return 'year';
    }
    // Einzelner Monat?
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === 1) {
      const lastDay = new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate();
      if (e.getDate() === lastDay) return 'month';
    }
    return 'custom';
  }, [startDate, endDate]);

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

  const selectQuickOption = useCallback(
    offset => {
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
    },
    [onMonthChange]
  );

  const selectYear = useCallback(() => {
    const now = new Date();
    const y = now.getFullYear();
    onMonthChange?.(now.getMonth() + 1, y, {
      startDate: `${y}-01-01`,
      endDate: `${y}-12-31`,
    });
    setIsOpen(false);
  }, [onMonthChange]);

  const handleDateChange = useCallback(
    (field, value) => {
      if (!value) return;
      const newStartDate = field === 'startDate' ? value : startDate || '';
      const newEndDate = field === 'endDate' ? value : endDate || '';
      if (newStartDate && newEndDate) {
        const d = new Date(newStartDate + 'T00:00:00');
        onMonthChange?.(d.getMonth() + 1, d.getFullYear(), {
          startDate: newStartDate,
          endDate: newEndDate,
        });
      }
    },
    [onMonthChange, startDate, endDate]
  );

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
    return periodMode === 'month' && month === now.getMonth() + 1 && year === now.getFullYear();
  }, [month, year, periodMode]);

  const displayLabel = useMemo(() => {
    if (periodMode === 'year' && startDate) {
      const y = new Date(startDate + 'T00:00:00').getFullYear();
      return String(y);
    }
    if (periodMode === 'custom' && startDate && endDate) {
      // Kompakte Anzeige: "01.02 – 15.03"
      const s = new Date(startDate + 'T00:00:00');
      const e = new Date(endDate + 'T00:00:00');
      const fmt = d =>
        `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      return `${fmt(s)} – ${fmt(e)}`;
    }
    return formatShortMonth(month, year, i18n.language);
  }, [month, year, i18n.language, periodMode, startDate, endDate]);

  const fullMonthLabel = useMemo(() => {
    return formatMonthDisplay(month, year, i18n.language, 'long');
  }, [month, year, i18n.language]);

  const quickOptions = useMemo(
    () => [
      { key: 'current', label: t('dashboard.filter.currentMonth', 'Aktueller Monat'), offset: 0 },
      { key: 'last1', label: t('dashboard.filter.last1Month', 'Letzter Monat'), offset: 1 },
      { key: 'last3', label: t('dashboard.filter.last3Months', 'Letzte 3 Monate'), offset: 3 },
      { key: 'last6', label: t('dashboard.filter.last6Months', 'Letzte 6 Monate'), offset: 6 },
    ],
    [t]
  );

  // Prüfe welche Quick-Option aktuell ausgewählt ist
  const activeQuickOption = useMemo(() => {
    if (periodMode === 'year') return 'year';
    if (periodMode === 'custom') return 'custom';

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
  }, [month, year, quickOptions, periodMode]);

  // ─────────────────────────────────────────────────────────────────────
  // OUTSIDE CLICK
  // ─────────────────────────────────────────────────────────────────────
  useClickOutside(dropdownRef, () => setIsOpen(false));

  // RTL-aware Icons
  const PrevIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const NextIcon = isRTL ? FiChevronLeft : FiChevronRight;

  // ── Shared filter content (used in dropdown & bottom sheet) ──
  const filterContent = (
    <>
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
      <div
        className={styles.quickOptions}
        role="radiogroup"
        aria-label={t('dashboard.filter.selectPeriod', 'Zeitraum wählen')}
      >
        {quickOptions.map(opt => (
          <button
            key={opt.key}
            type="button"
            className={`${styles.quickOption} ${activeQuickOption === opt.key ? styles.quickOptionActive : ''}`}
            onClick={() => selectQuickOption(opt.offset)}
            aria-checked={activeQuickOption === opt.key}
            role="radio"
          >
            <span>{opt.label}</span>
            {activeQuickOption === opt.key && <FiCheck className={styles.checkIcon} size={14} />}
          </button>
        ))}
        {/* Dieses Jahr */}
        <button
          type="button"
          className={`${styles.quickOption} ${activeQuickOption === 'year' ? styles.quickOptionActive : ''}`}
          onClick={selectYear}
          aria-checked={activeQuickOption === 'year'}
          role="radio"
        >
          <span>{t('dashboard.filter.thisYear', 'Dieses Jahr')}</span>
          {activeQuickOption === 'year' && <FiCheck className={styles.checkIcon} size={14} />}
        </button>
      </div>

      {/* Custom Date Range */}
      <div className={styles.dateSection}>
        <h4 className={styles.dateSectionTitle}>{t('dashboard.filter.customRange', 'Zeitraum')}</h4>
        <div className={styles.dateRow}>
          <DateInput
            label={t('filters.from', 'Von')}
            value={startDate || ''}
            onChange={val => handleDateChange('startDate', val)}
            ariaLabel={t('filters.from', 'Von')}
          />
          <DateInput
            label={t('filters.to', 'Bis')}
            value={endDate || ''}
            onChange={val => handleDateChange('endDate', val)}
            ariaLabel={t('filters.to', 'Bis')}
          />
        </div>
      </div>

      {/* Current Month Button (if not already current) */}
      {!isCurrentMonth && (
        <button type="button" className={styles.todayBtn} onClick={goToCurrentMonth}>
          <FiCalendar size={14} />
          <span>{t('dashboard.filter.goToToday', 'Zu heute')}</span>
        </button>
      )}
    </>
  );

  return (
    <div className={`${styles.filterWrapper} ${isRTL ? styles.rtl : ''}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        type="button"
        className={styles.filterButton}
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.98 }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('dashboard.filter.selectPeriod', 'Zeitraum wählen')}
      >
        <FiCalendar className={styles.buttonIcon} />
        <span className={styles.buttonLabel}>{displayLabel}</span>
        <FiChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
      </motion.button>

      {/* Desktop: Positioned Dropdown */}
      {!isMobile && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className={styles.dropdown}
              initial={shouldAnimate ? { opacity: 0, y: -8 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              exit={shouldAnimate ? { opacity: 0, y: -8 } : undefined}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              role="dialog"
              aria-label={t('dashboard.filter.selectPeriod', 'Zeitraum wählen')}
            >
              {filterContent}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Mobile: Bottom Sheet (portaled to body) */}
      {isMobile &&
        isOpen &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  className={styles.sheetBackdrop}
                  initial={shouldAnimate ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsOpen(false)}
                />
                {/* Sheet Panel */}
                <motion.div
                  className={styles.sheetPanel}
                  initial={shouldAnimate ? { y: '100%' } : false}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  role="dialog"
                  aria-label={t('dashboard.filter.selectPeriod', 'Zeitraum wählen')}
                >
                  {/* Drag handle */}
                  <div className={styles.sheetHandle}>
                    <div className={styles.sheetHandleBar} />
                  </div>
                  {/* Sheet header with title + close */}
                  <div className={styles.sheetHeader}>
                    <h3 className={styles.sheetTitle}>
                      {t('dashboard.filter.selectPeriod', 'Zeitraum wählen')}
                    </h3>
                    <button
                      type="button"
                      className={styles.sheetClose}
                      onClick={() => setIsOpen(false)}
                      aria-label={t('common.close', 'Schließen')}
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                  {/* Filter content */}
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
