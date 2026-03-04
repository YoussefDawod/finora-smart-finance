/**
 * @fileoverview ThemeSelector Component - Redesigned für Navigation
 * @description Moderne, kompakte Theme-Auswahl Komponente für Sidebar & HamburgerMenu
 * Positioniert UNTER dem "Einstellungen" Navigation-Link
 * 
 * FEATURES:
 * - Light/Dark/System Theme Auswahl
 * - Kompaktes, professionelles Design
 * - Responsive & Accessible
 * - Harmonisch mit Gesamtprojekt
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { useMotion } from '@/hooks/useMotion';
import { FiSun, FiMoon, FiMonitor, FiCheck, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ThemeSelector.module.scss';

function ThemeSelector({ isCollapsed = false, onClose }) {
  const { theme, systemPreference, isInitialized, setTheme, resetToSystemPreference } = useTheme();
  const { t, i18n } = useTranslation();
  const { shouldAnimate } = useMotion();
  const isRtl = i18n.dir() === 'rtl';
  const [isOpen, setIsOpen] = useState(false);
  const [isSystemMode, setIsSystemMode] = useState(() => {
    try { return localStorage.getItem('et-theme-system-mode') === 'true'; }
    catch { return false; }
  });
  const containerRef = useRef(null);

  // ============================================
  // CLOSE ON CLICK OUTSIDE
  // ============================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // ============================================
  // CLOSE ON ESCAPE
  // ============================================
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

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
  // HELPERS
  // ============================================
  const getCurrentLabel = () => {
    if (isSystemMode) return themeLabels.system;
    if (theme === 'dark') return themeLabels.dark;
    return themeLabels.light;
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleThemeSelect = (selectedTheme) => {
    if (selectedTheme === 'system') {
      resetToSystemPreference();
      setIsSystemMode(true);
      try { localStorage.setItem('et-theme-system-mode', 'true'); } catch { /* ignore */ }
    } else {
      setTheme(selectedTheme);
      setIsSystemMode(false);
      try { localStorage.setItem('et-theme-system-mode', 'false'); } catch { /* ignore */ }
    }
    setIsOpen(false);
    onClose?.();
  };



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
          {theme === 'dark' ? <FiMoon size={20} /> : theme === 'light' ? <FiSun size={20} /> : <FiMonitor size={20} />}
        </span>
        {!isCollapsed && (
          <>
            <span className={styles.triggerLabel}>{t('themeSelector.title')}</span>
            <motion.span
              className={styles.triggerArrow}
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiChevronDown size={12} />
            </motion.span>
          </>
        )}
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className={styles.panel}
            initial={shouldAnimate ? { opacity: 0, height: 0 } : false}
            animate={shouldAnimate ? { opacity: 1, height: 'auto' } : false}
            exit={shouldAnimate ? { opacity: 0, height: 0 } : undefined}
            transition={{ duration: 0.18 }}
          >
            {/* Theme Options Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>{t('themeSelector.colorScheme')}</div>
              <div className={styles.options}>
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon;
                  const isActive = themeOption.value === 'system'
                    ? isSystemMode
                    : (!isSystemMode && theme === themeOption.value);
                  return (
                    <motion.button
                      key={themeOption.value}
                      className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
                      onClick={() => handleThemeSelect(themeOption.value)}
                      whileHover={{ x: isRtl ? -2 : 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon size={18} />
                      <span>{themeOption.label}</span>
                      {isActive && <FiCheck size={16} className={styles.checkmark} />}
                    </motion.button>
                  );
                })}
              </div>
            </div>


          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ThemeSelector;
