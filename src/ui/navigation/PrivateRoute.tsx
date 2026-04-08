import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../shared/constants';
import { clearSession } from '../../infrastructure/api/httpClient';

export const PrivateRoute = () => {
  const usuario = localStorage.getItem('usuario');

  if (!usuario) {
    clearSession();
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <div className="md:pb-0 pb-20">
      <Outlet />
    </div>
  );
};