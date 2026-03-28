/**
 * @fileoverview SettingsPage Component
 * @description Vollständige Einstellungen mit Präferenzen, Design, Benachrichtigungen und Export
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  FiBell,
  FiLayout,
  FiMonitor,
  FiMoon,
  FiSave,
  FiSliders,
  FiSun,
  FiShield,
  FiDollarSign,
  FiBarChart2,
  FiAlertCircle,
  FiTarget,
  FiMail,
  FiClock,
  FiMessageSquare,
} from 'react-icons/fi';
import { ExportSection, BudgetSettings } from '@/components/settings';
import { RetentionBanner } from '@/components/dashboard';
import { FeedbackForm } from '@/components/feedback';
import { useFeedback } from '@/hooks/useFeedback';
import FilterDropdown from '@/components/common/FilterDropdown/FilterDropdown';
import Button from '@/components/common/Button/Button';
import AuthRequiredOverlay from '@/components/common/AuthRequiredOverlay/AuthRequiredOverlay';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useMotion } from '@/hooks/useMotion';
import { useToast } from '@/hooks/useToast';
import { useLifecycle } from '@/hooks/useLifecycle';
import { userService } from '@/api';
import { persistUserPreferences, getUserPreferences } from '@/utils/userPreferences';
import { useTranslation } from 'react-i18next';
import styles from './SettingsPage.module.scss';

const DEFAULT_PREFERENCES = {
  themePreference: 'system',
  language: 'de',
  currency: 'EUR',
  dateFormat: 'iso',
  emailNotifications: true,
  // Option C: Category-based notifications
  notificationCategories: {
    security: true, // Login alerts, password changes
    transactions: true, // New transactions
    reports: true, // Weekly/monthly reports
    alerts: true, // Budget warnings, unusual activity
  },
};

const LANGUAGE_OPTIONS = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
  { value: 'ka', label: 'ქართული' },
];

const CURRENCY_OPTIONS = [
  { value: 'EUR', labelKey: 'settings.general.currencyEUR' },
  { value: 'USD', labelKey: 'settings.general.currencyUSD' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'iso', labelKey: 'settings.general.dateFormatIso' },
  { value: 'dmy', labelKey: 'settings.general.dateFormatDmy' },
];

/**
 * Wrapper-Komponente für den Feedback-Bereich in den Einstellungen.
 * Kapselt useFeedback, damit der Hook nur bei authentifizierten Nutzern läuft.
 */
function FeedbackSection() {
  const {
    feedback,
    feedbackCount,
    loading,
    actionLoading,
    submitFeedback,
    updateConsent,
    deleteFeedback,
  } = useFeedback();

  return (
    <FeedbackForm
      feedback={feedback}
      feedbackCount={feedbackCount}
      loading={loading}
      actionLoading={actionLoading}
      onSubmit={submitFeedback}
      onUpdateConsent={updateConsent}
      onDelete={deleteFeedback}
    />
  );
}

export default function SettingsPage() {
  const { setTheme, resetToSystemPreference } = useTheme();
  const { user, refreshUser, isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const {
    lifecycleStatus,
    isLoading: lifecycleLoading,
    fetchLifecycleStatus,
    confirmExport,
  } = useLifecycle();
  const { shouldAnimate } = useMotion();
  const themeOptions = useMemo(
    () => [
      {
        value: 'light',
        label: t('settings.appearance.themeLight'),
        description: t('settings.appearance.themeLightDesc'),
        icon: FiSun,
      },
      {
        value: 'dark',
        label: t('settings.appearance.themeDark'),
        description: t('settings.appearance.themeDarkDesc'),
        icon: FiMoon,
      },
      {
        value: 'system',
        label: t('settings.appearance.themeSystem'),
        description: t('settings.appearance.themeSystemDesc'),
        icon: FiMonitor,
      },
    ],
    [t]
  );

  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [initialPreferences, setInitialPreferences] = useState(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const getDatePreview = format => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return format === 'iso' ? `${year}-${month}-${day}` : `${day}.${month}.${year}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  // Newsletter-Status laden
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await userService.getNewsletterStatus();
        if (!cancelled) setNewsletterSubscribed(res.data?.subscribed ?? false);
      } catch {
        // Silently ignore — toggle will default to off
      }
    })();
    fetchLifecycleStatus();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, fetchLifecycleStatus]);

  const handleNewsletterToggle = async () => {
    if (!user?.email) {
      showError(t('settings.notifications.newsletter.noEmail'));
      return;
    }
    setNewsletterLoading(true);
    try {
      const res = await userService.toggleNewsletter(preferences.language);
      setNewsletterSubscribed(res.data?.subscribed ?? false);
      if (res.data?.subscribed) {
        success(t('settings.notifications.newsletter.subscribed'));
      } else {
        success(t('settings.notifications.newsletter.unsubscribed'));
      }
    } catch {
      showError(t('settings.notifications.newsletter.error'));
    } finally {
      setNewsletterLoading(false);
    }
  };

  useEffect(() => {
    const storedPreferences = getUserPreferences();
    const nextPreferences = {
      themePreference:
        user?.preferences?.theme ?? storedPreferences.theme ?? DEFAULT_PREFERENCES.themePreference,
      language:
        user?.preferences?.language ?? storedPreferences.language ?? DEFAULT_PREFERENCES.language,
      currency:
        user?.preferences?.currency ?? storedPreferences.currency ?? DEFAULT_PREFERENCES.currency,
      dateFormat:
        user?.preferences?.dateFormat ??
        storedPreferences.dateFormat ??
        DEFAULT_PREFERENCES.dateFormat,
      emailNotifications:
        user?.preferences?.emailNotifications ??
        storedPreferences.emailNotifications ??
        DEFAULT_PREFERENCES.emailNotifications,
      notificationCategories: {
        security:
          user?.preferences?.notificationCategories?.security ??
          storedPreferences.notificationCategories?.security ??
          DEFAULT_PREFERENCES.notificationCategories.security,
        transactions:
          user?.preferences?.notificationCategories?.transactions ??
          storedPreferences.notificationCategories?.transactions ??
          DEFAULT_PREFERENCES.notificationCategories.transactions,
        reports:
          user?.preferences?.notificationCategories?.reports ??
          storedPreferences.notificationCategories?.reports ??
          DEFAULT_PREFERENCES.notificationCategories.reports,
        alerts:
          user?.preferences?.notificationCategories?.alerts ??
          storedPreferences.notificationCategories?.alerts ??
          DEFAULT_PREFERENCES.notificationCategories.alerts,
      },
    };

    if (i18n.language) {
      nextPreferences.language = i18n.language;
    }

    setPreferences(nextPreferences);
    setInitialPreferences(nextPreferences);
  }, [user, i18n.language]);

  // Scroll to hash target (e.g. #feedback) after mount
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (!hash) return;
    // Small delay so Framer Motion animations have rendered the target
    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
    return () => clearTimeout(timer);
  }, [location.hash]);

  const isDirty = useMemo(
    () => JSON.stringify(preferences) !== JSON.stringify(initialPreferences),
    [preferences, initialPreferences]
  );

  const handlePreferenceChange = key => value => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleToggle = key => () => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasEmail = !!user?.email;

  const handleNotificationToggle = () => {
    if (!hasEmail) {
      showError(t('settings.notifications.noEmailRequired'));
      return;
    }
    handleToggle('emailNotifications')();
  };

  const handleCategoryToggle = category => () => {
    if (!hasEmail) {
      showError(t('settings.notifications.noEmailRequired'));
      return;
    }
    setPreferences(prev => ({
      ...prev,
      notificationCategories: {
        ...prev.notificationCategories,
        [category]: !prev.notificationCategories[category],
      },
    }));
  };

  const handleThemeSelect = value => {
    setPreferences(prev => ({ ...prev, themePreference: value }));
    if (value === 'system') {
      resetToSystemPreference();
    } else {
      setTheme(value);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      if (isAuthenticated) {
        await userService.updatePreferences({
          theme: preferences.themePreference,
          currency: preferences.currency,
          language: preferences.language,
          dateFormat: preferences.dateFormat,
          emailNotifications: preferences.emailNotifications,
          notificationCategories: preferences.notificationCategories,
        });
        await refreshUser();
      }
      setInitialPreferences(preferences);
      persistUserPreferences({
        theme: preferences.themePreference,
        currency: preferences.currency,
        language: preferences.language,
        dateFormat: preferences.dateFormat,
        emailNotifications: preferences.emailNotifications,
        notificationCategories: preferences.notificationCategories,
      });
      await i18n.changeLanguage(preferences.language);
      success(t('settings.saved'));
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || t('settings.saveError');
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.section
      className={styles.settingsPage}
      variants={containerVariants}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
    >
      <motion.div className={styles.pageHeader} variants={itemVariants}>
        <div>
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.subtitle')}</p>
        </div>
      </motion.div>

      <div className={styles.sections}>
        <motion.div className={styles.sectionCard} variants={itemVariants}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} aria-hidden="true">
              <FiSliders />
            </div>
            <div>
              <h2>{t('settings.general.title')}</h2>
              <p>{t('settings.general.description')}</p>
            </div>
          </div>

          <div className={styles.sectionBody}>
            <div className={styles.preferenceGrid}>
              <FilterDropdown
                id="language"
                label={t('settings.general.language')}
                options={LANGUAGE_OPTIONS}
                value={preferences.language}
                onChange={handlePreferenceChange('language')}
                placeholder={t('settings.general.languagePlaceholder')}
                size="md"
              />

              <FilterDropdown
                id="currency"
                label={t('settings.general.currency')}
                options={CURRENCY_OPTIONS.map(option => ({
                  value: option.value,
                  label: t(option.labelKey),
                }))}
                value={preferences.currency}
                onChange={handlePreferenceChange('currency')}
                placeholder={t('settings.general.currencyPlaceholder')}
                size="md"
              />

              <FilterDropdown
                id="dateFormat"
                label={t('settings.general.dateFormat')}
                options={DATE_FORMAT_OPTIONS.map(option => ({
                  value: option.value,
                  label: t(option.labelKey),
                }))}
                value={preferences.dateFormat}
                onChange={handlePreferenceChange('dateFormat')}
                placeholder={t('settings.general.datePlaceholder')}
                hint={t('settings.general.dateExample', {
                  value: getDatePreview(preferences.dateFormat),
                })}
                size="md"
              />
            </div>
          </div>

          <div className={styles.sectionFooter}>
            <Button
              variant="primary"
              icon={<FiSave />}
              onClick={handleSavePreferences}
              loading={isSaving}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </div>
        </motion.div>

        <motion.div className={styles.sectionCard} variants={itemVariants}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} aria-hidden="true">
              <FiLayout />
            </div>
            <div>
              <h2>{t('settings.appearance.title')}</h2>
              <p>{t('settings.appearance.description')}</p>
            </div>
          </div>

          <div className={styles.sectionBody}>
            <div className={styles.themeOptions}>
              {themeOptions.map(option => {
                const Icon = option.icon;
                const isActive = preferences.themePreference === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.themeOption} ${isActive ? styles.themeOptionActive : ''}`}
                    onClick={() => handleThemeSelect(option.value)}
                    aria-pressed={isActive}
                  >
                    <span className={styles.themeIcon} aria-hidden="true">
                      <Icon />
                    </span>
                    <span className={styles.themeLabel}>{option.label}</span>
                    <span className={styles.themeDescription}>{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Notifications Section - Auth required */}
        <motion.div className={styles.sectionCard} variants={itemVariants}>
          {!isAuthenticated ? (
            <AuthRequiredOverlay>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon} aria-hidden="true">
                  <FiBell />
                </div>
                <div>
                  <h2>{t('settings.notifications.title')}</h2>
                  <p>{t('settings.notifications.description')}</p>
                </div>
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.switchRow}>
                  <div className={styles.switchInfo}>
                    <div className={styles.switchTitle}>
                      {t('settings.notifications.emailTitle')}
                    </div>
                    <p>{t('settings.notifications.emailDescription')}</p>
                  </div>
                </div>
              </div>
            </AuthRequiredOverlay>
          ) : (
            <>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon} aria-hidden="true">
                  <FiBell />
                </div>
                <div>
                  <h2>{t('settings.notifications.title')}</h2>
                  <p>{t('settings.notifications.description')}</p>
                </div>
              </div>

              <div className={styles.sectionBody}>
                {/* Master Toggle */}
                <div className={styles.switchRow}>
                  <div className={styles.switchInfo}>
                    <div className={styles.switchTitle}>
                      {t('settings.notifications.emailTitle')}
                    </div>
                    <p>
                      {hasEmail
                        ? t('settings.notifications.emailDescription')
                        : t('settings.notifications.noEmailHint')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${styles.switch} ${hasEmail && preferences.emailNotifications ? styles.switchOn : ''}`}
                    onClick={handleNotificationToggle}
                    role="switch"
                    aria-checked={hasEmail && preferences.emailNotifications}
                    aria-label={t('settings.notifications.emailAria')}
                  >
                    <span className={styles.switchThumb} />
                  </button>
                </div>

                {/* Category Toggles - Only visible when master toggle is on */}
                {hasEmail && preferences.emailNotifications && (
                  <div className={styles.categoryToggles}>
                    {[
                      { key: 'security', icon: FiShield },
                      { key: 'transactions', icon: FiDollarSign },
                      { key: 'reports', icon: FiBarChart2 },
                      { key: 'alerts', icon: FiAlertCircle },
                    ].map(({ key, icon: Icon }) => (
                      <div className={styles.switchRow} key={key}>
                        <div className={styles.switchInfo}>
                          <div className={styles.switchTitle}>
                            <Icon aria-hidden="true" />
                            {t(`settings.notifications.${key}.title`)}
                          </div>
                          <p>{t(`settings.notifications.${key}.description`)}</p>
                        </div>
                        <button
                          type="button"
                          className={`${styles.switch} ${preferences.notificationCategories[key] ? styles.switchOn : ''}`}
                          onClick={handleCategoryToggle(key)}
                          role="switch"
                          aria-checked={preferences.notificationCategories[key]}
                          aria-label={t(`settings.notifications.${key}.aria`)}
                        >
                          <span className={styles.switchThumb} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Newsletter Toggle — separate from notification preferences */}
                <div className={styles.newsletterDivider}>
                  <div className={styles.switchInfo}>
                    <div className={styles.switchTitle}>
                      <FiMail aria-hidden="true" />
                      {t('settings.notifications.newsletter.title')}
                    </div>
                    <p>
                      {user?.email
                        ? t('settings.notifications.newsletter.description')
                        : t('settings.notifications.newsletter.noEmailHint')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${styles.switch} ${newsletterSubscribed ? styles.switchOn : ''}`}
                    onClick={handleNewsletterToggle}
                    disabled={newsletterLoading || !user?.email}
                    role="switch"
                    aria-checked={newsletterSubscribed}
                    aria-label={t('settings.notifications.newsletter.aria')}
                  >
                    <span className={styles.switchThumb} />
                  </button>
                </div>
              </div>

              <div className={styles.sectionFooter}>
                <Button
                  variant="primary"
                  icon={<FiSave />}
                  onClick={handleSavePreferences}
                  loading={isSaving}
                  disabled={!isDirty || isSaving}
                >
                  {isSaving ? t('common.saving') : t('common.saveChanges')}
                </Button>
              </div>
            </>
          )}
        </motion.div>

        {/* Budget Section - Auth required */}
        <motion.div className={styles.sectionCard} variants={itemVariants}>
          {!isAuthenticated ? (
            <AuthRequiredOverlay>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon} aria-hidden="true">
                  <FiTarget />
                </div>
                <div>
                  <h2>{t('settings.budget.title')}</h2>
                  <p>{t('settings.budget.description')}</p>
                </div>
              </div>
              <div className={styles.sectionBody} />
            </AuthRequiredOverlay>
          ) : (
            <>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon} aria-hidden="true">
                  <FiTarget />
                </div>
                <div>
                  <h2>{t('settings.budget.title')}</h2>
                  <p>{t('settings.budget.description')}</p>
                </div>
              </div>
              <div className={styles.sectionBody}>
                <BudgetSettings />
              </div>
            </>
          )}
        </motion.div>

        {/* Lifecycle / Data Retention Section */}
        <motion.div className={styles.sectionCard} variants={itemVariants}>
          {!isAuthenticated ? (
            <AuthRequiredOverlay>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon} aria-hidden="true">
                  <FiClock />
                </div>
                <div>
                  <h2>{t('lifecycle.retention.title')}</h2>
                  <p>{t('lifecycle.retention.exportReminder')}</p>
                </div>
              </div>
              <div className={styles.sectionBody} />
            </AuthRequiredOverlay>
          ) : (
            <>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon} aria-hidden="true">
                  <FiClock />
                </div>
                <div>
                  <h2>{t('lifecycle.retention.title')}</h2>
                  <p>{t('lifecycle.retention.exportReminder')}</p>
                </div>
              </div>
              <div className={styles.sectionBody}>
                <RetentionBanner
                  lifecycleStatus={lifecycleStatus}
                  onConfirmExport={confirmExport}
                  isLoading={lifecycleLoading}
                />
              </div>
            </>
          )}
        </motion.div>

        {/* Export Section - Auth required */}
        <motion.div className={styles.sectionSlot} variants={itemVariants}>
          {!isAuthenticated ? (
            <AuthRequiredOverlay>
              <ExportSection />
            </AuthRequiredOverlay>
          ) : (
            <ExportSection />
          )}
        </motion.div>

        {/* Feedback Section - Auth required (letzte Sektion) */}
        <motion.div className={styles.sectionCard} variants={itemVariants} id="feedback">
          {!isAuthenticated ? (
            <AuthRequiredOverlay>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon} aria-hidden="true">
                  <FiMessageSquare />
                </div>
                <div>
                  <h2>{t('feedback.settings.title')}</h2>
                  <p>{t('feedback.settings.description')}</p>
                </div>
              </div>
              <div className={styles.sectionBody} />
            </AuthRequiredOverlay>
          ) : (
            <>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon} aria-hidden="true">
                  <FiMessageSquare />
                </div>
                <div>
                  <h2>{t('feedback.settings.title')}</h2>
                  <p>{t('feedback.settings.description')}</p>
                </div>
              </div>
              <div className={styles.sectionBody}>
                <FeedbackSection />
              </div>
            </>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
