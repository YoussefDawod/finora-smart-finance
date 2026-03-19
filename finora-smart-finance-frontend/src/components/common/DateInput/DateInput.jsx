/**
 * @fileoverview DateInput – Vollständig eigener Kalender-Picker
 *
 * KEIN natives <input type="date"> mehr.
 * Eigenes Kalender-Panel (AnimatePresence) wie FilterDropdown:
 *   - Button-Trigger mit FiCalendar + formatiertem Datum
 *   - Kalender-Panel mit Monats-Navigation + Tagesraster
 *   - Click-outside zum Schließen
 *   - Keyboard-Navigation (Esc, Pfeile, Enter)
 *   - Locale-aware Wochentage + Monatsnamen
 *   - min/max Einschränkung
 *   - Responsive + RTL
 *
 * MOTION_GLOW_RULES: nur border/shadow Transition, kein Glow.
 *
 * @module components/common/DateInput
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/hooks/useMotion';
import styles from './DateInput.module.scss';

// ── Locale mapping ──────────────────────────────
const LOCALE_MAP = { de: 'de-DE', en: 'en-US', ar: 'ar-SA', ka: 'ka-GE' };

function getLocale(language) {
  return LOCALE_MAP[language] || 'de-DE';
}

/** Format YYYY-MM-DD → locale display text (e.g. "01. Feb. 2026") */
function formatDisplayDate(isoString, language) {
  if (!isoString) return '';
  try {
    const [y, m, d] = isoString.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat(getLocale(language), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

/** Get short weekday names for a locale (Mo, Di, Mi, …) */
function getWeekdayNames(language) {
  const locale = getLocale(language);
  const base = new Date(2024, 0, 1); // Monday 2024-01-01
  const names = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const short = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
    // Arabisch: Kurzform beginnt mit "ال" (Artikel) → narrow verwenden statt abschneiden
    if (language === 'ar') {
      names.push(new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(d));
    } else {
      names.push(short.slice(0, 2));
    }
  }
  return names;
}

/** Get month name for a locale */
function getMonthName(year, month, language) {
  const locale = getLocale(language);
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(year, month)
  );
}

/** Build calendar grid: array of 42 day-objects (6 rows × 7 cols) */
function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  // Monday = 0, Sunday = 6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const days = [];
  const startDate = new Date(year, month, 1 - startOffset);

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push({
      date: d,
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      isCurrentMonth: d.getMonth() === month && d.getFullYear() === year,
    });
  }
  return days;
}

/** Convert Date to YYYY-MM-DD string */
function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD string to Date */
function parseISO(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Check if two dates are the same calendar day */
function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Check if date is within min/max bounds */
function isDateInRange(date, minStr, maxStr) {
  if (minStr) {
    const minDate = parseISO(minStr);
    if (minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) {
      return false;
    }
  }
  if (maxStr) {
    const maxDate = parseISO(maxStr);
    if (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) {
      return false;
    }
  }
  return true;
}

// ── Panel animation variants ─────────────────────
const panelVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

/**
 * @component DateInput
 */
export default function DateInput({
  value = '',
  onChange,
  label = '',
  placeholder = '',
  ariaLabel = '',
  disabled = false,
  className = '',
  min = '',
  max = '',
  size = 'sm',
  id = '',
}) {
  const { t, i18n } = useTranslation();
  const { shouldAnimate } = useMotion();
  const isRTL = i18n.dir() === 'rtl' || i18n.language === 'ar';
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({ top: 0, left: 0 });
  const [focusedDate, setFocusedDate] = useState(null);

  // Calendar view state
  const selectedDate = useMemo(() => parseISO(value), [value]);
  const [viewYear, setViewYear] = useState(
    () => selectedDate?.getFullYear() || new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    () => selectedDate?.getMonth() ?? new Date().getMonth()
  );

  // RTL-aware chevron icons
  const PrevIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const NextIcon = isRTL ? FiChevronLeft : FiChevronRight;

  // Sync view when value changes externally (adjusting state during render)
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }

  // Display text
  const displayLabel = useMemo(() => {
    if (value) return formatDisplayDate(value, i18n.language);
    return placeholder || t('common.selectDate', 'Datum wählen');
  }, [value, i18n.language, placeholder, t]);

  const inputAriaLabel = ariaLabel || label || t('common.selectDate', 'Datum wählen');

  // Weekday names + month label
  const weekdays = useMemo(() => getWeekdayNames(i18n.language), [i18n.language]);
  const monthLabel = useMemo(
    () => getMonthName(viewYear, viewMonth, i18n.language),
    [viewYear, viewMonth, i18n.language]
  );

  // Calendar days grid
  const calendarDays = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  // Today
  const today = new Date();

  // ── Panel Position (JS-basiert, viewport-aware) ──
  const updatePanelPosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const panelW = 280;
    const panelEl = panelRef.current;
    const panelH = panelEl ? panelEl.offsetHeight : 340;
    const gap = 4;
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 640; // $bp-sm

    // ── Vertical ──
    // Mobile: immer über dem Button (Platz für Bottom-Sheet-Content)
    // Desktop/Tablet: unter dem Button, Flip nach oben wenn kein Platz
    let top;
    let maxH = null;
    if (isMobile) {
      top = rect.top - panelH - gap;
      // Verfügbaren Platz über dem Button berechnen, Panel schrumpft wenn nötig
      const available = rect.top - gap - margin;
      if (available < panelH) {
        maxH = Math.max(200, available);
        top = margin;
      }
    } else {
      const spaceBelow = vh - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openUp = spaceBelow < Math.min(panelH, 300) && spaceAbove > spaceBelow;
      top = openUp ? rect.top - panelH - gap : rect.bottom + gap;
      top = Math.max(margin, Math.min(top, vh - panelH - margin));
    }

    // ── Horizontal ──
    // Automatische Richtung: Linke Kante des Triggers als Start.
    // Wenn das Panel nach rechts überläuft, an rechter Kante ausrichten.
    // RTL: Spiegelung (rechte Kante als Start).
    // Mobile: zentriert unter dem Trigger.
    let left;
    if (isMobile) {
      left = rect.left + rect.width / 2 - panelW / 2;
    } else if (isRTL) {
      // RTL: rechte Kante Panel = rechte Kante Trigger
      left = rect.right - panelW;
      // Wenn nach links überläuft → linke Kante statt
      if (left < margin) left = rect.left;
    } else {
      // LTR: linke Kante Panel = linke Kante Trigger
      left = rect.left;
      // Wenn nach rechts überläuft → rechte Kante statt
      if (left + panelW > vw - margin) left = rect.right - panelW;
    }
    // Clamp to viewport
    if (left + panelW > vw - margin) left = vw - panelW - margin;
    if (left < margin) left = margin;

    setPanelStyle({ top, left, ...(maxH ? { maxHeight: maxH } : {}) });
  }, [isRTL]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- useLayoutEffect for DOM measurement before paint is the canonical React pattern
    updatePanelPosition();
    // Recalculate after panel renders to get actual height
    const raf = requestAnimationFrame(updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);
    window.addEventListener('resize', updatePanelPosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', updatePanelPosition, true);
      window.removeEventListener('resize', updatePanelPosition);
    };
  }, [isOpen, updatePanelPosition]);

  // ── Click Outside ─────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = e => {
      const inWrapper = wrapperRef.current?.contains(e.target);
      const inPanel = panelRef.current?.contains(e.target);
      if (!inWrapper && !inPanel) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isOpen]);

  // ── Toggle ────────────────────────────────────
  const toggle = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => !prev);
  }, [disabled]);

  // ── Month navigation ──────────────────────────
  const prevMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 0) {
        setViewYear(y => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 11) {
        setViewYear(y => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  // ── Day selection ─────────────────────────────
  const handleDayClick = useCallback(
    dayObj => {
      if (!dayObj.isCurrentMonth) return;
      if (!isDateInRange(dayObj.date, min, max)) return;
      onChange?.(toISODate(dayObj.date));
      setIsOpen(false);
    },
    [onChange, min, max]
  );

  // ── Go to today ───────────────────────────────
  const goToToday = useCallback(() => {
    const now = new Date();
    if (!isDateInRange(now, min, max)) return;
    onChange?.(toISODate(now));
    setIsOpen(false);
  }, [onChange, min, max]);

  // ── Keyboard ──────────────────────────────────
  // Initialize focusedDate when panel opens/closes (adjusting state during render)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    setFocusedDate(isOpen ? selectedDate || new Date() : null);
  }

  // Focus the active day cell when focusedDate changes
  useEffect(() => {
    if (!isOpen || !focusedDate || !panelRef.current) return;
    const iso = toISODate(focusedDate);
    const btn = panelRef.current.querySelector(`[data-date="${iso}"]`);
    if (btn && !btn.disabled) btn.focus();
  }, [isOpen, focusedDate]);

  const handleKeyDown = useCallback(
    e => {
      if (!isOpen) return;

      // Helper to move focusedDate by N days
      const moveDay = days => {
        e.preventDefault();
        setFocusedDate(prev => {
          const d = new Date(prev || new Date());
          d.setDate(d.getDate() + days);
          // Auto-navigate month if crossing boundary
          if (d.getMonth() !== viewMonth || d.getFullYear() !== viewYear) {
            setViewMonth(d.getMonth());
            setViewYear(d.getFullYear());
          }
          return d;
        });
      };

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case 'ArrowLeft':
          moveDay(isRTL ? 1 : -1);
          break;
        case 'ArrowRight':
          moveDay(isRTL ? -1 : 1);
          break;
        case 'ArrowUp':
          moveDay(-7);
          break;
        case 'ArrowDown':
          moveDay(7);
          break;
        case 'Home':
          e.preventDefault();
          setFocusedDate(new Date(viewYear, viewMonth, 1));
          break;
        case 'End':
          e.preventDefault();
          // Last day of current month
          setFocusedDate(new Date(viewYear, viewMonth + 1, 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedDate && isDateInRange(focusedDate, min, max)) {
            onChange?.(toISODate(focusedDate));
            setIsOpen(false);
          }
          break;
        default:
          break;
      }
    },
    [isOpen, isRTL, viewMonth, viewYear, focusedDate, min, max, onChange]
  );

  return (
    <>
      <div
        ref={wrapperRef}
        className={`
          ${styles.wrapper}
          ${isRTL ? styles.rtl : ''}
          ${disabled ? styles.disabled : ''}
          ${styles[`size-${size}`] || ''}
          ${label ? styles.withLabel : ''}
          ${className}
        `.trim()}
      >
        {/* ── Label ──────────────────────────────── */}
        {label && (
          <label className={styles.label} htmlFor={id || undefined}>
            {label}
          </label>
        )}

        {/* ── Trigger Container ──────────────────── */}
        <div className={styles.triggerWrap}>
          <motion.button
            ref={triggerRef}
            type="button"
            id={id || undefined}
            className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''} ${value ? styles.hasValue : ''}`}
            onClick={toggle}
            whileTap={disabled ? undefined : { scale: 0.98 }}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-label={inputAriaLabel}
            disabled={disabled}
          >
            <FiCalendar className={styles.icon} aria-hidden="true" />
            <span className={styles.triggerLabel}>{displayLabel}</span>
          </motion.button>
        </div>
      </div>

      {/* ── Calendar Panel (Portal → <body>) ───── */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={panelRef}
              className={`${styles.panel} ${isRTL ? styles.panelRtl : ''}`}
              style={{
                top: panelStyle.top,
                left: panelStyle.left,
                ...(panelStyle.maxHeight ? { maxHeight: panelStyle.maxHeight } : {}),
              }}
              variants={panelVariants}
              initial={shouldAnimate ? 'hidden' : false}
              animate={shouldAnimate ? 'visible' : false}
              exit={shouldAnimate ? 'exit' : undefined}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              role="dialog"
              aria-label={inputAriaLabel}
              onKeyDown={handleKeyDown}
            >
              {/* ── Month Navigation ─────────────── */}
              <div className={styles.calendarHeader}>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={prevMonth}
                  aria-label={t('common.previousMonth', 'Vorheriger Monat')}
                >
                  <PrevIcon size={16} />
                </button>
                <span className={styles.monthLabel}>{monthLabel}</span>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={nextMonth}
                  aria-label={t('common.nextMonth', 'Nächster Monat')}
                >
                  <NextIcon size={16} />
                </button>
              </div>

              {/* ── Weekday Headers ──────────────── */}
              <div className={styles.weekdays}>
                {weekdays.map((wd, i) => (
                  <span key={i} className={styles.weekday}>
                    {wd}
                  </span>
                ))}
              </div>

              {/* ── Day Grid ─────────────────────── */}
              <div className={styles.dayGrid} role="grid">
                {calendarDays.map((dayObj, i) => {
                  const isSelected = isSameDay(dayObj.date, selectedDate);
                  const isToday = isSameDay(dayObj.date, today);
                  const isFocused = isSameDay(dayObj.date, focusedDate);
                  const inRange = isDateInRange(dayObj.date, min, max);
                  const isDisabled = !dayObj.isCurrentMonth || !inRange;

                  return (
                    <button
                      key={i}
                      type="button"
                      data-date={toISODate(dayObj.date)}
                      className={`
                        ${styles.dayCell}
                        ${isSelected ? styles.daySelected : ''}
                        ${isToday && !isSelected ? styles.dayToday : ''}
                        ${isFocused && !isDisabled ? styles.dayFocused : ''}
                        ${!dayObj.isCurrentMonth ? styles.dayOutside : ''}
                        ${isDisabled ? styles.dayDisabled : ''}
                      `.trim()}
                      onClick={() => handleDayClick(dayObj)}
                      disabled={isDisabled}
                      tabIndex={isFocused && !isDisabled ? 0 : -1}
                      aria-label={formatDisplayDate(toISODate(dayObj.date), i18n.language)}
                      aria-selected={isSelected}
                      role="gridcell"
                    >
                      {dayObj.day}
                    </button>
                  );
                })}
              </div>

              {/* ── Today Button ──────────────────── */}
              <button type="button" className={styles.todayBtn} onClick={goToToday}>
                {t('common.today', 'Heute')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
