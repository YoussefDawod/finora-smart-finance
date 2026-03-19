/**
 * @fileoverview useViewerGuard Hook
 * @description Guards admin actions for viewer role — shows info toast instead of executing.
 *
 * USAGE:
 * const { guard, isViewer } = useViewerGuard();
 * <button onClick={() => guard(() => handleDelete(id))}>Delete</button>
 *
 * @module useViewerGuard
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export function useViewerGuard() {
  const { isViewer } = useAuth();
  const { info } = useToast();
  const { t } = useTranslation();

  const guard = useCallback(
    fn => {
      if (isViewer) {
        info(t('admin.viewer.noAccess'));
        return;
      }
      fn();
    },
    [isViewer, info, t]
  );

  return { guard, isViewer };
}

export default useViewerGuard;
