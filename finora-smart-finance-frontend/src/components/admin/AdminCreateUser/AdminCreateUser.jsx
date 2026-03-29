/**
 * @fileoverview AdminCreateUser – User-Erstellen-Modal
 * @description Modal mit Formular zum manuellen Anlegen neuer Benutzer.
 *              Unterstützt automatische Passwortgenerierung und zeigt das
 *              generierte Passwort nach der Erstellung sicher an.
 *
 * @module components/admin/AdminCreateUser
 */

import { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiUserPlus,
  FiUser,
  FiMail,
  FiLock,
  FiCheckCircle,
  FiRefreshCw,
  FiZap,
  FiEdit3,
  FiCopy,
  FiCheck,
  FiMail as FiMailSent,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiInfo,
  FiGlobe,
} from 'react-icons/fi';
import Modal from '@/components/common/Modal/Modal';
import Checkbox from '@/components/common/Checkbox/Checkbox';
import FilterDropdown from '@/components/common/FilterDropdown/FilterDropdown';
import { validatePassword } from '@/validators/passwordValidation';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '@/constants/languages';
import styles from './AdminCreateUser.module.scss';

/**
 * Sicheres Passwort (16 Zeichen) auf dem Client generieren
 */
function generateClientPassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%&*?';
  const all = upper + lower + digits + special;
  const pick = charset => {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    return charset[buf[0] % charset.length];
  };
  const required = [
    pick(upper),
    pick(upper),
    pick(lower),
    pick(lower),
    pick(digits),
    pick(digits),
    pick(special),
    pick(special),
  ];
  const extra = Array.from({ length: 8 }, () => pick(all));
  const chars = [...required, ...extra];
  for (let i = chars.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/**
 * Leeres Formular-Objekt
 */
const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  isVerified: false,
  autoGeneratePassword: true,
  emailLanguage: 'de',
};

/**
 * AdminCreateUser Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal offen?
 * @param {Function} props.onClose - Modal schließen
 * @param {Function} props.onSubmit - createUser(data) → { success, data: { generatedPassword, emailSent } }
 * @param {boolean} props.loading - Ladevorgang läuft
 */
function AdminCreateUser({ isOpen, onClose, onSubmit, loading = false }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => ({ ...INITIAL_FORM, password: generateClientPassword() }));
  const [errors, setErrors] = useState({});
  // Zustand nach erfolgreicher Erstellung: zeigt generiertes Passwort an
  const [createdResult, setCreatedResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  // ── Feld-Änderung ───────────────────────────────
  const handleChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  // ── Reset bei Schließen ─────────────────────────
  const handleClose = useCallback(() => {
    setForm({ ...INITIAL_FORM, password: generateClientPassword() });
    setErrors({});
    setCreatedResult(null);
    setCopied(false);
    setShowPassword(true);
    onClose?.();
  }, [onClose]);

  // ── Passwort in Zwischenablage kopieren ─────────
  const handleCopyPassword = useCallback(async () => {
    if (!createdResult?.generatedPassword) return;
    try {
      await navigator.clipboard.writeText(createdResult.generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback für Browser ohne Clipboard API
      const el = document.createElement('textarea');
      el.value = createdResult.generatedPassword;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [createdResult]);

  // ── Validierung ─────────────────────────────────
  const validate = useCallback(() => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = t('admin.users.create.errorNameRequired');
    } else if (form.name.trim().length < 2) {
      newErrors.name = t('admin.users.create.errorNameTooShort');
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = t('admin.users.create.errorEmailInvalid');
    }

    // Passwort nur validieren wenn manuell eingegeben
    if (!form.autoGeneratePassword) {
      const pwError = validatePassword(form.password);
      if (pwError) {
        newErrors.password = t(`admin.users.create.errorPassword_${pwError}`);
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, t]);

  // ── Submit ──────────────────────────────────────
  const handleSubmit = useCallback(
    async e => {
      e.preventDefault();
      if (!validate()) return;

      const payload = {
        name: form.name.trim(),
        ...(form.email.trim() && { email: form.email.trim() }),
        role: form.role,
        isVerified: form.isVerified,
        autoGeneratePassword: false,
        password: form.password,
        ...(form.email.trim() && { emailLanguage: form.emailLanguage }),
      };

      const submittedPassword = form.password;
      const result = await onSubmit?.(payload);

      if (result?.success) {
        const { emailSent } = result.data || {};
        setCreatedResult({ generatedPassword: submittedPassword, emailSent: !!emailSent });
      }
    },
    [form, validate, onSubmit]
  );

  // ── Passwort-Anzeige nach Erstellung ────────────
  if (createdResult) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={t('admin.users.create.title')}
        size="medium"
      >
        <div className={styles.createdView}>
          <div className={styles.createdHeader}>
            <FiCheckCircle size={32} className={styles.createdIcon} />
            <p>{t('admin.users.create.success')}</p>
          </div>

          {createdResult.emailSent && (
            <div className={styles.credentialsBanner}>
              <FiMailSent size={14} />
              <span>{t('admin.users.create.credentialsSentBanner')}</span>
            </div>
          )}

          {!createdResult.emailSent && (
            <div className={styles.noEmailHint}>
              <FiInfo size={14} />
              <span>{t('admin.users.create.noEmailHint')}</span>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>
              <FiLock size={14} />
              {t('admin.users.create.generatedPasswordTitle')}
            </label>
            <div className={styles.generatedPasswordBox}>
              <input
                type="text"
                readOnly
                value={createdResult.generatedPassword}
                className={styles.generatedPasswordInput}
                aria-label={t('admin.users.create.generatedPasswordTitle')}
              />
              <button
                type="button"
                className={`${styles.copyButton} ${copied ? styles.copyButtonSuccess : ''}`}
                onClick={handleCopyPassword}
                title={
                  copied
                    ? t('admin.users.create.passwordCopied')
                    : t('admin.users.create.copyPassword')
                }
              >
                {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
                <span>
                  {copied
                    ? t('admin.users.create.passwordCopied')
                    : t('admin.users.create.copyPassword')}
                </span>
              </button>
            </div>
            <p className={styles.generatedPasswordHint}>
              <FiAlertCircle size={13} />
              {t('admin.users.create.generatedPasswordHint')}
            </p>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.submitButton} onClick={handleClose}>
              {t('common.close')}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('admin.users.create.title')}
      size="medium"
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* Name + Email – 2-Spalten-Zeile */}
        <div className={styles.formRow}>
          {/* Name */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="create-user-name">
              <FiUser size={14} />
              {t('admin.users.create.labelName')}
            </label>
            <input
              id="create-user-name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder={t('admin.users.create.placeholderName')}
              disabled={loading}
              autoComplete="off"
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="create-user-email">
              <FiMail size={14} />
              {t('admin.users.create.labelEmail')}
              <span className={styles.optionalTag}>
                {t('admin.users.create.labelEmailOptional')}
              </span>
            </label>
            <input
              id="create-user-email"
              type="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder={t('admin.users.create.placeholderEmail')}
              disabled={loading}
              autoComplete="off"
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            {!form.email.trim() && !errors.email && (
              <p className={styles.fieldHint}>
                <FiInfo size={12} />
                {t('admin.users.create.noEmailFormHint')}
              </p>
            )}
          </div>
        </div>

        {/* Email Language – nur sichtbar wenn Email angegeben */}
        {form.email.trim() && (
          <div className={styles.field}>
            <FilterDropdown
              id="create-user-email-language"
              label={
                <>
                  <FiGlobe size={14} /> {t('admin.users.create.labelEmailLanguage')}
                </>
              }
              options={SUPPORTED_LANGUAGES.map(lang => ({
                value: lang,
                label: LANGUAGE_LABELS[lang],
              }))}
              value={form.emailLanguage}
              onChange={val => handleChange('emailLanguage', val)}
              disabled={loading}
              size="md"
              placeholder={t('admin.users.create.labelEmailLanguage')}
            />
            <p className={styles.fieldHint}>
              <FiInfo size={12} />
              {t('admin.users.create.emailLanguageHint')}
            </p>
          </div>
        )}

        {/* Password */}
        <div className={styles.field}>
          <label className={styles.label}>
            <FiLock size={14} />
            {t('admin.users.create.labelPassword')}
          </label>
          <div className={styles.passwordModeToggle}>
            <button
              type="button"
              className={`${styles.toggleOption} ${form.autoGeneratePassword ? styles.toggleOptionActive : ''}`}
              onClick={() => {
                const pw = generateClientPassword();
                setForm(prev => ({ ...prev, autoGeneratePassword: true, password: pw }));
                setErrors(prev => ({ ...prev, password: '' }));
                setShowPassword(true);
              }}
              disabled={loading}
            >
              <FiZap size={13} />
              {t('admin.users.create.autoGeneratePassword')}
            </button>
            <button
              type="button"
              className={`${styles.toggleOption} ${!form.autoGeneratePassword ? styles.toggleOptionActive : ''}`}
              onClick={() => {
                setForm(prev => ({ ...prev, autoGeneratePassword: false, password: '' }));
                setErrors(prev => ({ ...prev, password: '' }));
                setShowPassword(false);
              }}
              disabled={loading}
            >
              <FiEdit3 size={13} />
              {t('admin.users.create.manualPassword')}
            </button>
          </div>

          <div className={styles.passwordInputWrapper}>
            <input
              id="create-user-password"
              name="create-user-password"
              type={showPassword ? 'text' : 'password'}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              value={form.password}
              readOnly={form.autoGeneratePassword}
              onChange={
                form.autoGeneratePassword
                  ? undefined
                  : e => handleChange('password', e.target.value)
              }
              placeholder={
                form.autoGeneratePassword
                  ? t('admin.users.create.placeholderPasswordAuto')
                  : t('admin.users.create.placeholderPassword')
              }
              disabled={loading}
              autoComplete="new-password"
              style={{ paddingRight: form.autoGeneratePassword ? '5rem' : '2.5rem' }}
            />
            {form.autoGeneratePassword && (
              <button
                type="button"
                className={styles.regenerateButton}
                onClick={() => {
                  const pw = generateClientPassword();
                  setForm(prev => ({ ...prev, password: pw }));
                  setErrors(prev => ({ ...prev, password: '' }));
                }}
                tabIndex={-1}
                title={t('admin.users.create.regeneratePassword')}
                disabled={loading}
              >
                <FiRefreshCw size={14} />
              </button>
            )}
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
              disabled={loading}
            >
              {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            </button>
          </div>
          {errors.password && <span className={styles.errorText}>{errors.password}</span>}
        </div>

        {/* Role + Verified Row */}
        <div className={styles.rowFields}>
          <div className={styles.field}>
            <FilterDropdown
              id="create-user-role"
              label={t('admin.users.create.labelRole')}
              options={[
                { value: 'user', label: t('admin.users.roleUser') },
                { value: 'viewer', label: t('admin.users.roleViewer') },
                { value: 'admin', label: t('admin.users.roleAdmin') },
              ]}
              value={form.role}
              onChange={val => handleChange('role', val)}
              disabled={loading}
              size="md"
              placeholder={t('admin.users.create.labelRole')}
            />
          </div>

          <div className={styles.field}>
            <Checkbox
              checked={form.isVerified}
              onChange={e => handleChange('isVerified', e.target.checked)}
              disabled={loading}
            >
              <FiCheckCircle size={14} /> {t('admin.users.create.labelVerified')}
            </Checkbox>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? (
              <FiRefreshCw size={14} className={styles.spinning} />
            ) : (
              <FiUserPlus size={14} />
            )}
            {t('admin.users.create.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default memo(AdminCreateUser);
