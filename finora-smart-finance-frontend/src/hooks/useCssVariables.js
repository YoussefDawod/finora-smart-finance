/**
 * @fileoverview useCssVariables Hook
 * @description Löst CSS-Variablen zur Laufzeit auf für Verwendung in JS-Bibliotheken wie Recharts
 * 
 * @example
 * const { success, error, primary } = useCssVariables();
 * <Cell fill={success} /> // Resolved hex color instead of var(--success)
 * 
 * @module useCssVariables
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * CSS-Variablen, die für Charts benötigt werden
 */
const CHART_CSS_VARS = [
  '--success',
  '--error',
  '--primary',
  '--border',
  '--tx-muted',
  '--surface',
  '--info',
  '--warning',
];

/**
 * Löst eine CSS-Variable zur Laufzeit auf
 * @param {string} varName - CSS-Variable (z.B. '--success')
 * @returns {string} - Aufgelöster Farbwert (z.B. '#10b981')
 */
const getCssVariable = (varName) => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
};

/**
 * Hook zum Auflösen von CSS-Variablen für Chart-Komponenten
 * Aktualisiert sich automatisch bei Theme-Änderungen
 * 
 * @returns {Object} - Objekt mit aufgelösten Farbwerten
 */
export function useCssVariables() {
  const [colors, setColors] = useState(() => {
    const initial = {};
    CHART_CSS_VARS.forEach((varName) => {
      // Ohne '--' prefix für einfachere Verwendung
      const key = varName.replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      initial[key] = getCssVariable(varName);
    });
    return initial;
  });

  const updateColors = useCallback(() => {
    const updated = {};
    CHART_CSS_VARS.forEach((varName) => {
      const key = varName.replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      updated[key] = getCssVariable(varName);
    });
    setColors(updated);
  }, []);

  useEffect(() => {
    // Initial update
    updateColors();

    // MutationObserver für Theme-Änderungen (data-theme Attribut)
    const observer = new MutationObserver((mutations) => {
      const hasThemeChange = mutations.some(
        (m) => m.type === 'attributes' && 
              (m.attributeName === 'data-theme' || m.attributeName === 'data-glass')
      );
      if (hasThemeChange) {
        // Kurze Verzögerung, um CSS-Transitions abzuwarten
        requestAnimationFrame(updateColors);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-glass'],
    });

    return () => observer.disconnect();
  }, [updateColors]);

  return colors;
}

/**
 * Convenience-Export für CHART_TOKENS mit aufgelösten Werten
 * Für Komponenten, die keine Hooks verwenden können
 */
export function getResolvedChartColors() {
  return {
    success: getCssVariable('--success'),
    error: getCssVariable('--error'),
    primary: getCssVariable('--primary'),
    border: getCssVariable('--border'),
    textMuted: getCssVariable('--tx-muted'),
    surface: getCssVariable('--surface'),
    info: getCssVariable('--info'),
    warning: getCssVariable('--warning'),
  };
}

export default useCssVariables;
