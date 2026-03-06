import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/api';

function VerificarEmail() {
  const [searchParams] = useSearchParams();
  const [estado, setEstado] = useState('verificando'); // verificando, exitoso o error
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const verificarToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setEstado('error');
        setMensaje('Token de verificación no proporcionado');
        setLoading(false);
        return;
      }

      try {
        const response = await authService.verificarEmail(token);
        
        if (response.success) {
          setEstado('exitoso');
          setMensaje(response.message);
        }
      } catch (err) {
        setEstado('error');
        setMensaje(err.response?.data?.message || 'Error al verificar el correo');
      } finally {
        setLoading(false);
      }
    };

    verificarToken();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f8fafc' }}>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        {loading ? (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e3f2fd' }}>
              <span className="material-symbols-outlined text-4xl animate-spin" style={{ color: '#0a3d82' }}>
                progress_activity
              </span>
            </div>
            <h1 className="text-2xl font-extrabold mb-4" style={{ color: '#0f172a' }}>
              Verificando tu correo...
            </h1>
            <p style={{ color: '#64748b' }}>Por favor espera un momento</p>
          </>
        ) : estado === 'exitoso' ? (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#d1fae5' }}>
              <span className="material-symbols-outlined text-4xl" style={{ color: '#059669' }}>
                check_circle
              </span>
            </div>
            <h1 className="text-2xl font-extrabold mb-4" style={{ color: '#0f172a' }}>
              ¡Cuenta verificada!
            </h1>
            <p className="mb-8" style={{ color: '#64748b' }}>
              {mensaje}
            </p>
            <Link
              to="/login"
              className="inline-block w-full text-white font-bold h-14 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center"
              style={{ backgroundColor: '#0a3d82' }}
            >
              Iniciar Sesión
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fee2e2' }}>
              <span className="material-symbols-outlined text-4xl" style={{ color: '#dc2626' }}>
                error
              </span>
            </div>
            <h1 className="text-2xl font-extrabold mb-4" style={{ color: '#0f172a' }}>
              Error de verificación
            </h1>
            <p className="mb-8" style={{ color: '#64748b' }}>
              {mensaje}
            </p>
            <Link
              to="/login"
              className="inline-block w-full text-white font-bold h-14 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center mb-4"
              style={{ backgroundColor: '#0a3d82' }}
            >
              Ir al Login
            </Link>
            <Link
              to="/reenviar-verificacion"
              className="inline-block w-full font-bold h-14 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center"
              style={{ borderColor: '#0a3d82', color: '#0a3d82' }}
            >
              Reenviar correo de verificación
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerificarEmail;
