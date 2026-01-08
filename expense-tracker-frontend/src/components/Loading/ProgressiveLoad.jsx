/**
 * Progressive loading component that loads sections sequentially.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMotion } from '../../context/MotionContext';
import './ProgressiveLoad.scss';

/**
 * ProgressiveLoad - Sequential loading of sections.
 * @param {Object} props
 * @param {Array} props.sections - Array of section configs
 *   Each section: { key, skeleton, component, fetchFn, priority }
 * @param {boolean} props.loadInParallel - Load sections in parallel (default: false)
 * @param {number} props.staggerDelay - Delay between sections (default: 100ms)
 * @returns {JSX.Element}
 */
export function ProgressiveLoad({
  sections = [],
  loadInParallel = false,
  staggerDelay = 100,
}) {
  const { prefersReducedMotion } = useMotion();
  const [loadedSections, setLoadedSections] = useState(new Set());
  const [sectionData, setSectionData] = useState(new Map());
  const [errors, setErrors] = useState(new Map());

  useEffect(() => {
    if (loadInParallel) {
      // Load all sections in parallel
      sections.forEach((section) => {
        loadSection(section);
      });
    } else {
      // Load sections sequentially with stagger
      sections.forEach((section, index) => {
        setTimeout(() => {
          loadSection(section);
        }, index * staggerDelay);
      });
    }
  }, [sections, loadInParallel, staggerDelay]);

  const loadSection = async (section) => {
    if (!section.fetchFn) {
      // No fetch function, mark as loaded immediately
      setLoadedSections((prev) => new Set(prev).add(section.key));
      return;
    }

    try {
      const data = await section.fetchFn();
      setSectionData((prev) => new Map(prev).set(section.key, data));
      setLoadedSections((prev) => new Set(prev).add(section.key));
    } catch (error) {
      console.error(`Failed to load section ${section.key}:`, error);
      setErrors((prev) => new Map(prev).set(section.key, error));
      setLoadedSections((prev) => new Set(prev).add(section.key));
    }
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: 'easeOut' };

  return (
    <div className="progressive-load">
      {sections.map((section, index) => {
        const isLoaded = loadedSections.has(section.key);
        const data = sectionData.get(section.key);
        const error = errors.get(section.key);

        return (
          <motion.div
            key={section.key}
            className="progressive-load__section"
            variants={fadeInVariants}
            initial="hidden"
            animate={isLoaded ? 'visible' : 'hidden'}
            transition={{
              ...transition,
              delay: prefersReducedMotion ? 0 : index * 0.1,
            }}
          >
            {!isLoaded ? (
              section.skeleton || <div>Loading...</div>
            ) : error ? (
              <div className="progressive-load__error">
                Failed to load {section.key}
              </div>
            ) : (
              section.component({ data })
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default ProgressiveLoad;
