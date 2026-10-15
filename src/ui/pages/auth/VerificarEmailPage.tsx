import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../../shared/constants';

type Estado = 'pendiente' | 'verificando' | 'exitoso' | 'error';

export function VerificarEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [estado, setEstado] = useState<Estado>(token ? 'pendiente' : 'error');
  const [mensaje, setMensaje] = useState(
    token ? '' : 'Token de verificación no proporcionado en el enlace.'
  );
  const { verificarEmail } = useAuth();

  const handleConfirmar = async () => {
    if (!token) {
      setEstado('error');
      setMensaje('Token de verificación no válido o ausente.');
      return;
    }

    setEstado('verificando');
    try {
      const msg = await verificarEmail(token);
      setEstado('exitoso');
      setMensaje(msg || '¡Cuenta verificada exitosamente! Redirigiendo...');
      setTimeout(() => {
        navigate(ROUTES.HOME);
      }, 2000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setEstado('error');
      setMensaje(axiosErr.response?.data?.message || 'Error al verificar el correo electrónico.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 text-center border border-slate-100 dark:border-slate-700 transition-colors duration-300">
        
        {estado === 'pendiente' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/50">
              <span className="material-symbols-outlined text-4xl text-blue-600 dark:text-blue-400">mark_email_read</span>
            </div>
            <h1 className="text-2xl font-extrabold mb-3 text-slate-900 dark:text-white">
              Activa tu Cuenta
            </h1>
            <p className="mb-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Pulsa el botón para confirmar tu correo y activar tu cuenta en Cootranar.
            </p>
            <button
              onClick={handleConfirmar}
              className="w-full inline-flex items-center justify-center text-white font-bold h-14 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-[#0a3d82] hover:bg-[#0c4ca3] cursor-pointer"
            >
              Confirmar y Activar Cuenta
            </button>
          </>
        )}

        {estado === 'verificando' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/50">
              <span className="material-symbols-outlined text-4xl animate-spin text-blue-600 dark:text-blue-400">progress_activity</span>
            </div>
            <h1 className="text-2xl font-extrabold mb-3 text-slate-900 dark:text-white">
              Verificando tu cuenta...
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Por favor espera un momento mientras validamos tu registro.
            </p>
          </>
        )}

        {estado === 'exitoso' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/50">
              <span className="material-symbols-outlined text-4xl text-emerald-600 dark:text-emerald-400">check_circle</span>
            </div>
            <h1 className="text-2xl font-extrabold mb-3 text-slate-900 dark:text-white">
              ¡Cuenta Verificada!
            </h1>
            <p className="mb-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {mensaje}
            </p>
            <Link
              to={ROUTES.HOME}
              className="inline-flex w-full items-center justify-center text-white font-bold h-14 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] bg-[#0a3d82] hover:bg-[#0c4ca3]"
            >
              Ir al Inicio
            </Link>
          </>
        )}

        {estado === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-950/50">
              <span className="material-symbols-outlined text-4xl text-rose-600 dark:text-rose-400">error</span>
            </div>
            <h1 className="text-2xl font-extrabold mb-3 text-slate-900 dark:text-white">
              No pudimos verificar tu correo
            </h1>
            <p className="mb-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {mensaje}
            </p>
            {token && (
              <button
                onClick={handleConfirmar}
                className="w-full inline-flex items-center justify-center text-white font-bold h-14 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] mb-3 bg-[#0a3d82] hover:bg-[#0c4ca3] cursor-pointer"
              >
                Reintentar Verificación
              </button>
            )}
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex w-full items-center justify-center text-slate-700 dark:text-slate-200 font-semibold h-12 rounded-xl border border-slate-300 dark:border-slate-600 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Ir a Iniciar Sesión
            </Link>
          </>
        )}

      </div>
    </div>
  );
}
