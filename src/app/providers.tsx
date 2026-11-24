import * as React from 'react';
import {
  applyThemeClass,
  readStoredTheme,
  writeStoredTheme,
  type ThemeMode,
} from '@/lib/theme';

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within AppProviders');
  }
  return ctx;
}

export interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Provides TanStack Query client and persisted light/dark theme context.
 */
export function AppProviders({ children }: AppProvidersProps): React.ReactElement {
  const [theme, setTheme] = React.useState<ThemeMode>(() => readStoredTheme());

  React.useEffect(() => {
    applyThemeClass(theme);
    writeStoredTheme(theme);
  }, [theme]);

  const toggleTheme = React.useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const themeValue = React.useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>
  );
}
