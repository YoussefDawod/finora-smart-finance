/**
 * @fileoverview Checkbox — Wiederverwendbare Checkbox-Komponente
 * Konsistente Größe & Styling auf allen Viewports (inkl. Mobile).
 *
 * Props:
 *  - checked       {boolean}    Controlled checked state
 *  - onChange       {function}   (e) => void
 *  - name          {string}     Input name attribute
 *  - disabled      {boolean}    Disabled state
 *  - required      {boolean}    Required for form validation
 *  - label         {string}     Visible label text (optional, use children instead if needed)
 *  - children      {ReactNode}  Rich label content (Trans, links etc.)
 *  - variant       {'default'|'warning'|'error'}
 *  - size          {'default'|'sm'}
 *  - className     {string}     Extra CSS classes on wrapper
 *  - id            {string}     Custom id — auto-generated if omitted
 *  - ...rest                    Passed to native <input>
 *
 * Rules: COLOR_USAGE_RULES.md, MOTION_GLOW_RULES.md
 */

import { memo, useId } from 'react';
import { FiCheck } from 'react-icons/fi';
import s from './Checkbox.module.scss';

function Checkbox({
  checked = false,
  onChange,
  name,
  disabled = false,
  required = false,
  label,
  children,
  variant = 'default',
  size = 'default',
  className = '',
  id: externalId,
  ...rest
}) {
  const autoId = useId();
  const id = externalId || `cb-${autoId}`;

  const wrapperCls = [
    s.label,
    disabled && s.disabled,
    size === 'sm' && s.sm,
    variant === 'warning' && s.warning,
    variant === 'error' && s.error,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label htmlFor={id} className={wrapperCls}>
      <input
        id={id}
        type="checkbox"
        className={s.input}
        checked={checked}
        onChange={onChange}
        name={name}
        disabled={disabled}
        required={required}
        {...rest}
      />
      <span className={s.checkmark} aria-hidden="true">
        <FiCheck />
      </span>
      {(children || label) && (
        <span className={s.text}>{children || label}</span>
      )}
    </label>
  );
}

export default memo(Checkbox);
