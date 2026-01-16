/**
 * @fileoverview Sidebar Component - Professional & Clean
 */

import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/hooks/useAuth';
import { ThemeSelector } from '@/components/common';
import { NAV_ITEMS } from '@/config/navigation';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import styles from './Sidebar.module.scss';

function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, isAuthenticated } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const sidebarRef = useRef(null);

  // Close on escape (mobile) + prevent body scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobile && isOpen && onClose) {
        onClose();
      }
    };

    if (isMobile && isOpen) {
      /* eslint-disable-next-line no-undef */
      document?.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
      return () => {
        /* eslint-disable-next-line no-undef */
        document?.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isMobile, isOpen, onClose]);

  // Close on backdrop click (mobile)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobile && isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    if (isMobile && isOpen) {
      /* eslint-disable-next-line no-undef */
      document?.addEventListener('mousedown', handleClickOutside);
      return () => {
        /* eslint-disable-next-line no-undef */
        document?.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMobile, isOpen, onClose]);

  const isActive = (path) => location.pathname === path;

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile && onClose) onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (isMobile && onClose) onClose();
      navigate('/login');
    } catch (error) {
      // Logout failed silently
    }
  };

  // Mobile: Overlay sidebar
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

            {/* Sidebar */}
            <motion.aside
              ref={sidebarRef}
              className={styles.sidebar}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
            >
              {/* Mobile User Section */}
              {isAuthenticated ? (
                <div className={styles.userSection}>
                  <div className={styles.userCard}>
                    <div className={styles.userAvatar}>
                      {user?.name
                        ?.split(' ')
                        .map((p) => p[0])
                        .join('')
                        .toUpperCase() || 'U'}
                    </div>
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>{user?.name}</div>
                      <div className={styles.userEmail}>{user?.email}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.authSection}>
                  <button className={styles.authBtn} onClick={() => handleNavigate('/login')}>
                    Anmelden
                  </button>
                  <button 
                    className={`${styles.authBtn} ${styles.registerBtn}`} 
                    onClick={() => handleNavigate('/register')}
                  >
                    Registrieren
                  </button>
                </div>
              )}

              {/* Navigation */}
              <nav className={styles.nav}>
                {NAV_ITEMS.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                  <motion.button
                    key={item.path}
                    className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
                    onClick={() => handleNavigate(item.path)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 8 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={styles.navIcon}><IconComponent size={22} /></span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </motion.button>
                  );
                })}
              </nav>
              
              {/* Theme Selector */}
              <div className={styles.themeSection}>
                <ThemeSelector />
              </div>

              {/* Logout */}
              {isAuthenticated && (
                <motion.button 
                  className={styles.logoutBtn} 
                  onClick={handleLogout}
                  whileHover={{ x: 8 }}
                  whileTap={{ scale: 0.98 }}
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

  // Desktop: Fixed sidebar
  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Collapse Button */}
      <div className={styles.header}>
        <motion.button
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={isCollapsed ? 'Erweitern' : 'Einklappen'}
        >
          {isCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          return (
          <motion.button
            key={item.path}
            className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
            onClick={() => handleNavigate(item.path)}
            whileHover={{ x: isCollapsed ? 0 : 4, scale: isCollapsed ? 1.05 : 1 }}
            whileTap={{ scale: 0.95 }}
            title={item.label}
          >
            <span className={styles.navIcon}><IconComponent size={20} /></span>
            {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
          </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        {/* Theme Selector */}
        <ThemeSelector isCollapsed={isCollapsed} />

        {/* Logout */}
        {isAuthenticated && (
          <motion.button 
            className={`${styles.logoutBtn} ${isCollapsed ? styles.collapsedLogoutBtn : ''}`} 
            onClick={handleLogout} 
            title="Logout"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.logoutIcon}><FiLogOut size={20} /></span>
            {!isCollapsed && <span className={styles.logoutLabel}>Abmelden</span>}
          </motion.button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
