import { Routes, Route, Navigate } from 'react-router-dom';
import { ScrollToTop } from './ScrollToTop';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegistroPage } from '../pages/auth/RegistroPage';
import { VerificarEmailPage } from '../pages/auth/VerificarEmailPage';
import { OlvidoPasswordPage } from '../pages/auth/OlvidoPasswordPage';
import { VerificarCodigoPage } from '../pages/auth/VerificarCodigoPage';
import { NuevaPasswordPage } from '../pages/auth/NuevaPasswordPage';
import { HomePage } from '../pages/home/HomePage';
import { SeleccionAsientosPage } from '../pages/seleccion-asientos/SeleccionAsientosPage';
import { MisViajesPage } from '../pages/mis-viajes/MisViajesPage';
import { CotizarEncomiendaPage } from '../pages/encomiendas/CotizarEncomiendaPage';
import { MisEncomiendasPage } from '../pages/encomiendas/MisEncomiendasPage';
import { MillasPage } from '../pages/millas/MillasPage';
import { PerfilPage } from '../pages/perfil/PerfilPage';
import { PagoResultadoPage } from '../pages/pago/PagoResultadoPage';
import { PrivateRoute } from './PrivateRoute';
import { ROUTES } from '../../shared/constants';

export const AppRouter = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Rutas públicas - sin autenticación requerida */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTRO} element={<RegistroPage />} />
      <Route path={ROUTES.VERIFICAR_EMAIL} element={<VerificarEmailPage />} />
      <Route path={ROUTES.RECUPERAR_PASSWORD} element={<OlvidoPasswordPage />} />
      <Route path={ROUTES.VERIFICAR_CODIGO_PASSWORD} element={<VerificarCodigoPage />} />
      <Route path={ROUTES.NUEVA_PASSWORD} element={<NuevaPasswordPage />} />

      {/* Rutas protegidas - requieren autenticación */}
      <Route element={<PrivateRoute />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.SELECCION_ASIENTOS} element={<SeleccionAsientosPage />} />
        <Route path={ROUTES.MIS_VIAJES} element={<MisViajesPage />} />

        <Route path={ROUTES.ENCOMIENDAS} element={<CotizarEncomiendaPage />} />
        <Route path={ROUTES.MIS_ENCOMIENDAS} element={<MisEncomiendasPage />} />
        <Route path={ROUTES.MILLAS} element={<MillasPage />} />
        <Route path={ROUTES.PERFIL} element={<PerfilPage />} />
        <Route path={ROUTES.PAGO_RESULTADO} element={<PagoResultadoPage />} />
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </>
  );
};
