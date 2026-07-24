import { API_BASE_URL } from '../../config/api.js';
import { getAuthToken } from '../auth/authStorage.js';

const API_V1 = `${API_BASE_URL}/v1`;

function authHeaders(json = false) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required.');
  const headers = { Authorization: `Bearer ${token}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
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

function buildQuery(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
  return new URLSearchParams(clean).toString();
}

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  AREA_BUSINESS_PARTNER: 'AREA_BUSINESS_PARTNER',
  AREA_BUSINESS_COORDINATOR: 'AREA_BUSINESS_COORDINATOR',
  AREA_BUSINESS_EXECUTIVE: 'AREA_BUSINESS_EXECUTIVE',
  CHANNEL_AGENT: 'CHANNEL_AGENT',
  CUSTOMER: 'CUSTOMER',
};

export const ROLE_LABELS = {
  ADMIN: 'Admin',
  AREA_BUSINESS_PARTNER: 'Area Business Partner',
  AREA_BUSINESS_COORDINATOR: 'Area Business Coordinator',
  AREA_BUSINESS_EXECUTIVE: 'Area Business Executive',
  CHANNEL_AGENT: 'Channel Agent',
  CUSTOMER: 'Customer',
};

export async function listUsers(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${API_V1}/admin/users${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function getUserById(id) {
  const response = await fetch(`${API_V1}/admin/users/${id}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function createUser(payload) {
  const response = await fetch(`${API_V1}/admin/users`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function updateUser(id, payload) {
  const response = await fetch(`${API_V1}/admin/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function setUserStatus(id, status) {
  const response = await fetch(`${API_V1}/admin/users/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ status }),
  });
  return parseResponse(response);
}

export async function resetUserPassword(id) {
  const response = await fetch(`${API_V1}/admin/users/${id}/reset-password`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ forceChange: true }),
  });
  return parseResponse(response);
}

export async function deleteUser(id) {
  const response = await fetch(`${API_V1}/admin/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function listSalesUsers(role) {
  const query = buildQuery(role ? { role } : {});
  const response = await fetch(`${API_V1}/admin/users/sales-options${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function listPendingAgents() {
  const response = await fetch(`${API_V1}/admin/agents/pending`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function approveAgent(agentId) {
  const response = await fetch(`${API_V1}/admin/agents/${agentId}/approve`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({}),
  });
  return parseResponse(response);
}

export function formatSalesUserOption(user) {
  const code = user.employeeCode ? ` (${user.employeeCode})` : '';
  const role = ROLE_LABELS[user.role] || user.role;
  return {
    value: String(user.id),
    label: `${user.name}${code} — ${role}`,
  };
}
