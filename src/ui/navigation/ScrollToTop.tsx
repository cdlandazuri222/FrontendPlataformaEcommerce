import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente que resetea el scroll al inicio (top) cada vez que cambia la ruta.
 * Esto evita que al navegar entre páginas (ej. login → home) se mantenga
 * la posición de scroll de la página anterior.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Resetear el scroll de la ventana al inicio en cada cambio de ruta
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // También resetear el scroll de document.documentElement y body
    // por si el scroll está en el elemento raíz (común en móviles)
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
};
