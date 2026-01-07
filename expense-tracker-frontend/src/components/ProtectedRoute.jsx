import React from 'react';
import { useAuth } from '../hooks/useAuth';
import PropTypes from 'prop-types';

/**
 * ProtectedRoute component for guarding content
 * Since no router is present, this conditionally renders content
 */
const ProtectedRoute = ({ children, fallback = null }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    return fallback || <div className="auth-required">Please log in to view this content.</div>;
  }

  return <>{children}</>;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node
};

export default ProtectedRoute;
