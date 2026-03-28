/**
 * @fileoverview Admin Campaign Composer
 * @description Erstellen/Bearbeiten einer Newsletter-Kampagne mit Vorlagen,
 *              Multi-Language-Support, Empfänger-Filter und Vorschau.
 *
 * @module pages/admin/AdminCampaignComposer
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiSave,
  FiSend,
  FiEye,
  FiRefreshCw,
  FiAlertTriangle,
  FiX,
  FiFileText,
} from 'react-icons/fi';
import { adminService } from '@/api/adminService';
import { useToast } from '@/hooks';
import Modal from '@/components/common/Modal/Modal';
import FilterDropdown from '@/components/common/FilterDropdown/FilterDropdown';
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  CAMPAIGN_TEMPLATES,
  TEMPLATE_MAP,
} from '@/constants';
import styles from './AdminCampaignComposer.module.scss';

// ── Leeres Multi-Language Objekt ──────────────────
const emptyMultiLang = () =>
  Object.fromEntries(SUPPORTED_LANGUAGES.map(l => [l, { subject: '', content: '' }]));

export default function AdminCampaignComposer() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // ── Template State ──────────────────────────────
  const [templateId, setTemplateId] = useState('');

  // ── Form State (single-language mode) ───────────
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('de');

  // ── Multi-language State ────────────────────────
  const [multiLang, setMultiLang] = useState(emptyMultiLang);
  const [activeTab, setActiveTab] = useState('de');

  // ── Recipient Filter ────────────────────────────
  const [recipientLang, setRecipientLang] = useState('');
  const [broadcastMode, setBroadcastMode] = useState(false);
  // isMultiLang: kein spezifischer Sprachfilter, kein Edit, kein Broadcast
  const isMultiLang = !recipientLang && !isEdit && !broadcastMode;

  // ── UI State ────────────────────────────────────
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [recipientCount, setRecipientCount] = useState(null);
  const [errors, setErrors] = useState({});

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Template Options for FilterDropdown ─────────
  const templateOptions = useMemo(
    () => [
      { value: '', label: t('admin.campaigns.templates.custom') },
      ...CAMPAIGN_TEMPLATES.map(tpl => ({
        value: tpl.id,
        label: t(tpl.labelKey),
      })),
    ],
    [t]
  );

  // ── Recipient Options ───────────────────────────
  const recipientOptions = useMemo(
    () => [
      { value: '', label: t('admin.campaigns.allConfirmed') },
      { value: '__broadcast__', label: t('admin.campaigns.broadcastMode') },
      ...SUPPORTED_LANGUAGES.map(lang => ({
        value: lang,
        label: t('admin.campaigns.languageOnly', { lang: LANGUAGE_LABELS[lang] }),
      })),
    ],
    [t]
  );

  // ── Language Options ────────────────────────────
  const languageOptions = useMemo(
    () =>
      SUPPORTED_LANGUAGES.map(lang => ({
        value: lang,
        label: LANGUAGE_LABELS[lang],
      })),
    []
  );

  // ── Template-Wechsel: Inhalte auto-füllen ───────
  const handleTemplateChange = useCallback(
    newTemplateId => {
      setTemplateId(newTemplateId);
      if (!newTemplateId) return;

      const tpl = TEMPLATE_MAP[newTemplateId];
      if (!tpl) return;

      // Multi-language → fill all tabs
      const newMulti = {};
      for (const lang of SUPPORTED_LANGUAGES) {
        newMulti[lang] = {
          subject: tpl.subjects[lang] || '',
          content: tpl.contents[lang] || '',
        };
      }
      setMultiLang(newMulti);

      // Single-language → fill current language
      const lang = recipientLang || language;
      setSubject(tpl.subjects[lang] || tpl.subjects.de || '');
      setContent(tpl.contents[lang] || tpl.contents.de || '');
    },
    [recipientLang, language]
  );

  // ── Recipient-Wechsel ───────────────────────────
  const handleRecipientChange = useCallback(
    newVal => {
      if (newVal === '__broadcast__') {
        setBroadcastMode(true);
        setRecipientLang('');
        return;
      }
      setBroadcastMode(false);
      setRecipientLang(newVal);
      if (newVal) {
        setLanguage(newVal);
        if (templateId) {
          const tpl = TEMPLATE_MAP[templateId];
          if (tpl) {
            setSubject(tpl.subjects[newVal] || '');
            setContent(tpl.contents[newVal] || '');
          }
        }
      }
    },
    [templateId]
  );

  // ── Fetch existing campaign (edit mode) ─────────
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await adminService.getCampaign(id);
        if (cancelled) return;
        const data = res.data?.data || res.data;
        setSubject(data.subject || '');
        setContent(data.content || '');
        setLanguage(data.language || 'de');
        setRecipientLang(data.recipientFilter?.language || data.language || 'de');
      } catch {
        if (!cancelled) toast.error(t('admin.campaigns.saveError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, isEdit, t, toast]);

  // ── Fetch recipient count estimate ──────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const params = { isConfirmed: 'true' };
        if (recipientLang) params.language = recipientLang;
        const res = await adminService.getSubscribers({ ...params, limit: 1 });
        if (cancelled) return;
        const data = res.data?.data || res.data;
        setRecipientCount(data.pagination?.total ?? 0);
      } catch {
        if (!cancelled) setRecipientCount(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [recipientLang]);

  // ── Update multiLang from tab edits ─────────────
  const updateMultiField = useCallback((lang, field, value) => {
    setMultiLang(prev => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value },
    }));
    setErrors(prev => ({ ...prev, [`${field}_${lang}`]: undefined }));
  }, []);

  // ── Validation ──────────────────────────────────
  const validate = useCallback(() => {
    const errs = {};

    if (isMultiLang) {
      for (const lang of SUPPORTED_LANGUAGES) {
        const s = multiLang[lang]?.subject || '';
        const c = multiLang[lang]?.content || '';
        if (!s.trim()) errs[`subject_${lang}`] = t('admin.campaigns.subjectRequired');
        else if (s.length > 200) errs[`subject_${lang}`] = t('admin.campaigns.subjectTooLong');
        if (!c.trim()) errs[`content_${lang}`] = t('admin.campaigns.contentRequired');
        else if (c.length > 50000) errs[`content_${lang}`] = t('admin.campaigns.contentTooLong');
      }
      const firstErrLang = SUPPORTED_LANGUAGES.find(
        l => errs[`subject_${l}`] || errs[`content_${l}`]
      );
      if (firstErrLang) setActiveTab(firstErrLang);
    } else {
      if (!subject.trim()) errs.subject = t('admin.campaigns.subjectRequired');
      else if (subject.length > 200) errs.subject = t('admin.campaigns.subjectTooLong');
      if (!content.trim()) errs.content = t('admin.campaigns.contentRequired');
      else if (content.length > 50000) errs.content = t('admin.campaigns.contentTooLong');
      if (!language) errs.language = t('admin.campaigns.languageRequired');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [isMultiLang, multiLang, subject, content, language, t]);

  // ── Save (single or multi-language) ─────────────
  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      if (isMultiLang) {
        const saveErrors = [];
        for (const lang of SUPPORTED_LANGUAGES) {
          const payload = {
            subject: multiLang[lang].subject.trim(),
            content: multiLang[lang].content.trim(),
            language: lang,
            recipientFilter: { language: lang },
          };
          try {
            await adminService.createCampaign(payload);
          } catch {
            saveErrors.push(LANGUAGE_LABELS[lang]);
          }
        }
        if (!mountedRef.current) return;
        if (saveErrors.length < SUPPORTED_LANGUAGES.length) {
          toast.success(t('admin.campaigns.saveSuccess'));
          navigate('/admin/campaigns');
        } else {
          toast.error(t('admin.campaigns.saveError'));
        }
      } else {
        const payload = {
          subject: subject.trim(),
          content: content.trim(),
          language,
          recipientFilter: recipientLang ? { language: recipientLang } : {},
        };
        if (isEdit) {
          await adminService.updateCampaign(id, payload);
        } else {
          await adminService.createCampaign(payload);
        }
        if (!mountedRef.current) return;
        toast.success(t('admin.campaigns.saveSuccess'));
        navigate('/admin/campaigns');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      toast.error(err.response?.data?.error || t('admin.campaigns.saveError'));
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [
    validate,
    isMultiLang,
    multiLang,
    subject,
    content,
    language,
    recipientLang,
    isEdit,
    id,
    toast,
    t,
    navigate,
  ]);

  // ── Preview ─────────────────────────────────────
  const handlePreview = useCallback(async () => {
    const previewSubject = isMultiLang ? multiLang[activeTab]?.subject : subject;
    const previewContent = isMultiLang ? multiLang[activeTab]?.content : content;
    const previewLang = isMultiLang ? activeTab : language;

    if (!previewContent?.trim()) {
      setErrors(prev => ({
        ...prev,
        [isMultiLang ? `content_${activeTab}` : 'content']: t('admin.campaigns.contentRequired'),
      }));
      return;
    }

    setPreviewLoading(true);
    setPreviewOpen(true);

    try {
      const res = await adminService.previewCampaign({
        subject: previewSubject?.trim() || t('admin.campaigns.preview'),
        content: previewContent.trim(),
        language: previewLang,
      });
      if (!mountedRef.current) return;
      setPreviewHtml(res.data?.data?.html || '');
    } catch {
      if (!mountedRef.current) return;
      toast.error(t('admin.campaigns.saveError'));
      setPreviewOpen(false);
    } finally {
      if (mountedRef.current) setPreviewLoading(false);
    }
  }, [isMultiLang, multiLang, activeTab, subject, content, language, toast, t]);

  // ── Send ────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!validate()) return;
    setSending(true);

    try {
      if (isMultiLang) {
        let totalSuccess = 0;
        let totalRecipients = 0;
        const skipped = []; // Sprachen ohne Abonnenten (Warnung)
        const failed = []; // Sprachen mit echten Fehlern

        for (const lang of SUPPORTED_LANGUAGES) {
          const payload = {
            subject: multiLang[lang].subject.trim(),
            content: multiLang[lang].content.trim(),
            language: lang,
            recipientFilter: { language: lang },
          };
          try {
            const createRes = await adminService.createCampaign(payload);
            const campaignId = createRes.data?.data?._id || createRes.data?.data?.id;
            if (campaignId) {
              try {
                const sendRes = await adminService.sendCampaign(campaignId);
                const data = sendRes.data?.data || sendRes.data;
                totalSuccess += data?.successCount ?? 0;
                totalRecipients += data?.recipientCount ?? 0;
              } catch (sendErr) {
                if (sendErr.response?.data?.code === 'NO_RECIPIENTS') {
                  skipped.push(LANGUAGE_LABELS[lang]);
                } else {
                  failed.push(LANGUAGE_LABELS[lang]);
                }
              }
            }
          } catch {
            failed.push(LANGUAGE_LABELS[lang]);
          }
        }

        if (!mountedRef.current) return;

        const sentCount = SUPPORTED_LANGUAGES.length - skipped.length - failed.length;
        if (sentCount > 0) {
          toast.success(
            t('admin.campaigns.sendSuccess', {
              success: totalSuccess,
              total: totalRecipients,
            })
          );
        }
        if (skipped.length > 0) {
          toast.warning(t('admin.campaigns.sendSkippedLangs', { langs: skipped.join(', ') }));
        }
        if (failed.length > 0) {
          toast.error(t('admin.campaigns.sendError'));
        }
        // Nur navigieren wenn mindestens etwas gesendet oder übersprungen wurde
        if (sentCount > 0 || (skipped.length > 0 && failed.length === 0)) {
          navigate('/admin/campaigns');
        }
      } else {
        const payload = {
          subject: subject.trim(),
          content: content.trim(),
          language,
          recipientFilter: recipientLang ? { language: recipientLang } : {},
        };

        let campaignId = id;
        if (isEdit) {
          await adminService.updateCampaign(id, payload);
        } else {
          const res = await adminService.createCampaign(payload);
          campaignId = res.data?.data?._id || res.data?.data?.id;
        }

        const sendRes = await adminService.sendCampaign(campaignId);
        if (!mountedRef.current) return;
        const data = sendRes.data?.data || sendRes.data;
        toast.success(
          t('admin.campaigns.sendSuccess', {
            success: data?.successCount ?? 0,
            total: data?.recipientCount ?? 0,
          })
        );
        navigate('/admin/campaigns');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const code = err.response?.data?.code;
      if (code === 'NO_RECIPIENTS') {
        toast.error(t('admin.campaigns.noConfirmedRecipients'));
      } else {
        toast.error(err.response?.data?.error || t('admin.campaigns.sendError'));
      }
    } finally {
      if (mountedRef.current) {
        setSending(false);
        setSendConfirmOpen(false);
      }
    }
  }, [
    validate,
    isMultiLang,
    multiLang,
    subject,
    content,
    language,
    recipientLang,
    isEdit,
    id,
    toast,
    t,
    navigate,
  ]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <FiRefreshCw size={24} className={styles.spinning} />
        </div>
      </div>
    );
  }

  const tabSubject = multiLang[activeTab]?.subject || '';
  const tabContent = multiLang[activeTab]?.content || '';

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────── */}
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/admin/campaigns')}
          type="button"
        >
          <FiArrowLeft size={16} />
          {t('admin.campaigns.backToList')}
        </button>
        <h1 className={styles.title}>
          {isEdit ? t('admin.campaigns.editCampaign') : t('admin.campaigns.create')}
        </h1>
      </div>

      {/* ── Form ────────────────────────────────── */}
      <div className={styles.form}>
        {/* Template + Recipient Row (only in create mode) */}
        {!isEdit && (
          <div className={styles.fieldRow}>
            <FilterDropdown
              value={templateId}
              onChange={handleTemplateChange}
              label={t('admin.campaigns.templates.label')}
              ariaLabel={t('admin.campaigns.templates.label')}
              placeholder={t('admin.campaigns.templates.custom')}
              icon={<FiFileText size={14} />}
              options={templateOptions}
              size="md"
              className={styles.fieldGroup}
            />
            <FilterDropdown
              value={broadcastMode ? '__broadcast__' : recipientLang}
              onChange={handleRecipientChange}
              label={t('admin.campaigns.recipientFilter')}
              ariaLabel={t('admin.campaigns.recipientFilter')}
              placeholder={t('admin.campaigns.allConfirmed')}
              options={recipientOptions}
              size="md"
              className={styles.fieldGroup}
            />
          </div>
        )}

        {/* Recipient hint */}
        {recipientCount !== null && (
          <p className={styles.recipientHint}>
            {recipientCount > 0
              ? t('admin.campaigns.recipientCount', { count: recipientCount })
              : t('admin.campaigns.noRecipients')}
          </p>
        )}

        {/* Broadcast mode hint */}
        {broadcastMode && (
          <p className={styles.broadcastHint}>{t('admin.campaigns.broadcastModeHint')}</p>
        )}

        {/* ── Multi-Language Mode ───────────────── */}
        {isMultiLang ? (
          <>
            <div className={styles.langTabs} role="tablist">
              {SUPPORTED_LANGUAGES.map(lang => {
                const hasError = errors[`subject_${lang}`] || errors[`content_${lang}`];
                return (
                  <button
                    key={lang}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === lang}
                    className={`${styles.langTab} ${activeTab === lang ? styles.langTabActive : ''} ${hasError ? styles.langTabError : ''}`}
                    onClick={() => setActiveTab(lang)}
                  >
                    {LANGUAGE_LABELS[lang]}
                    {hasError && <FiAlertTriangle size={12} className={styles.tabErrorIcon} />}
                  </button>
                );
              })}
            </div>

            <div className={styles.tabContent} role="tabpanel">
              <div className={styles.fieldGroup}>
                <label htmlFor={`subject-${activeTab}`} className={styles.label}>
                  {t('admin.campaigns.subject')} ({LANGUAGE_LABELS[activeTab]}) *
                </label>
                <input
                  id={`subject-${activeTab}`}
                  type="text"
                  className={`${styles.input} ${errors[`subject_${activeTab}`] ? styles.inputError : ''}`}
                  value={tabSubject}
                  onChange={e => updateMultiField(activeTab, 'subject', e.target.value)}
                  placeholder={t('admin.campaigns.subjectPlaceholder')}
                  maxLength={200}
                />
                {errors[`subject_${activeTab}`] && (
                  <p className={styles.errorMsg}>{errors[`subject_${activeTab}`]}</p>
                )}
                <span className={styles.charCount}>{tabSubject.length}/200</span>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor={`content-${activeTab}`} className={styles.label}>
                  {t('admin.campaigns.content')} ({LANGUAGE_LABELS[activeTab]}) *
                </label>
                <textarea
                  id={`content-${activeTab}`}
                  className={`${styles.textarea} ${errors[`content_${activeTab}`] ? styles.inputError : ''}`}
                  value={tabContent}
                  onChange={e => updateMultiField(activeTab, 'content', e.target.value)}
                  placeholder={t('admin.campaigns.contentPlaceholder')}
                  rows={14}
                  maxLength={50000}
                />
                {errors[`content_${activeTab}`] && (
                  <p className={styles.errorMsg}>{errors[`content_${activeTab}`]}</p>
                )}
                <span className={styles.charCount}>
                  {tabContent.length.toLocaleString()}/50.000
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.fieldGroup}>
              <label htmlFor="campaign-subject" className={styles.label}>
                {t('admin.campaigns.subject')} *
              </label>
              <input
                id="campaign-subject"
                type="text"
                className={`${styles.input} ${errors.subject ? styles.inputError : ''}`}
                value={subject}
                onChange={e => {
                  setSubject(e.target.value);
                  setErrors(p => ({ ...p, subject: undefined }));
                }}
                placeholder={t('admin.campaigns.subjectPlaceholder')}
                maxLength={200}
              />
              {errors.subject && <p className={styles.errorMsg}>{errors.subject}</p>}
              <span className={styles.charCount}>{subject.length}/200</span>
            </div>

            {(isEdit || broadcastMode) && (
              <FilterDropdown
                value={language}
                onChange={setLanguage}
                label={t('admin.campaigns.language')}
                ariaLabel={t('admin.campaigns.language')}
                options={languageOptions}
                size="md"
                className={styles.fieldGroup}
              />
            )}

            <div className={styles.fieldGroup}>
              <label htmlFor="campaign-content" className={styles.label}>
                {t('admin.campaigns.content')} *
              </label>
              <textarea
                id="campaign-content"
                className={`${styles.textarea} ${errors.content ? styles.inputError : ''}`}
                value={content}
                onChange={e => {
                  setContent(e.target.value);
                  setErrors(p => ({ ...p, content: undefined }));
                }}
                placeholder={t('admin.campaigns.contentPlaceholder')}
                rows={16}
                maxLength={50000}
              />
              {errors.content && <p className={styles.errorMsg}>{errors.content}</p>}
              <span className={styles.charCount}>{content.length.toLocaleString()}/50.000</span>
            </div>
          </>
        )}

        {/* ── Action Buttons ────────────────────── */}
        <div className={styles.actions}>
          <button
            className={styles.previewButton}
            onClick={handlePreview}
            disabled={saving || sending}
            type="button"
          >
            <FiEye size={16} />
            {t('admin.campaigns.preview')}
          </button>

          <div className={styles.actionsRight}>
            <button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={saving || sending}
              type="button"
            >
              {saving ? (
                <FiRefreshCw size={16} className={styles.spinning} />
              ) : (
                <FiSave size={16} />
              )}
              {t('admin.campaigns.saveDraft')}
            </button>
            <button
              className={styles.sendButton}
              onClick={() => {
                if (validate()) setSendConfirmOpen(true);
              }}
              disabled={saving || sending}
              type="button"
            >
              <FiSend size={16} />
              {t('admin.campaigns.send')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Preview Modal ───────────────────────── */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={t('admin.campaigns.previewTitle')}
        size="large"
      >
        <div className={styles.previewContent}>
          {previewLoading ? (
            <div className={styles.previewLoading}>
              <FiRefreshCw size={24} className={styles.spinning} />
            </div>
          ) : (
            <iframe
              title={t('admin.campaigns.previewTitle')}
              srcDoc={previewHtml}
              className={styles.previewFrame}
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </Modal>

      {/* ── Send Confirmation Modal ─────────────── */}
      <Modal
        isOpen={sendConfirmOpen}
        onClose={() => !sending && setSendConfirmOpen(false)}
        title={t('admin.campaigns.confirmSend')}
        size="small"
      >
        <div className={styles.confirmView}>
          <div className={styles.confirmIcon}>
            <FiAlertTriangle size={28} />
          </div>
          <p className={styles.confirmText}>
            {isMultiLang
              ? t('admin.campaigns.confirmSendAllLangs', { count: recipientCount ?? '?' })
              : broadcastMode
                ? t('admin.campaigns.broadcastConfirmText', { count: recipientCount ?? '?' })
                : t('admin.campaigns.confirmSendText', { count: recipientCount ?? '?' })}
          </p>
          <div className={styles.confirmActions}>
            <button
              className={styles.cancelBtn}
              onClick={() => setSendConfirmOpen(false)}
              disabled={sending}
              type="button"
            >
              <FiX size={14} />
              {t('common.cancel')}
            </button>
            <button
              className={styles.confirmSendBtn}
              onClick={handleSend}
              disabled={sending}
              type="button"
            >
              {sending ? (
                <FiRefreshCw size={14} className={styles.spinning} />
              ) : (
                <FiSend size={14} />
              )}
              {t('admin.campaigns.send')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
