/**
 * @fileoverview Export-Utility für Audit-Log (CSV & PDF)
 * @description CSV: nativer Blob-Export. PDF: delegiert an generatePDF() aus exportHelpers
 *              für einheitliches Layout (Header/Footer/Seitennummern).
 * @module utils/exportAuditLog
 */

import { generatePDF } from './exportHelpers';

/**
 * Formatiert ein Datum für den Export (Locale-unabhängig)
 * @param {string} dateStr - ISO-Datum
 * @returns {string} Formatiertes Datum
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return '—';
  }
}

/**
 * Exportiert Audit-Logs als CSV-Datei
 * @param {Array} logs - Audit-Log-Einträge
 * @param {string} filename - Dateiname (ohne Endung)
 * @param {Function} t - i18next translate-Funktion
 */
export function exportToCSV(logs, filename, t) {
  const headers = [
    t('admin.auditLog.date'),
    t('admin.auditLog.admin'),
    t('admin.auditLog.action'),
    t('admin.auditLog.target'),
    t('admin.auditLog.country'),
    t('admin.auditLog.city'),
    t('admin.auditLog.ipAddress'),
    t('admin.auditLog.details'),
  ];

  const escapeCSV = val => {
    const str = String(val ?? '—');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = logs.map(log => [
    escapeCSV(formatDate(log.createdAt)),
    escapeCSV(log.adminName),
    escapeCSV(t(`admin.auditLog.actions_enum.${log.action}`, log.action)),
    escapeCSV(log.targetUserName),
    escapeCSV(log.country),
    escapeCSV(log.city),
    escapeCSV(log.ipAddress),
    escapeCSV(typeof log.details === 'object' ? JSON.stringify(log.details) : log.details),
  ]);

  // BOM für korrektes Encoding in Excel
  const BOM = '\uFEFF';
  const csv = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Exportiert Audit-Logs als PDF mit einheitlichem Layout.
 * Delegiert an generatePDF() für Header/Footer/Seitennummern.
 *
 * @param {Array} logs - Audit-Log-Einträge
 * @param {string} filename - Dateiname (ohne Endung)
 * @param {Function} t - i18next translate-Funktion
 * @param {Object} [userInfo] - { name, email } des eingeloggten Users
 */
export async function exportToPDF(logs, filename, t, userInfo) {
  const headers = [
    t('admin.auditLog.date'),
    t('admin.auditLog.admin'),
    t('admin.auditLog.action'),
    t('admin.auditLog.target'),
    t('admin.auditLog.country'),
    t('admin.auditLog.city'),
    t('admin.auditLog.ipAddress'),
  ];

  const rows = logs.map(log => [
    formatDate(log.createdAt),
    log.adminName || '—',
    t(`admin.auditLog.actions_enum.${log.action}`, log.action),
    log.targetUserName || '—',
    log.country || '—',
    log.city || '—',
    log.ipAddress || '—',
  ]);

  await generatePDF({
    title: t('admin.auditLog.title'),
    headers,
    rows,
    filename: `${filename}.pdf`,
    userInfo,
  });
}
