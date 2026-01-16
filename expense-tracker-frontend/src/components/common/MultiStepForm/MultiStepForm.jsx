/**
 * @fileoverview Multi-Step Form Container
 * @description Container component for managing multi-step forms with progress tracking
 * 
 * FEATURES:
 * - Step navigation (next, previous)
 * - Progress tracking
 * - Per-step validation
 * - Step-specific content
 * - Animated transitions
 * - Mobile responsive
 * 
 * @module components/common/MultiStepForm
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './MultiStepForm.module.scss';

/**
 * Multi-Step Form Container
 * @component
 * @example
 * // Usage
 * <MultiStepForm
 *   steps={[
 *     { title: 'Schritt 1', content: <Step1 /> },
 *     { title: 'Schritt 2', content: <Step2 /> },
 *   ]}
 *   onComplete={handleComplete}
 * />
 */
const MultiStepForm = ({
  steps = [],
  onComplete = null,
  onStepChange = null,
  showProgress = true,
  showStepTitles = true,
  nextLabel = 'Weiter',
  prevLabel = 'Zurück',
  completeLabel = 'Fertig',
  canGoBack = true,
  validateStep = null,
  className = '',
  isLoading = false,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  // ──────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────

  const handleNext = useCallback(async () => {
    setIsValidating(true);

    try {
      // Validate current step if validator provided
      if (validateStep) {
        const stepErrors = await validateStep(currentStep);
        if (stepErrors && Object.keys(stepErrors).length > 0) {
          setErrors(stepErrors);
          setIsValidating(false);
          return;
        }
      }

      setErrors({});

      // Move to next step or complete
      if (isLastStep) {
        // onComplete might be async, so we keep isValidating true
        await onComplete?.();
      } else {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        onStepChange?.(nextStep);
      }
    } finally {
      setIsValidating(false);
    }
  }, [currentStep, isLastStep, validateStep, onComplete, onStepChange]);

  const handlePrev = useCallback(() => {
    if (canGoBack && !isFirstStep) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setErrors({});
      onStepChange?.(prevStep);
    }
  }, [currentStep, isFirstStep, canGoBack, onStepChange]);

  const currentStepData = useMemo(() => steps[currentStep], [steps, currentStep]);

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      className={`${styles.container} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* PROGRESS BAR */}
      {showProgress && (
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <motion.div
              className={styles.progressFill}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          <div className={styles.progressText}>
            <span className={styles.stepCount}>
              Schritt {currentStep + 1} von {totalSteps}
            </span>
            {showStepTitles && currentStepData?.title && (
              <span className={styles.stepTitle}>{currentStepData.title}</span>
            )}
          </div>
        </div>
      )}

      {/* STEP INDICATORS */}
      <div className={styles.stepIndicators}>
        {steps.map((step, idx) => (
          <motion.button
            key={idx}
            type="button"
            className={`${styles.stepIndicator} ${
              idx === currentStep ? styles.active : ''
            } ${idx < currentStep ? styles.completed : ''}`}
            onClick={() => {
              if (idx < currentStep && canGoBack) {
                setCurrentStep(idx);
                setErrors({});
                onStepChange?.(idx);
              }
            }}
            disabled={idx > currentStep}
            aria-current={idx === currentStep ? 'step' : undefined}
            aria-label={`${step.title || `Schritt ${idx + 1}`}${
              idx < currentStep ? ' - Abgeschlossen' : ''
            }`}
            whileHover={idx <= currentStep ? { scale: 1.1 } : {}}
            whileTap={idx <= currentStep ? { scale: 0.95 } : {}}
          >
            {idx < currentStep ? (
              <span className={styles.checkmark}>✓</span>
            ) : (
              <span>{idx + 1}</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* STEP CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          className={styles.stepContent}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStepData?.content}
        </motion.div>
      </AnimatePresence>

      {/* NAVIGATION BUTTONS */}
      <div className={styles.navigation}>
        <button
          type="button"
          className={styles.prevButton}
          onClick={handlePrev}
          disabled={isFirstStep || !canGoBack || isValidating || isLoading}
          aria-label="Zum vorherigen Schritt"
        >
          ← {prevLabel}
        </button>

        <button
          type="button"
          className={styles.nextButton}
          onClick={handleNext}
          disabled={isValidating || isLoading}
          aria-label={isLastStep ? completeLabel : nextLabel}
        >
          {isValidating || isLoading ? (
            <>
              <span className={styles.spinner} />
              <span>{isLastStep ? 'Wird registriert...' : 'Wird überprüft...'}</span>
            </>
          ) : isLastStep ? (
            completeLabel
          ) : (
            `${nextLabel} →`
          )}
        </button>
      </div>

      {/* ERRORS */}
      {Object.keys(errors).length > 0 && (
        <motion.div
          className={styles.errorSummary}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
        >
          <span className={styles.errorTitle}>⚠ Fehler in diesem Schritt:</span>
          <ul className={styles.errorList}>
            {Object.entries(errors).map(([key, message]) => (
              <li key={key}>{message}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MultiStepForm;
