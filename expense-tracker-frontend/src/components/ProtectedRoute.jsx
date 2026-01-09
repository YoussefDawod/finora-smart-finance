import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';
import PropTypes from 'prop-types';

/**
 * ProtectedRoute Component
 * Guards routes for authenticated users only
 * 
 * Features:
 * - Redirects to /login if not authenticated
 * - Preserves intended location for post-login redirect
 * - Shows loading state during auth check
 * - Optional: Role-based access control
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Components to render if authenticated
 * @param {string} [props.requiredRole] - Optional role requirement (e.g., 'admin', 'user')
 * @param {string} [props.redirectTo='/login'] - Where to redirect if not authenticated
 * @param {string} [props.unauthorizedRedirect='/unauthorized'] - Where to redirect if unauthorized (wrong role)
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole = null,
  redirectTo = '/login',
  unauthorizedRedirect = '/unauthorized'
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // ============================================
  // Loading State
  // ============================================
  if (isLoading) {
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
  }

  // ============================================
  // Authentication Check
  // ============================================
  if (!isAuthenticated) {
    // Preserve the location user was trying to access
    // So we can redirect them back after login
    return (
      <Navigate 
        to={redirectTo} 
        replace 
        state={{ from: location }}
      />
    );
  }

  // ============================================
  // Role-Based Access Control (Optional)
  // ============================================
  if (requiredRole) {
    // Check if user has the required role
    const userRole = user?.role || 'user'; // Default to 'user' if no role specified
    
    if (userRole !== requiredRole) {
      console.warn(
        `[ProtectedRoute] Access denied: User role "${userRole}" does not match required role "${requiredRole}"`
      );
      
      return (
        <Navigate 
          to={unauthorizedRedirect} 
          replace 
          state={{ 
            from: location,
            requiredRole,
            userRole 
          }}
        />
      );
    }
  }

  // ============================================
  // Authorized - Render Children
  // ============================================
  return <>{children}</>;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.string,
  redirectTo: PropTypes.string,
  unauthorizedRedirect: PropTypes.string,
};

export default ProtectedRoute;

