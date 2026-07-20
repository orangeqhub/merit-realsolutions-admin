import { API_BASE_URL } from '../../config/api.js';
import { getAuthToken } from '../auth/authStorage.js';

const API_V1 = `${API_BASE_URL}/v1`;

function authHeaders() {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required.');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
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

function appendFormValue(formData, key, value) {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    formData.append(key, JSON.stringify(value));
    return;
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    formData.append(key, String(value));
    return;
  }

  formData.append(key, value);
}

function appendExistingMediaFields(formData, payload = {}) {
  if (typeof payload.thumbnail === 'string' && payload.thumbnail.trim()) {
    formData.append('thumbnail', payload.thumbnail);
  }
  if (typeof payload.bannerImage === 'string' && payload.bannerImage.trim()) {
    formData.append('bannerImage', payload.bannerImage);
  }
  const gallery = payload.galleryImages;
  if (Array.isArray(gallery)) {
    gallery.forEach((item) => {
      if (typeof item === 'string' && item.trim()) {
        formData.append('galleryImages', item);
      }
    });
  } else if (typeof gallery === 'string' && gallery.trim()) {
    formData.append('galleryImages', gallery);
  }
  if (Array.isArray(payload.documents)) {
    const existingDocs = payload.documents.filter((doc) => doc?.url && !(doc.file instanceof File));
    if (existingDocs.length) {
      formData.append('documents', JSON.stringify(existingDocs));
    }
  }
}

function buildPropertyFormData(payload = {}, files = {}) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (['thumbnail', 'bannerImage', 'galleryImages', 'documents'].includes(key)) {
      return;
    }
    if (key === 'specificationValues' || key === 'amenityIds') {
      formData.append(key, JSON.stringify(value));
      return;
    }
    appendFormValue(formData, key, value);
  });

  appendExistingMediaFields(formData, payload);

  if (files.thumbnail instanceof File) {
    formData.append('thumbnail', files.thumbnail);
  }
  if (files.bannerImage instanceof File) {
    formData.append('bannerImage', files.bannerImage);
  }
  if (Array.isArray(files.galleryImages)) {
    files.galleryImages.forEach((file) => {
      if (file instanceof File) {
        formData.append('galleryImages', file);
      }
    });
  }
  if (Array.isArray(files.propertyDocuments)) {
    files.propertyDocuments.forEach((file) => {
      if (file instanceof File) {
        formData.append('propertyDocuments', file);
      }
    });
  }

  return formData;
}

export function extractPropertyFiles(form = {}) {
  return {
    thumbnail: form.thumbnail instanceof File ? form.thumbnail : null,
    bannerImage: form.banner instanceof File ? form.banner : null,
    galleryImages: Array.isArray(form.gallery)
      ? form.gallery.filter((item) => item instanceof File)
      : [],
    propertyDocuments: Array.isArray(form.documents)
      ? form.documents.filter((item) => item instanceof File)
      : [],
  };
}

export async function listProperties(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_V1}/admin/properties?${query}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function getPropertyById(id) {
  const response = await fetch(`${API_V1}/admin/properties/${id}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function createProperty(payload, files = {}) {
  const response = await fetch(`${API_V1}/admin/properties`, {
    method: 'POST',
    headers: authHeaders(),
    body: buildPropertyFormData(payload, files),
  });
  return parseResponse(response);
}

export async function updateProperty(id, payload, files = {}) {
  const hasFiles =
    files.thumbnail instanceof File ||
    files.bannerImage instanceof File ||
    (Array.isArray(files.galleryImages) && files.galleryImages.some((file) => file instanceof File)) ||
    (Array.isArray(files.propertyDocuments) && files.propertyDocuments.some((file) => file instanceof File));

  const response = await fetch(`${API_V1}/admin/properties/${id}`, {
    method: 'PUT',
    headers: hasFiles
      ? authHeaders()
      : {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
    body: hasFiles ? buildPropertyFormData(payload, files) : JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function deleteProperty(id) {
  const response = await fetch(`${API_V1}/admin/properties/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function setPropertyAssignment(id, payload) {
  const response = await fetch(`${API_V1}/admin/properties/${id}/assignment`, {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function removePropertyAssignment(id) {
  const response = await fetch(`${API_V1}/admin/properties/${id}/assignment`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function publishProperty(id) {
  return updateProperty(id, { isPublished: true });
}

export async function unpublishProperty(id) {
  return updateProperty(id, { isPublished: false });
}

function buildQuery(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
  return new URLSearchParams(clean).toString();
}

export async function listPropertyEnquiries(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${API_V1}/admin/property-enquiries${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function getPropertyEnquiry(id) {
  const response = await fetch(`${API_V1}/admin/property-enquiries/${id}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function updatePropertyEnquiry(id, payload) {
  const response = await fetch(`${API_V1}/admin/property-enquiries/${id}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function listPropertyBookings(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${API_V1}/admin/property-bookings${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function updatePropertyBooking(id, payload) {
  const response = await fetch(`${API_V1}/admin/property-bookings/${id}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}
