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
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (value === 'undefined' || value === 'null') return false;
      return true;
    })
  );
  return new URLSearchParams(clean).toString();
}

function buildBuilderFormData(payload = {}, files = {}) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (['logo', 'coverImage'].includes(key)) return;
    if (value === undefined || value === null) return;
    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, String(value));
  });

  if (typeof payload.logo === 'string' && payload.logo.trim()) {
    formData.append('logo', payload.logo);
  }
  if (typeof payload.coverImage === 'string' && payload.coverImage.trim()) {
    formData.append('coverImage', payload.coverImage);
  }

  if (files.logo instanceof File) formData.append('logo', files.logo);
  if (files.coverImage instanceof File) formData.append('coverImage', files.coverImage);

  return formData;
}

export function extractBuilderFiles(form = {}) {
  return {
    logo: form.logo instanceof File ? form.logo : null,
    coverImage: form.coverImage instanceof File ? form.coverImage : null,
  };
}

export async function listBuilders(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${API_V1}/admin/builders${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function getBuilderById(id) {
  const response = await fetch(`${API_V1}/admin/builders/${id}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function createBuilder(payload, files = {}) {
  const response = await fetch(`${API_V1}/admin/builders`, {
    method: 'POST',
    headers: authHeaders(),
    body: buildBuilderFormData(payload, files),
  });
  return parseResponse(response);
}

export async function updateBuilder(id, payload, files = {}) {
  const hasFiles = files.logo instanceof File || files.coverImage instanceof File;
  const response = await fetch(`${API_V1}/admin/builders/${id}`, {
    method: 'PUT',
    headers: hasFiles ? authHeaders() : authHeaders(true),
    body: hasFiles ? buildBuilderFormData(payload, files) : JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function deleteBuilder(id) {
  const response = await fetch(`${API_V1}/admin/builders/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function setBuilderStatus(id, status) {
  const response = await fetch(`${API_V1}/admin/builders/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ status }),
  });
  return parseResponse(response);
}

export async function listBuilderOptions() {
  const response = await fetch(`${API_V1}/admin/builders/options`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}
