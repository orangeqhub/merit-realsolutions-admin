import { getAuthToken } from '../../services/auth/authStorage.js';
import { persistMediaValue } from './ventureCatalogSync.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function authHeaders(json = true) {
  const token = getAuthToken();
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function canPersistLayoutToBackend() {
  return Boolean(getAuthToken());
}

function mapStatusToLifecycle(status = 'Draft') {
  const key = String(status || '').toLowerCase();
  if (key === 'active' || key === 'approved' || key === 'published') return 'ACTIVE';
  if (key === 'archived') return 'ARCHIVED';
  return 'DRAFT';
}

function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:');
}

async function dataUrlToFile(dataUrl, filename = 'layout-media.png') {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const type = blob.type || 'image/png';
  return new File([blob], filename, { type });
}

export async function uploadLayoutMediaValue(value) {
  if (!value) return null;
  if (isDataUrl(value)) {
    const file = await dataUrlToFile(value);
    return persistMediaValue(file);
  }
  return persistMediaValue(value);
}

export async function prepareLayoutMediaForBackend(layout = {}) {
  const [layoutPlan, masterPlan, banner] = await Promise.all([
    uploadLayoutMediaValue(layout.layoutPlan),
    uploadLayoutMediaValue(layout.masterPlan),
    uploadLayoutMediaValue(layout.banner),
  ]);

  return {
    layoutPlan: layoutPlan || (isDataUrl(layout.layoutPlan) ? '' : layout.layoutPlan) || '',
    masterPlan: masterPlan || (isDataUrl(layout.masterPlan) ? '' : layout.masterPlan) || '',
    banner: banner || (isDataUrl(layout.banner) ? '' : layout.banner) || '',
  };
}

function buildProfilePayload(layout, venture) {
  const media = {
    banner: layout.banner || layout.layoutPlan || null,
    thumbnail: layout.banner || layout.layoutPlan || null,
    layoutPlan: layout.layoutPlan || null,
    masterPlan: layout.masterPlan || null,
    gallery: layout.banner || layout.layoutPlan ? [layout.banner || layout.layoutPlan] : [],
  };

  return {
    layoutId: layout.id,
    name: layout.name,
    layoutName: layout.name,
    code: layout.code,
    layoutCode: layout.code,
    ventureId: layout.ventureId || venture?.id,
    ventureName: venture?.name,
    layoutType: layout.layoutType || 'CUSTOM',
    description: layout.layoutNotes || layout.notes || '',
    lifecycleStatus: mapStatusToLifecycle(layout.status),
    layoutPlan: media.layoutPlan,
    masterPlan: media.masterPlan,
    banner: media.banner,
    thumbnail: media.thumbnail,
    gallery: media.gallery,
    source: 'admin',
    surveyNumber: layout.surveyNumber || '',
    totalArea: layout.totalArea ?? null,
    plotCount: layout.plotCount ?? null,
    status: layout.status || 'Draft',
    progress: layout.progress ?? null,
    hasGeneratedLayout: Boolean(layout.hasGeneratedLayout),
    documents: Array.isArray(layout.documents) ? layout.documents : [],
    configuration: {
      source: 'admin',
      admin: {
        surveyNumber: layout.surveyNumber || '',
        totalArea: layout.totalArea ?? null,
        plotCount: layout.plotCount ?? null,
        status: layout.status || 'Draft',
        progress: layout.progress ?? null,
        hasGeneratedLayout: Boolean(layout.hasGeneratedLayout),
        documents: Array.isArray(layout.documents) ? layout.documents : [],
        createdDate: layout.createdDate || null,
        lastUpdated: layout.lastUpdated || null,
      },
    },
  };
}

export async function saveLayoutProfileToBackend(layout, venture) {
  const response = await fetch(
    `${API_BASE}/v1/admin/plot-inventory/layouts/${layout.id}/profile`,
    {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(buildProfilePayload(layout, venture)),
    }
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const error = new Error(body.message || `Layout save failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return body.data || null;
}

export async function fetchLayoutProfileFromBackend(layoutId) {
  const response = await fetch(
    `${API_BASE}/v1/admin/plot-inventory/layouts/${layoutId}/profile`,
    { headers: authHeaders(false) }
  );

  if (response.status === 404) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const error = new Error(body.message || `Layout load failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return body.data || null;
}

export function mapBackendProfileToLayoutRecord(dto = {}, existing = null) {
  if (!dto) return existing;
  const admin = dto.configuration?.admin || {};
  const media = dto.configuration?.media || {};

  return {
    ...(existing || {}),
    id: dto.layoutRef || dto.layoutId || existing?.id,
    name: dto.layoutName || dto.name || existing?.name || '',
    code: dto.layoutCode || admin.code || existing?.code || '',
    ventureId: dto.ventureRef || dto.ventureId || existing?.ventureId,
    layoutType: dto.layoutType || existing?.layoutType || '',
    status: admin.status || dto.lifecycleStatus || existing?.status || 'Draft',
    surveyNumber: admin.surveyNumber || existing?.surveyNumber || '',
    totalArea: admin.totalArea ?? existing?.totalArea ?? 0,
    plotCount: admin.plotCount ?? existing?.plotCount ?? 0,
    layoutPlan: media.layoutPlan || dto.masterPlanImage || existing?.layoutPlan || '',
    masterPlan: media.masterPlan || existing?.masterPlan || '',
    banner: media.banner || media.thumbnail || existing?.banner || '',
    layoutNotes: dto.description || admin.layoutNotes || existing?.layoutNotes || '',
    progress: admin.progress ?? existing?.progress,
    hasGeneratedLayout: admin.hasGeneratedLayout ?? existing?.hasGeneratedLayout ?? false,
    documents: admin.documents || existing?.documents || [],
    persistedToBackend: true,
    lastUpdated: admin.lastUpdated || existing?.lastUpdated,
    createdDate: admin.createdDate || existing?.createdDate,
  };
}

const DATA_URL_PREFIX = 'data:';

export function slimLayoutForLocalCache(layout = {}) {
  const next = { ...layout };

  ['layoutPlan', 'masterPlan', 'banner'].forEach((key) => {
    const value = next[key];
    if (typeof value === 'string' && value.startsWith(DATA_URL_PREFIX)) {
      next[key] = next.persistedToBackend ? '' : value;
    }
  });

  if (next.persistedToBackend && next.generationSnapshot?.source === 'api') {
    next.generationSnapshot = {
      source: 'api',
      savedAt: next.generationSnapshot.savedAt,
      summary: next.generationSnapshot.summary,
    };
  } else if (next.persistedToBackend && next.generationSnapshot) {
    const { savedAt, summary, source } = next.generationSnapshot;
    next.generationSnapshot = {
      source: source || 'api',
      savedAt,
      summary,
    };
  }

  if (Array.isArray(next.activities) && next.activities.length > 8) {
    next.activities = next.activities.slice(0, 8);
  }

  return next;
}
