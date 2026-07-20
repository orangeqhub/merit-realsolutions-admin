const HEALTH_URL = '/api/health';
const MIN_POLL_MS = 2000;
const MAX_POLL_MS = 30000;

export async function checkBackendHealth() {
  try {
    const response = await fetch(HEALTH_URL, { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    const applicationState = String(data.applicationState || data.status || '').toUpperCase();

    if (response.ok && (applicationState === 'READY' || data.status === 'ready')) {
      return { online: true, status: 'ready', message: data.message || 'Backend is ready.' };
    }

    if (applicationState === 'FAILED' || data.status === 'failed') {
      return {
        online: false,
        status: 'failed',
        message: data.message || 'Backend startup failed.',
      };
    }

    if (response.status === 503 || applicationState === 'STARTING' || data.status === 'starting') {
      return {
        online: false,
        status: 'starting',
        message: data.message || data.stepLabel || 'Backend is starting...',
      };
    }

    return {
      online: false,
      status: data.status || 'offline',
      message: data.message || 'Backend API is unavailable.',
    };
  } catch {
    return {
      online: false,
      status: 'offline',
      message: 'Backend unavailable. Retrying...',
    };
  }
}

export function isBackendUnavailableError(error) {
  if (!error) return false;
  const message = String(error.message || error).toLowerCase();
  return (
    message.includes('failed to fetch')
    || message.includes('network')
    || message.includes('not running')
    || message.includes('starting')
    || message.includes('unavailable')
    || message.includes('retrying')
    || error.status === 503
  );
}

export async function parseApiResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (response.status === 503) {
    const error = new Error(data.message || 'Backend unavailable. Retrying...');
    error.status = 503;
    error.code = data.status || 'offline';
    throw error;
  }

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed.');
    error.status = response.status;
    error.errors = data.errors || [];
    throw error;
  }

  return data.data;
}

export { HEALTH_URL, MIN_POLL_MS, MAX_POLL_MS };
