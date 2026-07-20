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

function buildGalleryFormData(payload = {}, files = {}) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (['coverImage', 'existingImages', 'existingVideos'].includes(key)) return;
    if (value === undefined || value === null) return;
    if (Array.isArray(value) || typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, String(value));
  });

  if (typeof payload.coverImage === 'string' && payload.coverImage.trim()) {
    formData.append('coverImage', payload.coverImage);
  }

  if (Array.isArray(payload.existingImages)) {
    formData.append('existingImages', JSON.stringify(payload.existingImages));
  }
  if (Array.isArray(payload.existingVideos)) {
    formData.append('existingVideos', JSON.stringify(payload.existingVideos));
  }

  if (files.coverImage instanceof File) formData.append('coverImage', files.coverImage);
  if (Array.isArray(files.galleryImages)) {
    files.galleryImages.forEach((file) => {
      if (file instanceof File) formData.append('galleryImages', file);
    });
  }
  if (Array.isArray(files.galleryVideos)) {
    files.galleryVideos.forEach((file) => {
      if (file instanceof File) formData.append('galleryVideos', file);
    });
  }

  return formData;
}

export function extractGalleryFiles(form = {}) {
  return {
    coverImage: form.coverImage instanceof File ? form.coverImage : null,
    galleryImages: Array.isArray(form.images)
      ? form.images.filter((item) => item instanceof File)
      : [],
    galleryVideos: Array.isArray(form.videos)
      ? form.videos.filter((item) => item instanceof File)
      : [],
  };
}

export async function listGalleries(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${API_V1}/admin/gallery${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function getGalleryById(id) {
  const response = await fetch(`${API_V1}/admin/gallery/${id}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function createGallery(payload, files = {}) {
  const response = await fetch(`${API_V1}/admin/gallery`, {
    method: 'POST',
    headers: authHeaders(),
    body: buildGalleryFormData(payload, files),
  });
  return parseResponse(response);
}

export async function updateGallery(id, payload, files = {}) {
  const hasFiles =
    files.coverImage instanceof File
    || (files.galleryImages || []).some((f) => f instanceof File)
    || (files.galleryVideos || []).some((f) => f instanceof File);

  const response = await fetch(`${API_V1}/admin/gallery/${id}`, {
    method: 'PUT',
    headers: hasFiles ? authHeaders() : authHeaders(true),
    body: hasFiles ? buildGalleryFormData(payload, files) : JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function deleteGallery(id) {
  const response = await fetch(`${API_V1}/admin/gallery/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function listGalleryCategories() {
  const response = await fetch(`${API_V1}/admin/gallery/categories`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function createGalleryCategory(name) {
  const response = await fetch(`${API_V1}/admin/gallery/categories`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ name }),
  });
  return parseResponse(response);
}
