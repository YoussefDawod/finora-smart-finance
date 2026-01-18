/**
 * @fileoverview Floating Label Input Component
 * @description Input with animated floating label that moves above when focused or has value
 * 
 * FEATURES:
 * - Animated label floats up on focus or value
 * - Supports all input types
 * - Error states with visual feedback
 * - Character counter
 * - Icon support
 * - Accessibility compliant
 * 
 * @module components/common/FloatingLabelInput
 */

import { forwardRef, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './FloatingLabelInput.module.scss';

/**
 * Floating Label Input Component
 * @component
 * @example
 * // Basic
 * <FloatingLabelInput label="E-Mail" type="email" />
 * 
 * // With error
 * <FloatingLabelInput 
 *   label="Passwort" 
 *   type="password" 
 *   error="Zu kurz"
 * />
 * 
 * // With character counter
 * <FloatingLabelInput 
 *   label="Beschreibung" 
 *   maxLength={100}
 *   showCharCount
 * />
 */
const FloatingLabelInput = forwardRef((
  {
    label = '',
    placeholder = '',
    type = 'text',
    error = '',
    hint = '',
    required = false,
    disabled = false,
    size = 'md',
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
  const shouldFloat = isFocused || hasValue;

  // Memoize animation values to prevent unnecessary re-renders
  const labelAnimateValues = useMemo(() => ({
    y: shouldFloat ? -28 : 12,
    scale: shouldFloat ? 0.8 : 1,
    opacity: shouldFloat ? 1 : 0.7,
  }), [shouldFloat]);

  const iconColorLeft = useMemo(() => 
    isFocused ? 'var(--primary)' : hasValue ? 'var(--tx)' : 'var(--tx-muted)',
    [isFocused, hasValue]
  );

  const iconColorRight = useMemo(() => 
    isFocused ? 'var(--primary)' : hasValue ? 'var(--tx)' : 'var(--tx-muted)',
    [isFocused, hasValue]
  );

  // ──────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleChange = useCallback((e) => {
    onChange?.(e);
  }, [onChange]);

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className={`
        ${styles.container}
        ${styles[`size-${size}`]}
        ${hasError ? styles.hasError : ''}
        ${isFocused ? styles.focused : ''}
        ${hasValue ? styles.hasValue : ''}
        ${disabled ? styles.disabled : ''}
        ${className}
      `.trim()}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* FLOATING LABEL */}
      {label && (
        <motion.label
          className={styles.floatingLabel}
          htmlFor={props.id}
          animate={labelAnimateValues}
          transition={{
            type: 'spring',
            stiffness: 140,
            damping: 14,
            mass: 1,
          }}
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
            animate={{
              color: iconColorLeft,
              scale: isFocused ? 1.1 : 1,
            }}
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
          className={`${styles.input} floating-label-input`}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          value={value}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined
          }
          {...props}
        />

        {/* ICON RIGHT */}
        {iconRight && (
          <motion.span
            className={styles.iconRight}
            animate={{
              color: iconColorRight,
              scale: isFocused ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {iconRight}
          </motion.span>
        )}

        {/* FOCUS INDICATOR (only for accessibility) */}
        <motion.div
          className={styles.focusIndicator}
          animate={{
            scaleX: isFocused ? 1 : 0,
            opacity: isFocused ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* FOOTER: ERROR / HINT / CHAR COUNT */}
      <motion.div
        className={styles.footer}
        animate={{
          opacity: error || hint || showCharCount ? 1 : 0,
          height: error || hint || showCharCount ? 'auto' : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        {/* ERROR MESSAGE */}
        {error && (
          <motion.span
            id={`${props.id}-error`}
            className={styles.errorMessage}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            ⚠ {error}
          </motion.span>
        )}

        {/* HINT TEXT */}
        {!error && hint && (
          <motion.span
            id={`${props.id}-hint`}
            className={styles.hintText}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {hint}
          </motion.span>
        )}

        {/* CHARACTER COUNTER */}
        {showCharCount && maxLength && (
          <motion.span
            className={`${styles.charCount} ${
              charCount === maxLength ? styles.maxReached : ''
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {charCount} / {maxLength}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
});

FloatingLabelInput.displayName = 'FloatingLabelInput';

export default FloatingLabelInput;
