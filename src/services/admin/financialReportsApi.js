import { API_BASE_URL } from '../../config/api.js';
import { getAuthToken } from '../auth/authStorage.js';

const API_V1 = `${API_BASE_URL}/v1`;

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required.');
  return { Authorization: `Bearer ${token}` };
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data.data;
}

export async function getFinancialReports(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_V1}/admin/financial-reports?${query}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}
