import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import styles from './Button.module.scss';

/**
 * @component Button
 * @description Professional button component with multiple variants, sizes, and states
 * 
 * @param {string} [variant='primary'] - 'primary', 'secondary', 'danger', 'ghost', 'outline'
 * @param {string} [size='medium'] - 'small', 'medium', 'large'
 * @param {boolean} [disabled=false] - Disabled state
 * @param {boolean} [loading=false] - Loading/spinner state
 * @param {React.ReactNode} [icon] - Icon to display before text
 * @param {React.ReactNode} [iconRight] - Icon to display after text
 * @param {boolean} [fullWidth=false] - Full width button
 * @param {string} [className] - Additional CSS classes
 * @param {React.ReactNode} children - Button text/content
 * @param {...any} props - Other HTML button props
 * 
 * @example
 * // Primary button
 * <Button variant="primary" size="medium">Save</Button>
 * 
 * // Danger button with icon
 * <Button variant="danger" icon={<DeleteIcon />}>Delete</Button>
 * 
 * // Loading state
 * <Button loading>Saving...</Button>
 */
export const Button = forwardRef((
  {
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon = null,
    iconRight = null,
    fullWidth = false,
    className = '',
    children,
    ...props
  },
  ref
) => {
  const isDisabled = disabled || loading;

  // Animation variants for button
  const whileHoverVariant = !isDisabled ? { scale: 1.02, y: -2 } : {};
  const whileTapVariant = !isDisabled ? { scale: 0.98, y: 0 } : {};

  return (
    <motion.button
      ref={ref}
      className={`
        ${styles.button}
        ${styles[variant]}
        ${styles[size]}
        ${fullWidth ? styles.fullWidth : ''}
        ${isDisabled ? styles.disabled : ''}
        ${className}
      `.trim()}
      disabled={isDisabled}
      whileHover={whileHoverVariant}
      whileTap={whileTapVariant}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {/* SPINNER */}
      {loading && (
        <motion.span
          className={styles.spinner}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* ICON LEFT */}
      {icon && !loading && (
        <span className={styles.iconLeft}>{icon}</span>
      )}

      {/* TEXT */}
      {children && <span className={styles.text}>{children}</span>}

      {/* ICON RIGHT */}
      {iconRight && !loading && (
        <span className={styles.iconRight}>{iconRight}</span>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
