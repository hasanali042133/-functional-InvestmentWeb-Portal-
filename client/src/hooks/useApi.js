import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async request and tracks its loading, error and data states.
 *
 * Results are ignored once the component has unmounted, and a stale response
 * from a superseded request cannot overwrite a newer one.
 *
 * @param {() => Promise<unknown>} request
 * @param {unknown[]} deps re-runs when these change
 */
export function useApi(request, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const mounted = useRef(true);
  const requestId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);

    return request()
      .then((result) => {
        if (!mounted.current || id !== requestId.current) return;
        setData(result);
      })
      .catch((caught) => {
        if (!mounted.current || id !== requestId.current) return;
        setError(caught);
      })
      .finally(() => {
        if (!mounted.current || id !== requestId.current) return;
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, error, isLoading, refetch: run };
}
