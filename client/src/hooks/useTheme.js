import { useCallback, useEffect, useState } from 'react';
import { applyTheme, resolveTheme, storeTheme, storedTheme, systemTheme } from '@/lib/theme.js';

/**
 * The current theme, and a way to change it.
 *
 * While the customer has made no choice the system preference is followed live,
 * so a laptop switching to dark at sunset takes the app with it. The moment
 * they pick one, that choice sticks and the system is ignored.
 */
export function useTheme() {
  const [theme, setTheme] = useState(resolveTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (storedTheme()) return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setTheme(systemTheme());

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  /** Choosing a theme is what makes it stick; before that the system leads. */
  const choose = useCallback((next) => {
    storeTheme(next);
    setTheme(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      storeTheme(next);
      return next;
    });
  }, []);

  return { theme, isDark: theme === 'dark', setTheme: choose, toggle };
}
