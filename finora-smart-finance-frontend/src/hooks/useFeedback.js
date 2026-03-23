/**
 * @fileoverview useFeedback Hook
 * @description User-facing feedback state management — load, create, consent, delete
 */

import { useState, useEffect, useCallback } from 'react';
import { feedbackService } from '@/api/feedbackService';
import { useAuth } from './useAuth';
import { useAbortSignal } from './useAbortSignal';

/**
 * Hook for user feedback operations
 * @returns {{ feedback, feedbackCount, loading, error, submitFeedback, updateConsent, deleteFeedback, refresh }}
 */
export function useFeedback() {
  const { isAuthenticated } = useAuth();
  const { createSignal } = useAbortSignal();

  const [feedback, setFeedback] = useState(null);
  const [feedbackCount, setFeedbackCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load own feedback + public count
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const signal = createSignal();

      // Always fetch count (public)
      const countRes = await feedbackService.getCount({ signal });
      setFeedbackCount(countRes.data?.data?.count ?? 0);

      // Fetch own feedback only if authenticated
      if (isAuthenticated) {
        const mineRes = await feedbackService.getMine({ signal });
        setFeedback(mineRes.data?.data ?? null);
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, createSignal]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Submit new feedback
  const submitFeedback = useCallback(async ({ rating, text, consentGiven }) => {
    setActionLoading(true);
    try {
      const res = await feedbackService.create({ rating, text, consentGiven });
      setFeedback(res.data?.data ?? null);
      return { success: true, data: res.data?.data };
    } catch (err) {
      return { success: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Update consent
  const updateConsent = useCallback(async consentGiven => {
    setActionLoading(true);
    try {
      const res = await feedbackService.updateConsent(consentGiven);
      setFeedback(res.data?.data ?? null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Delete own feedback
  const deleteFeedback = useCallback(async () => {
    setActionLoading(true);
    try {
      await feedbackService.deleteMine();
      setFeedback(null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    } finally {
      setActionLoading(false);
    }
  }, []);

  return {
    feedback,
    feedbackCount,
    loading,
    error,
    actionLoading,
    submitFeedback,
    updateConsent,
    deleteFeedback,
    refresh: fetchData,
  };
}
