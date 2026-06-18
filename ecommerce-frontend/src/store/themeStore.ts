// src/store/themeStore.ts
import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

const getInitialTheme = (): Theme => {
  try {
    const stored = localStorage.getItem('easyshop-theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {}
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
};

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('easyshop-theme', theme); } catch {}
};

// 应用初始主题
applyTheme(getInitialTheme());

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  toggle: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    set({ theme: next });
  },
}));
