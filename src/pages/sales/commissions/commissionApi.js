import { API_BASE_URL } from '../../../config/api.js';
import { getAuthToken } from '../../../services/auth/authStorage.js';

const endpoint = `${API_BASE_URL}/v1/admin/sales/commissions`;
const headers = (json = false) => ({ Authorization: `Bearer ${getAuthToken()}`, ...(json ? { 'Content-Type': 'application/json' } : {}) });

async function request(path = '', options = {}) {
  const response = await fetch(`${endpoint}${path}`, { ...options, headers: headers(Boolean(options.body)) });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Unable to process commission rule.');
  return payload.data;
}

const query = (params = {}) => {
  const search = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null));
  return search.toString() ? `?${search}` : '';
};

export const getCommissionRules = (params) => request(query(params));
export const getCommissionStats = () => request('/stats');
export const createCommissionRule = (data) => request('', { method: 'POST', body: JSON.stringify(data) });
export const updateCommissionRule = (id, data) => request(`/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const updateCommissionRuleStatus = (id, status) => request(`/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const deleteCommissionRule = (id) => request(`/${id}`, { method: 'DELETE' });
