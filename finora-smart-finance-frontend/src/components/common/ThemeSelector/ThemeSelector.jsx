/**
 * @fileoverview ThemeSelector Component - Redesigned für Navigation
 * @description Moderne, kompakte Theme-Auswahl Komponente für Sidebar & HamburgerMenu
 * Positioniert UNTER dem "Einstellungen" Navigation-Link
 * 
 * FEATURES:
 * - Light/Dark/System Theme Auswahl
 * - Glassmorphic Effect Toggle
 * - Kompaktes, professionelles Design
 * - Responsive & Accessible
 * - Harmonisch mit Gesamtprojekt
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { FiSun, FiMoon, FiMonitor, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ThemeSelector.module.scss';

function ThemeSelector({ isCollapsed = false }) {
  const { theme, useGlass, systemPreference, isInitialized, setTheme, setGlassEnabled, resetToSystemPreference } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // ============================================
  // CLOSE ON CLICK OUTSIDE
  // ============================================
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

  // ============================================
  // CLOSE ON ESCAPE
  // ============================================
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

  // ============================================
  // THEME OPTIONS
  // ============================================
  const themeLabels = {
    light: t('settings.appearance.themeLight'),
    dark: t('settings.appearance.themeDark'),
    system: t('settings.appearance.themeSystem'),
  };

  const themes = [
    { value: 'light', label: themeLabels.light, icon: FiSun },
    { value: 'dark', label: themeLabels.dark, icon: FiMoon },
    { value: 'system', label: themeLabels.system, icon: FiMonitor },
  ];

  // ============================================
  // GET CURRENT THEME ICON
  // ============================================
  const getCurrentIcon = () => {
    if (theme === 'dark') return FiMoon;
    if (theme === 'light') return FiSun;
    return FiMonitor;
  };

  const getCurrentLabel = () => {
    if (theme === 'dark') return themeLabels.dark;
    if (theme === 'light') return themeLabels.light;
    return themeLabels.system;
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleThemeSelect = (selectedTheme) => {
    if (selectedTheme === 'system') {
      resetToSystemPreference();
    } else {
      setTheme(selectedTheme);
    }
    setIsOpen(false);
  };

  const handleGlassToggle = () => {
    setGlassEnabled(!useGlass);
  };

  const CurrentIcon = getCurrentIcon();

  // ============================================
  // RENDER
  // ============================================
  return (
    <div ref={containerRef} className={styles.themeSelector}>
      {/* Trigger Button */}
      <motion.button
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''} ${isCollapsed ? styles.triggerCollapsed : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-expanded={isOpen}
        aria-label={t('themeSelector.ariaLabel')}
        title={isCollapsed ? getCurrentLabel() : undefined}
      >
        <span className={styles.triggerIcon}>
          <CurrentIcon size={20} />
        </span>
        {!isCollapsed && (
          <>
            <span className={styles.triggerLabel}>{t('themeSelector.title')}</span>
            <motion.span
              className={styles.triggerArrow}
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ▼
            </motion.span>
          </>
        )}
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Theme Options Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>{t('themeSelector.colorScheme')}</div>
              <div className={styles.options}>
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon;
                  const isActive = (themeOption.value === 'system' && theme === systemPreference) || theme === themeOption.value;
                  return (
                    <motion.button
                      key={themeOption.value}
                      className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
                      onClick={() => handleThemeSelect(themeOption.value)}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Icon size={18} />
                      <span>{themeOption.label}</span>
                      {isActive && <FiCheck size={16} className={styles.checkmark} />}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className={styles.divider} />

            {/* Glass Effect Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>{t('themeSelector.effects')}</div>
              <motion.button
                className={styles.toggleOption}
                onClick={handleGlassToggle}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.96 }}
              >
                <span className={styles.toggleLabel}>{t('themeSelector.glassmorphic')}</span>
                <div className={`${styles.toggle} ${useGlass ? styles.toggleActive : ''}`}>
                  <motion.div
                    className={styles.toggleThumb}
                    layout
                    transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                  />
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ThemeSelector;
