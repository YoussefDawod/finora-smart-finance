import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useAuth, useMotion, useToast } from '@/hooks';
import { MainLayout, AdminLayout, PublicLayout } from '@/components/layout';
import { AdminRoute } from '@/components/auth';
import Skeleton from '@/components/common/Skeleton/Skeleton';
import { PageFallback } from '@/components/common/Skeleton';

// ============================================
// Critical Pages — statisch importiert (sofort benötigt)
// ============================================
import AuthPage from '@/pages/AuthPage';
import EmailVerificationPage from '@/pages/EmailVerificationPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import NotFoundPage from '@/pages/NotFoundPage';

// ============================================
// Lazy-Loaded Pages — on-demand importiert
// ============================================

// Public Content Pages
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const ImpressumPage = lazy(() => import('@/pages/ImpressumPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const FeaturesPage = lazy(() => import('@/pages/FeaturesPage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const BlogPage = lazy(() => import('@/pages/BlogPage'));
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage'));
const HelpPage = lazy(() => import('@/pages/HelpPage'));
const FaqPage = lazy(() => import('@/pages/FaqPage'));
const PrivacyNoticePage = lazy(() => import('@/pages/PrivacyNoticePage'));

// Protected App Pages
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const TransactionsPage = lazy(() => import('@/pages/TransactionsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

// Admin Pages (lazy-loaded, nur für Admins)
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminTransactionsPage = lazy(() => import('@/pages/admin/AdminTransactionsPage'));
const AdminSubscribersPage = lazy(() => import('@/pages/admin/AdminSubscribersPage'));
const AdminCampaignsPage = lazy(() => import('@/pages/admin/AdminCampaignsPage'));
const AdminCampaignComposer = lazy(() => import('@/pages/admin/AdminCampaignComposer'));
const AdminAuditLogPage = lazy(() => import('@/pages/admin/AdminAuditLogPage'));
const AdminLifecyclePage = lazy(() => import('@/pages/admin/AdminLifecyclePage'));

const PageTransition = ({ children }) => {
  const { shouldAnimate } = useMotion();

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1 }}
      exit={shouldAnimate ? { opacity: 0, y: -8 } : { opacity: 1 }}
      transition={shouldAnimate ? { duration: 0.28, ease: 'easeOut' } : { duration: 0 }}
    >
      {children}
    </motion.div>
  );
};

const AuthLoadingScreen = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '24px',
      padding: '48px',
      background: 'var(--bg)',
    }}
    aria-busy="true"
    aria-label={i18n.t('common.loadingContent')}
  >
    {/* App-ähnliches Skeleton */}
    <div style={{ width: '100%', maxWidth: '400px' }}>
      <Skeleton width="200px" height="32px" borderRadius="var(--r-md)" />
      <div style={{ marginTop: '24px' }}>
        <Skeleton count={3} width="100%" height="48px" gap="16px" borderRadius="var(--r-lg)" />
      </div>
    </div>
  </div>
);

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

// NOTE: ProtectedRoute existiert bewusst, wird aber NICHT auf die App-Routes angewendet.
// Grund: Die App unterstützt einen vollständigen Guest-Modus (Offline / LocalStorage).
// Unangemeldete User dürfen /dashboard, /transactions, /settings, /profile frei nutzen.
// Auth-sensitive Features (API-Calls, Profil-Daten) prüfen intern per useAuth/AuthRequiredOverlay.
// eslint-disable-next-line no-unused-vars
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const VerifyEmailWrapper = () => {
  const location = useLocation();
  const params = new globalThis.URLSearchParams(location.search);
  const hasResult = params.has('success') || params.has('error');
  return hasResult ? <EmailVerificationPage /> : <VerifyEmailPage />;
};

/**
 * ScrollToTop — scrollt bei jedem Routenwechsel automatisch nach oben.
 * Verhindert, dass die Seite im Footer-Bereich "stecken bleibt".
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

/**
 * Handles newsletter redirect query parameters (?newsletter=confirmed|unsubscribed|invalid|error)
 * Shows a toast and cleans the URL.
 */
const NewsletterToastHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { success, error: showError, info } = useToast();

  useEffect(() => {
    const params = new globalThis.URLSearchParams(location.search);
    const status = params.get('newsletter');
    if (!status) return;

    // Kleine Verzögerung, damit die Seite fertig gerendert ist
    const timer = setTimeout(() => {
      switch (status) {
        case 'confirmed':
          success(t('newsletter.confirmed'));
          break;
        case 'unsubscribed':
          info(t('newsletter.unsubscribed'));
          break;
        case 'invalid':
          showError(t('newsletter.invalid'));
          break;
        case 'error':
          showError(t('newsletter.error'));
          break;
        default:
          break;
      }

      // Clean the URL
      params.delete('newsletter');
      const cleanSearch = params.toString();
      navigate(
        { pathname: location.pathname, search: cleanSearch ? `?${cleanSearch}` : '' },
        { replace: true }
      );
    }, 100);

    return () => clearTimeout(timer);
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

/**
 * Redirects "/" to "/dashboard" while preserving any query parameters.
 * Ensures e.g. /?newsletter=confirmed → /dashboard?newsletter=confirmed.
 */
const RootRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/dashboard${location.search}`} replace />;
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <NewsletterToastHandler />
      <Routes location={location}>
        {/* Auth Routes - Single AuthPage handles both login and register */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PublicRoute>
              <PageTransition>
                <VerifyEmailWrapper />
              </PageTransition>
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
        {/* Public Product Pages — PublicLayout mit BrandingBackground */}
        <Route element={<PublicLayout variant="product" />}>
          <Route
            path="/features"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="content" />}>
                  <FeaturesPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/pricing"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="content" />}>
                  <PricingPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/about"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="content" />}>
                  <AboutPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/blog"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="content" />}>
                  <BlogPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/blog/:id"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="content" />}>
                  <BlogPostPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/faq"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="content" />}>
                  <FaqPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/help"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="content" />}>
                  <HelpPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/contact"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="content" />}>
                  <ContactPage />
                </Suspense>
              </PageTransition>
            }
          />
        </Route>

        {/* Public Legal Pages — PublicLayout ohne BrandingBackground */}
        <Route element={<PublicLayout variant="legal" />}>
          <Route
            path="/terms"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="content" />}>
                  <TermsPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/privacy"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="content" />}>
                  <PrivacyPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/privacy-notice"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="content" />}>
                  <PrivacyNoticePage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/impressum"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="content" />}>
                  <ImpressumPage />
                </Suspense>
              </PageTransition>
            }
          />
        </Route>

        {/* App Routes — MainLayout OHNE ProtectedRoute:
            Guest-Modus erlaubt vollen Zugriff ohne Login (LocalStorage-basiert).
            Auth-sensitive Bereiche nutzen intern useAuth() + AuthRequiredOverlay. */}
        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="dashboard" />}>
                  <DashboardPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/transactions"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="transactions" />}>
                  <TransactionsPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/settings"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="settings" />}>
                  <SettingsPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="/profile"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="settings" />}>
                  <ProfilePage />
                </Suspense>
              </PageTransition>
            }
          />
        </Route>

        {/* Admin Routes — AdminRoute erzwingt Auth + Admin-Rolle */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route
            index
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="dashboard" />}>
                  <AdminDashboardPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="users"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="dashboard" />}>
                  <AdminUsersPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="transactions"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="transactions" />}>
                  <AdminTransactionsPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="subscribers"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="dashboard" />}>
                  <AdminSubscribersPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="campaigns"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="dashboard" />}>
                  <AdminCampaignsPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="campaigns/new"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="dashboard" />}>
                  <AdminCampaignComposer />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="campaigns/:id/edit"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="dashboard" />}>
                  <AdminCampaignComposer />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="audit-log"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="dashboard" />}>
                  <AdminAuditLogPage />
                </Suspense>
              </PageTransition>
            }
          />
          <Route
            path="lifecycle"
            element={
              <PageTransition>
                <Suspense fallback={<PageFallback variant="dashboard" />}>
                  <AdminLifecyclePage />
                </Suspense>
              </PageTransition>
            }
          />
        </Route>

        {/* Default & Fallback Routes — RootRedirect preserviert Query-Parameter */}
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="*"
          element={
            <PageTransition>
              <NotFoundPage />
            </PageTransition>
          }
        />
      </Routes>
    </>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
