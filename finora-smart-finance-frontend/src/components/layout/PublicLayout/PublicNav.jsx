import { useState, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MEDIA_QUERIES } from '@/constants/breakpoints';
import { useAuth } from '@/hooks/useAuth';
import { UserMenu } from '@/components/common';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import styles from './PublicNav.module.scss';

const NAV_LINKS = [
  { labelKey: 'nav.features', path: '/features' },
  { labelKey: 'nav.pricing', path: '/pricing' },
  { labelKey: 'nav.blog', path: '/blog' },
  { labelKey: 'nav.help', path: '/help' },
];

function PublicNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
  const { user, logout, isAuthenticated, isLoading, isViewer } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, navigate]);

  const logoTo = isAuthenticated ? '/dashboard' : '/';

  return (
    <nav className={styles.nav} aria-label={t('nav.publicNav', 'Navigation')}>
      {/* navBar trägt backdrop-filter — mobileMenu ist AUSSERHALB davon */}
      <div className={`${styles.navBar} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.container}>
          {isMobile ? (
            <>
              {/* Mobile LEFT: Hamburger (hidden on landing page) */}
              {!isLandingPage && (
                <button
                  type="button"
                  className={styles.hamburger}
                  onClick={toggleMenu}
                  aria-expanded={isMenuOpen}
                  aria-label={isMenuOpen ? t('nav.menuClose') : t('nav.menuOpen')}
                >
                  {isMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                </button>
              )}

              {/* Mobile: Logo on landing page */}
              {isLandingPage && (
                <Link to="/" className={styles.logo} aria-label="Finora Home">
                  <img
                    src="/logo-branding/finora-logo.svg"
                    alt="Finora"
                    className={styles.logoImg}
                  />
                </Link>
              )}

              {/* Mobile RIGHT: Avatar oder Login */}
              <div className={styles.mobileRight}>
                {isLoading ? (
                  <Skeleton variant="circle" width="36px" height="36px" />
                ) : isAuthenticated ? (
                  <UserMenu user={user} onLogout={handleLogout} />
                ) : (
                  <Link to="/login" className={styles.loginBtn}>
                    {t('nav.login')}
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Desktop LEFT: Logo → Dashboard oder Home */}
              <Link to={logoTo} className={styles.logo} aria-label="Finora Home">
                <img src="/logo-branding/finora-logo.svg" alt="Finora" className={styles.logoImg} />
              </Link>

              {/* Desktop CENTER: Nav Links (hidden on landing page) */}
              {!isLandingPage && (
                <div className={styles.links}>
                  {NAV_LINKS.map(({ labelKey, path }) => (
                    <Link
                      key={path}
                      to={path}
                      className={`${styles.link} ${location.pathname === path ? styles.active : ''}`}
                    >
                      {t(labelKey)}
                    </Link>
                  ))}
                </div>
              )}

              {/* Desktop RIGHT: Auth-State */}
              <div className={styles.actions}>
                {isLoading ? (
                  <Skeleton variant="circle" width="36px" height="36px" />
                ) : isAuthenticated ? (
                  <>
                    {(user?.role === 'admin' || user?.role === 'viewer') && (
                      <span className={isViewer ? styles.viewerBadge : styles.adminBadge}>
                        {isViewer ? t('admin.viewerBadge') : t('admin.badge')}
                      </span>
                    )}
                    <UserMenu user={user} onLogout={handleLogout} />
                  </>
                ) : (
                  <>
                    <Link to="/login" className={styles.loginBtn}>
                      {t('nav.login')}
                    </Link>
                    <Link to="/register" className={styles.registerBtn}>
                      {t('nav.register')}
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu — only on non-landing pages */}
      {isMobile && !isLandingPage && isMenuOpen && (
        <div className={styles.mobileMenu}>
          {/* Logo oben im Menü */}
          <Link to={logoTo} className={styles.mobileLogo} onClick={closeMenu}>
            <img
              src="/logo-branding/finora-logo.svg"
              alt="Finora"
              className={styles.mobileLogoImg}
            />
          </Link>

          <div className={styles.mobileLinks}>
            {NAV_LINKS.map(({ labelKey, path }) => (
              <Link
                key={path}
                to={path}
                className={`${styles.mobileLink} ${location.pathname === path ? styles.active : ''}`}
                onClick={closeMenu}
              >
                {t(labelKey)}
              </Link>
            ))}
          </div>

          <div className={styles.mobileActions}>
            {isAuthenticated ? (
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
              >
                <FiLogOut size={16} />
                {t('nav.logout')}
              </button>
            ) : (
              <>
                <Link to="/login" className={styles.loginBtn} onClick={closeMenu}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className={styles.registerBtn} onClick={closeMenu}>
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default memo(PublicNav);
