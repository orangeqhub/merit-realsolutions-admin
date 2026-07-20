import { useEffect, useState } from 'react';
import { checkBackendHealth, MIN_POLL_MS, MAX_POLL_MS } from '../../utils/backendHealth.js';
import './BackendStatusBanner.css';

function nextDelay(current, online) {
  if (online) return MIN_POLL_MS;
  return Math.min(Math.round(current * 1.5), MAX_POLL_MS);
}

export default function BackendStatusBanner() {
  const [state, setState] = useState({ online: true, status: 'ready', message: '' });

  useEffect(() => {
    let active = true;
    let delay = MIN_POLL_MS;
    let timer;

    const poll = async () => {
      const result = await checkBackendHealth();
      if (!active) return;
      setState(result);
      delay = nextDelay(delay, result.online);
      timer = setTimeout(poll, delay);
    };

    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  if (state.online) return null;

  const title = state.status === 'starting'
    ? 'Backend starting'
    : state.status === 'failed'
      ? 'Backend failed to start'
      : 'Backend unavailable';

  return (
    <div className={`backend-status-banner backend-status-banner--${state.status}`} role="status">
      <strong>{title}</strong>
      <span>{state.message || 'Retrying...'}</span>
      {state.status === 'offline' ? (
        <code>cd meritrealsolutions-backend && npm run dev</code>
      ) : null}
    </div>
  );
}
