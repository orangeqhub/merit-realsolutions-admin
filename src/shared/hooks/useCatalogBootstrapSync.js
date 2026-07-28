import { useEffect, useRef } from 'react';
import { dataStore } from '../repositories/dataStore.js';
import { syncInventoryCatalogToBackend } from '../services/ventureCatalogSync.js';
import { getAuthToken } from '../../services/auth/authStorage.js';

const BOOT_SYNC_KEY = 'mrs_erp_catalog_boot_sync_v3';

/**
 * One-time per session: reconcile + push admin ventures/layouts to the website catalog.
 * Runs even when admin has zero ventures so stale website rows are removed.
 */
export function useCatalogBootstrapSync() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (!getAuthToken()) return;
    if (typeof window !== 'undefined' && window.sessionStorage?.getItem(BOOT_SYNC_KEY)) return;

    started.current = true;

    const ventures = dataStore.getList('ventures');
    const layouts = dataStore.getList('layouts');

    void syncInventoryCatalogToBackend({ ventures, layouts }).finally(() => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(BOOT_SYNC_KEY, '1');
      }
    });
  }, []);
}
