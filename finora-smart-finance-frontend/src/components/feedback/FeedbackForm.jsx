/**
 * @fileoverview FeedbackForm Component
 * @description Star-Rating + Freitext + DSGVO-Checkboxen für User-Feedback
 *
 * Zustände:
 * - Kein Feedback → Formular anzeigen
 * - Feedback vorhanden → Readonly-Ansicht + Consent-Toggle + Löschen
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiTrash2, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import { useMotion } from '@/hooks/useMotion';
import ConsentDialog from './ConsentDialog';
import styles from './FeedbackForm.module.scss';

/**
 * @param {{ feedback, feedbackCount, loading, actionLoading, onSubmit, onUpdateConsent, onDelete }} props
 */
export default function FeedbackForm({
  feedback,
  feedbackCount,
  loading,
  actionLoading,
  onSubmit,
  onUpdateConsent,
  onDelete,
}) {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  const { shouldAnimate } = useMotion();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [checkHonest, setCheckHonest] = useState(false);
  const [checkPrivacy, setCheckPrivacy] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canSubmit = rating > 0 && checkHonest && checkPrivacy && !actionLoading;

  // Motivation text based on feedback count (§8.3)
  const getMotivationText = () => {
    if (feedbackCount === null) return null;
    if (feedbackCount === 0) return t('feedback.motivation.first');
    if (feedbackCount <= 2) return t('feedback.motivation.topThree');
    if (feedbackCount <= 9) return t('feedback.motivation.topTen');
    return null;
  };

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault();
      if (!canSubmit) return;

      // If rating >= 4, show consent dialog first (§8.4)
      if (rating >= 4) {
        setPendingSubmission({ rating, text: text.trim() });
        setShowConsentDialog(true);
        return;
      }

      // For < 4 stars, submit directly without consent
      const result = await onSubmit({ rating, text: text.trim(), consentGiven: false });
      if (result.success) {
        success(t('feedback.form.submitSuccess'));
      } else {
        showError(t('feedback.form.submitError'));
      }
    },
    [canSubmit, rating, text, onSubmit, success, showError, t]
  );

  const handleConsentDecision = useCallback(
    async consentGiven => {
      setShowConsentDialog(false);
      if (!pendingSubmission) return;

      const result = await onSubmit({ ...pendingSubmission, consentGiven });
      setPendingSubmission(null);
      if (result.success) {
        success(t('feedback.form.submitSuccess'));
      } else {
        showError(t('feedback.form.submitError'));
      }
    },
    [pendingSubmission, onSubmit, success, showError, t]
  );

  const handleConsentToggle = useCallback(async () => {
    if (!feedback) return;
    const newConsent = !feedback.consentGiven;
    const result = await onUpdateConsent(newConsent);
    if (result.success) {
      success(newConsent ? t('feedback.consent.granted') : t('feedback.consent.revoked'));
    } else {
      showError(t('feedback.consent.error'));
    }
  }, [feedback, onUpdateConsent, success, showError, t]);

  const handleDelete = useCallback(async () => {
    const result = await onDelete();
    setConfirmDelete(false);
    if (result.success) {
      success(t('feedback.form.deleteSuccess'));
      setRating(0);
      setText('');
      setCheckHonest(false);
      setCheckPrivacy(false);
    } else {
      showError(t('feedback.form.deleteError'));
    }
  }, [onDelete, success, showError, t]);

  const motivationText = getMotivationText();

  if (loading) {
    return (
      <div className={styles.skeleton}>
        <div className={styles.skeletonStars} />
        <div className={styles.skeletonText} />
      </div>
    );
  }

  // ── READONLY VIEW (Feedback already submitted) ──
  if (feedback) {
    return (
      <motion.div
        className={styles.readonlyView}
        initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.thankYou}>
          <FiCheck className={styles.thankYouIcon} />
          <span>{t('feedback.form.thankYou')}</span>
        </div>

        <div className={styles.readonlyStars}>
          {[1, 2, 3, 4, 5].map(star => (
            <FiStar
              key={star}
              className={`${styles.star} ${star <= feedback.rating ? styles.starFilled : ''}`}
            />
          ))}
          <span className={styles.ratingLabel}>{feedback.rating}/5</span>
        </div>

        {feedback.text && <p className={styles.readonlyText}>&ldquo;{feedback.text}&rdquo;</p>}

        {/* Consent toggle (only for >= 4 stars) */}
        {feedback.rating >= 4 && (
          <div className={styles.consentRow}>
            <label className={styles.consentToggle}>
              <input
                type="checkbox"
                checked={feedback.consentGiven || false}
                onChange={handleConsentToggle}
                disabled={actionLoading}
              />
              <span className={styles.toggleSlider} />
              <span className={styles.consentLabel}>{t('feedback.consent.allowPublic')}</span>
            </label>
            {feedback.published && (
              <span className={styles.publishedBadge}>{t('feedback.consent.published')}</span>
            )}
          </div>
        )}

        <div className={styles.actions}>
          {!confirmDelete ? (
            <button
              className={styles.deleteBtn}
              onClick={() => setConfirmDelete(true)}
              disabled={actionLoading}
              type="button"
            >
              <FiTrash2 /> {t('feedback.form.delete')}
            </button>
          ) : (
            <div className={styles.confirmRow}>
              <span>{t('feedback.form.confirmDelete')}</span>
              <button
                className={styles.confirmYes}
                onClick={handleDelete}
                disabled={actionLoading}
                type="button"
              >
                {t('common.yes')}
              </button>
              <button
                className={styles.confirmNo}
                onClick={() => setConfirmDelete(false)}
                disabled={actionLoading}
                type="button"
              >
                {t('common.no')}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ── FORM VIEW (No feedback yet) ──
  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        {motivationText && <p className={styles.motivation}>{motivationText}</p>}

        {/* Star Rating */}
        <div className={styles.ratingGroup}>
          <label className={styles.label}>{t('feedback.form.ratingLabel')}</label>
          <div
            className={styles.stars}
            role="radiogroup"
            aria-label={t('feedback.form.ratingLabel')}
          >
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={`${styles.starBtn} ${star <= (hoverRating || rating) ? styles.starBtnActive : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${star} ${t('feedback.form.stars')}`}
                aria-pressed={star === rating}
              >
                <FiStar />
              </button>
            ))}
          </div>
        </div>

        {/* Text Input */}
        <div className={styles.textGroup}>
          <label className={styles.label} htmlFor="feedback-text">
            {t('feedback.form.textLabel')}
          </label>
          <textarea
            id="feedback-text"
            className={styles.textarea}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t('feedback.form.textPlaceholder')}
            maxLength={1000}
            rows={4}
          />
          <span className={styles.charCount}>{text.length}/1000</span>
        </div>

        {/* DSGVO Checkboxes (§10) */}
        <div className={styles.checkboxGroup}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={checkHonest}
              onChange={e => setCheckHonest(e.target.checked)}
            />
            <span className={styles.checkmark} />
            <span>{t('feedback.form.checkHonest')}</span>
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={checkPrivacy}
              onChange={e => setCheckPrivacy(e.target.checked)}
            />
            <span className={styles.checkmark} />
            <span>{t('feedback.form.checkPrivacy')}</span>
          </label>
        </div>

        {/* Hint for consent */}
        {rating >= 4 && (
          <p className={styles.consentHint}>
            <FiAlertCircle />
            {t('feedback.form.consentHint')}
          </p>
        )}

        <button type="submit" className={styles.submitBtn} disabled={!canSubmit}>
          {actionLoading ? t('common.saving') : t('feedback.form.submit')}
        </button>
      </form>

      <AnimatePresence>
        {showConsentDialog && (
          <ConsentDialog
            onConsent={() => handleConsentDecision(true)}
            onDecline={() => handleConsentDecision(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
