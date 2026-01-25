import { forwardRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiChevronDown } from 'react-icons/fi';
import styles from './Select.module.scss';

/**
 * @component Select
 * @description Professional select/dropdown component with label, error state, and animations
 * 
 * @param {string} [label] - Label text displayed above select
 * @param {Array} options - Array of { value, label } objects
 * @param {string} [placeholder] - Placeholder text for empty state
 * @param {string} [value] - Selected value
 * @param {Function} onChange - Change handler
 * @param {string} [error] - Error message to display
 * @param {string} [hint] - Helper text displayed below select
 * @param {boolean} [required=false] - Show required asterisk
 * @param {boolean} [disabled=false] - Disabled state
 * @param {string} [size='medium'] - 'small', 'medium', 'large'
 * @param {string} [className] - Additional CSS classes
 * @param {...any} props - Other HTML select props
 * 
 * @example
 * <Select
 *   label="Category"
 *   options={[
 *     { value: 'food', label: '🛒 Lebensmittel' },
 *     { value: 'transport', label: '🚗 Transport' }
 *   ]}
 *   value={category}
 *   onChange={(e) => setCategory(e.target.value)}
 * />
 */
export const Select = forwardRef((
  {
    label = '',
    options = [],
    placeholder = '',
    value = '',
    onChange = null,
    error = '',
    hint = '',
    required = false,
    disabled = false,
    size = 'medium',
    className = '',
    ...props
  },
  ref
) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const hasError = !!error;
  const hasValue = value && value !== '';
  const resolvedPlaceholder = placeholder || t('common.selectPlaceholder');

  // ──────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────
  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    props.onFocus?.(e);
  }, [props]);

  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    props.onBlur?.(e);
  }, [props]);

  const handleChange = useCallback((e) => {
    onChange?.(e);
    props.onChange?.(e);
  }, [onChange, props]);

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className={`
        ${styles.selectGroup}
        ${styles[size]}
        ${hasError ? styles.hasError : ''}
        ${isFocused ? styles.focused : ''}
        ${disabled ? styles.disabled : ''}
        ${className}
      `.trim()}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* LABEL */}
      {label && (
        <motion.label
          className={styles.label}
          htmlFor={props.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {label}
          {required && <span className={styles.required}>*</span>}
        </motion.label>
      )}

      {/* SELECT WRAPPER */}
      <div className={styles.selectWrapper}>
        <motion.select
          ref={ref}
          className={styles.select}
          disabled={disabled}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        >
          {/* PLACEHOLDER OPTION */}
          {resolvedPlaceholder && (
            <option value="" disabled={!hasValue}>
              {resolvedPlaceholder}
            </option>
          )}

          {/* OPTIONS */}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </motion.select>

        {/* DROPDOWN ARROW ICON */}
        <motion.div
          className={styles.arrow}
          animate={{ rotate: isFocused ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
        >
          <FiChevronDown />
        </motion.div>
      </div>

      {/* HELPER TEXT / ERROR */}
      <motion.div
        className={styles.footer}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.2 }}
      >
        {hasError && (
          <motion.p
            className={styles.error}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            role="alert"
          >
            <FiAlertCircle /> {error}
          </motion.p>
        )}

        {hint && !hasError && (
          <motion.p
            className={styles.hint}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {hint}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
});

Select.displayName = 'Select';

export default Select;
