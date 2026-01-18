/**
 * @fileoverview HamburgerMenu - Mobile Navigation Menu
 * @description Overlay-Menü für Mobile/Tablet mit Logo, Navigation, ThemeSelector und Logout
 * IDENTISCHE LOGIK wie Sidebar aber KEINE Sidebar-Abhängigkeit
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ThemeSelector, Logo } from '@/components/common';
import { NAV_ITEMS } from '@/config/navigation';
import { FiLogOut } from 'react-icons/fi';
import styles from './HamburgerMenu.module.scss';

/**
 * HamburgerMenu Component - Mobile Navigation
 * @param {Object} props
 * @param {boolean} props.isOpen - Menü sichtbar
 * @param {Function} props.onClose - Close Handler
 */
export default function HamburgerMenu({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, isAuthenticated } = useAuth();
  const menuRef = useRef(null);

  // ============================================
  // ESCAPE KEY HANDLER
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document?.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document?.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  // ============================================
  // BACKDROP CLICK HANDLER
  // ============================================
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

  // ============================================
  // NAVIGATION & AUTH HANDLERS
  // ============================================
  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
    onClose?.();
  }, [navigate, onClose]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
      onClose?.();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, navigate, onClose]);

  // ============================================
  // RENDER
  // ============================================
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
            role="navigation"
            aria-modal="true"
            aria-label="Hauptnavigation"
          >
            {/* Mobile Header: Logo */}
            <div className={styles.menuHeader}>
              <Logo onClick={onClose} />
            </div>

            {/* User Section */}
            {isAuthenticated && user && (
              <div className={styles.userSection}>
                <div className={styles.userCard}>
                  <div className={styles.userAvatar}>
                    {user.name
                      ?.split(' ')
                      .map((p) => p[0])
                      .join('')
                      .toUpperCase() || 'U'}
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className={styles.nav}>
              {NAV_ITEMS.map((item, idx) => {
                const IconComponent = item.icon;
                const active = isActive(item.path);
                return (
                  <React.Fragment key={item.path}>
                    <motion.button
                      className={`${styles.navItem} ${active ? styles.active : ''}`}
                      onClick={() => handleNavigate(item.path)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ x: 8, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <span className={styles.navIcon}>
                        <IconComponent size={24} />
                      </span>
                      <span className={styles.navLabel}>{item.label}</span>
                    </motion.button>
                    {/* ThemeSelector unter Settings Link */}
                    {item.path === '/settings' && (
                      <motion.div
                        className={styles.themeSection}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (idx + 0.5) * 0.05 }}
                      >
                        <ThemeSelector />
                      </motion.div>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>

            {/* Logout Button */}
            {isAuthenticated && (
              <motion.button
                className={styles.logoutBtn}
                onClick={handleLogout}
                whileHover={{ x: 8 }}
                whileTap={{ scale: 0.96 }}
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
