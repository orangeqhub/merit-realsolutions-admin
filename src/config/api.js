export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/** Origin for uploaded media when API is on a different host than the Vite dev server. */
export function getMediaBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && /^https?:\/\//i.test(apiUrl)) {
    return apiUrl.replace(/\/api(?:\/v\d+)?\/?$/i, '');
  }
  return '';
}
