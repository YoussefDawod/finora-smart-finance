/**
 * @fileoverview RetentionBanner Component
 * @description Banner-Komponente für Datenaufbewahrungs-Warnungen und -Status
 *
 * Zeigt phasenabhängig Info/Warnung/Gefahr an:
 * - active:       nichts anzeigen (keine alten Transaktionen)
 * - reminding:    Info-Banner mit Export-Empfehlung
 * - finalWarning: Warn-Banner mit Countdown
 * - gracePeriod:  Danger-Banner — letzte Chance
 * - deleted:      Info-Banner — Löschung abgeschlossen
 *
 * @module components/dashboard/RetentionBanner
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiDownload } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useMotion } from '@/hooks/useMotion';
import styles from './RetentionBanner.module.scss';

/**
 * Phase → visuelles Mapping
 */
const PHASE_CONFIG = {
  reminding: {
    variant: 'info',
    Icon: FiClock,
  },
  finalWarning: {
    variant: 'warning',
    Icon: FiAlertTriangle,
  },
  gracePeriod: {
    variant: 'danger',
    Icon: FiAlertCircle,
  },
  deleted: {
    variant: 'neutral',
    Icon: FiCheckCircle,
  },
};

export default function RetentionBanner({
  lifecycleStatus,
  onExport,
  onConfirmExport,
  isLoading = false,
}) {
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();

  const phaseConfig = useMemo(() => {
    if (!lifecycleStatus) return null;
    const phase = lifecycleStatus.phase;
    if (!phase || phase === 'active') return null;
    return PHASE_CONFIG[phase] || null;
  }, [lifecycleStatus]);

  // Nicht anzeigen bei active-Phase oder fehlenden Daten
  if (!phaseConfig || !lifecycleStatus) return null;

  const { variant, Icon } = phaseConfig;
  const { phase, oldTransactionCount, daysRemaining, hasExported } = lifecycleStatus;

  return (
    <AnimatePresence>
      <motion.div
        className={`${styles.retentionBanner} ${styles[variant]}`}
        role="alert"
        aria-live="polite"
        initial={shouldAnimate ? { opacity: 0, y: -10 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
        exit={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.iconWrapper}>
          <Icon aria-hidden="true" />
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <h4 className={styles.title}>{t('lifecycle.retention.title')}</h4>
            <span className={`${styles.phaseBadge} ${styles[variant]}`}>
              {t(`lifecycle.retention.phase.${phase}`)}
            </span>
          </div>

          <p className={styles.message}>
            {oldTransactionCount > 0
              ? t('lifecycle.retention.oldTransactions', { count: oldTransactionCount })
              : t('lifecycle.retention.noOldTransactions')}
          </p>

          {daysRemaining != null && daysRemaining > 0 && (
            <p className={styles.countdown}>
              {t('lifecycle.retention.daysRemaining', { days: daysRemaining })}
            </p>
          )}

          {hasExported && (
            <p className={styles.exported}>
              <FiCheckCircle />
              {t('lifecycle.retention.exportConfirmed', {
                date: lifecycleStatus.exportDate || '—',
              })}
            </p>
          )}

          {/* Aktionen — nur bei aktiven Phasen ohne bestätigten Export */}
          {!hasExported && phase !== 'deleted' && (
            <div className={styles.actions}>
              {onExport && (
                <button type="button" className={styles.exportBtn} onClick={onExport}>
                  <FiDownload />
                  {t('lifecycle.retention.exportButton')}
                </button>
              )}
              {onConfirmExport && (
                <button
                  type="button"
                  className={styles.confirmBtn}
                  onClick={onConfirmExport}
                  disabled={isLoading}
                >
                  {t('lifecycle.retention.confirmExport')}
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
