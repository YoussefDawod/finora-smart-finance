import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiSend, FiUser, FiMail, FiMessageSquare } from 'react-icons/fi';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import FilterDropdown from '@/components/common/FilterDropdown/FilterDropdown';
import Checkbox from '@/components/common/Checkbox/Checkbox';
import styles from './ContactPage.module.scss';

const CATEGORIES = ['feedback', 'bug', 'feature', 'other'];

export default function ContactPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', category: 'feedback', message: '' });
  const [honeypot, setHoneypot] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | 'loading' | null
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (honeypot) return; // Bot detected

    if (!privacyConsent) {
      setConsentError(true);
      return;
    }

    setConsentError(false);
    setStatus('loading');
    setErrorMsg('');

    try {
      await client.post(ENDPOINTS.contact, form);

      setStatus('success');
      setForm({ name: '', email: '', category: 'feedback', message: '' });
      setPrivacyConsent(false);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error || err.message || t('contact.error'));
    }
  };

  return (
    <div className={styles.contactContainer}>
      <div className={styles.contactContent}>
        <h1 className={styles.title}>{t('contact.title')}</h1>
        <p className={styles.subtitle}>{t('contact.subtitle')}</p>

        {status === 'success' ? (
          <div className={styles.successMessage}>
            <FiSend size={32} />
            <p>{t('contact.success')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Honeypot field - hidden from real users */}
            <div className={styles.honeypot} aria-hidden="true">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="contact-name" className={styles.formLabel}>
                <FiUser size={16} /> {t('contact.form.name')}
              </label>
              <input
                id="contact-name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="contact-email" className={styles.formLabel}>
                <FiMail size={16} /> {t('contact.form.email')}
              </label>
              <input
                id="contact-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="contact-category" className={styles.formLabel}>
                <FiMessageSquare size={16} /> {t('contact.form.category')}
              </label>
              <FilterDropdown
                id="contact-category"
                options={CATEGORIES.map(cat => ({
                  value: cat,
                  label: t(`contact.categories.${cat}`),
                }))}
                value={form.category}
                onChange={val => setForm(prev => ({ ...prev, category: val }))}
                ariaLabel={t('contact.form.category')}
                size="md"
                className={styles.formDropdown}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="contact-message" className={styles.formLabel}>
                <FiMessageSquare size={16} /> {t('contact.form.message')}
              </label>
              <textarea
                id="contact-message"
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={6}
                autoComplete="off"
                className={styles.formTextarea}
              />
            </div>

            {/* DSGVO Consent Checkbox */}
            <div className={styles.consentGroup}>
              <Checkbox
                checked={privacyConsent}
                onChange={e => {
                  setPrivacyConsent(e.target.checked);
                  if (e.target.checked) setConsentError(false);
                }}
                name="privacyConsent"
                variant={consentError ? 'error' : 'default'}
              >
                <Trans
                  i18nKey="contact.privacyConsent"
                  components={{ link: <Link to="/privacy" /> }}
                />
              </Checkbox>
              {consentError && (
                <p className={styles.consentError}>{t('contact.privacyRequired')}</p>
              )}
            </div>

            {status === 'error' && <div className={styles.errorMessage}>{errorMsg}</div>}

            <button type="submit" disabled={status === 'loading'} className={styles.submitButton}>
              <FiSend size={18} />
              {status === 'loading' ? t('contact.form.sending') : t('contact.form.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
