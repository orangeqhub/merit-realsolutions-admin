import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/button/Button';
import { useToast } from '../components/feedback/Toast';
import { useAuth } from '../context/AuthContext.jsx';
import { getMustChangePassword } from '../services/auth/authApi';
import '../styles/components/form.css';
import './AdminLogin.css';

const heroLayers = [
  'admin-login__bg-layer--1',
  'admin-login__bg-layer--2',
  'admin-login__bg-layer--3',
  'admin-login__bg-layer--4',
];

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const { login, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(getMustChangePassword() ? '/set-password' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(email.trim(), password);
      toast.success('Login successful.');
      navigate(result.mustChangePassword ? '/set-password' : '/dashboard', { replace: true });
    } catch (err) {
      const message = err.message || 'Unable to sign in. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-login" style={{ display: 'grid', placeItems: 'center', minHeight: '100svh' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="admin-login">
      <div className="admin-login__background" aria-hidden="true">
        {heroLayers.map((layerClass) => (
          <div key={layerClass} className={`admin-login__bg-layer ${layerClass}`} />
        ))}
        <div className="admin-login__overlay" />
      </div>

      <main className="admin-login__main">
        <div className="admin-login__card">
          <div className="admin-login__brand">
            <span className="admin-login__logo-icon">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16 4L28 16V26H4V16L16 4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <rect x="13" y="18" width="6" height="8" fill="currentColor" />
              </svg>
            </span>
            <div className="admin-login__brand-text">
              <h1 className="admin-login__brand-name">Merit Real Solutions</h1>
              <p className="admin-login__brand-tagline">Admin Portal</p>
            </div>
          </div>

          <div className="admin-login__divider" />

          <div className="admin-login__form-header">
            <h2 className="admin-login__form-title">Sign In</h2>
            <p className="admin-login__form-description">
              Enter your credentials to access the dashboard.
            </p>
          </div>

          <form className="admin-login__form" onSubmit={handleLogin}>
            {error ? (
              <div className="admin-login__error" role="alert">
                {error}
              </div>
            ) : null}

            <div className="form-group form-group--light">
              <label htmlFor="admin-email">Email Address</label>
              <input
                id="admin-email"
                type="email"
                placeholder="admin@meritrealsolutions.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group form-group--light">
              <label htmlFor="admin-password">Password</label>
              <div className="admin-login__password-field">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="admin-login__password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isSubmitting}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="admin-login__options">
              <label className="admin-login__remember">
                <input type="checkbox" disabled={isSubmitting} />
                <span>Remember me</span>
              </label>
              <a href="/login" className="admin-login__forgot">
                Forgot password?
              </a>
            </div>

            <Button type="submit" variant="gold" size="lg" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="admin-login__footer">
          &copy; {new Date().getFullYear()} Merit Real Solutions. All rights reserved.
        </p>
      </main>
    </div>
  );
}
