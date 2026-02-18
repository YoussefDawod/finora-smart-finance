/**
 * @fileoverview Footer Component - Professional Footer
 * @description Clean footer with navigation, social links, newsletter, contact, and scroll-triggered back-to-top
 */

import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGithub, FiLinkedin, FiMail, FiArrowUp } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { Logo } from '@/components/common';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import styles from './Footer.module.scss';

// Heart SVG icon component
const HeartIcon = () => (
  <svg
    className={styles.heartIcon}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

// Social links configuration (static)
const SOCIAL_LINKS = [
  { name: 'GitHub', url: 'https://github.com/YoussefDawod', icon: FiGithub, ariaKey: 'footer.social.ariaGithub' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/youssef-dawod-203273215/', icon: FiLinkedin, ariaKey: 'footer.social.ariaLinkedin' }
];

/**
 * Footer Component
 * @param {Object} props
 * @param {boolean} props.isCollapsed - Sidebar collapsed state (desktop)
 * @param {boolean} props.isMobile - Mobile viewport flag
 */
const Footer = ({ isCollapsed, isMobile }) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const footerRef = useRef(null);

  // IntersectionObserver for back-to-top visibility
  useEffect(() => {
    const footerEl = footerRef.current;
    if (!footerEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowBackToTop(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(footerEl);
    return () => observer.disconnect();
  }, []);

  // Navigation sections
  const NAV_SECTIONS = [
    {
      title: t('footer.sections.product'),
      links: [
        { label: t('footer.links.features'), to: '/features' },
        { label: t('footer.links.pricing'), to: '/pricing' }
      ]
    },
    {
      title: t('footer.sections.company'),
      links: [
        { label: t('footer.links.about'), to: '/about' },
        { label: t('footer.links.blog'), to: '/blog' }
      ]
    },
    {
      title: t('footer.sections.resources'),
      links: [
        { label: t('footer.links.help'), to: '/help' },
        { label: t('footer.links.faq'), to: '/faq' }
      ]
    },
    {
      title: t('footer.sections.legal'),
      links: [
        { label: t('footer.terms'), to: '/terms' },
        { label: t('footer.privacy'), to: '/privacy' },
        { label: t('footer.contact'), to: '/contact' }
      ]
    }
  ];

  // Newsletter handler
  const handleNewsletterSubmit = useCallback(async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setNewsletterStatus('error');
      setTimeout(() => setNewsletterStatus(null), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      await client.post(ENDPOINTS.newsletter.subscribe, {
        email,
        language: i18n.language,
      });
      setNewsletterStatus('success');
      setEmail('');
    } catch {
      setNewsletterStatus('serverError');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNewsletterStatus(null), 5000);
    }
  }, [email, i18n.language]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Footer class based on sidebar
  const footerClass = isMobile
    ? styles.footer
    : `${styles.footer} ${isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`;

  return (
    <footer ref={footerRef} className={footerClass} role="contentinfo">
      <div className={styles.footerContainer}>
        {/* Main Grid */}
        <div className={styles.footerGrid}>
          {/* Brand */}
          <div className={styles.footerBrand}>
            <Logo className={styles.footerLogo} />
            <p className={styles.brandDescription}>
              {t('footer.brand.description')}
            </p>
            <div className={styles.socialIcons}>
              {SOCIAL_LINKS.map((social) => {
                const IconComponent = social.icon;
                return (
                  <motion.a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialIcon}
                    aria-label={t(social.ariaKey)}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent size={18} />
                  </motion.a>
                );
              })}
            </div>
          </div>

          {/* Navigation Sections */}
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className={styles.footerSection}>
              <h3 className={styles.sectionTitle}>{section.title}</h3>
              <nav className={styles.sectionLinks}>
                {section.links.map((link) => (
                  <Link key={link.to} to={link.to} className={styles.sectionLink}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}

          {/* Newsletter & Contact */}
          <div className={styles.footerSection}>
            <h3 className={styles.sectionTitle}>{t('footer.newsletter.title')}</h3>
            <form onSubmit={handleNewsletterSubmit} className={styles.newsletterForm}>
              <div className={styles.inputWrapper}>
                <FiMail className={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer.newsletter.placeholder')}
                  className={styles.newsletterInput}
                  aria-label={t('footer.newsletter.placeholder')}
                />
              </div>
              <button type="submit" disabled={isSubmitting} className={styles.newsletterButton}>
                {isSubmitting ? '...' : t('footer.newsletter.button')}
              </button>
              {newsletterStatus === 'success' && (
                <motion.p
                  className={styles.newsletterSuccess}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {t('footer.newsletter.success')}
                </motion.p>
              )}
              {newsletterStatus === 'error' && (
                <motion.p
                  className={styles.newsletterError}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {t('footer.newsletter.error')}
                </motion.p>
              )}
              {newsletterStatus === 'serverError' && (
                <motion.p
                  className={styles.newsletterError}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {t('footer.newsletter.serverError')}
                </motion.p>
              )}
            </form>

            {/* Contact */}
            <div className={styles.contactInfo}>
              <h4 className={styles.contactTitle}>{t('footer.contactInfo.title')}</h4>
              <a
                href="mailto:info@finora.dawoddev.com"
                className={styles.contactLink}
                aria-label={`${t('footer.contactInfo.email')}: info@finora.dawoddev.com`}
              >
                <FiMail size={16} />
                <span>info@finora.dawoddev.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Finora — {t('footer.madeWith')}{' '}
            <HeartIcon />{' '}
            {t('footer.byAuthor')}
          </p>
          <p className={styles.rights}>
            {t('footer.allRightsReserved')}
          </p>
        </div>
      </div>

      {/* Back to Top - only visible when footer is in viewport */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            className={styles.backToTop}
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={t('footer.backToTop')}
            title={t('footer.backToTop')}
          >
            <FiArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
};

Footer.propTypes = {
  isCollapsed: PropTypes.bool,
  isMobile: PropTypes.bool
};

Footer.defaultProps = {
  isCollapsed: false,
  isMobile: false
};

export default memo(Footer);
