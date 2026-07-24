import { getAuthToken } from '../../services/auth/authStorage.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function authHeaders(json = true) {
  const token = getAuthToken();
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function uploadVentureMedia(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE}/v1/admin/ventures/media`, {
    method: 'POST',
    headers: authHeaders(false),
    body: formData,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.data?.url) {
    throw new Error(body.message || `Media upload failed (${response.status})`);
  }
  return body.data.url;
}

async function persistMediaValue(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    if (value.startsWith('blob:')) return null;
    return value;
  }
  if (typeof File !== 'undefined' && value instanceof File) {
    return uploadVentureMedia(value);
  }
  return null;
}

async function persistGallery(gallery = []) {
  if (!Array.isArray(gallery)) return [];
  const urls = [];
  for (const item of gallery) {
    const url = await persistMediaValue(item);
    if (url) urls.push(url);
  }
  return urls;
}

/** Convert File/blob fields to durable `/uploads/ventures/...` URLs before catalog sync. */
export async function prepareVentureForCatalogSync(venture) {
  if (!venture?.id || !venture?.name) return null;

  const [
    banner,
    thumbnail,
    logo,
    layoutPlan,
    brochure,
    masterPlan,
    gallery,
  ] = await Promise.all([
    persistMediaValue(venture.banner),
    persistMediaValue(venture.thumbnail),
    persistMediaValue(venture.logo),
    persistMediaValue(venture.layoutPlan),
    persistMediaValue(venture.brochure),
    persistMediaValue(venture.masterPlan),
    persistGallery(venture.gallery),
  ]);

  const videos = await persistGallery(venture.videos || []);
  const images360 = await persistGallery(venture.images360 || venture.media360 || []);

  const documents = [];
  if (Array.isArray(venture.documents)) {
    for (const doc of venture.documents) {
      if (!doc) continue;
      if (typeof doc === 'string') {
        const url = await persistMediaValue(doc);
        if (url) documents.push({ name: 'Document', url });
        continue;
      }
      const url = await persistMediaValue(doc.url || doc.src || doc.file || doc);
      if (!url) continue;
      documents.push({
        id: doc.id,
        name: doc.name || doc.title || 'Document',
        url,
        type: doc.type || null,
        size: doc.size || null,
        date: doc.date || null,
      });
    }
  }

  return {
    ...venture,
    id: venture.id,
    refId: venture.id,
    village: venture.village || venture.locality,
    locality: venture.village || venture.locality,
    banner,
    thumbnail: thumbnail || banner,
    logo,
    gallery,
    layoutPlan,
    brochure,
    masterPlan,
    videos,
    images360,
    documents,
    approvalType: venture.approvalType || venture.approval,
    reraNumber: venture.reraNumber || venture.rera,
    dtcpNumber: venture.dtcpNumber || venture.dtcp,
  };
}

/** Best-effort sync to PostgreSQL catalog used by the public website. */
export async function syncVentureToBackend(venture) {
  try {
    const payload = await prepareVentureForCatalogSync(venture);
    if (!payload) return { ok: false, skipped: true };

    const response = await fetch(`${API_BASE}/v1/admin/ventures`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      console.warn('[ventureCatalogSync] upsert failed:', body.message || response.status);
      return { ok: false, status: response.status };
    }
    return {
      ok: true,
      media: {
        banner: payload.banner,
        thumbnail: payload.thumbnail,
        logo: payload.logo,
        gallery: payload.gallery,
        layoutPlan: payload.layoutPlan,
        brochure: payload.brochure,
        masterPlan: payload.masterPlan,
        videos: payload.videos,
        images360: payload.images360,
        documents: payload.documents,
      },
    };
  } catch (error) {
    console.warn('[ventureCatalogSync] upsert error:', error.message);
    return { ok: false, error };
  }
}

export async function deactivateVentureOnBackend(ventureId) {
  if (!ventureId) return { ok: false, skipped: true };
  try {
    const response = await fetch(`${API_BASE}/v1/admin/ventures/${ventureId}`, {
      method: 'DELETE',
      headers: authHeaders(true),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      console.warn('[ventureCatalogSync] delete failed:', body.message || response.status);
      return { ok: false, status: response.status };
    }
    return { ok: true };
  } catch (error) {
    console.warn('[ventureCatalogSync] delete error:', error.message);
    return { ok: false, error };
  }
}
