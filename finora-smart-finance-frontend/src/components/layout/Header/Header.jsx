/**
 * @fileoverview Header Component — Aurora Flow Glass Neubau
 * @description Schmale, schwebende Glass-Bar mit Sticky Positioning.
 *
 * STRUKTUR:
 * Desktop (>768px):  Logo | [space] | [Badge] Avatar
 * Mobile (≤768px):   Hamburger | [space] | [Badge] Avatar
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useMotion } from '@/hooks/useMotion';
import { MEDIA_QUERIES } from '@/constants';
import { FiMenu } from 'react-icons/fi';
import { UserMenu } from '@/components/common';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import HamburgerMenu from '../HamburgerMenu/HamburgerMenu';
import styles from './Header.module.scss';

// Stabile Motion-Konstanten (kein Inline-Object in JSX)
const HAMBURGER_HOVER = { scale: 1.02 };
const HAMBURGER_TAP = { scale: 0.98 };

export default function Header() {
  const { user, logout, isAuthenticated, isLoading, isViewer } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();

  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

  // Close HamburgerMenu on Escape
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        setIsHamburgerOpen(false);
      }
    };

    document?.addEventListener('keydown', handleKeyDown);
    return () => document?.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Stabile Logout-Referenz
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/dashboard');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, navigate]);

  return (
    <>
      <header className={styles.header} role="banner">
        {/* Left Section */}
        <div className={styles.headerLeft}>
          {isMobile ? (
            <motion.button
              className={`${styles.hamburger}${isHamburgerOpen ? ` ${styles.open}` : ''}`}
              onClick={() => setIsHamburgerOpen(v => !v)}
              whileHover={shouldAnimate ? HAMBURGER_HOVER : undefined}
              whileTap={shouldAnimate ? HAMBURGER_TAP : undefined}
              aria-label={t('common.menu')}
              aria-expanded={isHamburgerOpen ? 'true' : 'false'}
            >
              <FiMenu size={24} />
            </motion.button>
          ) : (
            <Link to="/" className={styles.logo} onClick={() => setIsHamburgerOpen(false)}>
              <img src="/logo-branding/finora-logo.svg" alt="Finora" />
            </Link>
          )}
        </div>

        {/* Right Section */}
        <div className={styles.headerRight}>
          {isLoading ? (
            <Skeleton variant="circle" width="40px" height="40px" />
          ) : isAuthenticated ? (
            <>
              {(user?.role === 'admin' || user?.role === 'viewer') && (
                <span className={isViewer ? styles.viewerBadge : styles.adminBadge}>
                  {isViewer ? t('admin.viewerBadge') : t('admin.badge')}
                </span>
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
