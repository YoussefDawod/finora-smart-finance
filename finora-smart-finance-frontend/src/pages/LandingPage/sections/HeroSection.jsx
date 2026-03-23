import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { DeviceFrameset } from 'react-device-frameset';
import 'react-device-frameset/styles/marvel-devices.min.css';
import { useMotion, useTheme } from '@/hooks';
import styles from './HeroSection.module.scss';

const trustKeys = ['trustFree', 'trustNoSignup', 'trustLanguages', 'trustDarkMode'];

export default function HeroSection() {
  const { t } = useTranslation();
  const { shouldAnimate } = useMotion();
  const { isDarkMode } = useTheme();

  const suffix = isDarkMode ? 'Dark' : 'Light';

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.12 },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className={styles.hero}>
      <motion.div
        className={styles.content}
        variants={shouldAnimate ? container : undefined}
        initial={shouldAnimate ? 'hidden' : false}
        whileInView={shouldAnimate ? 'show' : undefined}
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* ── Linke Seite: Texte + Buttons ── */}
        <div className={styles.textCol}>
          <motion.h1 className={styles.headline} variants={shouldAnimate ? fadeUp : undefined}>
            {t('landing.hero.headline')}
          </motion.h1>

          <motion.p className={styles.subheadline} variants={shouldAnimate ? fadeUp : undefined}>
            {t('landing.hero.subheadline')}
          </motion.p>

          <motion.div className={styles.actions} variants={shouldAnimate ? fadeUp : undefined}>
            <Link to="/dashboard" className={styles.ctaPrimary}>
              {t('landing.hero.ctaPrimary')}
              <FiArrowRight size={18} />
            </Link>
            <Link to="/register" className={styles.ctaSecondary}>
              {t('landing.hero.ctaSecondary')}
            </Link>
          </motion.div>

          <motion.div className={styles.trustBadges} variants={shouldAnimate ? fadeUp : undefined}>
            {trustKeys.map(key => (
              <span key={key} className={styles.badge}>
                {t(`landing.hero.${key}`)}
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── Rechte Seite: Mockups ── */}
        <motion.div className={styles.mockupCol} variants={shouldAnimate ? fadeUp : undefined}>
          {/* Laptop — volle Breite, mit Perspektive */}
          <div className={styles.deviceLaptop}>
            <DeviceFrameset device="MacBook Pro">
              <img
                src={`/Screenshots/Screenshot-Desktop-${suffix}.png`}
                alt={t('landing.hero.altDesktop', 'Finora Dashboard — Desktop')}
                className={styles.screenshot}
                loading="eager"
              />
            </DeviceFrameset>
          </div>

          {/* Tablet (links) + Mobile (rechts) — davor */}
          <div className={styles.smallDevices}>
            <div className={styles.deviceTablet}>
              <DeviceFrameset device="iPad Mini" color={isDarkMode ? 'black' : 'silver'}>
                <img
                  src={`/Screenshots/Screenshot-Tablet-${suffix}.png`}
                  alt={t('landing.hero.altTablet', 'Finora Dashboard — Tablet')}
                  className={styles.screenshot}
                  loading="lazy"
                />
              </DeviceFrameset>
            </div>

            <div className={styles.deviceMobile}>
              <DeviceFrameset device="iPhone X">
                <img
                  src={`/Screenshots/Screenshot-Mobile-${suffix}.png`}
                  alt={t('landing.hero.altMobile', 'Finora Dashboard — Mobile')}
                  className={styles.screenshot}
                  loading="eager"
                />
              </DeviceFrameset>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
