/**
 * @fileoverview AdminCreateUser – User-Erstellen-Modal
 * @description Modal mit Formular zum manuellen Anlegen neuer Benutzer
 *              (Name, E-Mail, Passwort, Rolle, Verifiziert-Status).
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
} from 'react-icons/fi';
import Modal from '@/components/common/Modal/Modal';
import Checkbox from '@/components/common/Checkbox/Checkbox';
import FilterDropdown from '@/components/common/FilterDropdown/FilterDropdown';
import { validatePassword } from '@/validators/passwordValidation';
import styles from './AdminCreateUser.module.scss';

/**
 * Leeres Formular-Objekt
 */
const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  isVerified: false,
};

/**
 * AdminCreateUser Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal offen?
 * @param {Function} props.onClose - Modal schließen
 * @param {Function} props.onSubmit - createUser({ name, email, password, role, isVerified })
 * @param {boolean} props.loading - Ladevorgang läuft
 */
function AdminCreateUser({ isOpen, onClose, onSubmit, loading = false }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [errors, setErrors] = useState({});

  // ── Feld-Änderung ───────────────────────────────
  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  // ── Reset bei Schließen ─────────────────────────
  const handleClose = useCallback(() => {
    setForm({ ...INITIAL_FORM });
    setErrors({});
    onClose?.();
  }, [onClose]);

  // ── Validierung ─────────────────────────────────
  const validate = useCallback(() => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = t('admin.users.create.errorNameRequired');
    } else if (form.name.trim().length < 2) {
      newErrors.name = t('admin.users.create.errorNameTooShort');
    }

    if (!form.email.trim()) {
      newErrors.email = t('admin.users.create.errorEmailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = t('admin.users.create.errorEmailInvalid');
    }

    const pwError = validatePassword(form.password);
    if (pwError) {
      newErrors.password = t(`admin.users.create.errorPassword_${pwError}`);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, t]);

  // ── Submit ──────────────────────────────────────
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validate()) return;

      const result = await onSubmit?.({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        isVerified: form.isVerified,
      });

      if (result?.success) {
        handleClose();
      }
    },
    [form, validate, onSubmit, handleClose],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('admin.users.create.title')}
      size="medium"
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
            onChange={(e) => handleChange('name', e.target.value)}
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
          </label>
          <input
            id="create-user-email"
            type="email"
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder={t('admin.users.create.placeholderEmail')}
            disabled={loading}
            autoComplete="off"
          />
          {errors.email && <span className={styles.errorText}>{errors.email}</span>}
        </div>

        {/* Password */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="create-user-password">
            <FiLock size={14} />
            {t('admin.users.create.labelPassword')}
          </label>
          <input
            id="create-user-password"
            type="password"
            className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder={t('admin.users.create.placeholderPassword')}
            disabled={loading}
            autoComplete="new-password"
          />
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
                { value: 'admin', label: t('admin.users.roleAdmin') },
              ]}
              value={form.role}
              onChange={(val) => handleChange('role', val)}
              disabled={loading}
              size="md"
              placeholder={t('admin.users.create.labelRole')}
            />
          </div>

          <div className={styles.field}>
            <Checkbox
              checked={form.isVerified}
              onChange={(e) => handleChange('isVerified', e.target.checked)}
              disabled={loading}
            >
              <FiCheckCircle size={14} />
              {' '}{t('admin.users.create.labelVerified')}
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
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
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
