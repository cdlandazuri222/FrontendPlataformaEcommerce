import { useState, useEffect } from 'react';

const STORAGE_KEY = 'cootranar-tema';

export function useTheme() {
  const [esDark, setEsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (esDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY, 'light');
    }
  }, [esDark]);

  const toggleTema = () => setEsDark((prev) => !prev);

  return {
    tema: esDark ? 'dark' : 'light' as 'dark' | 'light',
    esDark,
    toggleTema,
  };
}
