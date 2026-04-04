import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../shared/constants';
import { isTokenValid } from '../../shared/utils/tokenUtils';
import { clearSession } from '../../infrastructure/api/httpClient';

/**
 * Protege rutas privadas validando el token JWT en cada carga de página.
 * - Si no hay token o está expirado, limpia la sesión y redirige al login.
 * - El refresh automático se maneja en el interceptor de httpClient.
 */
export const PrivateRoute = () => {
  const token = localStorage.getItem('authToken');

  if (!isTokenValid(token)) {
    // Token ausente o expirado: limpiar sesión antes de redirigir
    clearSession();
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <div className="md:pb-0 pb-20">
      <Outlet />
    </div>
  );
};
