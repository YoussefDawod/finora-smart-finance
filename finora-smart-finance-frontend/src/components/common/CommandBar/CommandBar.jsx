/**
 * @fileoverview CommandBar Component
 * @description Raycast/Spotlight-style Ctrl+K command palette with Glass styling.
 * Provides quick navigation and actions across the app.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useMotion } from '@/hooks/useMotion';
import { useTheme } from '@/hooks/useTheme';
import { FiSearch, FiHome, FiDollarSign, FiSettings, FiUser, FiPlus, FiSun } from 'react-icons/fi';
import styles from './CommandBar.module.scss';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.97,
    transition: { duration: 0.12, ease: 'easeIn' },
  },
};

export default function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();
  const { toggleTheme } = useTheme();

  // Command definitions
  const commands = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-dashboard',
        section: 'navigation',
        label: t('dashboard.commandBar.goToDashboard'),
        icon: FiHome,
        action: () => navigate('/dashboard'),
      },
      {
        id: 'nav-transactions',
        section: 'navigation',
        label: t('dashboard.commandBar.goToTransactions'),
        icon: FiDollarSign,
        action: () => navigate('/transactions'),
      },
      {
        id: 'nav-settings',
        section: 'navigation',
        label: t('dashboard.commandBar.goToSettings'),
        icon: FiSettings,
        action: () => navigate('/settings'),
      },
      {
        id: 'nav-profile',
        section: 'navigation',
        label: t('dashboard.commandBar.goToProfile'),
        icon: FiUser,
        action: () => navigate('/profile'),
      },
      // Actions
      {
        id: 'act-new-tx',
        section: 'actions',
        label: t('dashboard.commandBar.newTransaction'),
        icon: FiPlus,
        action: () => navigate('/transactions'),
      },
      {
        id: 'act-theme',
        section: 'actions',
        label: t('dashboard.commandBar.toggleTheme'),
        icon: FiSun,
        action: toggleTheme,
      },
    ],
    [t, navigate, toggleTheme]
  );

  // Filter commands by query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(cmd => cmd.label.toLowerCase().includes(q));
  }, [query, commands]);

  // Group by section
  const sections = useMemo(() => {
    const map = new Map();
    for (const cmd of filtered) {
      if (!map.has(cmd.section)) map.set(cmd.section, []);
      map.get(cmd.section).push(cmd);
    }
    return map;
  }, [filtered]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const executeCommand = useCallback(
    cmd => {
      close();
      // Wait for overlay to exit before navigating
      setTimeout(() => cmd.action(), 80);
    },
    [close]
  );

  // Global Ctrl+K / ⌘K listener
  useEffect(() => {
    const handler = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        if (!isOpen) {
          setQuery('');
          setActiveIndex(0);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filtered[activeIndex]) {
        e.preventDefault();
        executeCommand(filtered[activeIndex]);
      }
    },
    [filtered, activeIndex, executeCommand]
  );

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const sectionLabels = {
    navigation: t('dashboard.commandBar.sections.navigation'),
    actions: t('dashboard.commandBar.sections.actions'),
  };

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          variants={overlayVariants}
          initial={shouldAnimate ? 'hidden' : false}
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.15 }}
          onClick={close}
        >
          <motion.div
            className={styles.panel}
            variants={panelVariants}
            initial={shouldAnimate ? 'hidden' : false}
            animate="visible"
            exit="exit"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-label="Command Bar"
          >
            {/* Search input */}
            <div className={styles.inputRow}>
              <FiSearch className={styles.searchIcon} />
              <input
                ref={inputRef}
                id="command-bar-search"
                name="command-bar-search"
                className={styles.input}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('dashboard.commandBar.placeholder')}
                spellCheck={false}
                autoComplete="off"
              />
              <kbd className={styles.kbd}>Esc</kbd>
            </div>

            {/* Results */}
            <div className={styles.results} ref={listRef} role="listbox">
              {filtered.length === 0 ? (
                <div className={styles.noResults}>{t('dashboard.commandBar.noResults')}</div>
              ) : (
                Array.from(sections.entries()).map(([section, cmds]) => (
                  <div key={section} className={styles.section}>
                    <div className={styles.sectionLabel}>{sectionLabels[section] || section}</div>
                    {cmds.map(cmd => {
                      flatIndex++;
                      const idx = flatIndex;
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          className={`${styles.resultItem} ${idx === activeIndex ? styles.active : ''}`}
                          data-index={idx}
                          role="option"
                          aria-selected={idx === activeIndex}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          type="button"
                        >
                          <Icon className={styles.resultIcon} />
                          <span className={styles.resultLabel}>{cmd.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
