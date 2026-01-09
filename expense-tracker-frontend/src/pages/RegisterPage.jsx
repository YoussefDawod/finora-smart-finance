import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { z } from 'zod';

// ============================================
// Zod-Validierungsschema
// ============================================
const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten')
    .regex(/[^A-Za-z0-9]/, 'Passwort muss mindestens ein Sonderzeichen enthalten'),
  confirmPassword: z.string().min(1, 'Passwortbestätigung ist erforderlich'),
  name: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading, isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [done, setDone] = useState(false);
  const [verificationLink, setVerificationLink] = useState(null);

  // Redirect wenn bereits authentifiziert
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Auto-redirect zu Verification nach 5 Sekunden, wenn Link vorhanden
  useEffect(() => {
    if (verificationLink) {
      const timer = setTimeout(() => {
        navigate(verificationLink);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [verificationLink, navigate]);

  // Passwort-Anforderungen prüfen
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecial: /[^A-Za-z0-9]/.test(formData.password),
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    try {
      registerSchema.parse(formData);
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

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validierung
    if (!validateForm()) {
      toastError('Bitte korrigiere die Fehler im Formular');
      return;
    }

    try {
      const result = await register({ 
        email: formData.email, 
        password: formData.password, 
        name: formData.name || undefined 
      });
      
      // result contains: { user, verificationLink (optional, dev only) }
      setDone(true);
      success('Registrierung erfolgreich! Bitte überprüfe deine E-Mails.');
      
      if (result?.verificationLink) {
        setVerificationLink(result.verificationLink);
      }
    } catch (err) {
      toastError(err.message || 'Registrierung fehlgeschlagen');
    }
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <h1>Expense Tracker</h1>
          <div className="alert alert--success">
            <h3>✅ Registrierung erfolgreich!</h3>
            <p>Bitte überprüfe deine E-Mails zur Verifizierung deines Kontos.</p>
            <p className="email-verification-note">
              📧 Wir haben dir einen Verifizierungslink an <strong>{formData.email}</strong> gesendet.
            </p>
            
            {verificationLink && (
              <div className="verification-action">
                <p>Oder verifiziere direkt hier:</p>
                <button
                  onClick={() => { 
                    try { 
                      window.location.href = verificationLink; 
                    } catch { 
                      navigate('/verify-email' + (verificationLink?.includes('?') ? verificationLink.substring(verificationLink.indexOf('?')) : '')); 
                    } 
                  }}
                  className="btn btn--primary"
                >
                  E-Mail Verifizieren
                </button>
                <span className="redirect-note">Wird automatisch weitergeleitet...</span>
              </div>
            )}
            
            <p className="mt-3"><Link to="/login">Zurück zur Anmeldung</Link></p>
          </div>
          
          <div className="security-notice">
            <p>🔒 <strong>Sicherheitshinweis:</strong> Verwende ein starkes, einzigartiges Passwort.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Expense Tracker</h1>
        <h2>Registrieren</h2>
        
        <form onSubmit={onSubmit} noValidate>
          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name">
              Name <span className="optional-label">(optional)</span>
            </label>
            <input 
              id="name"
              name="name"
              className={`form-input ${errors.name ? 'form-input--error' : ''}`}
              type="text"
              value={formData.name} 
              onChange={handleChange}
              disabled={loading}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <small id="name-error" className="form-error" role="alert">
                {errors.name}
              </small>
            )}
          </div>
          
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
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required 
                disabled={loading}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby="password-requirements password-error"
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
            
            {/* Password Requirements Indicator */}
            {(passwordFocused || formData.password) && (
              <div id="password-requirements" className="password-requirements">
                <p className="requirements-title">Passwort-Anforderungen:</p>
                <ul>
                  <li className={passwordRequirements.minLength ? 'requirement-met' : ''}>
                    {passwordRequirements.minLength ? '✓' : '○'} Mindestens 8 Zeichen
                  </li>
                  <li className={passwordRequirements.hasUppercase ? 'requirement-met' : ''}>
                    {passwordRequirements.hasUppercase ? '✓' : '○'} Mindestens ein Großbuchstabe
                  </li>
                  <li className={passwordRequirements.hasNumber ? 'requirement-met' : ''}>
                    {passwordRequirements.hasNumber ? '✓' : '○'} Mindestens eine Zahl
                  </li>
                  <li className={passwordRequirements.hasSpecial ? 'requirement-met' : ''}>
                    {passwordRequirements.hasSpecial ? '✓' : '○'} Mindestens ein Sonderzeichen
                  </li>
                </ul>
              </div>
            )}
            
            {errors.password && (
              <small id="password-error" className="form-error" role="alert">
                {errors.password}
              </small>
            )}
          </div>
          
          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              Passwort bestätigen <span className="required-label">*</span>
            </label>
            <div className="password-input-wrapper">
              <input 
                id="confirmPassword"
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'form-input--error' : ''}`}
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword} 
                onChange={handleChange} 
                required 
                disabled={loading}
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                tabIndex={0}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && (
              <small id="confirmPassword-error" className="form-error" role="alert">
                {errors.confirmPassword}
              </small>
            )}
          </div>
          
          {/* Submit Button */}
          <button 
            className="btn btn--primary" 
            type="submit" 
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? '⏳ Wird registriert...' : 'Registrieren'}
          </button>
        </form>
        
        {/* Security Notice */}
        <div className="security-notice">
          <p>🔒 Deine Daten werden sicher über HTTPS übertragen.</p>
        </div>
        
        {/* Auth Links */}
        <div className="auth-links">
          <p>Du hast bereits ein Konto? <Link to="/login">Hier anmelden</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
