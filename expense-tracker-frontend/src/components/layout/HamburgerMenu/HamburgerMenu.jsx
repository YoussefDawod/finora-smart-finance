/**
 * @fileoverview HamburgerMenu - Mobile Navigation Menu
 * @description Overlay-Menü für Tablet und Mobile mit Logo und Navigation
 */

import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ThemeSelector, Logo } from '@/components/common';
import { NAV_ITEMS } from '@/config/navigation';
import { FiLogOut, FiX } from 'react-icons/fi';
import styles from './HamburgerMenu.module.scss';

export default function HamburgerMenu({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, isAuthenticated } = useAuth();
  const menuRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document?.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
      return () => {
        document?.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  // Close on backdrop click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    if (isOpen) {
      document?.addEventListener('mousedown', handleClickOutside);
      return () => {
        document?.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const isActive = (path) => location.pathname === path;

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Menu Overlay */}
          <motion.aside
            ref={menuRef}
            className={styles.menu}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            role="dialog"
            aria-modal="true"
            aria-label="Hauptnavigation"
          >
            {/* Header with Logo and Close Button */}
            <div className={styles.menuHeader}>
              <Logo to="/dashboard" onClick={onClose} />
              <motion.button
                className={styles.closeBtn}
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Menü schließen"
              >
                <FiX size={24} />
              </motion.button>
            </div>

            {/* User Section */}
            {isAuthenticated ? (
              <div className={styles.userSection}>
                <div className={styles.userCard}>
                  <div className={styles.userAvatar}>
                    {user?.name
                      ?.split(' ')
                      .map((p) => p[0])
                      .join('')
                      .toUpperCase() || 'U'}
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user?.name}</div>
                    <div className={styles.userEmail}>{user?.email}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.authSection}>
                <button className={styles.authBtn} onClick={() => handleNavigate('/login')}>
                  Anmelden
                </button>
                <button
                  className={`${styles.authBtn} ${styles.registerBtn}`}
                  onClick={() => handleNavigate('/register')}
                >
                  Registrieren
                </button>
              </div>
            )}

            {/* Navigation Links */}
            <nav className={styles.nav}>
              {NAV_ITEMS.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.button
                    key={item.path}
                    className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
                    onClick={() => handleNavigate(item.path)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 8 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={styles.navIcon}>
                      <IconComponent size={22} />
                    </span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </motion.button>
                );
              })}
            </nav>

            {/* Theme Selector */}
            <div className={styles.themeSection}>
              <ThemeSelector />
            </div>

            {/* Logout Button */}
            {isAuthenticated && (
              <motion.button
                className={styles.logoutBtn}
                onClick={handleLogout}
                whileHover={{ x: 8 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiLogOut size={20} />
                <span>Abmelden</span>
              </motion.button>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
