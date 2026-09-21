import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import storage from '../../services/storage/localStorage';
import { STORAGE_KEYS, THEMES } from '../../constants/appConstants';

const ThemeContext = createContext(null);

const resolveTheme = (theme) => {
  if (theme !== THEMES.SYSTEM) return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => storage.get(STORAGE_KEYS.THEME, THEMES.SYSTEM));

  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(theme);
    };
    apply();
    storage.set(STORAGE_KEYS.THEME, theme);

    if (theme !== THEMES.SYSTEM) return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  const value = useMemo(() => ({ theme, resolvedTheme: resolveTheme(theme), setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
};

export default ThemeProvider;
