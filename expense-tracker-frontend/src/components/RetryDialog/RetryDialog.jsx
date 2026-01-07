import { useState, useCallback } from 'react';
import TouchButton from '../Button/TouchButton';
import './RetryDialog.scss';

export const RetryDialog = ({ error, onRetry, onCancel }) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry]);

  return (
    <div className="retry-dialog">
      <div className="retry-dialog__content">
        <div className="retry-dialog__icon">⚠️</div>
        <h2 className="retry-dialog__title">Fehler beim Laden</h2>
        <p className="retry-dialog__message">{error?.message}</p>

        <div className="retry-dialog__actions">
          <TouchButton
            onClick={handleRetry}
            disabled={isRetrying}
            variant="primary"
          >
            {isRetrying ? '⏳ Wird versucht...' : '🔄 Erneut versuchen'}
          </TouchButton>
          <TouchButton
            onClick={onCancel}
            variant="secondary"
          >
            ✕ Abbrechen
          </TouchButton>
        </div>
      </div>
    </div>
  );
};
