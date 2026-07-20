import { useCallback, useEffect, useState } from "react";

/**
 * Generic async resource hook — loading / success / error states.
 */
export function useAsyncResource(fetcher, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ loading: false, data, error: null });
      return data;
    } catch (error) {
      setState({ loading: false, data: null, error: error?.message || "Request failed" });
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}

export function useAsyncAction(action) {
  const [state, setState] = useState({ loading: false, error: null });

  const run = useCallback(
    async (...args) => {
      setState({ loading: true, error: null });
      try {
        const result = await action(...args);
        setState({ loading: false, error: null });
        return { ok: true, data: result };
      } catch (error) {
        const message = error?.message || "Action failed";
        setState({ loading: false, error: message });
        return { ok: false, error: message };
      }
    },
    [action]
  );

  return { ...state, run };
}
