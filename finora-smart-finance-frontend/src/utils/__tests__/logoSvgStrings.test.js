/**
 * @fileoverview Logo SVG-String Utility Tests
 * @description Tests für logoSvgStrings — Single Source of Truth für statische Logo-SVGs.
 * @see FINORA-LOGO-SPEC.md §4 (SVG-Spezifikation)
 */

import { describe, it, expect } from 'vitest';
import {
  LOGO_COLORS,
  F_LETTERFORM_PATH,
  GROWTH_LINE_PATH,
  PEAK_DOT,
  getLogoIconSVG,
  getLogoFaviconSVG,
  getLogoFullSVG,
  svgToDataURI,
} from '@/utils/logoSvgStrings';

// ============================================
// 🎨 LOGO_COLORS
// ============================================
describe('LOGO_COLORS', () => {
  it('enthält light und dark Theme', () => {
    expect(LOGO_COLORS).toHaveProperty('light');
    expect(LOGO_COLORS).toHaveProperty('dark');
  });

  it.each(['light', 'dark'])('%s Theme enthält alle erforderlichen Farben', (theme) => {
    const colors = LOGO_COLORS[theme];
    expect(colors).toHaveProperty('primary');
    expect(colors).toHaveProperty('secondary');
    expect(colors).toHaveProperty('accent');
    expect(colors).toHaveProperty('success');
    expect(colors).toHaveProperty('info');
    expect(colors).toHaveProperty('text');
    expect(colors).toHaveProperty('textMuted');
    expect(colors).toHaveProperty('background');
  });

  it('Light Theme Primary ist #5b6cff (nicht Tailwind #6366f1)', () => {
    expect(LOGO_COLORS.light.primary).toBe('#5b6cff');
  });

  it('Light Theme Secondary ist #2dd4ff', () => {
    expect(LOGO_COLORS.light.secondary).toBe('#2dd4ff');
  });

  it('Dark Theme Primary ist #7c83ff', () => {
    expect(LOGO_COLORS.dark.primary).toBe('#7c83ff');
  });

  it('Success ist in beiden Themes #22c55e', () => {
    expect(LOGO_COLORS.light.success).toBe('#22c55e');
    expect(LOGO_COLORS.dark.success).toBe('#22c55e');
  });

  it('enthält KEINE alten Tailwind-Farben', () => {
    const allValues = [
      ...Object.values(LOGO_COLORS.light),
      ...Object.values(LOGO_COLORS.dark),
    ];
    expect(allValues).not.toContain('#6366f1');
    expect(allValues).not.toContain('#8b5cf6');
    expect(allValues).not.toContain('#22d3ee');
    expect(allValues).not.toContain('#34d399');
  });
});

// ============================================
// 📐 SVG-PFADE
// ============================================
describe('SVG-Pfade', () => {
  it('F_LETTERFORM_PATH beginnt mit M14', () => {
    expect(F_LETTERFORM_PATH).toMatch(/^M14/);
  });

  it('GROWTH_LINE_PATH hat 4 Punkte (M + 3× L)', () => {
    const points = GROWTH_LINE_PATH.split('L');
    expect(points).toHaveLength(4); // M24 38, L30 30, L36 33, L42 22
  });

  it('PEAK_DOT Position ist am Ende der Growth-Line', () => {
    expect(PEAK_DOT.cx).toBe(42);
    expect(PEAK_DOT.cy).toBe(22);
    expect(PEAK_DOT.r).toBe(3.5);
  });

  it('Peak-Dot liegt innerhalb der ViewBox (cx + r ≤ 48)', () => {
    expect(PEAK_DOT.cx + PEAK_DOT.r).toBeLessThanOrEqual(48);
  });
});

// ============================================
// 🖼️ getLogoIconSVG
// ============================================
describe('getLogoIconSVG', () => {
  it('gibt einen validen SVG-String zurück', () => {
    const svg = getLogoIconSVG();
    expect(svg).toMatch(/^<svg/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('hat korrekte Default-Größe (40×40)', () => {
    const svg = getLogoIconSVG();
    expect(svg).toContain('width="40"');
    expect(svg).toContain('height="40"');
  });

  it('respektiert benutzerdefinierte Größe', () => {
    const svg = getLogoIconSVG({ size: 64 });
    expect(svg).toContain('width="64"');
    expect(svg).toContain('height="64"');
  });

  it('verwendet Light-Theme-Farben als Default', () => {
    const svg = getLogoIconSVG();
    expect(svg).toContain(LOGO_COLORS.light.primary);
    expect(svg).toContain(LOGO_COLORS.light.secondary);
    expect(svg).toContain(LOGO_COLORS.light.success);
  });

  it('verwendet Dark-Theme-Farben wenn angegeben', () => {
    const svg = getLogoIconSVG({ theme: 'dark' });
    expect(svg).toContain(LOGO_COLORS.dark.primary);
    expect(svg).toContain(LOGO_COLORS.dark.secondary);
  });

  it('enthält KEINEN <rect> Hintergrund', () => {
    const svg = getLogoIconSVG();
    expect(svg).not.toContain('<rect');
  });

  it('enthält den F-Letterform-Pfad', () => {
    const svg = getLogoIconSVG();
    expect(svg).toContain(F_LETTERFORM_PATH);
  });

  it('enthält den Growth-Line-Pfad', () => {
    const svg = getLogoIconSVG();
    expect(svg).toContain(GROWTH_LINE_PATH);
  });

  it('enthält den Peak-Dot', () => {
    const svg = getLogoIconSVG();
    expect(svg).toContain(`cx="${PEAK_DOT.cx}"`);
    expect(svg).toContain(`cy="${PEAK_DOT.cy}"`);
    expect(svg).toContain(`r="${PEAK_DOT.r}"`);
  });

  it('enthält ViewBox 0 0 48 48', () => {
    const svg = getLogoIconSVG();
    expect(svg).toContain('viewBox="0 0 48 48"');
  });

  it('fällt auf Light zurück bei ungültigem Theme', () => {
    const svg = getLogoIconSVG({ theme: 'invalid' });
    expect(svg).toContain(LOGO_COLORS.light.primary);
  });
});

// ============================================
// 🏷️ getLogoFaviconSVG
// ============================================
describe('getLogoFaviconSVG', () => {
  it('gibt einen validen SVG-String zurück', () => {
    const svg = getLogoFaviconSVG();
    expect(svg).toMatch(/^<svg/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('enthält <rect> Hintergrund (Favicon braucht Background)', () => {
    const svg = getLogoFaviconSVG();
    expect(svg).toContain('<rect');
    expect(svg).toContain('rx="12"');
  });

  it('F-Letterform ist weiß (auf Gradient-Background)', () => {
    const svg = getLogoFaviconSVG();
    expect(svg).toContain('fill="white"');
  });

  it('verwendet Light-Theme-Farben als Default', () => {
    const svg = getLogoFaviconSVG();
    expect(svg).toContain(LOGO_COLORS.light.primary);
    expect(svg).toContain(LOGO_COLORS.light.secondary);
  });

  it('verwendet Dark-Theme-Farben wenn angegeben', () => {
    const svg = getLogoFaviconSVG({ theme: 'dark' });
    expect(svg).toContain(LOGO_COLORS.dark.primary);
    expect(svg).toContain(LOGO_COLORS.dark.secondary);
  });

  it('enthält den F-Letterform-Pfad', () => {
    const svg = getLogoFaviconSVG();
    expect(svg).toContain(F_LETTERFORM_PATH);
  });

  it('ist als Einzeiler formatiert (für Data-URI-Effizienz)', () => {
    const svg = getLogoFaviconSVG();
    // Favicon-SVG sollte keine Zeilenumbrüche haben (Einzeiler)
    expect(svg.split('\n')).toHaveLength(1);
  });
});

// ============================================
// 📄 getLogoFullSVG
// ============================================
describe('getLogoFullSVG', () => {
  it('gibt einen validen SVG-String zurück', () => {
    const svg = getLogoFullSVG();
    expect(svg).toMatch(/^<svg/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('enthält Brand-Name „Finora" als <text>', () => {
    const svg = getLogoFullSVG();
    expect(svg).toContain('>Finora</text>');
  });

  it('enthält Tagline „SMART FINANCE" als <text>', () => {
    const svg = getLogoFullSVG();
    expect(svg).toContain('>SMART FINANCE</text>');
  });

  it('verwendet Plus Jakarta Sans font-family', () => {
    const svg = getLogoFullSVG();
    expect(svg).toContain("'Plus Jakarta Sans'");
  });

  it('Brand-Name hat font-weight 800 (ExtraBold)', () => {
    const svg = getLogoFullSVG();
    // Erster <text> hat fw 800
    expect(svg).toMatch(/font-weight="800".*>Finora<\/text>/);
  });

  it('Tagline hat font-weight 500 (Medium)', () => {
    const svg = getLogoFullSVG();
    expect(svg).toMatch(/font-weight="500".*>SMART FINANCE<\/text>/);
  });

  it('Brand-Name hat letter-spacing -0.025em (tight)', () => {
    const svg = getLogoFullSVG();
    expect(svg).toContain('letter-spacing="-0.025em"');
  });

  it('Tagline hat letter-spacing 0.1em (widest)', () => {
    const svg = getLogoFullSVG();
    expect(svg).toContain('letter-spacing="0.1em"');
  });

  it('erlaubt benutzerdefinierten Brand-Name', () => {
    const svg = getLogoFullSVG({ brandName: 'TestBrand' });
    expect(svg).toContain('>TestBrand</text>');
  });

  it('erlaubt benutzerdefinierte Tagline', () => {
    const svg = getLogoFullSVG({ tagline: 'CUSTOM TAG' });
    expect(svg).toContain('>CUSTOM TAG</text>');
  });

  it('enthält den F-Letterform-Pfad', () => {
    const svg = getLogoFullSVG();
    expect(svg).toContain(F_LETTERFORM_PATH);
  });

  it('enthält Text-Gradient-Definition', () => {
    const svg = getLogoFullSVG();
    expect(svg).toContain('logoTextGrad');
  });
});

// ============================================
// 🔗 svgToDataURI
// ============================================
describe('svgToDataURI', () => {
  it('erzeugt eine gültige data:image/svg+xml URI', () => {
    const uri = svgToDataURI('<svg></svg>');
    expect(uri).toMatch(/^data:image\/svg\+xml,/);
  });

  it('URL-encoded den SVG-String', () => {
    const uri = svgToDataURI('<svg viewBox="0 0 48 48"></svg>');
    // Leerzeichen und Anführungszeichen sollten encoded sein
    expect(uri).not.toContain(' ');
    expect(uri).toContain('%22'); // Encoded "
  });

  it('funktioniert mit getLogoFaviconSVG', () => {
    const uri = svgToDataURI(getLogoFaviconSVG());
    expect(uri).toMatch(/^data:image\/svg\+xml,%3Csvg/);
  });

  it('roundtrip: decodierter URI ergibt Original-SVG', () => {
    const original = '<svg viewBox="0 0 48 48"><circle r="5"/></svg>';
    const uri = svgToDataURI(original);
    const decoded = decodeURIComponent(uri.replace('data:image/svg+xml,', ''));
    expect(decoded).toBe(original);
  });
});

// ============================================
// 🔒 Konsistenz-Tests
// ============================================
describe('Konsistenz', () => {
  it('Icon-SVG und Favicon-SVG verwenden denselben F-Letterform-Pfad', () => {
    const icon = getLogoIconSVG();
    const favicon = getLogoFaviconSVG();
    expect(icon).toContain(F_LETTERFORM_PATH);
    expect(favicon).toContain(F_LETTERFORM_PATH);
  });

  it('Icon-SVG und Full-SVG verwenden denselben Growth-Line-Pfad', () => {
    const icon = getLogoIconSVG();
    const full = getLogoFullSVG();
    expect(icon).toContain(GROWTH_LINE_PATH);
    expect(full).toContain(GROWTH_LINE_PATH);
  });

  it('alle SVG-Varianten verwenden dieselben Theme-Farben', () => {
    const icon = getLogoIconSVG({ theme: 'light' });
    const favicon = getLogoFaviconSVG({ theme: 'light' });
    const full = getLogoFullSVG({ theme: 'light' });

    const c = LOGO_COLORS.light;
    
    // Alle enthalten Primary
    expect(icon).toContain(c.primary);
    expect(favicon).toContain(c.primary);
    expect(full).toContain(c.primary);

    // Alle enthalten Success
    expect(icon).toContain(c.success);
    expect(favicon).toContain(c.success);
    expect(full).toContain(c.success);
  });

  it('keine SVG-Variante enthält alte Tailwind-Farben', () => {
    const variants = [
      getLogoIconSVG(),
      getLogoIconSVG({ theme: 'dark' }),
      getLogoFaviconSVG(),
      getLogoFaviconSVG({ theme: 'dark' }),
      getLogoFullSVG(),
      getLogoFullSVG({ theme: 'dark' }),
    ];

    const forbidden = ['#6366f1', '#8b5cf6', '#22d3ee', '#34d399'];

    variants.forEach((svg) => {
      forbidden.forEach((color) => {
        expect(svg).not.toContain(color);
      });
    });
  });
});
