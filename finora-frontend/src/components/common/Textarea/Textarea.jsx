import React, { forwardRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle } from 'react-icons/fi';
import styles from './Textarea.module.scss';

/**
 * @component Textarea
 * @description Professional textarea component with label, error state, character counter, and animations
 * 
 * @param {string} [label] - Label text displayed above textarea
 * @param {string} [placeholder] - Placeholder text
 * @param {string} [error] - Error message to display
 * @param {string} [hint] - Helper text displayed below textarea
 * @param {boolean} [required=false] - Show required asterisk
 * @param {boolean} [disabled=false] - Disabled state
 * @param {string} [size='medium'] - 'small', 'medium', 'large'
 * @param {boolean} [showCharCount=false] - Show character counter
 * @param {number} [maxLength] - Maximum character length
 * @param {number} [rows=4] - Number of rows
 * @param {string} [className] - Additional CSS classes
 * @param {Function} [onChange] - Change handler
 * @param {...any} props - Other HTML textarea props
 * 
 * @example
 * <Textarea
 *   label="Description"
 *   placeholder="Enter description..."
 *   maxLength={100}
 *   showCharCount
 *   rows={4}
 * />
 */
export const Textarea = forwardRef((
  {
    label = '',
    placeholder = '',
    error = '',
    hint = '',
    required = false,
    disabled = false,
    size = 'medium',
    showCharCount = false,
    maxLength = null,
    rows = 4,
    className = '',
    onChange = null,
    value = '',
    ...props
  },
  ref
) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value?.length > 0;
  const charCount = value?.length || 0;
  const hasError = !!error;

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
        ${styles.textareaGroup}
        ${styles[size]}
        ${hasError ? styles.hasError : ''}
        ${isFocused ? styles.focused : ''}
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

      {/* TEXTAREA WRAPPER */}
      <div className={styles.textareaWrapper}>
        {/* TEXTAREA FIELD */}
        <motion.textarea
          ref={ref}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={rows}
          className={styles.textarea}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          value={value}
          {...props}
        />

        {/* CHARACTER COUNTER */}
        {showCharCount && maxLength && (
          <motion.span
            className={styles.charCounter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {charCount}/{maxLength}
          </motion.span>
        )}
      </div>

      {/* HELPER TEXT / ERROR */}
      <motion.div
        className={styles.footer}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.2 }}
      >
        {/* ERROR MESSAGE */}
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

        {/* HINT TEXT */}
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

Textarea.displayName = 'Textarea';

export default Textarea;

