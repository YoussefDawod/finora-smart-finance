/**
 * Breakpoint-Konstanten für JavaScript
 * Synchron mit SCSS: variables.scss (CSS Custom Properties) + mixins.scss (SCSS $vars)
 *
 * Verwendung:
 *   import { BREAKPOINTS, MEDIA_QUERIES } from '@/constants';
 *   const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
 */

export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.md}px)`,
  tablet: `(min-width: ${BREAKPOINTS.md + 1}px) and (max-width: ${BREAKPOINTS.lg}px)`,
  desktop: `(min-width: ${BREAKPOINTS.lg + 1}px)`,
};
