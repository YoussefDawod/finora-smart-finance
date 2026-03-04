/**
 * @fileoverview LanguageSwitcher — Kompakte Sprach-Pillen im Footer-Bottom
 *
 * Zeigt DE | EN | AR | KA als Pill-Buttons.
 * Aktive Sprache ist visuell hervorgehoben.
 */

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Footer.module.scss';

const LANGUAGES = ['de', 'en', 'ar', 'ka'];

function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const handleChange = useCallback((lang) => {
    if (lang !== i18n.language) {
      i18n.changeLanguage(lang);
    }
  }, [i18n]);

  return (
    <div className={styles.langSwitcher} role="group" aria-label={t('footer.languageSwitcher.label')}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          className={`${styles.langPill} ${i18n.language === lang ? styles.langPillActive : ''}`}
          onClick={() => handleChange(lang)}
          aria-current={i18n.language === lang ? 'true' : undefined}
          aria-label={t(`footer.languageSwitcher.${lang}`)}
        >
          {t(`footer.languageSwitcher.${lang}`)}
        </button>
      ))}
    </div>
  );
}

export default memo(LanguageSwitcher);
