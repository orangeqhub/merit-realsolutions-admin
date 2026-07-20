import { getMediaBaseUrl } from '../config/api.js';

export function resolveMediaUrl(filePath) {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
    return filePath;
  }
  const path = filePath.startsWith('/') ? filePath : `/${filePath}`;
  const mediaBase = getMediaBaseUrl();
  return mediaBase ? `${mediaBase}${path}` : path;
}

export function getProfileAvatarUrl(profile, fallbackName = 'User') {
  return resolveMediaUrl(profile?.profilePhoto)
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || fallbackName)}&background=1a2744&color=fff`;
}
