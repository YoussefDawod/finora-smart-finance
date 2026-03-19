/**
 * @fileoverview CompactWidgetRow Component
 * @description 3-Slot-Grid: Budget | Quota | Retention — jeweils in Mini-GlassPanels.
 * Auf Tablet/Mobile: gestapelt.
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '@/components/common/ErrorBoundary/ErrorBoundary';
import GlassPanel from '../GlassPanel/GlassPanel';
import AuroraBudgetBar from '../AuroraBudgetBar/AuroraBudgetBar';
import QuotaIndicator from '../QuotaIndicator/QuotaIndicator';
import RetentionBanner from '../RetentionBanner/RetentionBanner';
import styles from './CompactWidgetRow.module.scss';

function CompactWidgetRow({ quota, lifecycleStatus, lifecycleLoading, confirmExport }) {
  const navigate = useNavigate();

  const showRetention =
    lifecycleStatus && lifecycleStatus.phase && lifecycleStatus.phase !== 'active';

  return (
    <div className={styles.wrapper}>
      <div className={styles.widgetRow}>
        {/* Budget-Slot */}
        <GlassPanel variant="compact" className={styles.slot}>
          <ErrorBoundary>
            <AuroraBudgetBar />
          </ErrorBoundary>
        </GlassPanel>

        {/* Quota-Slot */}
        <GlassPanel variant="compact" className={styles.slot}>
          <ErrorBoundary>
            <QuotaIndicator quota={quota} isLoading={lifecycleLoading} />
          </ErrorBoundary>
        </GlassPanel>
      </div>

      {/* Retention — nur anzeigen wenn aktiv */}
      {showRetention && (
        <GlassPanel variant="compact" className={styles.slot}>
          <ErrorBoundary>
            <RetentionBanner
              lifecycleStatus={lifecycleStatus}
              onExport={() => navigate('/settings')}
              onConfirmExport={confirmExport}
              isLoading={lifecycleLoading}
            />
          </ErrorBoundary>
        </GlassPanel>
      )}
    </div>
  );
}

export default memo(CompactWidgetRow);
