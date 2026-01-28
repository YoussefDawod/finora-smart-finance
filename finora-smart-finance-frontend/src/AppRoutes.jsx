import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, useMotion } from '@/hooks';
import { MainLayout } from '@/components/layout';
import Spinner from '@/components/common/Spinner/Spinner';
import AuthPage from '@/pages/AuthPage';
import EmailVerificationPage from '@/pages/EmailVerificationPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import TermsPage from '@/pages/TermsPage';
import DashboardPage from '@/pages/DashboardPage';
import TransactionsPage from '@/pages/TransactionsPage';
import SettingsPage from '@/pages/SettingsPage/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import ProfilePage from '@/pages/ProfilePage';

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
      gap: '12px',
      background: 'var(--bg)',
    }}
  >
    <Spinner size="large" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

const VerifyEmailWrapper = () => {
  const location = useLocation();
  const params = new globalThis.URLSearchParams(location.search);
  const hasResult = params.has('success') || params.has('error');
  return hasResult ? <EmailVerificationPage /> : <VerifyEmailPage />;
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
      <Routes location={location}>
        {/* Auth Routes - Single AuthPage handles both login and register */}
        <Route
          path="/login"
          element={(
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          )}
        />
        <Route
          path="/register"
          element={(
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          )}
        />
        <Route
          path="/verify-email"
          element={(
            <PublicRoute>
              <PageTransition>
                <VerifyEmailWrapper />
              </PageTransition>
            </PublicRoute>
          )}
        />
        <Route
          path="/forgot-password"
          element={(
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          )}
        />
        <Route path="/terms" element={(<PageTransition><TermsPage /></PageTransition>)} />

        {/* Protected Routes - mit MainLayout */}
        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <PageTransition>
                  <DashboardPage />
                </PageTransition>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/transactions"
            element={(
              <ProtectedRoute>
                <PageTransition>
                  <TransactionsPage />
                </PageTransition>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/settings"
            element={(
              <ProtectedRoute>
                <PageTransition>
                  <SettingsPage />
                </PageTransition>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/profile"
            element={(
              <ProtectedRoute>
                <PageTransition>
                  <ProfilePage />
                </PageTransition>
              </ProtectedRoute>
            )}
          />
        </Route>

        {/* Default & Fallback Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={(<PageTransition><NotFoundPage /></PageTransition>)} />
      </Routes>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
