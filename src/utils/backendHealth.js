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

