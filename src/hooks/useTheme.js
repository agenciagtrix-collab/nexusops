import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'projetix_theme';

// All preset primaries use the official brand color #6366f1 (239 84% 67%)
// Only dark/midnight presets toggle dark mode
const PRESET_THEMES = {
  default: {
    name: 'Padrão',
    dark: false,
  },
  dark: {
    name: 'Escuro',
    dark: true,
  },
  midnight: {
    name: 'Meia-Noite',
    dark: true,
  },
};

export function useTheme() {
  const [themeConfig, setThemeConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved ? JSON.parse(saved) : { mode: 'light', preset: 'default' };
    } catch {
      return { mode: 'light', preset: 'default' };
    }
  });

  const applyTheme = useCallback((config) => {
    const root = document.documentElement;
    const preset = PRESET_THEMES[config.preset] || PRESET_THEMES.default;
    const isDark = config.mode === 'dark' || preset.dark;

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    applyTheme(themeConfig);
  }, [themeConfig, applyTheme]);

  const setTheme = useCallback((config) => {
    const newConfig = { ...themeConfig, ...config };
    setThemeConfig(newConfig);
    localStorage.setItem(THEME_KEY, JSON.stringify(newConfig));
  }, [themeConfig]);

  return {
    themeConfig,
    setTheme,
    presets: PRESET_THEMES,
  };
}