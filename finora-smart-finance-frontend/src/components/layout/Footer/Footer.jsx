import { useState, useEffect, useRef, memo } from 'react';
import FooterBrand from './FooterBrand';
import FooterNav from './FooterNav';
import FooterBottom from './FooterBottom';
import BackToTop from './BackToTop';
import BrandingBackground from '@/components/common/BrandingBackground/BrandingBackground';
import styles from './Footer.module.scss';

const Footer = ({ isCollapsed = false, isMobile = false }) => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const footerRef = useRef(null);

  useEffect(() => {
    const footerEl = footerRef.current;
    if (!footerEl) return;

    const observer = new IntersectionObserver(([entry]) => setShowBackToTop(entry.isIntersecting), {
      threshold: 0.1,
    });

    observer.observe(footerEl);
    return () => observer.disconnect();
  }, []);

  const footerClass = isMobile
    ? styles.footer
    : `${styles.footer} ${isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`;

  return (
    <footer ref={footerRef} className={footerClass}>
      <BrandingBackground compact />
      <div className={styles.container}>
        <FooterBrand />
        <FooterNav />
        <FooterBottom />
      </div>
      <BackToTop visible={showBackToTop} />
    </footer>
  );
};

export default memo(Footer);
