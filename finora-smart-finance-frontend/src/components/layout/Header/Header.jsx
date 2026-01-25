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
import { FiMenu } from 'react-icons/fi';
import { Logo, UserMenu } from '@/components/common';
import HamburgerMenu from '../HamburgerMenu/HamburgerMenu';
import styles from './Header.module.scss';

export default function Header() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
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
      navigate('/login');
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={t('common.menu')}
              aria-expanded={isHamburgerOpen}
            >
              <FiMenu size={24} />
            </motion.button>
          ) : (
            // Desktop: Logo
            <Logo onClick={() => setIsHamburgerOpen(false)} />
          )}
        </div>

        {/* Right Section: Avatar & User Menu */}
        <div className={styles.headerRight}>
          {isAuthenticated && !isLoading ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : !isLoading ? (
            <div className={styles.authBtns}>
              <Link to="/login" className={styles.loginBtn}>
                {t('auth.page.loginTitle')}
              </Link>
              <Link to="/register" className={styles.registerBtn}>
                {t('auth.page.registerAction')}
              </Link>
            </div>
          ) : null}
        </div>
      </header>

      {/* HamburgerMenu (Mobile/Tablet) */}
      <HamburgerMenu isOpen={isHamburgerOpen} onClose={() => setIsHamburgerOpen(false)} />
    </>
  );
}
