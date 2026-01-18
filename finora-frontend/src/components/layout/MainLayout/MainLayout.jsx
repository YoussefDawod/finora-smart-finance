import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Only apply sidebar state class on desktop
  const layoutStateClass = isMobile 
    ? '' 
    : (isSidebarCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded);

  // Initialize collapsed state from localStorage
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedCollapsedState));
    }
  }, []);

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
      {/* Header - Sticky Top */}
      <Header />

      {/* Main Body - Sidebar + Content */}
      <div className={`${styles.mainBody} ${layoutStateClass}`}>
        {/* Desktop Sidebar - Fixed Left (immer sichtbar auf Desktop) */}
        {!isMobile && (
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleCollapse}
            isOpen={false}
            onClose={undefined}
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
