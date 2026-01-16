/**
 * @fileoverview ThemeSelector - Accordion Style Component
 * Expands inline to show theme options and effects
 */

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { FiSun, FiMoon, FiCheck, FiMonitor, FiFilter } from 'react-icons/fi';
import styles from './ThemeSelector.module.scss';

function ThemeSelector({ isCollapsed = false }) {
  const { theme, useGlass, systemPreference, isInitialized, setTheme, setGlassEnabled, resetToSystemPreference } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  if (!isInitialized) {
    return null;
  }

  const getThemeIcon = () => (theme === 'dark' ? <FiMoon size={16} /> : <FiSun size={16} />);
  const getThemeLabel = () => {
    switch (theme) {
      case 'dark':
        return 'Dunkel';
      case 'light':
        return 'Hell';
      default:
        return 'Theme';
    }
  };

  const handleThemeSelect = (selectedTheme) => {
    if (selectedTheme === 'system') {
      resetToSystemPreference();
    } else {
      setTheme(selectedTheme);
    }
  };

  const handleGlassToggle = () => {
    setGlassEnabled(!useGlass);
  };

  const themes = [
    { value: 'light', label: 'Hell', icon: FiSun },
    { value: 'dark', label: 'Dunkel', icon: FiMoon },
    { value: 'system', label: 'System', icon: FiMonitor },
  ];

  // Collapsed mode - vertical small button
  if (isCollapsed) {
    return (
      <div ref={containerRef} className={`${styles.wrapper} ${styles.collapsedWrapper}`}>
        <button
          type="button"
          className={`${styles.button} ${styles.collapsedButton} ${isOpen ? styles.isOpen : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Design Menü"
          title={getThemeLabel()}
        >
          <span className={styles.icon}>{getThemeIcon()}</span>
        </button>

        {/* Accordion Content */}
        {isOpen && (
          <div ref={contentRef} className={`${styles.content} ${styles.collapsedContent}`}>
            {/* Theme Options */}
            <div className={styles.section}>
              <div className={styles.sectionLabel}>🎨 Farbschema</div>
              {themes.map((t) => {
                const Icon = t.icon;
                const isActive = (t.value === 'system' && theme === systemPreference) || theme === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
                    onClick={() => handleThemeSelect(t.value)}
                    role="option"
                    aria-selected={isActive}
                  >
                    <Icon size={16} />
                    <span>{t.label}</span>
                    {isActive && <FiCheck size={16} className={styles.checkmark} />}
                  </button>
                );
              })}
            </div>

            <div className={styles.divider} />

            {/* Glass Effect Toggle */}
            <div className={styles.section}>
              <div className={styles.sectionLabel}>✨ Effekte</div>
              <button
                type="button"
                className={`${styles.menuItem} ${styles.toggleItem}`}
                onClick={handleGlassToggle}
              >
                <FiFilter size={16} />
                <span>Glasmorphic</span>
                <div className={`${styles.toggleSwitch} ${useGlass ? styles.toggleActive : ''}`}>
                  <div className={styles.toggleThumb} />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Expanded mode - full accordion
  return (
    <div ref={containerRef} className={`${styles.wrapper} ${isOpen ? styles.wrapperOpen : ''}`}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`${styles.button} ${isOpen ? styles.isOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Design Menü"
      >
        <span className={styles.icon}>{getThemeIcon()}</span>
        <span className={styles.label}>{getThemeLabel()}</span>
        <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>▼</span>
      </button>

      {/* Accordion Content - Inline */}
      {isOpen && (
        <div ref={contentRef} className={styles.content}>
          {/* Theme Options */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>🎨 Farbschema</div>
            {themes.map((t) => {
              const Icon = t.icon;
              const isActive = (t.value === 'system' && theme === systemPreference) || theme === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
                  onClick={() => handleThemeSelect(t.value)}
                  role="option"
                  aria-selected={isActive}
                >
                  <Icon size={16} />
                  <span>{t.label}</span>
                  {isActive && <FiCheck size={16} className={styles.checkmark} />}
                </button>
              );
            })}
          </div>

          <div className={styles.divider} />

          {/* Glass Effect Toggle */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>✨ Effekte</div>
            <button
              type="button"
              className={`${styles.menuItem} ${styles.toggleItem}`}
              onClick={handleGlassToggle}
            >
              <FiFilter size={16} />
              <span>Glasmorphic</span>
              <div className={`${styles.toggleSwitch} ${useGlass ? styles.toggleActive : ''}`}>
                <div className={styles.toggleThumb} />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeSelector;
