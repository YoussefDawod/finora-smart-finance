import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { MotionProvider } from '@/context/MotionContext';
import { TransactionProvider } from '@/context/TransactionContext';
import { CookieConsentProvider } from '@/context/CookieConsentContext';
import { ToastContainer, ErrorBoundary, CookieConsent } from '@/components/common';
import { OfflineBanner } from '@/components/common/OfflineBanner/OfflineBanner';
import AppRoutes from '@/AppRoutes';

export default function App() {
  return (
    <MotionProvider>
      <ErrorBoundary>
        <CookieConsentProvider>
          <AuthProvider>
            <ThemeProvider>
              <ToastProvider>
                {/* ToastContainer uses Portal - rendered first for proper stacking */}
                <ToastContainer />
                <OfflineBanner />
                <TransactionProvider>
                  <AppRoutes />
                  <CookieConsent />
                </TransactionProvider>
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </CookieConsentProvider>
      </ErrorBoundary>
    </MotionProvider>
  );
}
