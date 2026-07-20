import { useCallback, useEffect, useMemo, useState } from 'react';
import * as propertyApi from '../../services/property/propertyApi.js';
import { mapAdminFormToApi, mapApiPropertyToAdmin } from '../../services/property/propertyMapper.js';
import { getPropertyDashboardStatistics } from '../services/statisticsService.js';

export function useProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const result = await propertyApi.listProperties({
        pageSize: 100,
        ...params,
      });
      setProperties((result.items || []).map(mapApiPropertyToAdmin));
      setError(null);
    } catch (err) {
      setError(err.message);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      properties,
      loading,
      error,
      refresh,
      getProperty: (id) => properties.find((p) => String(p.id) === String(id)),
      getPropertyById: async (id) => {
        const data = await propertyApi.getPropertyById(id);
        const mapped = mapApiPropertyToAdmin(data);
        setProperties((prev) => {
          const index = prev.findIndex((p) => String(p.id) === String(id));
          if (index === -1) return [...prev, mapped];
          const next = [...prev];
          next[index] = mapped;
          return next;
        });
        return mapped;
      },
      statistics: getPropertyDashboardStatistics(properties),
      addProperty: async (data, options = {}) => {
        const files = propertyApi.extractPropertyFiles(data);
        const payload = mapAdminFormToApi(data, options);
        const created = await propertyApi.createProperty(payload, files);
        await refresh();
        return mapApiPropertyToAdmin(created);
      },
      updateProperty: async (id, data, options = {}) => {
        const files = propertyApi.extractPropertyFiles(data);
        const payload = mapAdminFormToApi(data, options);
        const updated = await propertyApi.updateProperty(id, payload, files);
        await refresh();
        return mapApiPropertyToAdmin(updated);
      },
      removeProperty: async (id) => {
        await propertyApi.deleteProperty(id);
        await refresh();
        return { id };
      },
      assignProperty: async (id, data) => {
        const updated = await propertyApi.setPropertyAssignment(id, data);
        await refresh();
        return mapApiPropertyToAdmin(updated);
      },
      unassignProperty: async (id) => {
        const updated = await propertyApi.removePropertyAssignment(id);
        await refresh();
        return mapApiPropertyToAdmin(updated);
      },
      publishProperty: async (id) => {
        const updated = await propertyApi.publishProperty(id);
        await refresh();
        return mapApiPropertyToAdmin(updated);
      },
      unpublishProperty: async (id) => {
        const updated = await propertyApi.unpublishProperty(id);
        await refresh();
        return mapApiPropertyToAdmin(updated);
      },
    }),
    [properties, loading, error, refresh]
  );
}
