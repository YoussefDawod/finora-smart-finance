/**
 * Success animation component.
 * Displays animated checkmark with optional confetti celebration.
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import './SuccessAnimation.scss';

/**
 * Generates confetti particles.
 * @param {number} count - Number of particles
 * @returns {Array} Array of particle objects
 */
function generateConfetti(count = 20) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Limit particles on reduced motion preference
  const particleCount = prefersReducedMotion ? 5 : Math.min(count, 30);

  return Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.2,
    duration: 2 + Math.random() * 0.5,
    rotation: Math.random() * 360,
    color: ['#fbbf24', '#60a5fa', '#34d399', '#f87171', '#a78bfa'][i % 5],
  }));
}

/**
 * Confetti particle component.
 */
const ConfettiParticle = ({ particle }) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <motion.div
      className="confetti-particle"
      key={particle.id}
      style={{
        left: `${particle.left}%`,
        backgroundColor: particle.color,
      }}
      initial={{ y: -20, opacity: 1, rotate: particle.rotation }}
      animate={{
        y: window.innerHeight + 20,
        opacity: 0,
        rotate: particle.rotation + 360,
      }}
      transition={{
        duration: particle.duration,
        delay: particle.delay,
        ease: 'easeIn',
      }}
    />
  );
};

/**
 * Success animation with optional checkmark and confetti.
 */
const SuccessAnimation = ({
  message,
  showCheckmark = true,
  showConfetti = false,
  onComplete,
  duration = 2000,
  soundEnabled = false,
}) => {
  const [confetti, setConfetti] = useState(() => 
    showConfetti ? generateConfetti(20) : []
  );
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Play optional success sound
  useEffect(() => {
    if (soundEnabled && !prefersReducedMotion) {
      playSuccessSound();
    }
  }, [soundEnabled, prefersReducedMotion]);

  // Auto-dismiss
  useEffect(() => {
    if (onComplete) {
      const timeout = setTimeout(onComplete, duration);
      return () => clearTimeout(timeout);
    }
  }, [onComplete, duration]);

  const playSuccessSound = () => {
    // Create a simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (err) {
      console.warn('Audio context not available:', err);
    }
  };

  return (
    <motion.div
      className="success-animation"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      {showCheckmark && (
        <motion.div
          className="success-animation__checkmark"
          initial={{ scale: 0.5, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            damping: 15,
            stiffness: 100,
            duration: 0.6,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </motion.div>
      )}

      {message && (
        <motion.p
          className="success-animation__message"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {message}
        </motion.p>
      )}

      {/* Confetti particles */}
      {confetti.map((particle) => (
        <ConfettiParticle key={particle.id} particle={particle} />
      ))}
    </motion.div>
  );
};

SuccessAnimation.propTypes = {
  message: PropTypes.string,
  showCheckmark: PropTypes.bool,
  showConfetti: PropTypes.bool,
  onComplete: PropTypes.func,
  duration: PropTypes.number,
  soundEnabled: PropTypes.bool,
};

export default SuccessAnimation;
