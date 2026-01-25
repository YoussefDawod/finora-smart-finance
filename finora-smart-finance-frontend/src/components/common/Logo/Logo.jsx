import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import styles from './Logo.module.scss';

/**
 * Finora Logo Component
 * Features: Animated abstract "F" mark with growth line, modern typography
 * All colors from CSS variables - consistent across the app
 * 
 * @param {string} to - Navigation path (default: '/dashboard')
 * @param {function} onClick - Click handler
 * @param {boolean} showText - Show brand name and tagline (default: true)
 * @param {string} size - Size variant: 'small', 'default', 'large'
 * @param {boolean} disableNavigation - Render static logo without link behavior
 */
export default function Logo({ 
  to = '/dashboard', 
  onClick, 
  showText = true, 
  size = 'default',
  disableNavigation = false,
}) {
  const { t } = useTranslation();
  const Component = disableNavigation ? 'div' : Link;
  const hoverProps = disableNavigation ? {} : {
    whileHover: { scale: 1.08 },
    whileTap: { scale: 0.95 },
  };

  return (
    <Component 
      {...(!disableNavigation ? { to } : { role: 'img' })}
      className={`${styles.logo} ${styles[size]} ${disableNavigation ? styles.isStatic : ''}`} 
      onClick={disableNavigation ? undefined : onClick} 
      aria-label={t('common.appName')}
      tabIndex={disableNavigation ? -1 : 0}
      aria-disabled={disableNavigation || undefined}
    >
      <motion.div 
        className={styles.iconWrapper}
        {...hoverProps}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <svg 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={styles.icon}
        >
          <defs>
            {/* Primary gradient - uses CSS custom properties */}
            <linearGradient id="logoPrimaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={styles.gradientStopPrimary} />
              <stop offset="100%" className={styles.gradientStopSecondary} />
            </linearGradient>
            
            {/* Accent gradient - for growth line */}
            <linearGradient id="logoAccentGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" className={styles.gradientStopAccent1} />
              <stop offset="100%" className={styles.gradientStopAccent2} />
            </linearGradient>
            
            {/* Glow effect */}
            <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Abstract "F" letterform - stylized and modern */}
          <path 
            d="M14 10h20c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H18v6h12c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H18v8c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2V12c0-1.1.9-2 2-2z" 
            className={styles.letterPath}
          />
          
          {/* Growth trend line - represents financial growth */}
          <motion.path 
            d="M24 38L30 30L36 33L42 22" 
            className={styles.growthLine}
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            filter="url(#logoGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          />
          
          {/* Dot at the peak - success indicator */}
          <motion.circle 
            cx="42" 
            cy="22" 
            r="3.5" 
            className={styles.peakDot}
            filter="url(#logoGlow)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, delay: 0.8 }}
          />
        </svg>
      </motion.div>
      
      {showText && (
        <div className={styles.textWrapper}>
          <span className={styles.brandName}>Finora</span>
          <span className={styles.tagline}>Smart Finance</span>
        </div>
      )}
    </Component>
  );
}
