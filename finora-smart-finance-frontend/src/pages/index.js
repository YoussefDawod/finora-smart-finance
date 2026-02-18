/**
 * Pages Export
 * 
 * Kritische Pages (statisch) — werden direkt in AppRoutes.jsx importiert.
 * Alle anderen Pages werden per React.lazy() on-demand geladen.
 * 
 * @see AppRoutes.jsx für die lazy-importierten Pages
 */

// Statisch importierte (kritische) Pages
export { default as AuthPage } from './AuthPage';
export { default as VerifyEmailPage } from './VerifyEmailPage/VerifyEmailPage';
export { default as EmailVerificationPage } from './EmailVerificationPage';
export { default as NotFoundPage } from './NotFoundPage';
