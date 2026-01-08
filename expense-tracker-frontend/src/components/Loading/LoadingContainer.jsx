/**
 * Loading container component that wraps content with loading states.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useMotion } from '../../context/MotionContext';
import { LOADING_STATES } from '../../utils/loadingStateManager';
import './LoadingContainer.scss';

/**
 * LoadingContainer - Wraps content with skeleton/loading/error states.
 * @param {Object} props
 * @param {string} props.state - Loading state ('idle', 'loading', 'success', 'error', 'skeleton')
 * @param {JSX.Element} props.skeleton - Skeleton component to show
 * @param {JSX.Element} props.children - Content to show when loaded
 * @param {JSX.Element} props.error - Error component (optional)
 * @param {Function} props.onRetry - Retry callback for error state
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function LoadingContainer({
  state = LOADING_STATES.IDLE,
  skeleton,
  children,
  error,
  onRetry,
  className = '',
}) {
  const { prefersReducedMotion } = useMotion();

  const fadeVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  };

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: 'easeOut' };

  // Show skeleton for loading or skeleton state
  if (state === LOADING_STATES.LOADING || state === LOADING_STATES.SKELETON) {
    return (
      <div className={`loading-container ${className}`} role="status" aria-busy="true">
        <AnimatePresence mode="wait">
          <motion.div
            key="skeleton"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transition}
          >
            {skeleton || <div className="loading-container__spinner" />}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Show error state
  if (state === LOADING_STATES.ERROR) {
    return (
      <div className={`loading-container ${className}`} role="alert">
        <AnimatePresence mode="wait">
          <motion.div
            key="error"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transition}
          >
            {error || (
              <div className="loading-container__error">
                <p>Failed to load content</p>
                {onRetry && (
                  <button onClick={onRetry} className="loading-container__retry">
                    Retry
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Show content for success or idle state
  return (
    <div className={`loading-container ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key="content"
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={transition}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default LoadingContainer;
