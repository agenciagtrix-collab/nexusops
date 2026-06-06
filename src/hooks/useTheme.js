import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'projetix_theme';

const PRESET_THEMES = {
  default: {
    name: 'Padrão',
    primary: '99 102 241',
    background: '255 255 255',
    foreground: '15 23 42',
    card: '255 255 255',
    muted: '241 245 249',
    border: '226 232 240',
  },
  ocean: {
    name: 'Oceano',
    primary: '14 165 233',
    background: '240 249 255',
    foreground: '12 74 110',
    card: '255 255 255',
    muted: '224 242 254',
    border: '186 230 253',
  },
  forest: {
    name: 'Floresta',
    primary: '34 197 94',
    background: '240 253 244',
    foreground: '20 83 45',
    card: '255 255 255',
    muted: '220 252 231',
    border: '187 247 208',
  },
  sunset: {
    name: 'Pôr do Sol',
    primary: '249 115 22',
    background: '255 247 237',
    foreground: '124 45 18',
    card: '255 255 255',
    muted: '255 237 213',
    border: '254 215 170',
  },
  dark: {
    name: 'Escuro',
    primary: '139 92 246',
    background: '9 9 11',
    foreground: '250 250 250',
    card: '24 24 27',
    muted: '39 39 42',
    border: '63 63 70',
  },
  midnight: {
    name: 'Meia-Noite',
    primary: '99 102 241',
    background: '15 23 42',
    foreground: '248 250 252',
    card: '30 41 59',
    muted: '51 65 85',
    border: '71 85 105',
  },
};

export function useTheme() {
  const [themeConfig, setThemeConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved ? JSON.parse(saved) : { mode: 'light', preset: 'default', custom: null };
    } catch {
      return { mode: 'light', preset: 'default', custom: null };
    }
  });

  const applyTheme = useCallback((config) => {
    const root = document.documentElement;
    const isDark = config.mode === 'dark' || config.preset === 'dark' || config.preset === 'midnight';
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const theme = config.custom || PRESET_THEMES[config.preset] || PRESET_THEMES.default;
    
    root.style.setProperty('--primary', theme.primary);
    if (isDark) {
      root.style.setProperty('--background', theme.background);
      root.style.setProperty('--foreground', theme.foreground);
      root.style.setProperty('--card', theme.card);
      root.style.setProperty('--muted', theme.muted);
      root.style.setProperty('--border', theme.border);
    } else {
      // Reset to CSS defaults for light themes
      if (config.preset !== 'default') {
        root.style.setProperty('--background', theme.background);
        root.style.setProperty('--foreground', theme.foreground);
        root.style.setProperty('--card', theme.card);
        root.style.setProperty('--muted', theme.muted);
        root.style.setProperty('--border', theme.border);
      }
    }
    root.style.setProperty('--primary', theme.primary);
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