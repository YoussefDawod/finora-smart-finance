import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { MotionProvider } from '@/context/MotionContext';
import { TransactionProvider } from '@/context/TransactionContext';
import { ToastContainer } from '@/components/common';
import AppRoutes from '@/AppRoutes';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          {/* ToastContainer uses Portal - rendered first for proper stacking */}
          <ToastContainer />
          <MotionProvider>
            <TransactionProvider>
              <AppRoutes />
            </TransactionProvider>
          </MotionProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
