import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import Footer from '../Footer/Footer';
import styles from './MainLayout.module.scss';

/**
 * MainLayout Component
 * @component
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - optional: main content (if not using Outlet)
 * @returns {React.ReactElement}
 */
export default function MainLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const layoutStateClass = isSidebarCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded;

  // Initialize collapsed state from localStorage
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedCollapsedState));
    }
  }, []);

  /**
   * Toggle sidebar collapse (desktop)
   */
  const handleToggleCollapse = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={styles.mainLayout}>
      {/* Header */}
      <Header />

      {/* Layout Container */}
      <div className={`${styles.layoutContainer} ${layoutStateClass}`}>
        {/* Desktop Sidebar (always visible, but can collapse) */}
        {!isMobile && (
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleCollapse}
            isOpen={false}
            onClose={undefined}
          />
        )}

        {/* Main Content Area */}
        <main 
          id="main-content" 
          className={styles.layoutContent} 
          role="main"
          tabIndex="-1"
        >
          {children || <Outlet />}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
