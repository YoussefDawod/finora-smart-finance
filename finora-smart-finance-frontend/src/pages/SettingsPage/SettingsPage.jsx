/**
 * @fileoverview SettingsPage Component
 * @description Vollständige Einstellungen mit Präferenzen, Design, Benachrichtigungen und Export
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiBell,
  FiLayout,
  FiMonitor,
  FiMoon,
  FiSave,
  FiSliders,
  FiSun,
  FiDroplet,
} from 'react-icons/fi';
import { ExportSection } from '@/components/settings';
import Select from '@/components/common/Select/Select';
import Button from '@/components/common/Button/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
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

export default function SettingsPage() {
  const { theme, useGlass, setTheme, resetToSystemPreference, setGlassEnabled } = useTheme();
  const { user, refreshUser } = useAuth();
  const { success, error: showError } = useToast();
  const { t, i18n } = useTranslation();
  const themeOptions = useMemo(() => ([
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
  ]), [t]);

  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [initialPreferences, setInitialPreferences] = useState(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);

  const getDatePreview = (format) => {
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

  useEffect(() => {
    const storedPreferences = getUserPreferences();
    const nextPreferences = {
      themePreference: user?.preferences?.theme ?? storedPreferences.theme ?? DEFAULT_PREFERENCES.themePreference,
      language: user?.preferences?.language ?? storedPreferences.language ?? DEFAULT_PREFERENCES.language,
      currency: user?.preferences?.currency ?? storedPreferences.currency ?? DEFAULT_PREFERENCES.currency,
      dateFormat: user?.preferences?.dateFormat ?? storedPreferences.dateFormat ?? DEFAULT_PREFERENCES.dateFormat,
      emailNotifications:
        user?.preferences?.emailNotifications ?? storedPreferences.emailNotifications ?? DEFAULT_PREFERENCES.emailNotifications,
    };

    if (i18n.language) {
      nextPreferences.language = i18n.language;
    }

    setPreferences(nextPreferences);
    setInitialPreferences(nextPreferences);
  }, [user, i18n.language]);

  useEffect(() => {
    const preferredTheme = user?.preferences?.theme;
    if (!preferredTheme) return;

    if (preferredTheme === 'system') {
      resetToSystemPreference();
      return;
    }

    if (preferredTheme !== theme) {
      setTheme(preferredTheme);
    }
  }, [user?.preferences?.theme, resetToSystemPreference, setTheme, theme]);

  const isDirty = useMemo(
    () => JSON.stringify(preferences) !== JSON.stringify(initialPreferences),
    [preferences, initialPreferences]
  );

  const handlePreferenceChange = (key) => (event) => {
    const value = event?.target?.value;
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key) => () => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleThemeSelect = (value) => {
    setPreferences((prev) => ({ ...prev, themePreference: value }));
    if (value === 'system') {
      resetToSystemPreference();
    } else {
      setTheme(value);
    }
  };

  const handleGlassToggle = () => {
    setGlassEnabled(!useGlass);
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await userService.updatePreferences({
        theme: preferences.themePreference,
        currency: preferences.currency,
        language: preferences.language,
        dateFormat: preferences.dateFormat,
        emailNotifications: preferences.emailNotifications,
      });
      await refreshUser();
      setInitialPreferences(preferences);
      persistUserPreferences({
        theme: preferences.themePreference,
        currency: preferences.currency,
        language: preferences.language,
        dateFormat: preferences.dateFormat,
        emailNotifications: preferences.emailNotifications,
      });
      await i18n.changeLanguage(preferences.language);
      success(t('settings.saved'));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t('settings.saveError');
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.section
      className={styles.settingsPage}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
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
              <Select
                id="language"
                label={t('settings.general.language')}
                options={LANGUAGE_OPTIONS}
                value={preferences.language}
                onChange={handlePreferenceChange('language')}
                placeholder={t('settings.general.languagePlaceholder')}
              />

              <Select
                id="currency"
                label={t('settings.general.currency')}
                options={CURRENCY_OPTIONS.map((option) => ({
                  value: option.value,
                  label: t(option.labelKey),
                }))}
                value={preferences.currency}
                onChange={handlePreferenceChange('currency')}
                placeholder={t('settings.general.currencyPlaceholder')}
              />

              <Select
                id="dateFormat"
                label={t('settings.general.dateFormat')}
                options={DATE_FORMAT_OPTIONS.map((option) => ({
                  value: option.value,
                  label: t(option.labelKey),
                }))}
                value={preferences.dateFormat}
                onChange={handlePreferenceChange('dateFormat')}
                placeholder={t('settings.general.datePlaceholder')}
                hint={t('settings.general.dateExample', { value: getDatePreview(preferences.dateFormat) })}
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
              {themeOptions.map((option) => {
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

            <div className={styles.switchRow}>
              <div className={styles.switchInfo}>
                <div className={styles.switchTitle}>
                  <FiDroplet aria-hidden="true" />
                  {t('settings.appearance.glassTitle')}
                </div>
                <p>{t('settings.appearance.glassDescription')}</p>
              </div>
              <button
                type="button"
                className={`${styles.switch} ${useGlass ? styles.switchOn : ''}`}
                onClick={handleGlassToggle}
                role="switch"
                aria-checked={useGlass}
                aria-label={t('settings.appearance.glassAria')}
              >
                <span className={styles.switchThumb} />
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.sectionCard} variants={itemVariants}>
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
                <div className={styles.switchTitle}>{t('settings.notifications.emailTitle')}</div>
                <p>{t('settings.notifications.emailDescription')}</p>
              </div>
              <button
                type="button"
                className={`${styles.switch} ${preferences.emailNotifications ? styles.switchOn : ''}`}
                onClick={handleToggle('emailNotifications')}
                role="switch"
                aria-checked={preferences.emailNotifications}
                aria-label={t('settings.notifications.emailAria')}
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
        </motion.div>

        <motion.div className={styles.sectionSlot} variants={itemVariants}>
          <ExportSection />
        </motion.div>
      </div>
    </motion.section>
  );
}
