import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  /** Resolved color mode: the single value consumers render against. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
  * The PC workbench ships the light tech-blue theme
    * (`specs/client-theme.spec.json`, base: light). Light is the default rendering
      * for every stored value except an explicit `dark`, so a dark OS preference can
        * never turn on the retained `dark:` utilities (light icon/text colors) on top
          * of the light token surfaces — that combination made icons invisible.
            */
const resolveThemeMode = (theme: Theme): ResolvedTheme => (theme === 'dark' ? 'dark' : 'light');

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('sdkwork-agents-theme');
    return (savedTheme as Theme) || 'light';
  });
  const resolvedTheme: ResolvedTheme = resolveThemeMode(theme);

  useEffect(() => {
    localStorage.setItem('sdkwork-agents-theme', theme);

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.dataset.agColorMode = resolvedTheme;
  }, [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
