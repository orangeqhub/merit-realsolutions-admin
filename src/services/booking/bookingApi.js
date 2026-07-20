import { API_BASE_URL } from '../../config/api.js';
import { getAuthToken } from '../auth/authStorage.js';

const API_V1 = `${API_BASE_URL}/v1`;

function authHeaders(json = false) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required.');
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed.');
    error.errors = data.errors || [];
    throw error;
  }
  return data.data;
}

export async function listBookings(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_V1}/admin/bookings?${query}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function getBookingDetail(id) {
  const response = await fetch(`${API_V1}/admin/bookings/${id}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function updateBookingStatus(id, status) {
  const response = await fetch(`${API_V1}/admin/bookings/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ status }),
  });
  return parseResponse(response);
}

export async function getBookingSettings() {
  const response = await fetch(`${API_V1}/admin/bookings/settings`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function updateBookingSettings(payload) {
  const response = await fetch(`${API_V1}/admin/bookings/settings`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function processBookingExpiry() {
  const response = await fetch(`${API_V1}/admin/bookings/process-expiry`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function listNotifications(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_V1}/admin/notifications?${query}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function markNotificationRead(id) {
  const response = await fetch(`${API_V1}/admin/notifications/${id}/read`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function markAllNotificationsRead() {
  const response = await fetch(`${API_V1}/admin/notifications/read-all`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return parseResponse(response);
}
