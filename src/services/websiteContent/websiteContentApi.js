import { API_BASE_URL } from '../../config/api.js';
import { getAuthToken } from '../auth/authStorage.js';

const API = `${API_BASE_URL}/v1/admin/website-content`;

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

function buildAboutFormData(payload = {}, file = null) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'companyImage') return;
    if (value !== undefined && value !== null) formData.append(key, String(value));
  });
  if (typeof payload.companyImage === 'string' && payload.companyImage.trim()) {
    formData.append('companyImage', payload.companyImage);
  }
  if (file instanceof File) formData.append('companyImage', file);
  return formData;
}

function buildTestimonialFormData(payload = {}, file = null) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'customerImage') return;
    if (value !== undefined && value !== null) formData.append(key, String(value));
  });
  if (typeof payload.customerImage === 'string' && payload.customerImage.trim()) {
    formData.append('customerImage', payload.customerImage);
  }
  if (file instanceof File) formData.append('customerImage', file);
  return formData;
}

export async function fetchAboutContent() {
  return parseResponse(await fetch(`${API}/about`, { headers: authHeaders() }));
}

export async function updateAboutContent(payload, file = null) {
  return parseResponse(await fetch(`${API}/about`, {
    method: 'PUT',
    headers: authHeaders(),
    body: buildAboutFormData(payload, file),
  }));
}

export async function listHighlights(params = {}) {
  const query = buildQuery(params);
  return parseResponse(await fetch(`${API}/highlights${query ? `?${query}` : ''}`, { headers: authHeaders() }));
}

export async function createHighlight(payload) {
  return parseResponse(await fetch(`${API}/highlights`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  }));
}

export async function updateHighlight(id, payload) {
  return parseResponse(await fetch(`${API}/highlights/${id}`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  }));
}

export async function deleteHighlight(id) {
  return parseResponse(await fetch(`${API}/highlights/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }));
}

export async function setHighlightStatus(id, status) {
  return parseResponse(await fetch(`${API}/highlights/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ status }),
  }));
}

export async function reorderHighlights(items) {
  return parseResponse(await fetch(`${API}/highlights/reorder`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify({ items }),
  }));
}

export async function listStatistics(params = {}) {
  const query = buildQuery(params);
  return parseResponse(await fetch(`${API}/statistics${query ? `?${query}` : ''}`, { headers: authHeaders() }));
}

export async function getStatistic(id) {
  return parseResponse(await fetch(`${API}/statistics/${id}`, { headers: authHeaders() }));
}

export async function createStatistic(payload) {
  return parseResponse(await fetch(`${API}/statistics`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  }));
}

export async function updateStatistic(id, payload) {
  return parseResponse(await fetch(`${API}/statistics/${id}`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  }));
}

export async function deleteStatistic(id) {
  return parseResponse(await fetch(`${API}/statistics/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }));
}

export async function setStatisticStatus(id, status) {
  return parseResponse(await fetch(`${API}/statistics/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ status }),
  }));
}

export async function listTestimonials(params = {}) {
  const query = buildQuery(params);
  return parseResponse(await fetch(`${API}/testimonials${query ? `?${query}` : ''}`, { headers: authHeaders() }));
}

export async function getTestimonial(id) {
  return parseResponse(await fetch(`${API}/testimonials/${id}`, { headers: authHeaders() }));
}

export async function createTestimonial(payload, file = null) {
  return parseResponse(await fetch(`${API}/testimonials`, {
    method: 'POST',
    headers: authHeaders(),
    body: buildTestimonialFormData(payload, file),
  }));
}

export async function updateTestimonial(id, payload, file = null) {
  const hasFile = file instanceof File;
  return parseResponse(await fetch(`${API}/testimonials/${id}`, {
    method: 'PUT',
    headers: hasFile ? authHeaders() : authHeaders(true),
    body: hasFile ? buildTestimonialFormData(payload, file) : JSON.stringify(payload),
  }));
}

export async function deleteTestimonial(id) {
  return parseResponse(await fetch(`${API}/testimonials/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }));
}

export async function setTestimonialStatus(id, status) {
  return parseResponse(await fetch(`${API}/testimonials/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ status }),
  }));
}
