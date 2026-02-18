/**
 * @fileoverview BudgetSettings Component
 * @description Budget-Management UI for SettingsPage
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiAlertTriangle, FiTrendingUp, FiTrash2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useBudget } from '@/hooks/useBudget';
import Button from '@/components/common/Button/Button';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatters';
import { getUserPreferences } from '@/utils/userPreferences';
import styles from './BudgetSettings.module.scss';

// Threshold presets
const THRESHOLD_OPTIONS = [50, 60, 70, 80, 90, 100];

export default function BudgetSettings() {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  const { budgetStatus, isLoading, updateBudget, clearBudget, hasBudget } = useBudget();

  // Local form state
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Currency symbol from user preferences
  const currencySymbol = useMemo(() => {
    const prefs = getUserPreferences();
    const currency = prefs.currency || 'EUR';
    try {
      return (0).toLocaleString(undefined, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\d/g, '').trim();
    } catch {
      return currency;
    }
  }, []);

  // Initialize form with existing budget
  useEffect(() => {
    if (budgetStatus?.hasBudget) {
      setMonthlyLimit(budgetStatus.monthlyLimit?.toString() || '');
      setAlertThreshold(budgetStatus.alertThreshold || 80);
    }
  }, [budgetStatus]);

  // Check if form has changed
  const isDirty = useMemo(() => {
    if (!budgetStatus?.hasBudget) {
      return monthlyLimit !== '' && parseFloat(monthlyLimit) > 0;
    }
    return (
      parseFloat(monthlyLimit) !== budgetStatus.monthlyLimit ||
      alertThreshold !== budgetStatus.alertThreshold
    );
  }, [monthlyLimit, alertThreshold, budgetStatus]);

  const handleLimitChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setMonthlyLimit(value);
    }
  };

  const handleThresholdChange = (value) => {
    setAlertThreshold(value);
  };

  const handleSave = async () => {
    const limit = parseFloat(monthlyLimit);
    if (isNaN(limit) || limit <= 0) {
      showError(t('settings.budget.invalidLimit'));
      return;
    }

    setIsSaving(true);
    const result = await updateBudget({
      monthlyLimit: limit,
      alertThreshold,
    });

    if (result.success) {
      success(t('settings.budget.saved'));
    } else {
      showError(result.error || t('settings.budget.saveError'));
    }
    setIsSaving(false);
  };

  const handleClear = async () => {
    setIsClearing(true);
    const result = await clearBudget();
    if (result.success) {
      setMonthlyLimit('');
      setAlertThreshold(80);
      success(t('settings.budget.cleared'));
    } else {
      showError(result.error || t('settings.budget.clearError'));
    }
    setIsClearing(false);
  };

  // Calculate current progress for visual feedback
  const progressPercent = budgetStatus?.percentUsed || 0;
  const getProgressColor = () => {
    if (progressPercent >= 100) return 'var(--error)';
    if (progressPercent >= alertThreshold) return 'var(--warning)';
    return 'var(--success)';
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <span className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.budgetSettings}>
      {/* Current Status (if budget exists) */}
      {hasBudget && (
        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <FiTrendingUp className={styles.statusIcon} />
            <span>{t('settings.budget.currentStatus')}</span>
          </div>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <motion.div
                className={styles.progressFill}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                style={{ backgroundColor: getProgressColor() }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className={styles.progressLabels}>
              <span>
                {formatCurrency(budgetStatus.totalSpent)} / {formatCurrency(budgetStatus.monthlyLimit)}
              </span>
              <span className={styles.percentLabel} style={{ color: getProgressColor() }}>
                {progressPercent}%
              </span>
            </div>
          </div>
          {progressPercent >= alertThreshold && (
            <div className={styles.warningMessage}>
              <FiAlertTriangle />
              <span>
                {progressPercent >= 100
                  ? t('settings.budget.exceeded')
                  : t('settings.budget.nearLimit')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Budget Form */}
      <div className={styles.formSection}>
        <div className={styles.inputGroup}>
          <label htmlFor="monthlyLimit">{t('settings.budget.monthlyLimit')}</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              id="monthlyLimit"
              value={monthlyLimit}
              onChange={handleLimitChange}
              placeholder="0.00"
              className={styles.input}
            />
            <span className={styles.inputSuffix}>{currencySymbol}</span>
          </div>
          <p className={styles.hint}>{t('settings.budget.limitHint')}</p>
        </div>

        <div className={styles.inputGroup}>
          <label>{t('settings.budget.alertThreshold')}</label>
          <div className={styles.thresholdOptions}>
            {THRESHOLD_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.thresholdBtn} ${alertThreshold === value ? styles.active : ''}`}
                onClick={() => handleThresholdChange(value)}
              >
                {value}%
              </button>
            ))}
          </div>
          <p className={styles.hint}>{t('settings.budget.thresholdHint')}</p>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {hasBudget && (
          <Button
            variant="ghost"
            icon={<FiTrash2 />}
            onClick={handleClear}
            loading={isClearing}
            disabled={isClearing || isSaving}
          >
            {t('settings.budget.remove')}
          </Button>
        )}
        <Button
          variant="primary"
          icon={<FiSave />}
          onClick={handleSave}
          loading={isSaving}
          disabled={!isDirty || isSaving || isClearing}
        >
          {isSaving ? t('common.saving') : t('common.saveChanges')}
        </Button>
      </div>
    </div>
  );
}
