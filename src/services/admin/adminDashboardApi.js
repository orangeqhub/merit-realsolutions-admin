import { API_BASE_URL } from '../../config/api.js';
import { getAuthToken } from '../auth/authStorage.js';

const API_V1 = `${API_BASE_URL}/v1`;
const DASHBOARD = `${API_V1}/admin/dashboard`;

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required.');
  return { Authorization: `Bearer ${token}` };
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

export async function getAdminDashboard() {
  const response = await fetch(DASHBOARD, { headers: authHeaders() });
  return parseResponse(response);
}
