/**
 * @fileoverview AdminRecentUsers – Letzte registrierte Benutzer
 * @description Kompakte Tabelle der zuletzt registrierten User
 *              für das Admin-Dashboard.
 *
 * @module components/admin/AdminRecentUsers
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUser, FiShield, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import styles from './AdminRecentUsers.module.scss';

/**
 * Formatiert ein Datum relativ (z.B. "vor 2 Tagen")
 * @param {string} dateStr - ISO-Datum
 * @param {string} lang - Sprache für Intl
 * @returns {string}
 */
function formatRelativeDate(dateStr, lang = 'de') {
  if (!dateStr) return '—';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return rtf.format(-seconds, 'second');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return rtf.format(-minutes, 'minute');
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return rtf.format(-hours, 'hour');
    const days = Math.floor(hours / 24);
    if (days < 30) return rtf.format(-days, 'day');
    const months = Math.floor(days / 30);
    return rtf.format(-months, 'month');
  } catch {
    return dateStr;
  }
}

/**
 * AdminRecentUsers Component
 *
 * @param {Object} props
 * @param {Array} props.users - Array von User-Objekten (name, email, role, isVerified, createdAt)
 * @param {boolean} [props.loading=false]
 */
function AdminRecentUsers({ users = [], loading = false }) {
  const { t, i18n } = useTranslation();

  if (loading) {
    return (
      <div className={styles.card} aria-busy="true">
        <h3 className={styles.title}>{t('admin.dashboard.recentUsers')}</h3>
        <div className={styles.list}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.row}>
              <Skeleton variant="circle" width={32} height={32} />
              <div className={styles.rowContent}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="40%" height={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>{t('admin.dashboard.recentUsers')}</h3>
        <p className={styles.empty}>{t('admin.dashboard.noRecentUsers')}</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{t('admin.dashboard.recentUsers')}</h3>
      <div className={styles.list}>
        {users.map((user, idx) => (
          <div key={user._id || user.id || idx} className={styles.row}>
            <div className={`${styles.avatar} ${user.role === 'admin' ? styles.adminAvatar : ''}`}>
              {user.role === 'admin' ? <FiShield size={16} /> : <FiUser size={16} />}
            </div>
            <div className={styles.rowContent}>
              <div className={styles.rowTop}>
                <span className={styles.userName}>{user.name}</span>
                {user.isVerified ? (
                  <FiCheckCircle
                    size={14}
                    className={styles.verified}
                    title={t('admin.dashboard.verified')}
                  />
                ) : (
                  <FiXCircle
                    size={14}
                    className={styles.unverified}
                    title={t('admin.dashboard.unverified')}
                  />
                )}
                {user.role === 'admin' && (
                  <span className={styles.roleBadge}>{t('admin.badge')}</span>
                )}
              </div>
              <span className={styles.meta}>
                {formatRelativeDate(user.createdAt, i18n.language)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(AdminRecentUsers);
