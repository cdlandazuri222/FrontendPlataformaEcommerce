import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegistroPage } from '../pages/auth/RegistroPage';
import { VerificarEmailPage } from '../pages/auth/VerificarEmailPage';
import { HomePage } from '../pages/home/HomePage';
import { SeleccionAsientosPage } from '../pages/seleccion-asientos/SeleccionAsientosPage';
import { MisViajesPage } from '../pages/mis-viajes/MisViajesPage';
import { CotizarEncomiendaPage } from '../pages/encomiendas/CotizarEncomiendaPage';
import { PrivateRoute } from './PrivateRoute';
import { ROUTES } from '../../shared/constants';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTRO} element={<RegistroPage />} />
      <Route path={ROUTES.VERIFICAR_EMAIL} element={<VerificarEmailPage />} />

      <Route element={<PrivateRoute />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.SELECCION_ASIENTOS} element={<SeleccionAsientosPage />} />
        <Route path={ROUTES.MIS_VIAJES} element={<SeleccionAsientosPage />} />
        <Route path={ROUTES.ENCOMIENDAS} element={<CotizarEncomiendaPage />} />
        <Route path={ROUTES.PERFIL} element={<Navigate to={ROUTES.HOME} replace />} />
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
};
