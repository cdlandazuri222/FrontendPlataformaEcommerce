import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../shared/constants';
import { clearSession, httpClient } from '../../infrastructure/api/httpClient';

type EstadoSesion = 'verificando' | 'valida' | 'invalida';

/**
 * Comprueba de forma inmediata (sin backend) si hay un objeto `usuario` plausible
 * en localStorage. Un residuo corrupto ("undefined"/"null"/JSON inválido) o la
 * ausencia del valor significan que no hay sesión y se puede cortar al instante.
 */
const hayUsuarioLocal = (): boolean => {
  const usuario = localStorage.getItem('usuario');
  if (!usuario || usuario === 'undefined' || usuario === 'null') return false;
  try {
    const parsed = JSON.parse(usuario);
    return parsed != null && typeof parsed === 'object';
  } catch {
    return false;
  }
};

/**
 * Guarda de rutas protegidas.
 *
 * La sesión real vive en una cookie HttpOnly que JavaScript no puede leer, por lo
 * que la presencia de `usuario` en localStorage NO garantiza una sesión activa
 * (puede ser un residuo de una sesión ya expirada). Para evitar que se entre a
 * rutas protegidas sin sesión válida:
 *
 *  1. Si no hay `usuario` local → redirige a login de inmediato.
 *  2. Si hay `usuario` → valida la cookie contra el backend con una petición
 *     autenticada ligera. Un 401 hace que el interceptor de httpClient limpie la
 *     sesión y redirija a login; cualquier otra respuesta se trata como sesión
 *     válida (no se bloquea al usuario por errores de red o backend dormido).
 */
export const PrivateRoute = () => {
  const [estado, setEstado] = useState<EstadoSesion>(() =>
    hayUsuarioLocal() ? 'verificando' : 'invalida'
  );

  useEffect(() => {
    if (estado !== 'verificando') return;

    let activo = true;
    (async () => {
      try {
        await httpClient.get('/plataforma-ecommerce/mis-viajes');
        if (activo) setEstado('valida');
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (!activo) return;
        if (status === 401 || status === 403) {
          // Sesión expirada o inválida. El interceptor 401 ya limpia y redirige;
          // marcamos inválida para no renderizar la ruta protegida mientras tanto.
          clearSession();
          setEstado('invalida');
        } else {
          // Error de red / backend caído: no bloqueamos al usuario con sesión local.
          setEstado('valida');
        }
      }
    })();

    return () => {
      activo = false;
    };
  }, [estado]);

  if (estado === 'invalida') {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (estado === 'verificando') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
          role="status"
          aria-label="Verificando sesión"
        />
      </div>
    );
  }

  return (
    <div className="md:pb-0 pb-20">
      <Outlet />
    </div>
  );
};
