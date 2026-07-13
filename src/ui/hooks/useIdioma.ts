import { useState } from 'react';

export type Idioma = 'es' | 'en';

const STORAGE_KEY = 'cootranar-idioma';

export function useIdioma() {
  const [idioma, setIdiomaState] = useState<Idioma>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'es' || stored === 'en') return stored;
    return navigator.language.startsWith('es') ? 'es' : 'en';
  });

  const setIdioma = (nuevo: Idioma) => {
    localStorage.setItem(STORAGE_KEY, nuevo);
    setIdiomaState(nuevo);
  };

  return { idioma, setIdioma };
}
