/**
 * @fileoverview Export-Hilfsfunktionen (CSV + PDF Download)
 * @description Stellt triggerBlobDownload (CSV) und generatePDF (PDF via jsPDF) bereit.
 *              Einheitliches Layout: Header (nur Seite 1), Main, Footer (alle Seiten).
 *
 * @module utils/exportHelpers
 */

// ── Konstanten ────────────────────────────────────
const FOOTER_HEIGHT = 14; // mm
const HEADER_HEIGHT_MM = 26; // mm
const MARGIN_SIDE = 14; // mm
const GITHUB_URL = 'github.com/YoussefDawod';
const LINKEDIN_URL = 'linkedin.com/in/youssef-dawod-203273215';
const BRAND_PRIMARY = { r: 91, g: 108, b: 255 };
const BRAND_ACCENT = { r: 244, g: 114, b: 208 };
const GRADIENT_STOPS = [
  { r: 39, g: 187, b: 216 },
  { r: 74, g: 142, b: 216 },
  { r: 80, g: 96, b: 223 },
];

/**
 * Blob-Download auslösen (für CSV oder andere Blobs).
 * Verwendet data-URI statt blob-URL, um "insecure connection"-Warnungen
 * bei HTTP-Verbindungen zu vermeiden.
 *
 * @param {Blob} blob - Der Blob zum Herunterladen
 * @param {string} filename - Dateiname inkl. Extension
 */
export function triggerBlobDownload(blob, filename) {
  const reader = new FileReader();
  reader.onloadend = () => {
    const link = document.createElement('a');
    link.href = reader.result;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 100);
  };
  reader.readAsDataURL(blob);
}

// ── Programmatischer Gradient ─────────────────────

function drawGradientBg(doc, x, y, width, height) {
  const steps = 60;
  const stepW = width / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    let r, g, b;
    if (t < 0.5) {
      const lt = t * 2;
      r = GRADIENT_STOPS[0].r + (GRADIENT_STOPS[1].r - GRADIENT_STOPS[0].r) * lt;
      g = GRADIENT_STOPS[0].g + (GRADIENT_STOPS[1].g - GRADIENT_STOPS[0].g) * lt;
      b = GRADIENT_STOPS[0].b + (GRADIENT_STOPS[1].b - GRADIENT_STOPS[0].b) * lt;
    } else {
      const lt = (t - 0.5) * 2;
      r = GRADIENT_STOPS[1].r + (GRADIENT_STOPS[2].r - GRADIENT_STOPS[1].r) * lt;
      g = GRADIENT_STOPS[1].g + (GRADIENT_STOPS[2].g - GRADIENT_STOPS[1].g) * lt;
      b = GRADIENT_STOPS[1].b + (GRADIENT_STOPS[2].b - GRADIENT_STOPS[1].b) * lt;
    }
    doc.setFillColor(Math.round(r), Math.round(g), Math.round(b));
    doc.rect(x + i * stepW, y, stepW + 0.5, height, 'F');
  }
}

// ── Header (nur Seite 1) ──────────────────────────

function drawHeader(doc, pageWidth, title, userInfo, logoDataUri) {
  const h = HEADER_HEIGHT_MM;

  // Full-width gradient background
  drawGradientBg(doc, 0, 0, pageWidth, h);

  // Brand: finora-logo.svg
  if (logoDataUri) {
    try {
      doc.addImage(logoDataUri, 'SVG', MARGIN_SIDE, (h - 12) / 2, 40, 12);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text('FINORA', MARGIN_SIDE, h / 2);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('FINORA', MARGIN_SIDE, h / 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(BRAND_ACCENT.r, BRAND_ACCENT.g, BRAND_ACCENT.b);
    doc.text('SMART FINANCE', MARGIN_SIDE, h / 2 + 5);
  }

  // Right side: User info + date
  const rightX = pageWidth - MARGIN_SIDE;
  const exportDate = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  if (userInfo?.name) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(userInfo.name, rightX, h / 2 - 4, { align: 'right' });
  }
  if (userInfo?.email) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(220, 240, 255);
    doc.text(userInfo.email, rightX, h / 2 + 2, { align: 'right' });
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 230, 250);
  doc.text(exportDate, rightX, h / 2 + 8, { align: 'right' });

  // Title below gradient
  const titleY = h + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(title, MARGIN_SIDE, titleY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  return titleY + 5;
}

function drawFallbackHeader(doc, title) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(title, MARGIN_SIDE, 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  return 24;
}

// ── Footer (alle Seiten) ──────────────────────────

function drawFooter(doc, pageWidth, pageHeight, iconDataUri) {
  const footerY = pageHeight - FOOTER_HEIGHT;

  // Background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, footerY, pageWidth, FOOTER_HEIGHT, 'F');

  // Separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(0, footerY, pageWidth, footerY);

  // Brand: finora-logo-icon.svg + "Smart Finance"
  const iconSize = 8;
  const iconY = footerY + (FOOTER_HEIGHT - iconSize) / 2;
  if (iconDataUri) {
    try {
      doc.addImage(iconDataUri, 'SVG', MARGIN_SIDE, iconY, iconSize, iconSize);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text('Smart Finance', MARGIN_SIDE + iconSize + 2, footerY + 6.5);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(BRAND_PRIMARY.r, BRAND_PRIMARY.g, BRAND_PRIMARY.b);
      doc.text('FINORA', MARGIN_SIDE, footerY + 6.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text('Smart Finance', MARGIN_SIDE + 16, footerY + 6.5);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(BRAND_PRIMARY.r, BRAND_PRIMARY.g, BRAND_PRIMARY.b);
    doc.text('FINORA', MARGIN_SIDE, footerY + 6.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Smart Finance', MARGIN_SIDE + 16, footerY + 6.5);
  }

  // Copyright + Links
  const year = new Date().getFullYear();
  const metaLine = `\u00A9 ${year} Finora  \u00B7  ${GITHUB_URL}  \u00B7  ${LINKEDIN_URL}`;
  doc.text(metaLine, MARGIN_SIDE, footerY + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
}

/**
 * PDF-Download aus tabellarischen Daten erzeugen.
 * Einheitliches Layout: Header (nur Seite 1) + Footer (alle Seiten) + Seitennummern.
 *
 * @param {Object} options
 * @param {string} options.title - Überschrift im PDF
 * @param {string[]} options.headers - Spaltenüberschriften
 * @param {Array<string[]>} options.rows - Zeilen-Daten (jede Zeile = Array von Strings)
 * @param {string} options.filename - Dateiname inkl. .pdf Extension
 * @param {Object} [options.userInfo] - { name, email } des eingeloggten Users
 */
export async function generatePDF({ title, headers, rows, filename, userInfo }) {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default;
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default;

  const orientation = headers.length > 5 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Logos laden
  let logoDataUri = null;
  let iconDataUri = null;
  try {
    const [logoResp, iconResp] = await Promise.all([
      fetch('/logo-branding/finora-logo.svg'),
      fetch('/logo-branding/finora-logo-icon.svg'),
    ]);
    const [logoSvg, iconSvg] = await Promise.all([logoResp.text(), iconResp.text()]);
    logoDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(logoSvg)));
    iconDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(iconSvg)));
  } catch {
    /* Fallback */
  }

  let tableStartY;
  try {
    tableStartY = drawHeader(doc, pageWidth, title, userInfo, logoDataUri);
  } catch {
    tableStartY = drawFallbackHeader(doc, title);
  }

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: tableStartY,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [BRAND_PRIMARY.r, BRAND_PRIMARY.g, BRAND_PRIMARY.b],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: {
      top: 15,
      left: MARGIN_SIDE,
      right: MARGIN_SIDE,
      bottom: FOOTER_HEIGHT + 5,
    },
    didDrawPage: () => {
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      drawFooter(doc, w, h, iconDataUri);
    },
  });

  // Seitennummern (Post-Processing)
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.text(`${i} / ${totalPages}`, pw - MARGIN_SIDE, ph - FOOTER_HEIGHT + 6.5, {
      align: 'right',
    });
  }

  doc.save(filename);
}
