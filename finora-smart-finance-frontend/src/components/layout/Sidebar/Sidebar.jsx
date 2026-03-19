/**
 * @fileoverview Sidebar — Aurora Flow Glass (Desktop only)
 * @description Glass-themed fixed sidebar with collapse toggle.
 * Mobile: nicht gerendert (HamburgerMenu übernimmt).
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useMotion } from '@/hooks/useMotion';
import { ThemeSelector } from '@/components/common';
import { NAV_ITEMS } from '@/config/navigation';
import { FiLogOut, FiLogIn, FiChevronLeft, FiChevronRight, FiShield } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import styles from './Sidebar.module.scss';

// Stable motion constants (outside render — no re-creation)
const HOVER_SCALE = { scale: 1.02 };
const TAP_SCALE = { scale: 0.98 };
const NAV_HOVER_LTR = { x: 4 };
const NAV_HOVER_RTL = { x: -4 };

function Sidebar({ isCollapsed, onToggleCollapse }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, isAuthenticated, isViewer } = useAuth();
  const { t, i18n } = useTranslation();
  const { shouldAnimate } = useMotion();
  const isRtl = i18n.dir() === 'rtl';
  const [autoExpandedForTheme, setAutoExpandedForTheme] = useState(false);

  // Sidebar CSS classes
  const sidebarClasses = useMemo(
    () => `${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`,
    [isCollapsed]
  );

  // Navigation active check
  const isActive = useCallback(path => location.pathname === path, [location.pathname]);

  // Handlers
  const handleThemeSectionClick = useCallback(() => {
    if (isCollapsed) {
      onToggleCollapse?.();
      setAutoExpandedForTheme(true);
    }
  }, [isCollapsed, onToggleCollapse]);

  const handleThemeClose = useCallback(() => {
    if (autoExpandedForTheme) {
      onToggleCollapse?.();
      setAutoExpandedForTheme(false);
    }
  }, [autoExpandedForTheme, onToggleCollapse]);

  const handleNavigate = useCallback(
    path => {
      navigate(path);
    },
    [navigate]
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, navigate]);

  const handleLoginClick = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  // Initials
  const initials = useMemo(() => {
    return (
      user?.name
        ?.split(' ')
        .map(p => p[0])
        .join('')
        .toUpperCase() || 'U'
    );
  }, [user?.name]);

  // Nav hover config (RTL-aware, disabled when collapsed)
  const navHover = isCollapsed ? undefined : isRtl ? NAV_HOVER_RTL : NAV_HOVER_LTR;

  return (
    <aside className={sidebarClasses}>
      {/* 1. Header: Collapse Toggle */}
      <div className={styles.header}>
        <motion.button
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          whileHover={shouldAnimate ? HOVER_SCALE : undefined}
          whileTap={shouldAnimate ? TAP_SCALE : undefined}
          title={isCollapsed ? t('common.expand') : t('common.collapse')}
          aria-label={isCollapsed ? t('common.expand') : t('common.collapse')}
        >
          {isCollapsed ? (
            isRtl ? (
              <FiChevronLeft size={20} />
            ) : (
              <FiChevronRight size={20} />
            )
          ) : isRtl ? (
            <FiChevronRight size={20} />
          ) : (
            <FiChevronLeft size={20} />
          )}
        </motion.button>
      </div>

      {/* 2. UserSection */}
      {isAuthenticated && user && (
        <div className={styles.userSection}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {initials}
              {(user.role === 'admin' || user.role === 'viewer') && (
                <span className={isViewer ? styles.avatarViewerBadge : styles.avatarBadge}>
                  {isViewer ? t('admin.viewerBadge') : t('admin.badge')}
                </span>
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

      {/* 3. Navigation */}
      <nav className={styles.nav} aria-label={t('common.navigation')}>
        {NAV_ITEMS.map(item => {
          const IconComponent = item.icon;
          const label = t(item.labelKey);
          const active = isActive(item.path);
          return (
            <motion.button
              key={item.path}
              className={`${styles.navItem} ${active ? styles.active : ''}`}
              onClick={() => handleNavigate(item.path)}
              whileHover={shouldAnimate ? navHover : undefined}
              whileTap={shouldAnimate ? TAP_SCALE : undefined}
              title={label}
            >
              <span className={styles.navIcon}>
                <IconComponent size={24} />
              </span>
              {!isCollapsed && <span className={styles.navLabel}>{label}</span>}
            </motion.button>
          );
        })}

        {/* Admin Panel Link */}
        {isAuthenticated && (user?.role === 'admin' || user?.role === 'viewer') && (
          <motion.button
            className={`${styles.navItem} ${styles.adminLink} ${location.pathname.startsWith('/admin') ? styles.active : ''}`}
            onClick={() => handleNavigate('/admin')}
            whileHover={shouldAnimate ? navHover : undefined}
            whileTap={shouldAnimate ? TAP_SCALE : undefined}
            title={t('nav.adminPanel')}
          >
            <span className={styles.navIcon}>
              <FiShield size={24} />
            </span>
            {!isCollapsed && <span className={styles.navLabel}>{t('nav.adminPanel')}</span>}
          </motion.button>
        )}
      </nav>

      {/* 4. ThemeSelector */}
      <div
        className={styles.themeSection}
        onClick={handleThemeSectionClick}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleThemeSectionClick();
          }
        }}
        role={isCollapsed ? 'button' : undefined}
        tabIndex={isCollapsed ? 0 : undefined}
        aria-label={isCollapsed ? t('themeSelector.ariaLabel') : undefined}
      >
        <ThemeSelector isCollapsed={isCollapsed} onClose={handleThemeClose} />
      </div>

      {/* 5. Footer: Logout / Login */}
      {isAuthenticated ? (
        <div className={styles.footer}>
          <motion.button
            className={styles.logoutBtn}
            onClick={handleLogout}
            whileHover={shouldAnimate ? HOVER_SCALE : undefined}
            whileTap={shouldAnimate ? TAP_SCALE : undefined}
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
            onClick={handleLoginClick}
            whileHover={shouldAnimate ? HOVER_SCALE : undefined}
            whileTap={shouldAnimate ? TAP_SCALE : undefined}
            title={t('auth.loginOrRegister')}
          >
            <span className={styles.logoutIcon}>
              <FiLogIn size={20} />
            </span>
            {!isCollapsed && (
              <span className={styles.logoutLabel}>{t('auth.loginOrRegister')}</span>
            )}
          </motion.button>
        </div>
      )}
    </aside>
  );
}

const MemoizedSidebar = React.memo(Sidebar);
MemoizedSidebar.displayName = 'Sidebar';
export default MemoizedSidebar;
