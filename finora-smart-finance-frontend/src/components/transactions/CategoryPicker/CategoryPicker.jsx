/**
 * @fileoverview CategoryPicker Component - Mobile-Friendly Category Selector
 * @description Custom modal-like dropdown für Kategorie-Auswahl
 * Verhindert native Mobile Picker, die Fullscreen werden
 * 
 * @module components/transactions/CategoryPicker
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { translateCategory } from '@/utils/categoryTranslations';
import { CategoryIcon } from '@/utils/categoryIcons';
import { FiChevronDown } from 'react-icons/fi';
import styles from './CategoryPicker.module.scss';

export const CategoryPicker = ({
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
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);
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
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

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
      <div className={styles.pickerWrapper} ref={pickerRef}>
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
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              role="listbox"
            >
              {categories.map((category) => (
                <motion.button
                  key={category}
                  type="button"
                  className={`${styles.menuItem} ${value === category ? styles.selected : ''}`}
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
                    <span className={styles.checkmark}>✓</span>
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
};

export default CategoryPicker;
