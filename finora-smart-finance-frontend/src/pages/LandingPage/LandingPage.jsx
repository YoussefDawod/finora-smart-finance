import { useRef, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import HeroSection from './sections/HeroSection';
import FeaturesSection from './sections/FeaturesSection';
import HowItWorksSection from './sections/HowItWorksSection';
import TestimonialsSection from './sections/TestimonialsSection';
import CTASection from './sections/CTASection';
import SectionTimeline from './components/SectionTimeline';
import styles from './LandingPage.module.scss';

const SECTIONS = ['hero', 'features', 'howItWorks', 'testimonials', 'cta'];

export default function LandingPage() {
  const { t } = useTranslation();
  const sectionRefs = useRef({});
  const [hasTestimonials, setHasTestimonials] = useState(false);

  const setRef = id => el => {
    sectionRefs.current[id] = el;
  };

  const handleTestimonialsLoaded = useCallback(count => {
    setHasTestimonials(count > 0);
  }, []);

  // Scrollbar auf html ausblenden — Timeline Navigation ersetzt sie
  useEffect(() => {
    document.documentElement.classList.add('page-no-scrollbar');
    return () => document.documentElement.classList.remove('page-no-scrollbar');
  }, []);

  const visibleSections = SECTIONS.filter(id => id !== 'testimonials' || hasTestimonials);

  const sectionLabels = visibleSections.map(id => ({
    id,
    label: t(`landing.timeline.${id}`),
  }));

  return (
    <div className={styles.landing}>
      <section id="hero" ref={setRef('hero')} className={styles.section}>
        <HeroSection />
      </section>

      <section id="features" ref={setRef('features')} className={styles.section}>
        <FeaturesSection />
      </section>

      <section id="howItWorks" ref={setRef('howItWorks')} className={styles.section}>
        <HowItWorksSection />
      </section>

      <section
        id="testimonials"
        ref={setRef('testimonials')}
        className={`${styles.section} ${!hasTestimonials ? styles.sectionHidden : ''}`}
      >
        <TestimonialsSection onLoaded={handleTestimonialsLoaded} />
      </section>

      <section id="cta" ref={setRef('cta')} className={styles.section}>
        <CTASection />
      </section>

      <SectionTimeline sections={sectionLabels} sectionRefs={sectionRefs} />
    </div>
  );
}
