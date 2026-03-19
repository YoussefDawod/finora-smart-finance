/**
 * @fileoverview HamburgerMenu — Aurora Flow Glass (Mobile/Tablet)
 * @description Glass overlay panel with slide animation, focus-trap, stagger nav items.
 * Desktop: nicht sichtbar (Sidebar übernimmt).
 */

import { useEffect, useRef, useCallback } from 'react';
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

// Stable motion constants (outside render)
const BACKDROP_TRANSITION = { duration: 0.2 };
const MENU_SPRING = { type: 'spring', ...MOTION_EASING.spring };
const NAV_HOVER_LTR = { x: 8 };
const NAV_HOVER_RTL = { x: -8 };
const TAP_SCALE = { scale: 0.98 };

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function HamburgerMenu({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, isAuthenticated, isViewer } = useAuth();
  const menuRef = useRef(null);
  const { t, i18n } = useTranslation();
  const { shouldAnimate } = useMotion();
  const isRtl = i18n.dir() === 'rtl';

  // ── Escape Key + Body Scroll Lock ──
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = e => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // ── Focus-Trap ──
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const focusableEls = menuRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
    const firstEl = focusableEls[0];
    const lastEl = focusableEls[focusableEls.length - 1];

    firstEl?.focus();

    const handleTab = e => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // ── Handlers ──
  const isActive = useCallback(path => location.pathname === path, [location.pathname]);

  const handleNavigate = useCallback(
    path => {
      navigate(path);
      onClose?.();
    },
    [navigate, onClose]
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/dashboard', { replace: true });
      onClose?.();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, navigate, onClose]);

  const handleLoginClick = useCallback(() => {
    navigate('/login');
    onClose?.();
  }, [navigate, onClose]);

  // Nav hover config (RTL-aware)
  const navHover = isRtl ? NAV_HOVER_RTL : NAV_HOVER_LTR;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 1. Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={shouldAnimate ? { opacity: 1 } : false}
            exit={shouldAnimate ? { opacity: 0 } : undefined}
            transition={BACKDROP_TRANSITION}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* 2. Menu Panel */}
          <motion.aside
            ref={menuRef}
            className={styles.menu}
            initial={shouldAnimate ? { x: isRtl ? '100%' : '-100%' } : false}
            animate={shouldAnimate ? { x: 0 } : false}
            exit={shouldAnimate ? { x: isRtl ? '100%' : '-100%' } : undefined}
            transition={MENU_SPRING}
            role="dialog"
            aria-modal="true"
            aria-label={t('common.navigation')}
          >
            {/* 2a. Header: Logo */}
            <div className={styles.menuHeader}>
              <Link to="/" onClick={onClose}>
                <img
                  src="/logo-branding/finora-logo.svg"
                  alt="Finora"
                  className="app-logo app-logo--sm"
                />
              </Link>
            </div>

            {/* 2b. UserSection */}
            {isAuthenticated && user && (
              <div className={styles.userSection}>
                <div className={styles.userCard}>
                  <div className={styles.userAvatar}>
                    {user.name
                      ?.split(' ')
                      .map(p => p[0])
                      .join('')
                      .toUpperCase() || 'U'}
                    {(user?.role === 'admin' || isViewer) && (
                      <span className={isViewer ? styles.avatarViewerBadge : styles.avatarBadge}>
                        {isViewer ? t('admin.viewerBadge') : t('admin.badge')}
                      </span>
                    )}
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 2c. Scrollable Content */}
            <div className={styles.menuContent}>
              <nav className={styles.nav} aria-label={t('common.navigation')}>
                {NAV_ITEMS.map((item, idx) => {
                  const IconComponent = item.icon;
                  const label = item.labelKey ? t(item.labelKey) : item.label;
                  const active = isActive(item.path);
                  return (
                    <motion.button
                      key={item.path}
                      className={`${styles.navItem} ${active ? styles.active : ''}`}
                      onClick={() => handleNavigate(item.path)}
                      initial={shouldAnimate ? { opacity: 0, x: isRtl ? 20 : -20 } : false}
                      animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={shouldAnimate ? navHover : undefined}
                      whileTap={shouldAnimate ? TAP_SCALE : undefined}
                    >
                      <span className={styles.navIcon}>
                        <IconComponent size={24} />
                      </span>
                      <span className={styles.navLabel}>{label}</span>
                    </motion.button>
                  );
                })}

                {/* Admin Panel Link */}
                {isAuthenticated && (user?.role === 'admin' || user?.role === 'viewer') && (
                  <motion.button
                    className={`${styles.navItem} ${styles.adminLink} ${location.pathname.startsWith('/admin') ? styles.active : ''}`}
                    onClick={() => handleNavigate('/admin')}
                    initial={shouldAnimate ? { opacity: 0, x: isRtl ? 20 : -20 } : false}
                    animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                    transition={{ delay: 0.35 }}
                    whileHover={shouldAnimate ? navHover : undefined}
                    whileTap={shouldAnimate ? TAP_SCALE : undefined}
                  >
                    <span className={styles.navIcon}>
                      <FiShield size={24} />
                    </span>
                    <span className={styles.navLabel}>{t('nav.adminPanel')}</span>
                  </motion.button>
                )}

                {/* ThemeSelector */}
                <motion.div
                  className={styles.themeSection}
                  initial={shouldAnimate ? { opacity: 0, x: isRtl ? 20 : -20 } : false}
                  animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                  transition={{ delay: 0.3 }}
                >
                  <ThemeSelector />
                </motion.div>
              </nav>
            </div>

            {/* 2d. Footer: Logout / Login */}
            {isAuthenticated ? (
              <div className={styles.menuFooter}>
                <motion.button
                  className={styles.logoutBtn}
                  onClick={handleLogout}
                  whileHover={shouldAnimate ? navHover : undefined}
                  whileTap={shouldAnimate ? TAP_SCALE : undefined}
                >
                  <FiLogOut size={20} />
                  <span>{t('nav.logout')}</span>
                </motion.button>
              </div>
            ) : (
              <div className={styles.menuFooter}>
                <motion.button
                  className={styles.loginBtn}
                  onClick={handleLoginClick}
                  whileHover={shouldAnimate ? navHover : undefined}
                  whileTap={shouldAnimate ? TAP_SCALE : undefined}
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
