/**
 * @fileoverview Footer — 3-Zonen Container
 * @description Professioneller Footer mit modularer Architektur:
 *  Zone 1: FooterBrand (Full-Width Brand-Band oben)
 *  Zone 2: FooterNav (4 gleichmäßige Spalten)
 *  Zone 3: FooterBottom (Newsletter + Language + Copyright)
 *  BackToTop (IntersectionObserver-gesteuerter Scroll-Button)
 */

import { useState, useEffect, useRef, memo } from 'react';
import FooterBrand from './FooterBrand';
import FooterNav from './FooterNav';
import FooterBottom from './FooterBottom';
import BackToTop from './BackToTop';
import styles from './Footer.module.scss';

/**
 * Footer Component
 * @param {Object} props
 * @param {boolean} props.isCollapsed - Sidebar collapsed state (desktop)
 * @param {boolean} props.isMobile - Mobile viewport flag
 */
const Footer = ({ isCollapsed = false, isMobile = false }) => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const footerRef = useRef(null);

  // IntersectionObserver — zeigt BackToTop, wenn Footer sichtbar ist
  useEffect(() => {
    const footerEl = footerRef.current;
    if (!footerEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowBackToTop(entry.isIntersecting),
      { threshold: 0.1 },
    );

    observer.observe(footerEl);
    return () => observer.disconnect();
  }, []);

  // Sidebar-aware Klasse
  const footerClass = isMobile
    ? styles.footer
    : `${styles.footer} ${isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`;

  return (
    <footer ref={footerRef} className={footerClass} role="contentinfo">
      <div className={styles.container}>
        {/* Zone 1: Brand-Band (volle Breite) */}
        <FooterBrand />

        {/* Zone 2: Navigation (4-Spalten-Grid) */}
        <FooterNav />

        {/* Zone 3: Bottom Bar (Newsletter + Language + Copyright) */}
        <FooterBottom />
      </div>

      {/* Scroll-to-Top Button */}
      <BackToTop visible={showBackToTop} />
    </footer>
  );
};

export default memo(Footer);
