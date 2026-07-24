import { getMediaBaseUrl } from '../config/api.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const DEFAULT_VENTURE_BANNER =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&q=80';

export function resolveMediaUrl(filePath) {
  if (!filePath || typeof filePath !== 'string') return '';
  const trimmed = filePath.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const mediaBase = getMediaBaseUrl();
  return mediaBase ? `${mediaBase}${path}` : path;
}

export function isUsableMediaUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (UUID_PATTERN.test(trimmed)) return false;
  if (trimmed.startsWith('blob:')) return false;
  return true;
}

export function getGalleryImageSrc(image) {
  const raw = typeof image === 'string' ? image : image?.src;
  if (!isUsableMediaUrl(raw)) return '';
  return resolveMediaUrl(raw);
}

export function filterDisplayableGalleryImages(images = []) {
  if (!Array.isArray(images)) return [];
  return images.filter((image) => getGalleryImageSrc(image));
}

export function getAvatarFallback(name, background = '2563eb') {
  const label = encodeURIComponent(name || 'Venture');
  return `https://ui-avatars.com/api/?name=${label}&background=${background}&color=ffffff&size=128&bold=true`;
}

export function getVentureBannerUrl(venture) {
  const candidates = [venture?.banner, venture?.thumbnail];
  for (const candidate of candidates) {
    if (!isUsableMediaUrl(candidate)) continue;
    return resolveMediaUrl(candidate);
  }
  return '';
}

export function getVentureLogoUrl(venture) {
  const candidates = [venture?.logo, venture?.thumbnail];
  for (const candidate of candidates) {
    if (!isUsableMediaUrl(candidate)) continue;
    return resolveMediaUrl(candidate);
  }
  return getAvatarFallback(venture?.name);
}

export function getVentureCardImageUrl(venture) {
  const candidates = [venture?.thumbnail, venture?.banner];
  for (const candidate of candidates) {
    if (!isUsableMediaUrl(candidate)) continue;
    return resolveMediaUrl(candidate);
  }
  return '';
}
