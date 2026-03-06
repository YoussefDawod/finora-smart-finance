/**
 * @fileoverview Export-Hilfsfunktionen (CSV + PDF Download)
 * @description Stellt triggerBlobDownload (CSV) und generatePDF (PDF via jsPDF) bereit.
 *
 * @module utils/exportHelpers
 */

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

/**
 * Lädt das Export-Header-SVG und gibt es als PNG-Data-URL zurück.
 * SVG viewBox 400×90 → wird auf volle Seitenbreite hochskaliert.
 *
 * @returns {Promise<{dataUrl: string, heightMm: number}>}
 */
async function loadExportHeaderImage(pageWidthMm) {
  const resp = await fetch('/finora-logo-branded-export.svg');
  const svgText = await resp.text();
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const svgW = 400;
      const svgH = 90;
      const scale = 3; // Auflösung erhöhen für schärfere Darstellung
      const canvas = document.createElement('canvas');
      canvas.width = svgW * scale;
      canvas.height = svgH * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      const heightMm = pageWidthMm * (svgH / svgW);
      resolve({ dataUrl: canvas.toDataURL('image/png'), heightMm });
    };
    img.src = objectUrl;
  });
}

/**
 * PDF-Download aus tabellarischen Daten erzeugen
 *
 * @param {Object} options
 * @param {string} options.title - Überschrift im PDF
 * @param {string[]} options.headers - Spaltenüberschriften
 * @param {Array<string[]>} options.rows - Zeilen-Daten (jede Zeile = Array von Strings)
 * @param {string} options.filename - Dateiname inkl. .pdf Extension
 */
export async function generatePDF({ title, headers, rows, filename }) {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default;
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default;

  const orientation = headers.length > 5 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header-Bild (finora-logo-branded-export.svg)
  let tableStartY;
  try {
    const { dataUrl, heightMm } = await loadExportHeaderImage(pageWidth);
    doc.addImage(dataUrl, 'PNG', 0, 0, pageWidth, heightMm);
    tableStartY = heightMm + 6;
  } catch {
    // Fallback: kein Bild, Titel als Text
    doc.setFontSize(16);
    doc.text(title, 14, 14);
    tableStartY = 24;
  }

  // Datum
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Export: ${new Date().toLocaleString()}`, 14, tableStartY);
  doc.setTextColor(0);
  tableStartY += 6;

  // Tabelle — Funktionsstil-API (jspdf-autotable v3+)
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: tableStartY,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { top: tableStartY },
  });

  doc.save(filename);
}
