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

  // Titel
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Datum
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Export: ${new Date().toLocaleString()}`, 14, 28);
  doc.setTextColor(0);

  // Tabelle — Funktionsstil-API (jspdf-autotable v3+)
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 34,
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
    margin: { top: 34 },
  });

  doc.save(filename);
}
