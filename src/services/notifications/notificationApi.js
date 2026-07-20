import { API_BASE_URL } from '../../config/api.js';
import { getAuthToken } from '../auth/authStorage.js';
import { parseApiResponse } from '../../utils/backendHealth.js';

const NOTIFICATIONS = `${API_BASE_URL}/v1/notifications`;

function authHeaders(json = false) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required.');
  const headers = { Authorization: `Bearer ${token}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

async function parseResponse(response) {
  return parseApiResponse(response);
}

function buildQuery(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
  return new URLSearchParams(clean).toString();
}

export async function fetchNotificationCount() {
  const data = await parseResponse(await fetch(`${NOTIFICATIONS}/count`, { headers: authHeaders() }));
  return data?.unreadCount ?? 0;
}

export async function listNotifications(params = {}) {
  const query = buildQuery(params);
  return parseResponse(await fetch(`${NOTIFICATIONS}${query ? `?${query}` : ''}`, { headers: authHeaders() }));
}

export async function fetchActiveAlert() {
  return fetchActionCenter();
}

export async function fetchActionCenter() {
  return parseResponse(await fetch(`${NOTIFICATIONS}/action-center`, { headers: authHeaders() }));
}

export async function fetchActionHistory(params = {}) {
  const query = buildQuery(params);
  return parseResponse(await fetch(`${NOTIFICATIONS}/action-center/history${query ? `?${query}` : ''}`, { headers: authHeaders() }));
}

export async function snoozeActiveAlert(payload) {
  return snoozeActionCenterItem(payload);
}

export async function snoozeActionCenterItem(payload) {
  return parseResponse(await fetch(`${NOTIFICATIONS}/action-center/snooze`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  }));
}

export async function dismissActiveAlert(payload) {
  return dismissActionCenterItem(payload);
}

export async function dismissActionCenterItem(payload) {
  return parseResponse(await fetch(`${NOTIFICATIONS}/action-center/dismiss`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  }));
}

export async function openActiveAlert(payload) {
  return openActionCenterItem(payload);
}

export async function openActionCenterItem(payload) {
  return parseResponse(await fetch(`${NOTIFICATIONS}/action-center/open`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  }));
}

export async function completeActionCenterItem(payload) {
  return parseResponse(await fetch(`${NOTIFICATIONS}/action-center/complete`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  }));
}

export async function dismissNotificationBanner(id) {
  return parseResponse(await fetch(`${NOTIFICATIONS}/${id}/dismiss-banner`, {
    method: 'PATCH',
    headers: authHeaders(),
  }));
}

export async function fetchMeetingPopups() {
  const data = await parseResponse(await fetch(`${NOTIFICATIONS}/meeting-popups`, { headers: authHeaders() }));
  return data?.items || [];
}

export async function fetchNotificationBanners() {
  const data = await parseResponse(await fetch(`${NOTIFICATIONS}/banners`, { headers: authHeaders() }));
  return data?.items || [];
}

export async function markNotificationRead(id) {
  return parseResponse(await fetch(`${NOTIFICATIONS}/${id}/read`, {
    method: 'PATCH',
    headers: authHeaders(),
  }));
}

export async function markAllNotificationsRead() {
  return parseResponse(await fetch(`${NOTIFICATIONS}/read-all`, {
    method: 'PATCH',
    headers: authHeaders(),
  }));
}

export async function deleteNotification(id) {
  return parseResponse(await fetch(`${NOTIFICATIONS}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }));
}

export async function fetchNotificationById(id) {
  return parseResponse(await fetch(`${NOTIFICATIONS}/${id}`, { headers: authHeaders() }));
}
