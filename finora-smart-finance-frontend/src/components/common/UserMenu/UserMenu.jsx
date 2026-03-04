/**
 * @fileoverview UserMenu - reusable avatar dropdown
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiLogOut, FiUser } from 'react-icons/fi';
import { useMotion } from '@/hooks/useMotion';
import styles from './UserMenu.module.scss';

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();

  const initials = (user?.name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  useEffect(() => {
    const handleClickOutside = (e) => {
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document?.addEventListener('keydown', handleKeyDown);
      return () => document?.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  const handleLogout = async () => {
    await onLogout?.();
    setOpen(false);
  };

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <motion.button
        className={styles.avatarBtn}
        onClick={() => setOpen((v) => !v)}
        whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
        aria-expanded={open}
        aria-label={t('common.userMenu')}
      >
        <span className={styles.avatarCircle}>{initials}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.dropdownMenu}
            initial={shouldAnimate ? { opacity: 0, y: -8 } : false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
            exit={shouldAnimate ? { opacity: 0, y: -8 } : undefined}
            transition={{ duration: 0.15 }}
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
}
