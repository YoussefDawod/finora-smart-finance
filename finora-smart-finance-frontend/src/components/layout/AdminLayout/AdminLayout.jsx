/**
 * @fileoverview AdminLayout Component
 * @description Layout für den Admin-Bereich mit eigener Sidebar-Navigation.
 *              Ähnlich wie MainLayout, aber mit Admin-spezifischer Navigation.
 *
 * @module components/layout/AdminLayout
 */

import { useState, useCallback, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/hooks/useAuth';
import { useMotion } from '@/hooks/useMotion';
import { MEDIA_QUERIES } from '@/constants';
import { MOTION_EASING } from '@/utils/motionPresets';
import { UserMenu, ThemeSelector } from '@/components/common';
import { ADMIN_NAV_ITEMS, ADMIN_BACK_LINK } from '@/config/adminNavigation';
import { FiMenu, FiChevronLeft, FiChevronRight, FiLogOut } from 'react-icons/fi';
import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary/AdminErrorBoundary';
import styles from './AdminLayout.module.scss';

// Stabile Motion-Konstanten (kein Inline-Object in JSX)
const MENU_HOVER = { scale: 1.02 };
const MENU_TAP = { scale: 0.98 };
const COLLAPSE_HOVER = { scale: 1.05 };
const COLLAPSE_TAP = { scale: 0.95 };

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout, isViewer } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
  const { shouldAnimate } = useMotion();
  const isRtl = i18n.dir() === 'rtl';

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('admin-sidebar-collapsed');
      if (saved != null) return JSON.parse(saved);
    } catch {
      // Ungültiger localStorage-Wert — Standard beibehalten
    }
    return false;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [autoExpandedForTheme, setAutoExpandedForTheme] = useState(false);

  const handleToggleCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(next));
      return next;
    });
    setAutoExpandedForTheme(false);
  }, []);

  const handleThemeSectionClick = useCallback(() => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      setAutoExpandedForTheme(true);
    }
  }, [isSidebarCollapsed]);

  const handleThemeClose = useCallback(() => {
    if (autoExpandedForTheme) {
      setIsSidebarCollapsed(true);
      setAutoExpandedForTheme(false);
    }
  }, [autoExpandedForTheme]);

  const handleMobileToggle = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev);
  }, []);

  const handleMobileClose = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  // ── Body-Scroll-Lock (Mobile) ───────────────
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMobileSidebarOpen]);

  // ── Escape-Key schließt Mobile-Sidebar ───────
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape' && isMobileSidebarOpen) {
        handleMobileClose();
      }
    };

    if (isMobileSidebarOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isMobileSidebarOpen, handleMobileClose]);

  // Close mobile sidebar on route change by tracking
  // (NavLink onClick closes it directly)

  return (
    <div className={styles.adminLayout}>
      {/* ── SKIP LINK ──────────────────────────────── */}
      <a href="#admin-content" className={styles.skipLink}>
        {t('common.skipToContent', 'Skip to content')}
      </a>

      {/* ── HEADER ─────────────────────────────────── */}
      <header className={styles.adminHeader}>
        <div className={styles.headerLeft}>
          {isMobile && (
            <motion.button
              className={styles.menuButton}
              onClick={handleMobileToggle}
              whileHover={shouldAnimate ? MENU_HOVER : undefined}
              whileTap={shouldAnimate ? MENU_TAP : undefined}
              aria-label={t('common.menu')}
            >
              <FiMenu size={22} />
            </motion.button>
          )}
          {!isMobile && (
            <img
              src="/logo-branding/finora-logo.svg"
              alt="Finora"
              className={styles.adminLogoImg}
            />
          )}
        </div>
        <div className={styles.headerRight}>
          <span className={isViewer ? styles.headerViewerBadge : styles.headerAdminBadge}>
            {isViewer ? t('admin.viewerBadge') : t('admin.badge')}
          </span>
          <UserMenu user={user} onLogout={handleLogout} />
        </div>
      </header>

      {/* ── BODY (Sidebar + Content) ───────────────── */}
      <div
        className={`${styles.adminBody} ${
          !isMobile ? (isSidebarCollapsed ? styles.collapsed : styles.expanded) : ''
        }`}
      >
        {/* ── SIDEBAR ──────────────────────────────── */}

        {/* Desktop Sidebar */}
        {!isMobile && (
          <nav
            className={`${styles.adminSidebar} ${
              isSidebarCollapsed ? styles.sidebarCollapsed : ''
            }`}
            aria-label={t('admin.nav.label', 'Admin Navigation')}
          >
            {/* Collapse toggle */}
            <div className={styles.sidebarHeader}>
              <motion.button
                className={styles.collapseToggle}
                onClick={handleToggleCollapse}
                whileHover={shouldAnimate ? COLLAPSE_HOVER : undefined}
                whileTap={shouldAnimate ? COLLAPSE_TAP : undefined}
                aria-label={
                  isSidebarCollapsed
                    ? t('sidebar.expand', 'Sidebar ausklappen')
                    : t('sidebar.collapse', 'Sidebar einklappen')
                }
              >
                {isSidebarCollapsed ? (
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

            {/* User Card */}
            {user && (
              <div className={styles.userSection}>
                <div className={styles.userCard}>
                  <div className={styles.userAvatar}>
                    {user.name
                      ?.split(' ')
                      .map(p => p[0])
                      .join('')
                      .toUpperCase() || 'U'}
                    <span className={isViewer ? styles.avatarViewerBadge : styles.avatarBadge}>
                      {isViewer ? t('admin.viewerBadge') : t('admin.badge')}
                    </span>
                  </div>
                  {!isSidebarCollapsed && (
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>{user.name}</div>
                      <div className={styles.userEmail}>{user.email}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nav Items */}
            <ul className={styles.navList}>
              {ADMIN_NAV_ITEMS.map(item => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `${styles.navLink} ${isActive ? styles.active : ''}`
                    }
                    title={isSidebarCollapsed ? t(item.labelKey) : undefined}
                  >
                    <span className={styles.navIcon}>
                      <item.icon size={24} />
                    </span>
                    {!isSidebarCollapsed && (
                      <span className={styles.navLabel}>{t(item.labelKey)}</span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Theme Selector */}
            <div
              className={styles.themeSection}
              onClick={handleThemeSectionClick}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleThemeSectionClick();
                }
              }}
              role={isSidebarCollapsed ? 'button' : undefined}
              tabIndex={isSidebarCollapsed ? 0 : undefined}
              aria-label={isSidebarCollapsed ? t('themeSelector.ariaLabel') : undefined}
            >
              <ThemeSelector isCollapsed={isSidebarCollapsed} onClose={handleThemeClose} />
            </div>

            {/* Bottom section */}
            <div className={styles.sidebarBottom}>
              <NavLink
                to={ADMIN_BACK_LINK.path}
                className={styles.navLink}
                title={isSidebarCollapsed ? t(ADMIN_BACK_LINK.labelKey) : undefined}
              >
                <span className={styles.navIcon}>
                  <ADMIN_BACK_LINK.icon size={24} />
                </span>
                {!isSidebarCollapsed && (
                  <span className={styles.navLabel}>{t(ADMIN_BACK_LINK.labelKey)}</span>
                )}
              </NavLink>
              <motion.button
                className={styles.logoutButton}
                onClick={handleLogout}
                title={isSidebarCollapsed ? t('nav.logout') : undefined}
                whileHover={shouldAnimate ? MENU_HOVER : undefined}
                whileTap={shouldAnimate ? MENU_TAP : undefined}
              >
                <span className={styles.logoutIcon}>
                  <FiLogOut size={24} />
                </span>
                {!isSidebarCollapsed && <span className={styles.navLabel}>{t('nav.logout')}</span>}
              </motion.button>
            </div>
          </nav>
        )}

        {/* Mobile Sidebar – AnimatePresence wie HamburgerMenu/Sidebar */}
        {isMobile && (
          <AnimatePresence>
            {isMobileSidebarOpen && (
              <>
                <motion.div
                  className={styles.backdrop}
                  initial={shouldAnimate ? { opacity: 0 } : false}
                  animate={shouldAnimate ? { opacity: 1 } : false}
                  exit={shouldAnimate ? { opacity: 0 } : undefined}
                  transition={{ duration: 0.2 }}
                  onClick={handleMobileClose}
                  aria-hidden="true"
                />
                <motion.nav
                  className={styles.mobileSidebar}
                  initial={shouldAnimate ? { x: isRtl ? '100%' : '-100%' } : false}
                  animate={shouldAnimate ? { x: 0 } : false}
                  exit={shouldAnimate ? { x: isRtl ? '100%' : '-100%' } : undefined}
                  transition={{ type: 'spring', ...MOTION_EASING.spring }}
                  aria-label={t('admin.nav.label', 'Admin Navigation')}
                  aria-modal="true"
                >
                  {/* Mobile Header: Logo */}
                  <div className={styles.mobileHeader}>
                    <img
                      src="/logo-branding/finora-logo.svg"
                      alt="Finora"
                      className="app-logo app-logo--sm"
                    />
                  </div>

                  {/* User Card */}
                  {user && (
                    <div className={styles.userSection}>
                      <div className={styles.userCard}>
                        <div className={styles.userAvatar}>
                          {user.name
                            ?.split(' ')
                            .map(p => p[0])
                            .join('')
                            .toUpperCase() || 'U'}
                          <span
                            className={isViewer ? styles.avatarViewerBadge : styles.avatarBadge}
                          >
                            {isViewer ? t('admin.viewerBadge') : t('admin.badge')}
                          </span>
                        </div>
                        <div className={styles.userInfo}>
                          <div className={styles.userName}>{user.name}</div>
                          <div className={styles.userEmail}>{user.email}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nav Items */}
                  <ul className={styles.navList}>
                    {ADMIN_NAV_ITEMS.map(item => (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          end={item.end}
                          className={({ isActive }) =>
                            `${styles.navLink} ${isActive ? styles.active : ''}`
                          }
                          onClick={handleMobileClose}
                        >
                          <span className={styles.navIcon}>
                            <item.icon size={24} />
                          </span>
                          <span className={styles.navLabel}>{t(item.labelKey)}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>

                  {/* Theme Selector */}
                  <div className={styles.themeSection}>
                    <ThemeSelector />
                  </div>

                  {/* Bottom section */}
                  <div className={styles.sidebarBottom}>
                    <NavLink
                      to={ADMIN_BACK_LINK.path}
                      className={`${styles.navLink} ${styles.backLink}`}
                      onClick={handleMobileClose}
                    >
                      <span className={styles.navIcon}>
                        <ADMIN_BACK_LINK.icon size={24} />
                      </span>
                      <span className={styles.navLabel}>{t(ADMIN_BACK_LINK.labelKey)}</span>
                    </NavLink>
                    <motion.button
                      className={styles.logoutButton}
                      onClick={handleLogout}
                      whileHover={shouldAnimate ? MENU_HOVER : undefined}
                      whileTap={shouldAnimate ? MENU_TAP : undefined}
                    >
                      <span className={styles.logoutIcon}>
                        <FiLogOut size={24} />
                      </span>
                      <span className={styles.navLabel}>{t('nav.logout')}</span>
                    </motion.button>
                  </div>
                </motion.nav>
              </>
            )}
          </AnimatePresence>
        )}

        {/* ── CONTENT ──────────────────────────────── */}
        <div className={styles.contentWrapper}>
          <main id="admin-content" className={styles.adminContent} tabIndex="-1">
            <AdminErrorBoundary t={t}>
              {isViewer && <div className={styles.viewerBanner}>{t('admin.viewer.banner')}</div>}
              <Outlet />
            </AdminErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}
