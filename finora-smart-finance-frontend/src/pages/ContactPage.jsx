import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSend, FiUser, FiMail, FiMessageSquare } from 'react-icons/fi';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import styles from './TermsPage.module.scss';

const CATEGORIES = ['feedback', 'bug', 'feature', 'other'];

export default function ContactPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', category: 'feedback', message: '' });
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'error' | 'loading' | null
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (honeypot) return; // Bot detected
    
    setStatus('loading');
    setErrorMsg('');

    try {
      await client.post(ENDPOINTS.contact, form);
      
      setStatus('success');
      setForm({ name: '', email: '', category: 'feedback', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error || err.message || t('contact.error'));
    }
  };

  return (
    <div className={styles.termsContainer}>
      <div className={styles.termsContent}>
        <h1 className={styles.title}>{t('contact.title')}</h1>
        <p style={{ textAlign: 'center', color: 'var(--tx-muted)', marginBottom: 'var(--space-xl)' }}>
          {t('contact.subtitle')}
        </p>

        {status === 'success' ? (
          <div style={{
            padding: 'var(--space-xl)',
            textAlign: 'center',
            background: 'var(--success-bg, rgba(34,197,94,0.1))',
            borderRadius: 'var(--r-lg)',
            color: 'var(--success, #22c55e)',
          }}>
            <FiSend size={32} style={{ marginBottom: 'var(--space-md)' }} />
            <p style={{ fontWeight: 'var(--fw-sb)', fontSize: 'var(--fs-lg)' }}>{t('contact.success')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Honeypot field - hidden from real users */}
            <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-xs)', color: 'var(--tx)', fontWeight: 'var(--fw-m)', fontSize: 'var(--fs-sm)' }}>
                <FiUser size={16} /> {t('contact.form.name')}
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--tx)',
                  fontSize: 'var(--fs-base)',
                  minHeight: '44px',
                }}
              />
            </div>

            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-xs)', color: 'var(--tx)', fontWeight: 'var(--fw-m)', fontSize: 'var(--fs-sm)' }}>
                <FiMail size={16} /> {t('contact.form.email')}
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--tx)',
                  fontSize: 'var(--fs-base)',
                  minHeight: '44px',
                }}
              />
            </div>

            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-xs)', color: 'var(--tx)', fontWeight: 'var(--fw-m)', fontSize: 'var(--fs-sm)' }}>
                <FiMessageSquare size={16} /> {t('contact.form.category')}
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--tx)',
                  fontSize: 'var(--fs-base)',
                  minHeight: '44px',
                }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{t(`contact.categories.${cat}`)}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-xs)', color: 'var(--tx)', fontWeight: 'var(--fw-m)', fontSize: 'var(--fs-sm)' }}>
                <FiMessageSquare size={16} /> {t('contact.form.message')}
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={6}
                style={{
                  width: '100%',
                  padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--tx)',
                  fontSize: 'var(--fs-base)',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {status === 'error' && (
              <div style={{
                padding: 'var(--space-sm) var(--space-md)',
                marginBottom: 'var(--space-lg)',
                borderRadius: 'var(--r-md)',
                background: 'var(--error-bg, rgba(239,68,68,0.1))',
                color: 'var(--error, #ef4444)',
                fontSize: 'var(--fs-sm)',
              }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                width: '100%',
                padding: 'var(--space-sm) var(--space-lg)',
                borderRadius: 'var(--r-md)',
                border: 'none',
                background: 'var(--primary)',
                color: 'var(--primary-fg, #fff)',
                fontSize: 'var(--fs-base)',
                fontWeight: 'var(--fw-sb)',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.7 : 1,
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-sm)',
                transition: 'opacity var(--tr)',
              }}
            >
              <FiSend size={18} />
              {status === 'loading' ? t('contact.form.sending') : t('contact.form.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
