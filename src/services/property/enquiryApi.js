import { getAuthToken } from '../auth/authStorage.js';
import { API_BASE_URL } from '../../config/api.js';

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
    throw new Error(data.message || 'Request failed.');
  }
  return data.data;
}

export async function submitPropertyEnquiry(propertyId, payload) {
  return parseResponse(await fetch(`${API_V1}/admin/property-enquiries`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({
      ...payload,
      propertyId: Number(propertyId),
    }),
  }));
}

export function getAdminEnquiryCustomerPrefill(user) {
  if (!user) return null;
  return {
    name: user.name || '',
    mobile: user.mobile || '',
    alternateMobile: user.alternateMobile || '',
    email: user.email || '',
    city: user.city || '',
    state: user.state || '',
  };
}
