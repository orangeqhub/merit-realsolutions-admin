const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const EXPIRES_KEY = 'auth_expires_at';
const LEGACY_TOKEN_KEY = 'token';

export function getTokenExpiryFromJwt(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.exp * 1000;
}

export function saveSession({ token, user }) {
  const expiresAt = getTokenExpiryFromJwt(token);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(EXPIRES_KEY, String(expiresAt));
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function getSession() {
  const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY) || 0);

  if (!token) {
    return null;
  }

  let resolvedExpiry = expiresAt;
  if (!resolvedExpiry) {
    try {
      resolvedExpiry = getTokenExpiryFromJwt(token);
      localStorage.setItem(EXPIRES_KEY, String(resolvedExpiry));
    } catch {
      resolvedExpiry = 0;
    }
  }

  return {
    token,
    user: userRaw ? JSON.parse(userRaw) : null,
    expiresAt: resolvedExpiry,
  };
}

export function isSessionValid() {
  const session = getSession();
  if (!session?.token) {
    return false;
  }

  if (!session.expiresAt || Date.now() >= session.expiresAt) {
    return false;
  }

  return true;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem('auth_must_change_password');
}

export function getAuthToken() {
  const session = getSession();
  return isSessionValid() ? session.token : null;
}
