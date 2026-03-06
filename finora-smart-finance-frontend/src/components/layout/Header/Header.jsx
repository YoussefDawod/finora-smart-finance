/**
 * @fileoverview Header Component - Vereinfachte Version
 * @description Schlanker Sticky Header nur mit Logo/Hamburger und User Menu
 * 
 * STRUKTUR:
 * Desktop (>768px):  Logo | [space] | Avatar
 * Mobile (≤768px):   Hamburger | [space] | Avatar
 *                    HamburgerMenu: Logo + Navigation
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA_QUERIES } from '@/constants';
import { FiMenu } from 'react-icons/fi';
import { UserMenu } from '@/components/common';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import HamburgerMenu from '../HamburgerMenu/HamburgerMenu';
import styles from './Header.module.scss';

export default function Header() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
  const { t } = useTranslation();
  
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsHamburgerOpen(false);
      }
    };

    document?.addEventListener('keydown', handleKeyDown);
    return () => document?.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/dashboard');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // ============================================
  // RENDER: HEADER (STICKY)
  // ============================================

  return (
    <>
      {/* Header: Logo/Hamburger + Avatar (STICKY) */}
      <header className={styles.headerTop} role="banner">
        {/* Left Section */}
        <div className={styles.headerLeft}>
          {isMobile ? (
            // Mobile: Hamburger Menu
            <motion.button
              className={styles.hamburger}
              onClick={() => setIsHamburgerOpen(!isHamburgerOpen)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label={t('common.menu')}
              aria-expanded={isHamburgerOpen}
            >
              <FiMenu size={24} />
            </motion.button>
          ) : (
            // Desktop: Logo
            <Link to="/" onClick={() => setIsHamburgerOpen(false)}>
              <img src="/logo-branding/finora-logo.svg" alt="Finora" className="app-logo" />
            </Link>
          )}
        </div>

        {/* Right Section: Avatar & User Menu */}
        <div className={styles.headerRight}>
          {isLoading ? (
            // Loading: Skeleton für Avatar
            <Skeleton variant="circle" width="40px" height="40px" />
          ) : isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <span className={styles.adminBadge}>{t('admin.badge', 'Admin')}</span>
              )}
              <UserMenu user={user} onLogout={handleLogout} />
            </>
          ) : (
            <Link to="/login" className={styles.authBtn}>
              {t('auth.loginOrRegister')}
            </Link>
          )}
        </div>
      </header>

      {/* HamburgerMenu (Mobile/Tablet) */}
      <HamburgerMenu isOpen={isHamburgerOpen} onClose={() => setIsHamburgerOpen(false)} />
    </>
  );
}
