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
    const error = new Error(data.message || 'Request failed.');
    error.errors = data.errors || [];
    throw error;
  }
  return data.data;
}

export async function listPropertyTypes() {
  const response = await fetch(`${API_V1}/admin/property-catalog/types`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function getPropertyCatalog(typeId) {
  const response = await fetch(`${API_V1}/admin/property-catalog/types/${typeId}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function listPropertySpecifications(typeId) {
  const response = await fetch(`${API_V1}/admin/property-catalog/types/${typeId}/specifications`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function listPropertyAmenities(typeId) {
  const response = await fetch(`${API_V1}/admin/property-catalog/types/${typeId}/amenities`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}
