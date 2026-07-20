import { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { RECORD_UNAVAILABLE_MESSAGE } from './notificationNavigation.js';

export function useNotificationHighlight(deps = []) {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  useEffect(() => {
    if (!highlightId) return undefined;

    const timer = window.setTimeout(() => {
      const selector = `[data-highlight-id="${CSS.escape(String(highlightId))}"]`;
      const el = document.querySelector(selector);
      if (!el) return;

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('notification-highlight');
      window.setTimeout(() => el.classList.remove('notification-highlight'), 4000);
    }, 300);

    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId, ...deps]);
}

export function useRecordUnavailableMessage(showMessage) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const message = location.state?.notificationRecordUnavailable;
    if (!message) return;

    showMessage?.(message || RECORD_UNAVAILABLE_MESSAGE);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
  }, [location, navigate, showMessage]);
}
