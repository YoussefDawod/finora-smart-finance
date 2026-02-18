/**
 * @fileoverview ModalSkeleton - Loading-Skeleton für Modal-Inhalte
 * @description Vorkonfigurierte Skeleton-Layouts für verschiedene Modal-Typen
 * 
 * FEATURES:
 * - Formular-Skeleton (Inputs, Buttons)
 * - Bestätigungs-Skeleton
 * - Anpassbare Zeilen
 * - ARIA-Accessibility
 * 
 * @module components/common/Modal/ModalSkeleton
 */

import { useTranslation } from 'react-i18next';
import styles from './ModalSkeleton.module.scss';

/**
 * Verschiedene Skeleton-Varianten für Modals
 * @param {'form' | 'confirm' | 'detail'} variant - Layout-Variante
 * @param {number} rows - Anzahl der Formularzeilen (bei form variant)
 */
const ModalSkeleton = ({ 
  variant = 'form', 
  rows = 4,
  showActions = true,
}) => {
  const { t } = useTranslation();

  // ──────────────────────────────────────────────────────────────────────
  // FORM SKELETON - Für Formulare (z.B. TransactionForm)
  // ──────────────────────────────────────────────────────────────────────
  const renderFormSkeleton = () => (
    <div 
      className={styles.formSkeleton}
      role="status"
      aria-busy="true"
      aria-label={t('common.loadingContent')}
    >
      {/* Formular-Felder */}
      <div className={styles.fieldsGrid}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={styles.fieldGroup}>
            <div className={styles.label} />
            <div className={styles.input} />
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className={styles.actions}>
          <div className={styles.buttonSecondary} />
          <div className={styles.buttonPrimary} />
        </div>
      )}
    </div>
  );

  // ──────────────────────────────────────────────────────────────────────
  // CONFIRM SKELETON - Für Bestätigungs-Dialoge
  // ──────────────────────────────────────────────────────────────────────
  const renderConfirmSkeleton = () => (
    <div 
      className={styles.confirmSkeleton}
      role="status"
      aria-busy="true"
      aria-label={t('common.loadingContent')}
    >
      {/* Icon Placeholder */}
      <div className={styles.iconCircle} />

      {/* Text */}
      <div className={styles.titleLine} />
      <div className={styles.descriptionLine} />
      <div className={styles.descriptionLineShort} />

      {/* Buttons */}
      {showActions && (
        <div className={styles.actions}>
          <div className={styles.buttonSecondary} />
          <div className={styles.buttonDanger} />
        </div>
      )}
    </div>
  );

  // ──────────────────────────────────────────────────────────────────────
  // DETAIL SKELETON - Für Detail-Ansichten
  // ──────────────────────────────────────────────────────────────────────
  const renderDetailSkeleton = () => (
    <div 
      className={styles.detailSkeleton}
      role="status"
      aria-busy="true"
      aria-label={t('common.loadingContent')}
    >
      {/* Header */}
      <div className={styles.detailHeader}>
        <div className={styles.avatar} />
        <div className={styles.headerText}>
          <div className={styles.titleLine} />
          <div className={styles.subtitleLine} />
        </div>
      </div>

      {/* Content Rows */}
      <div className={styles.detailRows}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={styles.detailRow}>
            <div className={styles.rowLabel} />
            <div className={styles.rowValue} />
          </div>
        ))}
      </div>

      {/* Actions */}
      {showActions && (
        <div className={styles.actions}>
          <div className={styles.buttonPrimary} />
        </div>
      )}
    </div>
  );

  // Render based on variant
  switch (variant) {
    case 'confirm':
      return renderConfirmSkeleton();
    case 'detail':
      return renderDetailSkeleton();
    case 'form':
    default:
      return renderFormSkeleton();
  }
};

export default ModalSkeleton;
