import React from 'react';
import PropTypes from 'prop-types';
import IconLibrary from '../IconLibrary';
import { cn } from '../../utils';
import useTheme from '../../hooks/useTheme';
import './ThemeSwitcher.scss';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'monitor' },
];

function ThemeSwitcher({ compact = false }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className={cn('theme-switcher glass shadow-elevated', { 'theme-switcher--compact': compact })}>
      <div className="theme-switcher__header">
        <p className="theme-switcher__title">Theme</p>
        <span className="theme-switcher__status" aria-live="polite">
          {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
        </span>
      </div>

      <div className="theme-switcher__controls" role="group" aria-label="Theme auswählen">
        {OPTIONS.map((option) => {
          const isActive = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={cn('theme-switcher__btn', { 'is-active': isActive })}
              onClick={() => setTheme(option.value)}
              aria-pressed={isActive}
            >
              <IconLibrary name={option.icon} size={18} />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

ThemeSwitcher.propTypes = {
  compact: PropTypes.bool,
};

export default ThemeSwitcher;
