import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin, logoutAdmin, fetchAdminProfile } from '../services/auth/authApi.js';
import {
  clearSession,
  getSession,
  isSessionValid,
  saveSession,
} from '../services/auth/authStorage.js';

const AuthContext = createContext(null);
const PROFILE_TIMEOUT_MS = 5000;

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getSession()?.user ?? null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => isSessionValid());
  const [isLoading, setIsLoading] = useState(() => isSessionValid());

  const syncSession = useCallback(() => {
    if (!isSessionValid()) {
      clearSession();
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }

    const session = getSession();
    setUser(session?.user ?? null);
    setIsAuthenticated(true);
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    const finishLoading = () => {
      if (!cancelled) setIsLoading(false);
    };

    const initialize = async () => {
      if (!isSessionValid()) {
        clearSession();
        setUser(null);
        setIsAuthenticated(false);
        finishLoading();
        return;
      }

      const session = getSession();
      setUser(session?.user ?? null);
      setIsAuthenticated(true);

      try {
        const profile = await Promise.race([
          fetchAdminProfile(session.token),
          new Promise((_, reject) => {
            timeoutId = window.setTimeout(
              () => reject(new Error('Profile request timed out.')),
              PROFILE_TIMEOUT_MS
            );
          }),
        ]);
        if (cancelled) return;
        setUser(profile);
        saveSession({ token: session.token, user: profile });
        setIsAuthenticated(true);
        if (profile.mustChangePassword) {
          localStorage.setItem('auth_must_change_password', '1');
        }
      } catch {
        if (cancelled) return;
        // Keep cached session usable if the network blips; only clear on hard auth failure.
        // If profile timed out / failed, still allow dashboard with cached user.
        if (!session?.user) {
          clearSession();
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (timeoutId) window.clearTimeout(timeoutId);
        finishLoading();
      }
    };

    initialize();
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      // Strict Mode remounts: ensure we never leave the app stuck on "Checking session..."
      setIsLoading(false);
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!isSessionValid()) {
        clearSession();
        setUser(null);
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
      }
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [navigate]);

  const login = useCallback(async (email, password) => {
    const result = await loginAdmin(email, password);
    saveSession(result);
    setUser(result.user);
    setIsAuthenticated(true);
    setIsLoading(false);
    return result;
  }, []);

  const logout = useCallback(async () => {
    const session = getSession();

    if (session?.token) {
      try {
        await logoutAdmin(session.token);
      } catch {
        // Stateless JWT — still clear client session on failure
      }
    }

    clearSession();
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      syncSession,
    }),
    [user, isAuthenticated, isLoading, login, logout, syncSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
