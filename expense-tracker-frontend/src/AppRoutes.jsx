import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppContent from './AppContent';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// Public Pages (Auth & Info)
import RootPage from './pages/RootPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

// Error Pages
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * AppRoutes - Complete Routing Configuration
 * 
 * Structure:
 * - PUBLIC: Authentication and Info Pages (no auth required)
 * - PROTECTED: Dashboard and user pages (auth required)
 * - ERROR: 404 and unauthorized pages
 * 
 * Wrapped with AuthProvider for global auth state
 */
export default function AppRoutes() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ROOT - Smart Redirect Based on Auth */}
          <Route path="/" element={<RootPage />} />

          {/* PUBLIC ROUTES - No Authentication */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* PROTECTED ROUTES - Requires Auth */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <ProfilePage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <SettingsPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Alternative path for app content */}
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            }
          />

          {/* ERROR & NOT FOUND ROUTES */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

