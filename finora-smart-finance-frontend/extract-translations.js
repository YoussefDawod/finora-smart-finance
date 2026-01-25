/**
 * Script zum Extrahieren von Übersetzungen aus translations.js in JSON-Dateien
 * Führen Sie aus mit: node extract-translations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resources } from './src/i18n/translations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Zielverzeichnis
const outputDir = path.join(__dirname, 'public', 'locales');

// Funktion zum Erstellen der JSON-Dateien
// Wir erstellen eine einzelne translation.json pro Sprache für Kompatibilität
function extractTranslations() {
  const languages = Object.keys(resources);

  for (const lang of languages) {
    const langDir = path.join(outputDir, lang);
    
    // Verzeichnis erstellen falls nicht vorhanden
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }

    const translation = resources[lang].translation;

    // Eine einzige translation.json Datei mit der gesamten Struktur
    const filePath = path.join(langDir, 'translation.json');
    fs.writeFileSync(
      filePath,
      JSON.stringify(translation, null, 2),
      'utf8'
    );
    console.log(`✅ Created: ${filePath}`);
  }

  console.log('\n🎉 All translations extracted successfully!');
}

extractTranslations();
