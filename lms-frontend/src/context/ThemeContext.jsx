import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('lms-theme') || 'dark';
  });

  const applyTheme = useCallback((newTheme) => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('lms-theme', newTheme);
    localStorage.setItem('lms.theme', newTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen to cross-domain or external slider changes
  useEffect(() => {
    const handleExternalChange = (e) => {
      const next = e.detail;
      if (next && (next === 'light' || next === 'dark') && next !== theme) {
        setThemeState(next);
      }
    };
    window.addEventListener('lms-theme-change', handleExternalChange);
    return () => window.removeEventListener('lms-theme-change', handleExternalChange);
  }, [theme]);

  const setTheme = useCallback((nextTheme) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new CustomEvent('lms-theme-change', { detail: nextTheme }));
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      window.dispatchEvent(new CustomEvent('lms-theme-change', { detail: next }));
      return next;
    });
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Convenience hook
export const useTheme = () => useContext(ThemeContext);

export default ThemeProvider;
