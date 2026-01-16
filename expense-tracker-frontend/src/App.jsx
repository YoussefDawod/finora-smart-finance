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
          <MotionProvider>
            <TransactionProvider>
              <AppRoutes />
              <ToastContainer />
            </TransactionProvider>
          </MotionProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
