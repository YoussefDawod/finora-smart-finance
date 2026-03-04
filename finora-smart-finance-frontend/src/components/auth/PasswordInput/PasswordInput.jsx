/**
 * @fileoverview PasswordInput Component
 * @description Shared password input with visibility toggle for auth forms.
 * Replaces 5 duplicated password field patterns across auth forms.
 *
 * @module components/auth/PasswordInput
 */

import { useState } from 'react';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import ownStyles from './PasswordInput.module.scss';

/**
 * Password input with integrated visibility toggle.
 * Manages show/hide state internally.
 *
 * @param {Object} props
 * @param {Object} props.formStyles - CSS module from the parent form (needs .inputWrapper, .inputIcon, .input)
 * @param {string} [props.wrapperErrorClass=''] - Additional class for error state on the wrapper
 * @param {string} props.showPasswordLabel - Aria label for "show password"
 * @param {string} props.hidePasswordLabel - Aria label for "hide password"
 * @param {...any} inputProps - All remaining props forwarded to the <input>
 */
export default function PasswordInput({
  formStyles,
  wrapperErrorClass = '',
  showPasswordLabel,
  hidePasswordLabel,
  ...inputProps
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`${formStyles.inputWrapper} ${wrapperErrorClass}`.trim()}>
      <FiLock className={formStyles.inputIcon} />
      <input
        {...inputProps}
        type={showPassword ? 'text' : 'password'}
        className={formStyles.input}
      />
      <button
        type="button"
        className={ownStyles.passwordToggle}
        onClick={() => setShowPassword(prev => !prev)}
        tabIndex={-1}
        aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
      >
        {showPassword ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  );
}
