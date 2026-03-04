/**
 * @fileoverview AdminRoute – Route-Schutz für Admin-Bereich
 * @description Prüft Authentifizierung + Admin-Rolle.
 *              Nicht-Admins werden zum Dashboard umgeleitet.
 *              Nicht-authentifizierte User zur Login-Seite.
 *
 * @module components/auth/AdminRoute
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import Skeleton from '@/components/common/Skeleton/Skeleton';

/**
 * Loading-Screen während Auth geprüft wird
 */
const AdminLoadingScreen = () => {
  const { t } = useTranslation();
  return (
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
    aria-label={t('admin.loadingPanel')}
  >
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <Skeleton width="180px" height="28px" borderRadius="var(--r-md)" />
      <div style={{ marginTop: '24px' }}>
        <Skeleton count={4} width="100%" height="56px" gap="16px" borderRadius="var(--r-lg)" />
      </div>
    </div>
  </div>
  );
};

/**
 * AdminRoute Component
 * Schützt verschachtelte Routen vor nicht-autorisierten Zugriffen.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Geschützte Kind-Komponenten
 * @returns {React.ReactElement}
 *
 * @example
 * <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
 *   <Route path="dashboard" element={<AdminDashboard />} />
 * </Route>
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Auth wird noch geladen
  if (isLoading) {
    return <AdminLoadingScreen />;
  }

  // Nicht eingeloggt → Login mit Redirect-Info
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Eingeloggt aber kein Admin → Dashboard
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Admin bestätigt → Kinder rendern
  return children;
}
