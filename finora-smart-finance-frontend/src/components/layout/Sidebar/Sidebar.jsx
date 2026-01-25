/**
 * @fileoverview Sidebar Component - Desktop & Mobile Navigation
 * @description Professionelle, saubere Sidebar mit einheitlicher Logik
 * Desktop: Collapsible Fixed Sidebar mit Toggle
 * Mobile: Overlay-Sidebar aus Header/HamburgerMenu geöffnet
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/hooks/useAuth';
import { ThemeSelector, Logo } from '@/components/common';
import { NAV_ITEMS } from '@/config/navigation';
import { FiLogOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import styles from './Sidebar.module.scss';

/**
 * Sidebar Component
 * @param {Object} props
 * @param {boolean} props.isOpen - Mobile: Sidebar sichtbar (Overlay)
 * @param {boolean} props.isCollapsed - Desktop: Sidebar eingeklappt
 * @param {Function} props.onClose - Mobile: Close Handler
 * @param {Function} props.onToggleCollapse - Desktop: Toggle Collapse Handler
 */
function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, isAuthenticated } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const sidebarRef = useRef(null);
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  // ============================================
  // MOBILE: Escape Key Handler
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobile && isOpen) {
        onClose?.();
      }
    };

    if (isMobile && isOpen) {
      document?.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document?.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isMobile, isOpen, onClose]);

  // ============================================
  // MOBILE: Backdrop Click Handler
  // ============================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobile && isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    if (isMobile && isOpen) {
      document?.addEventListener('mousedown', handleClickOutside);
      return () => {
        document?.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMobile, isOpen, onClose]);

  // ============================================
  // Navigation & Auth Handlers
  // ============================================
  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
    // Auto-close mobile sidebar nach Navigation
    if (isMobile) {
      onClose?.();
    }
  }, [navigate, isMobile, onClose]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
      if (isMobile) {
        onClose?.();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, navigate, isMobile, onClose]);

  // ============================================
  // RENDER: MOBILE OVERLAY SIDEBAR
  // ============================================
  if (isMobile) {
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

            {/* Mobile Sidebar */}
            <motion.aside
              ref={sidebarRef}
              className={styles.mobileSidebar}
              initial={{ x: isRtl ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              role="navigation"
              aria-modal="true"
              aria-label={t('common.navigation')}
            >
{/* Mobile Header: Logo */}
            <div className={styles.mobileHeader}>
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

              {/* Mobile Navigation */}
              <nav className={styles.nav}>
                {NAV_ITEMS.map((item, idx) => {
                  const IconComponent = item.icon;
                  const label = t(item.labelKey);
                  const active = isActive(item.path);
                  return (
                    <React.Fragment key={item.path}>
                      <motion.button
                        className={`${styles.navItem} ${active ? styles.active : ''}`}
                        onClick={() => handleNavigate(item.path)}
                        initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ x: isRtl ? -8 : 8, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                        whileTap={{ scale: 0.96 }}
                      >
                        <span className={styles.navIcon}>
                          <IconComponent size={24} />
                        </span>
                        <span className={styles.navLabel}>{label}</span>
                      </motion.button>
                    </React.Fragment>
                  );
                })}
                <motion.div
                  className={styles.themeSection}
                  initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <ThemeSelector />
                </motion.div>
              </nav>

              {/* Mobile Logout */}
              {isAuthenticated && (
                <motion.button
                  className={styles.logoutBtn}
                  onClick={handleLogout}
                  whileHover={{ x: isRtl ? -8 : 8 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <FiLogOut size={20} />
                  <span>{t('nav.logout')}</span>
                </motion.button>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // ============================================
  // RENDER: DESKTOP FIXED SIDEBAR
  // ============================================
  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Header: Collapse Toggle Button */}
      <div className={styles.header}>
        <motion.button
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          title={isCollapsed ? t('common.expand') : t('common.collapse')}
          aria-label={isCollapsed ? t('common.expand') : t('common.collapse')}
        >
          {isCollapsed
            ? (isRtl ? <FiChevronLeft size={20} /> : <FiChevronRight size={20} />)
            : (isRtl ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />)}
        </motion.button>
      </div>

      {/* Desktop Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const label = t(item.labelKey);
          const active = isActive(item.path);
          return (
            <React.Fragment key={item.path}>
              <motion.button
                className={`${styles.navItem} ${active ? styles.active : ''}`}
                onClick={() => handleNavigate(item.path)}
                whileHover={{ x: isCollapsed ? 0 : 4 }}
                whileTap={{ scale: 0.96 }}
                title={label}
              >
                <span className={styles.navIcon}>
                  <IconComponent size={24} />
                </span>
                {!isCollapsed && <span className={styles.navLabel}>{label}</span>}
              </motion.button>
            </React.Fragment>
          );
        })}
        <div className={styles.themeSection}>
          <ThemeSelector isCollapsed={isCollapsed} />
        </div>
      </nav>

      {/* Desktop Footer: Logout */}
      <div className={styles.footer}>
        {isAuthenticated && (
          <motion.button
            className={styles.logoutBtn}
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={t('nav.logout')}
          >
            <span className={styles.logoutIcon}>
              <FiLogOut size={20} />
            </span>
            {!isCollapsed && <span className={styles.logoutLabel}>{t('nav.logout')}</span>}
          </motion.button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
