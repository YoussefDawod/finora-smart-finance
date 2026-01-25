/**
 * Chart Constants
 * Design tokens und Konfiguration für Chart-Komponenten
 * Verwendet CSS-Variablen für konsistente Theming-Unterstützung
 */

export const CHART_TOKENS = {
  success: 'var(--success)',
  error: 'var(--error)',
  primary: 'var(--primary)',
  border: 'var(--border)',
  textMuted: 'var(--tx-muted)',
  surface: 'var(--surface)',
  shadow: 'var(--sh-md)',
  radius: 'var(--r-md)',
};

export const tooltipContentStyle = {
  background: CHART_TOKENS.surface,
  border: `1px solid ${CHART_TOKENS.border}`,
  borderRadius: CHART_TOKENS.radius,
  boxShadow: CHART_TOKENS.shadow,
};
