import React, { forwardRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './Input.module.scss';

/**
 * @component Input
 * @description Professional input component with label, error state, and animations
 * 
 * @param {string} [label] - Label text displayed above input
 * @param {string} [placeholder] - Placeholder text
 * @param {string} [type='text'] - Input type (text, email, password, number, etc.)
 * @param {string} [error] - Error message to display
 * @param {string} [hint] - Helper text displayed below input
 * @param {boolean} [required=false] - Show required asterisk
 * @param {boolean} [disabled=false] - Disabled state
 * @param {string} [size='medium'] - 'small', 'medium', 'large'
 * @param {React.ReactNode} [icon] - Icon to display inside input (left)
 * @param {React.ReactNode} [iconRight] - Icon to display inside input (right)
 * @param {boolean} [showCharCount=false] - Show character counter
 * @param {number} [maxLength] - Maximum character length
 * @param {string} [className] - Additional CSS classes
 * @param {Function} [onChange] - Change handler
 * @param {...any} props - Other HTML input props
 * 
 * @example
 * // Basic input
 * <Input label="Email" type="email" placeholder="your@email.com" />
 * 
 * // With error
 * <Input label="Password" type="password" error="Password is required" />
 * 
 * // With icon and hint
 * <Input label="Amount" icon={<EuroIcon />} hint="Enter amount in EUR" />
 */
export const Input = forwardRef((
  {
    label = '',
    placeholder = '',
    type = 'text',
    error = '',
    hint = '',
    required = false,
    disabled = false,
    size = 'medium',
    icon = null,
    iconRight = null,
    showCharCount = false,
    maxLength = null,
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
        ${styles.inputGroup}
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

      {/* INPUT WRAPPER */}
      <div className={styles.inputWrapper}>
        {/* ICON LEFT */}
        {icon && (
          <motion.span
            className={styles.iconLeft}
            animate={{ color: isFocused ? 'var(--primary)' : 'var(--text-secondary)' }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.span>
        )}

        {/* INPUT FIELD */}
        <motion.input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={styles.input}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          value={value}
          {...props}
        />

        {/* ICON RIGHT */}
        {iconRight && (
          <motion.span
            className={styles.iconRight}
            animate={{ color: isFocused ? 'var(--primary)' : 'var(--text-secondary)' }}
            transition={{ duration: 0.2 }}
          >
            {iconRight}
          </motion.span>
        )}
      </div>

      {/* HELPER TEXT / ERROR / CHAR COUNT */}
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
            ⚠️ {error}
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

        {/* CHARACTER COUNTER */}
        {showCharCount && maxLength && (
          <motion.p
            className={styles.charCount}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {charCount}/{maxLength}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
});

Input.displayName = 'Input';

export default Input;
