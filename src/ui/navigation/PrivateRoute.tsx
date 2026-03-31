import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../shared/constants';

export const PrivateRoute = () => {
  const isAuthenticated = !!localStorage.getItem('authToken') || !!localStorage.getItem('usuario');
  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />;
};
