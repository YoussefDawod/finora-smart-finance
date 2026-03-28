/**
 * @fileoverview FeedbackPrompt Component
 * @description Dezente Benachrichtigungskarte auf dem Dashboard (§8.2)
 *
 * Trigger: ≥7 Tage seit Registrierung ODER ≥10 Transaktionen
 * Wird exakt einmal angezeigt (localStorage-Flag)
 * Nicht angezeigt wenn bereits Feedback vorhanden
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './FeedbackPrompt.module.scss';

const STORAGE_KEY = 'finora_feedback_prompt_dismissed';
const MIN_DAYS = 7;
const MIN_TRANSACTIONS = 10;

/**
 * @param {{ userCreatedAt: string, transactionCount: number, hasFeedback: boolean, feedbackCount: number|null }} props
 */
export default function FeedbackPrompt({
  userCreatedAt,
  transactionCount,
  hasFeedback,
  feedbackCount,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');

  // Snapshot current time once per mount to avoid impure Date.now() during render
  const [now] = useState(() => Date.now());

  // Eligibility computed from props (re-evaluated when data loads)
  const isEligible = useMemo(
    () =>
      !hasFeedback &&
      !dismissed &&
      !!userCreatedAt &&
      ((now - new Date(userCreatedAt).getTime()) / (1000 * 60 * 60 * 24) >= MIN_DAYS ||
        (typeof transactionCount === 'number' && transactionCount >= MIN_TRANSACTIONS)),
    [hasFeedback, dismissed, userCreatedAt, now, transactionCount]
  );

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  }, []);

  const handleNavigate = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
    navigate('/settings#feedback');
  }, [navigate]);

  const getPromptTitle = () => {
    if (feedbackCount === null || feedbackCount === undefined) return t('feedback.prompt.title');
    if (feedbackCount === 0) return t('feedback.motivation.first');
    if (feedbackCount <= 2) return t('feedback.motivation.topThree');
    if (feedbackCount <= 9) return t('feedback.motivation.topTen');
    return t('feedback.prompt.title');
  };

  return (
    <AnimatePresence>
      {isEligible && (
        <motion.div
          className={styles.prompt}
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -12, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.iconWrap}>
            <FiMessageSquare />
          </div>
          <div className={styles.content}>
            <p className={styles.title}>{getPromptTitle()}</p>
            <p className={styles.description}>{t('feedback.prompt.description')}</p>
          </div>
          <button className={styles.ctaBtn} onClick={handleNavigate} type="button">
            {t('feedback.prompt.cta')}
          </button>
          <button
            className={styles.closeBtn}
            onClick={handleDismiss}
            type="button"
            aria-label={t('common.close')}
          >
            <FiX />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
