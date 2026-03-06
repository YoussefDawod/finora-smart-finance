/**
 * @fileoverview ExportSection Component
 * @description Export- und Archivierungsfunktionen für Transaktionen
 * 
 * FEATURES:
 * - PDF-Export aller Transaktionen
 * - CSV-Export
 * - Zeitraum-Filter für Export
 */

 
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiFileText, FiDatabase } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { transactionService } from '@/api';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { translateCategory } from '@/utils/categoryTranslations';
import { getLocaleForLanguage, getUserPreferences } from '@/utils/userPreferences';
import Button from '@/components/common/Button/Button';
import styles from './ExportSection.module.scss';

// ============================================================================
// CSV-EXPORT HELPER
// ============================================================================
const generateCSV = (transactions, t) => {
  const { currency, language } = getUserPreferences();
  const locale = getLocaleForLanguage(language);
  const amountFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const headers = [
    t('export.csv.headers.date'),
    t('export.csv.headers.category'),
    t('export.csv.headers.description'),
    t('export.csv.headers.type'),
    t('export.csv.headers.amount', { currency }),
  ];
  const rows = transactions.map((tx) => [
    formatDate(tx.date, 'short'),
    translateCategory(tx.category, t),
    `"${(tx.description || '').replace(/"/g, '""')}"`, // Escape quotes
    tx.type === 'income' ? t('export.csv.types.income') : t('export.csv.types.expense'),
    amountFormatter.format(tx.amount),
  ]);

  const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  return csv;
};

// ============================================================================
// PDF-EXPORT HELPER (Professional HTML-to-Print approach)
// ============================================================================
const generatePDFContent = (transactions, userInfo = {}, t, headerDataUri = null, iconDataUri = null) => {
  const { language } = getUserPreferences();
  const locale = getLocaleForLanguage(language);
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const groupedByMonth = transactions.reduce((acc, tx) => {
    const date = new Date(tx.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  const exportDate = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const userName = userInfo?.name || t('export.pdf.defaultUserName');
  const userEmail = userInfo?.email || '';

  const isRTL = language === 'ar';

  return `<!DOCTYPE html>
<html lang="${language}"${isRTL ? ' dir="rtl"' : ''}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t('export.pdf.reportTitle')}</title>
  ${iconDataUri ? `<link rel="icon" type="image/svg+xml" href="${iconDataUri}">` : ''}
  <style>
    :root {
      --primary: #5b6cff;
      --success: #22c55e;
      --error: #f43f5e;
      --surface: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--text);
      background: var(--surface);
      line-height: 1.4;
      font-size: 12px;
    }
    
    /* ═══════════════════════════════════════════════════════════════════
       HEADER
    ═══════════════════════════════════════════════════════════════════ */
    .header {
      position: relative;
      line-height: 0;
      font-size: 0;
    }
    
    .header img {
      width: 100%;
      height: auto;
      display: block;
    }
    
    .header-user-info {
      position: absolute;
      top: 0;
      right: 24px;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: right;
      line-height: 1.4;
    }
    
    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: white;
    }
    
    .user-email {
      font-size: 11px;
      color: rgba(255,255,255,0.8);
    }
    
    .export-date {
      font-size: 10px;
      color: rgba(255,255,255,0.65);
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px solid rgba(255,255,255,0.3);
    }
    
    /* ═══════════════════════════════════════════════════════════════════
       SUMMARY - Inline, kompakt
    ═══════════════════════════════════════════════════════════════════ */
    .summary-bar {
      display: flex;
      background: #f8fafc;
      border-bottom: 1px solid var(--border);
    }
    
    .summary-item {
      flex: 1;
      padding: 12px 24px;
      text-align: center;
      border-right: 1px solid var(--border);
    }
    
    .summary-item:last-child { border-right: none; }
    
    .summary-item .label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-muted);
      font-weight: 600;
      margin-bottom: 2px;
    }
    
    .summary-item .value {
      font-size: 16px;
      font-weight: 700;
    }
    
    .summary-item.income .value { color: var(--success); }
    .summary-item.expense .value { color: var(--error); }
    .summary-item.balance .value { color: ${balance >= 0 ? 'var(--success)' : 'var(--error)'}; }
    
    /* ═══════════════════════════════════════════════════════════════════
       BODY - Transaktionen, volle Breite
    ═══════════════════════════════════════════════════════════════════ */
    .content {
      padding: 16px 24px;
      padding-bottom: 60px; /* Platz für Footer */
    }
    
    .month-section {
      margin-bottom: 16px;
    }
    
    .month-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: linear-gradient(135deg, #5b6cff 0%, #2dd4ff 100%);
      border-radius: 4px 4px 0 0;
      color: white;
    }
    
    .month-header h2 {
      font-size: 12px;
      font-weight: 600;
    }
    
    .month-header .stats {
      font-size: 10px;
      opacity: 0.9;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      background: white;
      border: 1px solid var(--border);
      border-top: none;
    }
    
    th {
      text-align: left;
      padding: 6px 12px;
      background: #f8fafc;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
    }
    
    td {
      padding: 6px 12px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    
    tr:last-child td { border-bottom: none; }
    
    .category-cell {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .type-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .type-dot.income { background: var(--success); }
    .type-dot.expense { background: var(--error); }
    
    .amount-cell {
      text-align: right;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    
    .amount-cell.income { color: var(--success); }
    .amount-cell.expense { color: var(--error); }
    
    /* ═══════════════════════════════════════════════════════════════════
       FOOTER - Fixed am unteren Rand
    ═══════════════════════════════════════════════════════════════════ */
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #f8fafc;
      border-top: 1px solid var(--border);
      padding: 10px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: var(--text-muted);
    }
    
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .footer-brand span {
      font-weight: 500;
    }
    
    /* ═══════════════════════════════════════════════════════════════════
       PRINT STYLES
    ═══════════════════════════════════════════════════════════════════ */
    @media print {
      body { 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact;
        font-size: 10px;
      }
      
      .header { 
        padding: 12px 16px;
        break-after: avoid;
      }
      
      .summary-bar {
        break-after: avoid;
      }
      
      .content { 
        padding: 12px 16px;
        padding-bottom: 50px;
      }
      
      .month-section { 
        break-inside: avoid;
        margin-bottom: 12px;
      }
      
      .footer {
        padding: 8px 16px;
      }
      
      table { font-size: 9px; }
      th, td { padding: 4px 8px; }
    }
    
    @page {
      margin: 0.5cm;
      size: A4;
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <header class="header">
    ${headerDataUri
      ? `<img src="${headerDataUri}" alt="Finora" />`
      : `<div style="background:linear-gradient(to right,#27bbd8,#4a8ed8,#5060df);padding:16px 24px;"><span style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#fff;">Finora</span></div>`
    }
    <div class="header-user-info">
      <div class="user-name">${userName}</div>
      ${userEmail ? `<div class="user-email">${userEmail}</div>` : ''}
      <div class="export-date">${t('export.pdf.createdLabel')}: ${exportDate}</div>
    </div>
  </header>
  
  <!-- SUMMARY BAR -->
  <div class="summary-bar">
    <div class="summary-item income">
      <div class="label">${t('export.pdf.summary.income')}</div>
      <div class="value">${formatCurrency(totalIncome)}</div>
    </div>
    <div class="summary-item expense">
      <div class="label">${t('export.pdf.summary.expense')}</div>
      <div class="value">${formatCurrency(totalExpense)}</div>
    </div>
    <div class="summary-item balance">
      <div class="label">${t('export.pdf.summary.balance')}</div>
      <div class="value">${balance >= 0 ? '+' : ''}${formatCurrency(balance)}</div>
    </div>
  </div>
  
  <!-- CONTENT / TRANSACTIONS -->
  <main class="content">
    ${Object.entries(groupedByMonth)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, txs]) => {
        const monthIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const monthExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        return `
    <section class="month-section">
      <div class="month-header">
        <h2>${new Date(month + '-01').toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</h2>
        <span class="stats">${t('export.pdf.monthSummary', { count: txs.length, balance: formatCurrency(monthIncome - monthExpense) })}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 80px;">${t('export.pdf.table.date')}</th>
            <th>${t('export.pdf.table.category')}</th>
            <th>${t('export.pdf.table.description')}</th>
            <th style="width: 100px; text-align: right;">${t('export.pdf.table.amount')}</th>
          </tr>
        </thead>
        <tbody>
          ${txs
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(tx => `
          <tr>
            <td>${formatDate(tx.date, 'short')}</td>
            <td>
              <div class="category-cell">
                <span class="type-dot ${tx.type}"></span>
                ${translateCategory(tx.category, t)}
              </div>
            </td>
            <td>${tx.description || t('export.pdf.noDescription')}</td>
            <td class="amount-cell ${tx.type}">
              ${tx.type === 'income' ? '+' : '−'}${formatCurrency(tx.amount)}
            </td>
          </tr>
            `).join('')}
        </tbody>
      </table>
    </section>
        `;
      }).join('')}
  </main>
  
  <!-- FOOTER -->
  <footer class="footer">
    <div class="footer-brand">
      ${iconDataUri ? `<img src="${iconDataUri}" alt="Finora" style="height:20px;width:auto;vertical-align:middle;">` : ''}
      <span>Finora Smart Finance</span>
    </div>
    <div>${t('export.pdf.footer', { count: transactions.length, year: new Date().getFullYear() })}</div>
  </footer>
  
</body>
</html>`;
};

// ============================================================================
// EXPORT SECTION COMPONENT
// ============================================================================
export default function ExportSection() {
  const { success: showSuccess, error: showError } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState(null);

  // ──────────────────────────────────────────────────────────────────────
  // FETCH ALL TRANSACTIONS FOR EXPORT
  // ──────────────────────────────────────────────────────────────────────
  const fetchAllForExport = useCallback(async () => {
    try {
      // Hole alle Transaktionen (max 1000 für Export)
      const response = await transactionService.getTransactions({
        page: 1,
        limit: 100, // Backend erlaubt max 100
        sort: 'date',
        order: 'desc',
      });

      let allTransactions = response.data.data || [];
      const totalPages = response.data.pagination?.pages || 1;

      // Wenn mehr als eine Seite, hole alle weiteren
      if (totalPages > 1) {
        const additionalPages = [];
        for (let page = 2; page <= Math.min(totalPages, 10); page++) {
          additionalPages.push(
            transactionService.getTransactions({
              page,
              limit: 100,
              sort: 'date',
              order: 'desc',
            })
          );
        }
        const results = await Promise.all(additionalPages);
        results.forEach((res) => {
          allTransactions = [...allTransactions, ...(res.data.data || [])];
        });
      }

      return allTransactions;
    } catch (err) {
      console.error('Export fetch error:', err);
      throw err;
    }
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // CSV EXPORT
  // ──────────────────────────────────────────────────────────────────────
  const handleCSVExport = useCallback(async () => {
    setLoading(true);
    setExportType('csv');
    try {
      const transactions = await fetchAllForExport();

      if (transactions.length === 0) {
        showError(t('export.toasts.noTransactions'));
        return;
      }

      const csv = generateCSV(transactions, t);
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }); // BOM for Excel
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finora-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(t('export.toasts.csvSuccess', { count: transactions.length }));
    } catch {
      showError(t('export.toasts.csvError'));
    } finally {
      setLoading(false);
      setExportType(null);
    }
  }, [fetchAllForExport, showSuccess, showError, t]);

  // ──────────────────────────────────────────────────────────────────────
  // PDF EXPORT (Print-Dialog)
  // ──────────────────────────────────────────────────────────────────────
  const handlePDFExport = useCallback(async () => {
    setLoading(true);
    setExportType('pdf');
    try {
      const transactions = await fetchAllForExport();

      if (transactions.length === 0) {
        showError(t('export.toasts.noTransactions'));
        return;
      }

      // User-Info für PDF-Header
      const userInfo = user ? {
        name: user.name || t('export.pdf.defaultUserName'),
        email: user.email || '',
      } : null;

      // Branded Header-SVG als Base64 laden
      let headerDataUri = null;
      let iconDataUri = null;
      try {
        const [headerResp, iconResp] = await Promise.all([
          fetch('/logo-branding/finora-logo-branded-export.svg'),
          fetch('/logo-branding/finora-logo-icon.svg'),
        ]);
        const [headerSvg, iconSvg] = await Promise.all([headerResp.text(), iconResp.text()]);
        headerDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(headerSvg)));
        iconDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(iconSvg)));
      } catch { /* Fallback: keine Bilder */ }

      const htmlContent = generatePDFContent(transactions, userInfo, t, headerDataUri, iconDataUri);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');

      // Blob-URL freigeben, sobald das Fenster geladen hat
      const cleanup = () => URL.revokeObjectURL(blobUrl);

      if (!printWindow) {
        cleanup();
        showError(t('export.toasts.pdfError'));
        return;
      }

      printWindow.addEventListener('afterprint', cleanup);

      // Warte kurz, dann öffne Print-Dialog
      printWindow.addEventListener('load', () => {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      });

      showSuccess(t('export.toasts.pdfSuccess', { count: transactions.length }));
    } catch {
      showError(t('export.toasts.pdfError'));
    } finally {
      setLoading(false);
      setExportType(null);
    }
  }, [fetchAllForExport, showSuccess, showError, user, t]);

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className={styles.exportSection}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className={styles.sectionHeader}>
        <div className={styles.iconWrapper}>
          <FiDatabase />
        </div>
        <div>
          <h2>{t('export.title')}</h2>
          <p>{t('export.subtitle')}</p>
        </div>
      </div>

      <div className={styles.exportOptions}>
        {/* CSV Export */}
        <div className={styles.exportCard}>
          <div className={styles.exportIcon}>
            <FiFileText />
          </div>
          <div className={styles.exportInfo}>
            <h3>{t('export.csv.title')}</h3>
            <p>
              {t('export.csv.description')}
            </p>
          </div>
          <Button
            variant="secondary"
            size="small"
            icon={<FiDownload />}
            onClick={handleCSVExport}
            disabled={loading}
            loading={loading && exportType === 'csv'}
          >
            {t('export.csv.button')}
          </Button>
        </div>

        {/* PDF Export */}
        <div className={styles.exportCard}>
          <div className={styles.exportIcon}>
            <FiFileText />
          </div>
          <div className={styles.exportInfo}>
            <h3>{t('export.pdf.title')}</h3>
            <p>
              {t('export.pdf.description')}
            </p>
          </div>
          <Button
            variant="secondary"
            size="small"
            icon={<FiDownload />}
            onClick={handlePDFExport}
            disabled={loading}
            loading={loading && exportType === 'pdf'}
          >
            {t('export.pdf.button')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
