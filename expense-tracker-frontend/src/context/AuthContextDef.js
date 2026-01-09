import React from 'react';

/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} [name] - User name (optional)
 * @property {string} createdAt - Account creation date
 * @property {boolean} isVerified - Email verification status
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {User | null} user - Current user object
 * @property {boolean} isAuthenticated - Whether user is authenticated
 * @property {boolean} isLoading - Loading state for auth operations
 * @property {Error | null} error - Current error if any
 * @property {string | null} accessToken - Access token for API requests
 * @property {string | null} refreshToken - Refresh token for token renewal
 * @property {number | null} expiresIn - Token expiry timestamp
 * @property {(email: string, password: string) => Promise<User>} login - Login function
 * @property {() => void} logout - Logout function
 * @property {(data: {email: string, password: string, name?: string}) => Promise<any>} register - Register function
 * @property {() => Promise<string>} refreshAccessToken - Refresh access token
 * @property {(email: string) => Promise<any>} forgotPassword - Forgot password function
 * @property {(token: string, password: string) => Promise<any>} resetPassword - Reset password function
 * @property {(email: string) => Promise<any>} resendVerification - Resend verification email
 * @property {() => void} clearError - Clear error state
 * @property {boolean} loading - Deprecated: use isLoading instead
 */

/**
 * Auth Context
 * @type {React.Context<AuthContextValue | null>}
 */
export const AuthContext = React.createContext(null);
