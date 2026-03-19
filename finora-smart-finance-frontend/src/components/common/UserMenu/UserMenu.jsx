/**
 * @fileoverview UserMenu — Aurora Flow Glass Neubau
 * @description Avatar-Button + Glass-Dropdown (Profile, Logout)
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiLogOut, FiUser } from 'react-icons/fi';
import { useMotion } from '@/hooks/useMotion';
import styles from './UserMenu.module.scss';

// Stabile Motion-Konstanten
const AVATAR_HOVER = { scale: 1.02 };
const AVATAR_TAP = { scale: 0.98 };
const DROPDOWN_INITIAL = { opacity: 0, y: -8 };
const DROPDOWN_ANIMATE = { opacity: 1, y: 0 };
const DROPDOWN_EXIT = { opacity: 0, y: -8 };
const DROPDOWN_TRANSITION = { duration: 0.15 };

export default memo(function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();

  // Memoized Initialen
  const initials = useMemo(
    () =>
      (user?.name || 'U')
        .split(' ')
        .filter(Boolean)
        .map(p => p[0])
        .join('')
        .toUpperCase(),
    [user?.name]
  );

  // Click-outside Detection
  useEffect(() => {
    const handleClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document?.addEventListener('mousedown', handleClickOutside);
      document?.addEventListener('touchstart', handleClickOutside);
      return () => {
        document?.removeEventListener('mousedown', handleClickOutside);
        document?.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [open]);

  // Escape Key
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document?.addEventListener('keydown', handleKeyDown);
      return () => document?.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  // Stabiler Logout-Handler
  const handleLogout = useCallback(async () => {
    await onLogout?.();
    setOpen(false);
  }, [onLogout]);

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <motion.button
        className={styles.avatarBtn}
        onClick={() => setOpen(v => !v)}
        whileHover={shouldAnimate ? AVATAR_HOVER : undefined}
        whileTap={shouldAnimate ? AVATAR_TAP : undefined}
        aria-expanded={open}
        aria-label={t('common.userMenu')}
      >
        <span className={styles.avatarCircle}>{initials}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.dropdownMenu}
            initial={shouldAnimate ? DROPDOWN_INITIAL : false}
            animate={shouldAnimate ? DROPDOWN_ANIMATE : false}
            exit={shouldAnimate ? DROPDOWN_EXIT : undefined}
            transition={DROPDOWN_TRANSITION}
          >
            <div className={styles.dropdownHeader}>
              <div className={styles.dropdownName}>{user?.name}</div>
              <div className={styles.dropdownEmail}>{user?.email}</div>
            </div>

            <Link to="/profile" className={styles.dropdownItem} onClick={() => setOpen(false)}>
              <FiUser size={18} />
              <span>{t('nav.profile')}</span>
            </Link>

            <button className={styles.dropdownItem} onClick={handleLogout}>
              <FiLogOut size={18} />
              <span>{t('nav.logout')}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
