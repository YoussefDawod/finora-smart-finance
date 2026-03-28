import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { FiHome, FiGrid, FiZap, FiHeart, FiArrowRight } from 'react-icons/fi';
import { useMotion } from '@/hooks';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA_QUERIES } from '@/constants/breakpoints';
import styles from './SectionTimeline.module.scss';

const SECTION_ICONS = {
  hero: FiHome,
  features: FiGrid,
  howItWorks: FiZap,
  testimonials: FiHeart,
  cta: FiArrowRight,
};

function SectionTimeline({ sections, sectionRefs }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');
  const [visible, setVisible] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
  const { shouldAnimate } = useMotion();

  // Ratio-Map: trackt die aktuelle Sichtbarkeit jeder Sektion
  const ratioMap = useRef({});
  // Scroll-Lock: blockiert Observer-Updates nach Klick auf Nav
  const scrollLockRef = useRef(false);

  // Intersection Observer — aktive Sektion tracken
  useEffect(() => {
    const refs = sectionRefs.current;
    const elements = sections.map(s => refs[s.id]).filter(Boolean);

    if (elements.length === 0) return;

    // Ratio-Map initialisieren
    ratioMap.current = {};
    for (const s of sections) ratioMap.current[s.id] = 0;

    const observer = new IntersectionObserver(
      entries => {
        // Scroll-Lock aktiv → Observer ignorieren
        if (scrollLockRef.current) return;

        // Ratios aktualisieren
        for (const entry of entries) {
          ratioMap.current[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        }

        // Beste Sektion über ALLE Sektionen bestimmen
        let best = null;
        let bestRatio = 0;
        for (const id of Object.keys(ratioMap.current)) {
          if (ratioMap.current[id] > bestRatio) {
            best = id;
            bestRatio = ratioMap.current[id];
          }
        }
        if (best) setActiveId(best);
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.5, 0.7, 1], rootMargin: '-5% 0px -5% 0px' }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [sections, sectionRefs]);

  // Footer-Nähe → Timeline ausblenden + Mobile: erst nach Scroll anzeigen
  useEffect(() => {
    const handleScroll = () => {
      const scrollBottom = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      setVisible(docHeight - scrollBottom > 120);

      if (!hasScrolled && window.scrollY > 50) {
        setHasScrolled(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled]);

  const scrollTo = useCallback(id => {
    // Sofort aktiv setzen + Observer blockieren während smooth-scroll
    setActiveId(id);
    scrollLockRef.current = true;

    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });

    // Lock nach Scroll-Animation aufheben
    setTimeout(() => {
      scrollLockRef.current = false;
    }, 900);
  }, []);

  if (!visible || (isMobile && !hasScrolled)) return null;

  return (
    <motion.nav
      className={`${styles.timeline} ${isMobile ? styles.horizontal : styles.vertical}`}
      initial={shouldAnimate ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      aria-label="Section navigation"
    >
      <div className={styles.track}>
        {sections.map(section => {
          const Icon = SECTION_ICONS[section.id] || FiHome;
          const isActive = activeId === section.id;

          return (
            <button
              key={section.id}
              type="button"
              className={`${styles.dot} ${isActive ? styles.active : ''}`}
              onClick={() => scrollTo(section.id)}
              aria-label={section.label}
              aria-current={isActive ? 'true' : undefined}
              title={section.label}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}

export default memo(SectionTimeline);
