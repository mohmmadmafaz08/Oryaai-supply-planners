import { THEME_STORAGE_KEY } from './constants';

export type ThemeMode = 'light' | 'dark';

/**
 * Reads persisted theme preference safely inside try/catch.
 */
export function readStoredTheme(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch {
    return 'light';
  }
  return 'light';
}

/**
 * Persists theme preference safely inside try/catch.
 */
export function writeStoredTheme(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Ignore storage quota or sandbox restrictions.
  }
}

/**
 * Synchronizes the root html element class with the active theme mode.
 */
export function applyThemeClass(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
