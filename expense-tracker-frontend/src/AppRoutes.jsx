import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks';
import { MainLayout } from '@/components/layout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import TermsPage from '@/pages/TermsPage';
import DashboardPage from '@/pages/DashboardPage';
import TransactionsPage from '@/pages/TransactionsPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import AuthLayoutDemo from '@/pages/AuthLayoutDemo'; // DEMO
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

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes - ohne MainLayout */}
        <Route
          path="/login"
          element={(
            <PublicRoute>
              <PageTransition>
                <LoginPage />
              </PageTransition>
            </PublicRoute>
          )}
        />
        <Route
          path="/register"
          element={(
            <PublicRoute>
              <PageTransition>
                <RegisterPage />
              </PageTransition>
            </PublicRoute>
          )}
        />
        <Route
          path="/verify-email"
          element={(
            <PublicRoute>
              <PageTransition>
                <VerifyEmailPage />
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

        {/* DEMO: AuthLayout Testing */}
        <Route path="/auth-demo" element={(<PageTransition><AuthLayoutDemo /></PageTransition>)} />

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
