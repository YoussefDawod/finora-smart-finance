/**
 * @fileoverview Feedback API Service
 * @description User-facing feedback API calls (create, read, consent, delete, public)
 *
 * @module api/feedbackService
 */

import client from './client';
import { ENDPOINTS } from './endpoints';

export const feedbackService = {
  /**
   * Create feedback (one per user)
   * @param {{ rating: number, text?: string, consentGiven?: boolean }} data
   * @returns {Promise<AxiosResponse<{ success: boolean, data: object }>>}
   */
  create: data => client.post(ENDPOINTS.feedback.create, data),

  /**
   * Get own feedback
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ success: boolean, data: object|null }>>}
   */
  getMine: ({ signal } = {}) => client.get(ENDPOINTS.feedback.mine, { signal }),

  /**
   * Update consent (allow/disallow public display)
   * @param {boolean} consentGiven
   * @returns {Promise<AxiosResponse<{ success: boolean, data: object }>>}
   */
  updateConsent: consentGiven => client.patch(ENDPOINTS.feedback.consent, { consentGiven }),

  /**
   * Delete own feedback
   * @returns {Promise<AxiosResponse<{ success: boolean }>>}
   */
  deleteMine: () => client.delete(ENDPOINTS.feedback.delete),

  /**
   * Get published feedbacks (public, no auth)
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ success: boolean, data: object[] }>>}
   */
  getPublic: ({ signal } = {}) => client.get(ENDPOINTS.feedback.public, { signal }),

  /**
   * Get feedback count (public, no auth, for motivation texts)
   * @param {Object} [options] - Axios request options
   * @param {AbortSignal} [options.signal] - AbortController signal
   * @returns {Promise<AxiosResponse<{ success: boolean, data: { count: number } }>>}
   */
  getCount: ({ signal } = {}) => client.get(ENDPOINTS.feedback.count, { signal }),
};
