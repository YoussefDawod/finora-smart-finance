import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { z } from 'zod';

// ============================================
// Zod-Validierungsschema
// ============================================
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse'),
  password: z
    .string()
    .min(1, 'Passwort ist erforderlich'),
});

// LocalStorage Keys
const REMEMBER_ME_KEY = 'expense_tracker_remember_email';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, isAuthenticated, resendVerification } = useAuth();
  const { success, error: toastError } = useToast();
  
  // Get the location user was trying to access before redirect
  const from = location.state?.from?.pathname || '/dashboard';
  
  // Load remembered email from localStorage
  const rememberedEmail = localStorage.getItem(REMEMBER_ME_KEY) || '';
  
  const [formData, setFormData] = useState({
    email: rememberedEmail,
    password: '',
  });
  
  const [rememberMe, setRememberMe] = useState(!!rememberedEmail);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [verificationLink, setVerificationLink] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Redirect wenn bereits authentifiziert
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    
    // Clear API error when user starts typing
    if (apiError) {
      setApiError(null);
    }
  };

  const validateForm = () => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors = {};
        err.errors.forEach((error) => {
          if (error.path) {
            fieldErrors[error.path[0]] = error.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleRememberMe = (checked) => {
    setRememberMe(checked);
    
    if (!checked) {
      // Clear remembered email if unchecked
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  };

  const getErrorMessage = (error) => {
    // Customize error messages based on status code or message
    if (!error) return null;
    
    const statusCode = error.statusCode || error.status;
    const message = error.message || '';
    
    // Email not verified (403)
    if (statusCode === 403 || message.toLowerCase().includes('nicht verifiziert') || message.toLowerCase().includes('not verified')) {
      return {
        type: 'verification',
        message: '⚠️ Dein Konto ist noch nicht verifiziert. Bitte überprüfe deine E-Mails.',
      };
    }
    
    // Invalid credentials (401)
    if (statusCode === 401 || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('ungültig')) {
      return {
        type: 'credentials',
        message: '❌ Ungültige E-Mail-Adresse oder Passwort.',
      };
    }
    
    // Generic server error
    return {
      type: 'generic',
      message: message || 'Login fehlgeschlagen. Bitte versuche es erneut.',
    };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setApiError(null);
    setVerificationLink(null);
    
    // Validierung
    if (!validateForm()) {
      toastError('Bitte korrigiere die Fehler im Formular');
      return;
    }

    try {
      // Login attempt
      await login(formData.email, formData.password);
      
      // Save email to localStorage if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, formData.email);
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
      
      // Success toast
      success('Erfolgreich angemeldet! Willkommen zurück.');
      
      // Redirect wird durch useEffect getriggert
    } catch (err) {
      const errorInfo = getErrorMessage(err);
      setApiError(errorInfo);
      toastError(errorInfo.message);
    }
  };

  const handleResendVerification = async () => {
    try {
      const res = await resendVerification(formData.email);
      if (res?.verificationLink) {
        setVerificationLink(res.verificationLink);
      }
      success('Verifizierungslink wurde erneut gesendet!');
    } catch (e) {
      toastError('Erneutes Senden fehlgeschlagen.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Expense Tracker</h1>
        <h2>Anmelden</h2>
        
        {/* Error Display */}
        {apiError && (
          <div className="alert alert--error">
            <p>{apiError.message}</p>
            
            {/* Verification Error - Show resend button */}
            {apiError.type === 'verification' && (
              <div className="verification-error-actions">
                <button
                  className="btn btn--sm btn--secondary"
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading}
                >
                  📧 Verifizierungslink erneut senden
                </button>
                
                {verificationLink && (
                  <div className="verification-link-container">
                    <button
                      className="btn btn--sm btn--primary"
                      type="button"
                      onClick={() => { 
                        try { 
                          window.location.href = verificationLink; 
                        } catch { 
                          navigate('/verify-email' + (verificationLink?.includes('?') ? verificationLink.substring(verificationLink.indexOf('?')) : '')); 
                        } 
                      }}
                    >
                      Jetzt verifizieren
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={onSubmit} noValidate>
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">
              E-Mail <span className="required-label">*</span>
            </label>
            <input 
              id="email"
              name="email"
              className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              disabled={loading}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <small id="email-error" className="form-error" role="alert">
                {errors.email}
              </small>
            )}
          </div>
          
          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">
              Passwort <span className="required-label">*</span>
            </label>
            <div className="password-input-wrapper">
              <input 
                id="password"
                name="password"
                className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                value={formData.password} 
                onChange={handleChange} 
                required 
                disabled={loading}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                tabIndex={0}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && (
              <small id="password-error" className="form-error" role="alert">
                {errors.password}
              </small>
            )}
          </div>
          
          {/* Remember Me & Forgot Password */}
          <div className="form-row">
            <div className="form-checkbox">
              <input 
                type="checkbox" 
                id="rememberMe" 
                checked={rememberMe}
                onChange={(e) => handleRememberMe(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="rememberMe">E-Mail merken</label>
            </div>
            
            <Link to="/forgot-password" className="forgot-password-link">
              Passwort vergessen?
            </Link>
          </div>
          
          {/* Submit Button */}
          <button 
            className="btn btn--primary" 
            type="submit" 
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? '⏳ Wird angemeldet...' : 'Anmelden'}
          </button>
        </form>
        
        {/* Auth Links */}
        <div className="auth-links">
          <p>Du hast noch kein Konto? <Link to="/register">Hier registrieren</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
