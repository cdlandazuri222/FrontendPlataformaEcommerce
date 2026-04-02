import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../shared/constants';

export const PrivateRoute = () => {
  const isAuthenticated = !!localStorage.getItem('authToken') || !!localStorage.getItem('usuario');
  return isAuthenticated ? (
    // pb-20 en móvil/tablet para que el contenido no quede bajo el bottom nav
    <div className="md:pb-0 pb-20">
      <Outlet />
    </div>
  ) : <Navigate to={ROUTES.LOGIN} replace />;
};
