import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks';
import { MainLayout } from '@/components/layout';
import AuthPage from '@/pages/AuthPage';
import EmailVerificationPage from '@/pages/EmailVerificationPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import TermsPage from '@/pages/TermsPage';
import DashboardPage from '@/pages/DashboardPage';
import TransactionsPage from '@/pages/TransactionsPage';
import SettingsPage from '@/pages/SettingsPage/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import ProfilePage from '@/pages/ProfilePage';

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.28, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
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
  
  // Use 'auth' key for login/register so AuthPage doesn't remount
  const getRouteKey = (pathname) => {
    if (pathname === '/login' || pathname === '/register') {
      return 'auth';
    }
    return pathname;
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={getRouteKey(location.pathname)}>
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
              <PageTransition>
                <ForgotPasswordPage />
              </PageTransition>
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
    </AnimatePresence>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
