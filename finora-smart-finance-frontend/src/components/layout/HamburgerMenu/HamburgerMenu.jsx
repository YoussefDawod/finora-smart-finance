/**
 * @fileoverview HamburgerMenu - Mobile Navigation Menu
 * @description Overlay-Menü für Mobile/Tablet mit Logo, Navigation, ThemeSelector und Logout
 * IDENTISCHE LOGIK wie Sidebar aber KEINE Sidebar-Abhängigkeit
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useMotion } from '@/hooks/useMotion';
import { MOTION_EASING } from '@/utils/motionPresets';
import { ThemeSelector } from '@/components/common';
import { NAV_ITEMS } from '@/config/navigation';
import { FiLogOut, FiLogIn, FiShield } from 'react-icons/fi';
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
  const { t, i18n } = useTranslation();
  const { shouldAnimate } = useMotion();
  const isRtl = i18n.dir() === 'rtl';

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
      navigate('/dashboard', { replace: true });
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
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={shouldAnimate ? { opacity: 1 } : false}
            exit={shouldAnimate ? { opacity: 0 } : undefined}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Menu Overlay */}
          <motion.aside
            ref={menuRef}
            className={styles.menu}
            initial={shouldAnimate ? { x: isRtl ? '100%' : '-100%' } : false}
            animate={shouldAnimate ? { x: 0 } : false}
            exit={shouldAnimate ? { x: isRtl ? '100%' : '-100%' } : undefined}
            transition={{ type: 'spring', ...MOTION_EASING.spring }}
            role="navigation"
            aria-modal="true"
            aria-label={t('common.navigation')}
          >
            {/* Mobile Header: Logo */}
            <div className={styles.menuHeader}>
              <Link to="/" onClick={onClose}>
                <img src="/logo-branding/finora-logo.svg" alt="Finora" className="app-logo app-logo--sm" />
              </Link>
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
                    {user.role === 'admin' && (
                      <span className={styles.avatarBadge}>{t('admin.badge', 'Admin')}</span>
                    )}
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.menuContent}>
              {/* Navigation */}
              <nav className={styles.nav}>
                {NAV_ITEMS.map((item, idx) => {
                  const IconComponent = item.icon;
                  const label = item.labelKey ? t(item.labelKey) : item.label;
                  const active = isActive(item.path);
                  return (
                    <React.Fragment key={item.path}>
                      <motion.button
                        className={`${styles.navItem} ${active ? styles.active : ''}`}
                        onClick={() => handleNavigate(item.path)}
                        initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ x: isRtl ? -8 : 8 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className={styles.navIcon}>
                          <IconComponent size={24} />
                        </span>
                        <span className={styles.navLabel}>{label}</span>
                      </motion.button>
                    </React.Fragment>
                  );
                })}

                {/* Admin Panel Link */}
                {isAuthenticated && user?.role === 'admin' && (
                  <motion.button
                    className={`${styles.navItem} ${styles.adminLink} ${location.pathname.startsWith('/admin') ? styles.active : ''}`}
                    onClick={() => handleNavigate('/admin')}
                    initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    whileHover={{ x: isRtl ? -8 : 8 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={styles.navIcon}>
                      <FiShield size={24} />
                    </span>
                    <span className={styles.navLabel}>{t('nav.adminPanel')}</span>
                  </motion.button>
                )}

                {/* Theme Selector (am unteren Nav-Rand) */}
                <motion.div
                  className={styles.themeSection}
                  initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <ThemeSelector />
                </motion.div>
              </nav>
            </div>

            {/* Footer: Logout oder Login */}
            {isAuthenticated ? (
              <div className={styles.menuFooter}>
                <motion.button
                  className={styles.logoutBtn}
                  onClick={handleLogout}
                  whileHover={{ x: isRtl ? -8 : 8 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiLogOut size={20} />
                  <span>{t('nav.logout')}</span>
                </motion.button>
              </div>
            ) : (
              <div className={styles.menuFooter}>
                <motion.button
                  className={styles.loginBtn}
                  onClick={() => { navigate('/login'); onClose?.(); }}
                  whileHover={{ x: isRtl ? -8 : 8 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiLogIn size={20} />
                  <span>{t('auth.loginOrRegister')}</span>
                </motion.button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
