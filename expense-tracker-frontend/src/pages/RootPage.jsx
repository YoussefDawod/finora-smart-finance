import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';

/**
 * RootPage
 * Smart redirect component that routes based on authentication state
 * - If authenticated: Redirect to /dashboard
 * - If not authenticated: Show landing page or redirect to /login
 */
const RootPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Wait for auth check to complete
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect authenticated users to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        // Redirect non-authenticated users to landing page
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading spinner while checking auth status
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'var(--color-bg, #ffffff)'
      }}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner message="Authentifizierung wird überprüft..." />
    </div>
  );
};

export default RootPage;
