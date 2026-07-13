import { createContext, useContext, type ReactNode } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useIdioma, type Idioma } from '../hooks/useIdioma';
import { t, type Translations } from '../../shared/i18n/translations';

interface PreferenciasContextValue {
  tema: 'light' | 'dark';
  esDark: boolean;
  toggleTema: () => void;
  idioma: Idioma;
  setIdioma: (idioma: Idioma) => void;
  tx: Translations;
}

const defaultValue: PreferenciasContextValue = {
  tema: 'light',
  esDark: false,
  toggleTema: () => {},
  idioma: 'es',
  setIdioma: () => {},
  tx: t('es'),
};

const PreferenciasContext = createContext<PreferenciasContextValue>(defaultValue);

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const { tema, esDark, toggleTema } = useTheme();
  const { idioma, setIdioma } = useIdioma();

  return (
    <PreferenciasContext.Provider
      value={{ tema, esDark, toggleTema, idioma, setIdioma, tx: t(idioma) }}
    >
      {children}
    </PreferenciasContext.Provider>
  );
}

export function usePreferencias(): PreferenciasContextValue {
  return useContext(PreferenciasContext);
}
