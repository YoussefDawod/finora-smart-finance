import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA_QUERIES } from '@/constants';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import Footer from '../Footer/Footer';
import styles from './MainLayout.module.scss';

/**
 * MainLayout Component
 * Desktop: Fixed Header + Collapsible Sidebar + Content + Footer
 * Mobile: Sticky Header + Mobile Content + Footer
 *
 * ACHTUNG: 
 * - Desktop Sidebar ist IMMER sichtbar (nie über HamburgerMenu)
 * - Mobile Sidebar wird über Header/HamburgerMenu gesteuert
 * - Navigation schließt Sidebar NICHT erneut
 */
export default function MainLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
  const { t } = useTranslation();
  
  // Only apply sidebar state class on desktop
  const layoutStateClass = isMobile 
    ? '' 
    : (isSidebarCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded);

  /**
   * Toggle sidebar collapse (Desktop only)
   * useCallback ensures stable reference
   */
  const handleToggleCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
      return newState;
    });
  }, []);

  return (
    <div className={styles.mainLayout}>
      {/* ── SKIP LINK ──────────────────────────────── */}
      <a href="#main-content" className={styles.skipLink}>
        {t('common.skipToContent', 'Skip to content')}
      </a>

      {/* Header - Sticky Top */}
      <Header />

      {/* Main Body - Sidebar + Content */}
      <div className={`${styles.mainBody} ${layoutStateClass}`}>
        {/* Desktop Sidebar - Fixed Left (immer sichtbar auf Desktop) */}
        {!isMobile && (
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />
        )}

        {/* Content Area - Scrollable */}
        <div className={styles.contentWrapper}>
          <main 
            id="main-content" 
            className={styles.layoutContent} 
            role="main"
            tabIndex="-1"
          >
            {children || <Outlet />}
          </main>
        </div>
      </div>

      {/* Footer - Full width with dynamic padding for sidebar */}
      <Footer isCollapsed={isSidebarCollapsed} isMobile={isMobile} />
    </div>
  );
}
