/**
 * @fileoverview FooterNav — Vier gleichmäßige Navigations-Spalten
 *
 * Spalte 1: Unternehmen (Über Uns, Kontakt, Blog, Social Icons)
 * Spalte 2: Produkt (Funktionen, Preise)
 * Spalte 3: Ressourcen (Hilfe, FAQ)
 * Spalte 4: Rechtliches (Impressum, AGB, Datenschutz, Datenschutzhinweis)
 *
 * Social Icons sind im Unternehmen-Bereich — ohne Hintergrund, nur Icons + Hover.
 * Datenschutzhinweis ist ein Button, der den Datenschutz-Hinweis erneut öffnet.
 */

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiGithub, FiLinkedin } from 'react-icons/fi';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { useMotion } from '@/hooks/useMotion';
import styles from './Footer.module.scss';

const SOCIAL_LINKS = [
  {
    name: 'GitHub',
    url: 'https://github.com/YoussefDawod',
    icon: FiGithub,
    ariaKey: 'footer.social.ariaGithub',
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/youssef-dawod-203273215/',
    icon: FiLinkedin,
    ariaKey: 'footer.social.ariaLinkedin',
  },
];

function FooterNav() {
  const { t } = useTranslation();
  const { reopenNotice } = useCookieConsent();
  const { shouldAnimate } = useMotion();

  const handlePrivacyNotice = useCallback((e) => {
    e.preventDefault();
    reopenNotice();
  }, [reopenNotice]);

  const sections = [
    {
      key: 'company',
      title: t('footer.sections.company'),
      links: [
        { label: t('footer.links.about'), to: '/about' },
        { label: t('footer.links.contact'), to: '/contact' },
        { label: t('footer.links.blog'), to: '/blog' },
      ],
      showSocial: true,
    },
    {
      key: 'product',
      title: t('footer.sections.product'),
      links: [
        { label: t('footer.links.features'), to: '/features' },
        { label: t('footer.links.pricing'), to: '/pricing' },
      ],
    },
    {
      key: 'resources',
      title: t('footer.sections.resources'),
      links: [
        { label: t('footer.links.help'), to: '/help' },
        { label: t('footer.links.faq'), to: '/faq' },
      ],
    },
    {
      key: 'legal',
      title: t('footer.sections.legal'),
      links: [
        { label: t('footer.impressum'), to: '/impressum' },
        { label: t('footer.terms'), to: '/terms' },
        { label: t('footer.privacy'), to: '/privacy' },
      ],
      showPrivacyNotice: true,
    },
  ];

  return (
    <div className={styles.navGrid}>
      {sections.map((section) => (
        <div key={section.key} className={styles.navSection}>
          <h3 className={styles.navTitle}>{section.title}</h3>

          <nav className={styles.navLinks}>
            {section.links.map((link) => (
              <Link key={link.to} to={link.to} className={styles.navLink}>
                {link.label}
              </Link>
            ))}

            {/* Datenschutzhinweis-Button in Legal */}
            {section.showPrivacyNotice && (
              <button
                type="button"
                className={styles.navLink}
                onClick={handlePrivacyNotice}
              >
                {t('footer.privacyNotice')}
              </button>
            )}
          </nav>

          {/* Social Icons in Unternehmen — ohne Hintergrund */}
          {section.showSocial && (
            <div className={styles.socialIcons}>
              {SOCIAL_LINKS.map(({ name, url, icon: Icon, ariaKey }) => (
                <motion.a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  aria-label={t(ariaKey)}
                  whileHover={shouldAnimate ? { scale: 1.02, y: -2 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default memo(FooterNav);
