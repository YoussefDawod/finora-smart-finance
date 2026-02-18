/**
 * @fileoverview AuthPageSkeleton - Wiederverwendbares Auth-Seiten-Skeleton
 * @description Für Login, Register, ForgotPassword Seiten
 * 
 * @module components/common/Skeleton/AuthPageSkeleton
 */

import { memo } from 'react';
import Skeleton from './Skeleton';
import styles from './AuthPageSkeleton.module.scss';

/**
 * Auth Page Skeleton für Login/Register/ForgotPassword
 * @param {'login'|'register'|'forgot'|'verify'} [variant='login'] - Seiten-Variante
 * @param {boolean} [showBranding=true] - Branding-Panel anzeigen (Desktop)
 */
const AuthPageSkeleton = memo(({
  variant = 'login',
  showBranding = true,
  className = '',
}) => {
  const fieldCount = variant === 'register' ? 4 : variant === 'verify' ? 0 : 2;

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Form Panel */}
      <div className={styles.formPanel}>
        <div className={styles.formContent}>
          {/* Logo */}
          <Skeleton width="100px" height="32px" variant="rect" />
          
          {/* Header */}
          <div className={styles.header}>
            <Skeleton width="180px" height="28px" variant="text" />
            <Skeleton width="240px" height="16px" variant="text" />
          </div>
          
          {/* Form Fields */}
          {variant === 'verify' ? (
            // Verify Email: 6-digit code inputs
            <div className={styles.codeInputs}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} width="48px" height="56px" variant="rect" />
              ))}
            </div>
          ) : (
            <div className={styles.fields}>
              {[...Array(fieldCount)].map((_, i) => (
                <div key={i} className={styles.field}>
                  <Skeleton width="70px" height="14px" variant="text" />
                  <Skeleton width="100%" height="44px" variant="rect" />
                </div>
              ))}
            </div>
          )}
          
          {/* Submit Button */}
          <Skeleton width="100%" height="44px" variant="rect" />
          
          {/* Footer Links */}
          <div className={styles.footer}>
            <Skeleton width="140px" height="14px" variant="text" />
          </div>
        </div>
      </div>
      
      {/* Branding Panel (Desktop) */}
      {showBranding && (
        <div className={styles.brandingPanel}>
          <div className={styles.brandingContent}>
            <Skeleton width="200px" height="40px" variant="rect" />
            <Skeleton width="280px" height="20px" variant="text" />
          </div>
        </div>
      )}
    </div>
  );
});

AuthPageSkeleton.displayName = 'AuthPageSkeleton';

export default AuthPageSkeleton;
