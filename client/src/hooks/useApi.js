import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async request and tracks its loading, error and data states.
 *
 * Results are ignored once the component has unmounted, and a stale response
 * from a superseded request cannot overwrite a newer one.
 *
 * @param {() => Promise<unknown>} request
 * @param {unknown[]} deps re-runs when these change
 * @param {{ pollMs?: number }} [options] when set, refreshes on that interval
 */
export function useApi(request, deps = [], { pollMs = 0 } = {}) {
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

  /**
   * A silent run is a background refresh: it neither shows the spinner nor
   * replaces good data with an error screen if it fails, because the screen is
   * already displaying a perfectly usable earlier response.
   *
   * Called straight from onClick handlers too, so the argument may be a DOM
   * event rather than options — reading one property off it is harmless.
   */
  const run = useCallback((options = {}) => {
    const silent = options?.silent === true;
    const id = ++requestId.current;

    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    return request()
      .then((result) => {
        if (!mounted.current || id !== requestId.current) return;
        setData(result);
        setError(null);
      })
      .catch((caught) => {
        if (!mounted.current || id !== requestId.current || silent) return;
        setError(caught);
      })
      .finally(() => {
        if (!mounted.current || id !== requestId.current || silent) return;
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  // Fund prices move while the page is open, so live screens poll for them.
  //
  // A hidden tab is skipped — refreshing a chart nobody is looking at is just
  // load — but coming back to the tab refreshes immediately rather than showing
  // a stale price until the next tick happens to come round.
  useEffect(() => {
    if (!pollMs) return undefined;

    const isHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

    const intervalId = setInterval(() => {
      if (isHidden()) return;
      run({ silent: true });
    }, pollMs);

    const onVisible = () => {
      if (!isHidden()) run({ silent: true });
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [run, pollMs]);

  return { data, error, isLoading, refetch: run };
}
