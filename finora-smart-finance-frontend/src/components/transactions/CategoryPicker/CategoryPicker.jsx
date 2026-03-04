/**
 * @fileoverview CategoryPicker Component - Mobile-Friendly Category Selector
 * @description Custom modal-like dropdown für Kategorie-Auswahl
 * Verhindert native Mobile Picker, die Fullscreen werden
 * 
 * @module components/transactions/CategoryPicker
 */

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { translateCategory } from '@/utils/categoryTranslations';
import { CategoryIcon } from '@/utils/categoryIcons';
import { useMotion } from '@/hooks/useMotion';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import styles from './CategoryPicker.module.scss';

export const CategoryPicker = memo(({
  categories = [],
  value = '',
  onChange = () => {},
  label = '',
  placeholder = '',
  error = '',
  required = false,
  disabled = false,
  hint = '',
  size = 'medium',
}) => {
  const { t, i18n } = useTranslation();
  const { shouldAnimate } = useMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const pickerRef = useRef(null);
  const menuRef = useRef(null);
  const isRtl = i18n.dir() === 'rtl';

  const selectedCategory = value ? translateCategory(value, t) : placeholder;

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Reset focused index when open state changes
  useEffect(() => {
    if (isOpen) {
      // Focus the currently selected item, or first item
      const idx = categories.indexOf(value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, categories, value]);

  // Scroll focused item into view
  useEffect(() => {
    if (!isOpen || focusedIndex < 0 || !menuRef.current) return;
    const items = menuRef.current.querySelectorAll('[role="option"]');
    items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex, isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      // Open on ArrowDown/ArrowUp/Enter/Space when trigger is focused
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
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
        setFocusedIndex((prev) => (prev + 1) % categories.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + categories.length) % categories.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < categories.length) {
          handleSelect(categories[focusedIndex]);
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(categories.length - 1);
        break;
      default:
        break;
    }
  }, [isOpen, categories, focusedIndex]);

  const handleSelect = (category) => {
    onChange({ target: { name: 'category', value: category } });
    setIsOpen(false);
  };

  return (
    <div 
      className={`${styles.pickerGroup} ${error ? styles.hasError : ''} ${disabled ? styles.disabled : ''} ${size ? styles[size] : ''}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* LABEL */}
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      {/* PICKER TRIGGER */}
      <div className={styles.pickerWrapper} ref={pickerRef} onKeyDown={handleKeyDown}>
        <motion.button
          type="button"
          className={`${styles.pickerButton} ${isOpen ? styles.active : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={styles.selectedValue}>
            {value && <CategoryIcon category={value} />}
            <span>{selectedCategory}</span>
          </span>
          <motion.span
            className={styles.chevron}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FiChevronDown />
          </motion.span>
        </motion.button>

        {/* DROPDOWN MENU */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className={styles.pickerMenu}
              initial={shouldAnimate ? { opacity: 0, y: -8 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              exit={shouldAnimate ? { opacity: 0, y: -8 } : undefined}
              transition={{ duration: 0.15 }}
              role="listbox"
              ref={menuRef}
              aria-activedescendant={focusedIndex >= 0 ? `category-option-${focusedIndex}` : undefined}
            >
              {categories.map((category, idx) => (
                <motion.button
                  key={category}
                  id={`category-option-${idx}`}
                  type="button"
                  className={`${styles.menuItem} ${value === category ? styles.selected : ''} ${focusedIndex === idx ? styles.focused : ''}`}
                  onClick={() => handleSelect(category)}
                  role="option"
                  aria-selected={value === category}
                  whileHover={{ backgroundColor: 'var(--surface-2)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={styles.itemIcon}>
                    <CategoryIcon category={category} />
                  </span>
                  <span className={styles.itemLabel}>
                    {translateCategory(category, t)}
                  </span>
                  {value === category && (
                    <span className={styles.checkmark}><FiCheck /></span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <motion.span
          className={styles.error}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.span>
      )}

      {/* HINT */}
      {hint && !error && (
        <span className={styles.hint}>{hint}</span>
      )}
    </div>
  );
});
CategoryPicker.displayName = 'CategoryPicker';

export default CategoryPicker;
