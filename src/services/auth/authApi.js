import { API_BASE_URL } from '../../config/api.js';
import { getAuthToken, saveSession, clearSession, getSession } from './authStorage.js';

const MUST_CHANGE_KEY = 'auth_must_change_password';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed.');
    error.status = response.status;
    error.errors = data.errors || [];
    error.code = data.code;
    throw error;
  }
  return data;
}

function persistMustChangePassword(flag) {
  if (flag) {
    localStorage.setItem(MUST_CHANGE_KEY, '1');
  } else {
    localStorage.removeItem(MUST_CHANGE_KEY);
  }
}

export function getMustChangePassword() {
  return localStorage.getItem(MUST_CHANGE_KEY) === '1';
}

export async function loginAdmin(identifier, password) {
  const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await parseResponse(response);
  saveSession(data.data);
  persistMustChangePassword(data.data.mustChangePassword);
  return data.data;
}

export async function logoutAdmin(token) {
  const response = await fetch(`${API_BASE_URL}/admin/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await parseResponse(response).catch(() => null);
  persistMustChangePassword(false);
}

export async function fetchAdminProfile(token) {
  const response = await fetch(`${API_BASE_URL}/admin/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await parseResponse(response);
  persistMustChangePassword(data.data.mustChangePassword);
  return data.data;
}

async function authPost(path, body) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required.');

  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await parseResponse(response);
  return data.data;
}

export async function setPermanentPassword(payload) {
  const result = await authPost('/auth/set-permanent-password', payload);
  saveSession(result);
  persistMustChangePassword(false);
  return result;
}

export async function changeAdminPassword(payload) {
  return authPost('/auth/change-password', payload);
}

export async function updateAdminProfile(payload) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required.');

  const response = await fetch(`${API_BASE_URL}/admin/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse(response);
  const session = getSession();
  if (session?.token) saveSession({ token: session.token, user: data.data });
  return data.data;
}

export async function uploadAdminProfilePhoto(file) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required.');

  const formData = new FormData();
  formData.append('photo', file);

  const response = await fetch(`${API_BASE_URL}/admin/profile/photo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await parseResponse(response);
  const session = getSession();
  if (session?.token) saveSession({ token: session.token, user: data.data });
  return data.data;
}

export async function deleteAdminProfilePhoto() {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required.');

  const response = await fetch(`${API_BASE_URL}/admin/profile/photo`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await parseResponse(response);
  const session = getSession();
  if (session?.token) saveSession({ token: session.token, user: data.data });
  return data.data;
}

export { clearSession, getSession };
