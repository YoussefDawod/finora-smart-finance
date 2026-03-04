/**
 * @fileoverview Sidebar Component - Desktop & Mobile Navigation
 * @description Professionelle, saubere Sidebar mit einheitlicher Logik
 * Desktop: Collapsible Fixed Sidebar mit Toggle
 * Mobile: wird NICHT gerendert (HamburgerMenu übernimmt)
 */

import React, { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ThemeSelector } from '@/components/common';
import { NAV_ITEMS } from '@/config/navigation';
import { FiLogOut, FiLogIn, FiChevronLeft, FiChevronRight, FiShield } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import styles from './Sidebar.module.scss';

/**
 * Sidebar Component (Desktop only – Mobile uses HamburgerMenu)
 * @param {Object} props
 * @param {boolean} props.isCollapsed - Desktop: Sidebar eingeklappt
 * @param {Function} props.onToggleCollapse - Desktop: Toggle Collapse Handler
 */
function Sidebar({ isCollapsed, onToggleCollapse }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const [autoExpandedForTheme, setAutoExpandedForTheme] = useState(false);

  // ============================================
  // THEME SELECTOR: Auto-expand sidebar when collapsed
  // ============================================
  const handleThemeSectionClick = useCallback(() => {
    if (isCollapsed) {
      onToggleCollapse?.(); // Expand sidebar
      setAutoExpandedForTheme(true);
    }
  }, [isCollapsed, onToggleCollapse]);

  const handleThemeClose = useCallback(() => {
    if (autoExpandedForTheme) {
      onToggleCollapse?.(); // Re-collapse sidebar
      setAutoExpandedForTheme(false);
    }
  }, [autoExpandedForTheme, onToggleCollapse]);

  // ============================================
  // Navigation & Auth Handlers
  // ============================================
  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, navigate]);

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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title={isCollapsed ? t('common.expand') : t('common.collapse')}
          aria-label={isCollapsed ? t('common.expand') : t('common.collapse')}
        >
          {isCollapsed
            ? (isRtl ? <FiChevronLeft size={20} /> : <FiChevronRight size={20} />)
            : (isRtl ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />)}
        </motion.button>
      </div>

      {/* User Card (Desktop) */}
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
            {!isCollapsed && (
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user.name}</div>
                <div className={styles.userEmail}>{user.email}</div>
              </div>
            )}
          </div>
        </div>
      )}

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
                whileHover={{ x: isCollapsed ? 0 : (isRtl ? -4 : 4) }}
                whileTap={{ scale: 0.98 }}
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

        {/* Admin Panel Link */}
        {isAuthenticated && user?.role === 'admin' && (
          <motion.button
            className={`${styles.navItem} ${styles.adminLink} ${location.pathname.startsWith('/admin') ? styles.active : ''}`}
            onClick={() => handleNavigate('/admin')}
            whileHover={{ x: isCollapsed ? 0 : (isRtl ? -4 : 4) }}
            whileTap={{ scale: 0.98 }}
            title={t('nav.adminPanel')}
          >
            <span className={styles.navIcon}>
              <FiShield size={24} />
            </span>
            {!isCollapsed && <span className={styles.navLabel}>{t('nav.adminPanel')}</span>}
          </motion.button>
        )}
      </nav>

      {/* Theme Selector (am unteren Nav-Rand) */}
      <div
        className={styles.themeSection}
        onClick={handleThemeSectionClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleThemeSectionClick(); } }}
        role={isCollapsed ? 'button' : undefined}
        tabIndex={isCollapsed ? 0 : undefined}
        aria-label={isCollapsed ? t('themeSelector.ariaLabel') : undefined}
      >
        <ThemeSelector isCollapsed={isCollapsed} onClose={handleThemeClose} />
      </div>

      {/* Desktop Footer: Logout oder Login */}
      {isAuthenticated ? (
        <div className={styles.footer}>
          <motion.button
            className={styles.logoutBtn}
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={t('nav.logout')}
          >
            <span className={styles.logoutIcon}>
              <FiLogOut size={20} />
            </span>
            {!isCollapsed && <span className={styles.logoutLabel}>{t('nav.logout')}</span>}
          </motion.button>
        </div>
      ) : (
        <div className={styles.footer}>
          <motion.button
            className={styles.loginBtn}
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={t('auth.loginOrRegister')}
          >
            <span className={styles.logoutIcon}>
              <FiLogIn size={20} />
            </span>
            {!isCollapsed && <span className={styles.logoutLabel}>{t('auth.loginOrRegister')}</span>}
          </motion.button>
        </div>
      )}
    </aside>
  );
}

const MemoizedSidebar = React.memo(Sidebar);
MemoizedSidebar.displayName = 'Sidebar';
export default MemoizedSidebar;
