/**
 * @fileoverview FilterDropdown – Custom-styled dropdown (DashboardFilter pattern)
 * @description A reusable, fully custom dropdown that replaces native <select> elements.
 *              Uses a button trigger + floating panel with selectable options,
 *              following the DashboardFilter design language:
 *              - Button trigger with icon, label, chevron
 *              - AnimatePresence panel with options list
 *              - Active option check-mark
 *              - Click-outside to close
 *              - Keyboard navigation (Esc, Enter, ArrowDown/Up)
 *              - Responsive & RTL support
 *              - Reduced-motion safe (MOTION_GLOW_RULES compliant)
 *
 * @module components/common/FilterDropdown
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/hooks/useMotion';
import styles from './FilterDropdown.module.scss';

/**
 * @component FilterDropdown
 *
 * @param {Array<{value:string, label:string}>} options  – Selectable options
 * @param {string}          value         – Currently selected value
 * @param {Function}        onChange      – Called with the new value string
 * @param {string}          [placeholder] – Label shown when no value selected
 * @param {React.ReactNode} [icon]        – Optional leading icon in trigger
 * @param {string}          [ariaLabel]   – Accessible label
 * @param {boolean}         [disabled]    – Disabled state
 * @param {string}          [className]   – Extra class on outer wrapper
 * @param {'left'|'right'}  [align='left'] – Panel alignment
 * @param {'sm'|'md'}       [size='sm']   – Trigger button size
 * @param {string}          [label]       – Form label displayed above the trigger
 * @param {string}          [hint]        – Helper text displayed below the dropdown
 * @param {string}          [id]          – HTML id for label association
 */
export default function FilterDropdown({
  options = [],
  value = '',
  onChange,
  placeholder = '',
  icon = null,
  ariaLabel = '',
  disabled = false,
  className = '',
  align = 'left',
  size = 'sm',
  label = '',
  hint = '',
  id = '',
}) {
  const { i18n } = useTranslation();
  const { shouldAnimate } = useMotion();
  const isRTL = i18n.dir() === 'rtl' || i18n.language === 'ar';
  const wrapperRef = useRef(null);
  const listRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Resolve display label from current value
  const activeOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );
  const displayLabel = activeOption?.label || placeholder || '—';

  // ── Click Outside ──────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
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

  // ── Select Handler ─────────────────────────────
  const handleSelect = useCallback(
    (val) => {
      onChange?.(val);
      setIsOpen(false);
    },
    [onChange],
  );

  // ── Toggle ─────────────────────────────────────
  const toggle = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => {
      if (!prev) setFocusedIndex(options.findIndex((o) => o.value === value));
      return !prev;
    });
  }, [disabled, options, value]);

  // ── Keyboard Navigation ────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          toggle();
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((i) => (i < options.length - 1 ? i + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((i) => (i > 0 ? i - 1 : options.length - 1));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            handleSelect(options[focusedIndex].value);
          }
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(options.length - 1);
          break;
        default:
          break;
      }
    },
    [isOpen, focusedIndex, options, handleSelect, toggle],
  );

  // ── Scroll focused option into view ────────────
  useEffect(() => {
    if (!isOpen || focusedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[role="option"]');
    items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex, isOpen]);

  // ── Panel animation variants ───────────────────
  const panelVariants = {
    hidden: { opacity: 0, y: -6 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
  };

  return (
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
      onKeyDown={handleKeyDown}
    >
      {/* ── Label ──────────────────────────────── */}
      {label && (
        <label className={styles.label} htmlFor={id || undefined}>
          {label}
        </label>
      )}

      {/* ── Trigger Button ─────────────────────── */}
      <motion.button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''} ${value ? styles.hasValue : ''}`}
        onClick={toggle}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel || displayLabel}
        disabled={disabled}
        id={id || undefined}
      >
        {icon && <span className={styles.triggerIcon}>{icon}</span>}
        <span className={styles.triggerLabel}>{displayLabel}</span>
        <FiChevronDown
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        />
      </motion.button>

      {/* ── Dropdown Panel ─────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`${styles.panel} ${styles[`align-${align}`] || ''}`}
            variants={panelVariants}
            initial={shouldAnimate ? 'hidden' : false}
            animate={shouldAnimate ? 'visible' : false}
            exit={shouldAnimate ? 'exit' : undefined}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="listbox"
            aria-label={ariaLabel}
            ref={listRef}
          >
            {options.map((opt, idx) => {
              const isActive = opt.value === value;
              const isFocused = idx === focusedIndex;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`
                    ${styles.option}
                    ${isActive ? styles.optionActive : ''}
                    ${isFocused ? styles.optionFocused : ''}
                  `.trim()}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                >
                  <span className={styles.optionLabel}>{opt.label}</span>
                  {isActive && (
                    <FiCheck className={styles.checkIcon} size={14} />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hint ───────────────────────────────── */}
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
