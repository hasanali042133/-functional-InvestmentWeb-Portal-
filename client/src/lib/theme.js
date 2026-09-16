/**
 * Light and dark, and remembering which.
 *
 * A stored choice always wins; with none, the system preference is followed and
 * kept up to date. Every read is guarded because private browsing can make
 * localStorage throw rather than return null.
 */

const STORAGE_KEY = 'investment-portal.theme';

export const storedTheme = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
};

export const storeTheme = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* The choice simply will not survive a reload. */
  }
};

export const systemTheme = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

export const resolveTheme = () => storedTheme() ?? systemTheme();

/** The one place the class that drives the whole palette is set. */
export const applyTheme = (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
};
