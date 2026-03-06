import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../services/api';
import '../App.css';

function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    tipoDocumento: 'Cédula de Ciudadanía',
    numeroDocumento: '',
    telefono: '',
    direccion: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Mapear numeroDocumento a documento para que coincida con el backend
      const dataToSend = {
        ...formData,
        documento: formData.numeroDocumento
      };
      delete dataToSend.numeroDocumento;
      
      const response = await authService.registrarCliente(dataToSend);
      
      if (response.success) {
        alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await authService.loginGoogle(credentialResponse.credential);
      
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
        alert('¡Registro con Google exitoso!');
        console.log('Usuario:', response.data.usuario);
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Error al registrarse con Google');
  };

  return (
    <div className="min-h-screen flex items-center justify-center lg:p-6" style={{ backgroundColor: '#f8fafc' }}>
      <div className="flex w-full h-full lg:h-[95vh] overflow-hidden shadow-2xl bg-white max-w-[1536px] lg:rounded-3xl border border-slate-100">
        {/* Panel Izquierdo - Formulario */}
        <div className="w-full lg:w-[58%] flex flex-col bg-white custom-scrollbar overflow-y-auto">
          <div className="flex items-center justify-between p-6 lg:px-12 lg:pt-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: '#0a3d82' }}>
                <span className="material-symbols-outlined text-white text-2xl">directions_bus</span>
              </div>
              <span className="text-2xl font-extrabold tracking-tight" style={{ color: '#0a3d82' }}>Cootranar</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span style={{ color: '#64748b' }}>¿Ya tienes cuenta?</span>
              <Link to="/login" className="font-bold transition-colors" style={{ color: '#0a3d82' }}>Iniciar Sesión</Link>
            </div>
          </div>

          <div className="max-w-[680px] w-full mx-auto px-6 py-8 lg:px-12 lg:py-12">
            <header className="mb-10">
              <h1 className="text-4xl font-extrabold tracking-tight mb-3" style={{ color: '#0f172a' }}>Únete a nosotros</h1>
              <p className="text-lg" style={{ color: '#64748b' }}>Crea tu cuenta para gestionar tus tiquetes y beneficios de viaje.</p>
            </header>

            {error && (
              <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}>
                <p className="text-sm font-medium" style={{ color: '#991b1b' }}>{error}</p>
              </div>
            )}

            <div className="mb-8">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                size="large"
                text="signup_with"
                shape="rectangular"
                logo_alignment="left"
                width="100%"
              />
            </div>

            <div className="relative flex items-center mb-10">
              <div className="flex-grow border-t" style={{ borderColor: '#e2e8f0' }}></div>
              <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>O con tu correo electrónico</span>
              <div className="flex-grow border-t" style={{ borderColor: '#e2e8f0' }}></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Información Personal */}
              <section className="space-y-5">
                <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: '#f1f5f9' }}>
                  <span className="material-symbols-outlined" style={{ color: '#0a3d82' }}>account_circle</span>
                  <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>Información Personal</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1" style={{ color: '#334155' }}>Nombre</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl h-12 transition-all"
                      style={{ 
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'rgba(248, 250, 252, 0.5)'
                      }}
                      placeholder="Juan"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1" style={{ color: '#334155' }}>Apellido</label>
                    <input
                      type="text"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl h-12 transition-all"
                      style={{ 
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'rgba(248, 250, 252, 0.5)'
                      }}
                      placeholder="Pérez"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1" style={{ color: '#334155' }}>Correo Electrónico</label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl h-12 transition-all"
                    style={{ 
                      border: '1px solid #e2e8f0',
                      backgroundColor: 'rgba(248, 250, 252, 0.5)'
                    }}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1" style={{ color: '#334155' }}>Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl h-12 transition-all"
                      style={{ 
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'rgba(248, 250, 252, 0.5)'
                      }}
                      placeholder="Min. 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="material-symbols-outlined absolute right-4 top-3 transition-colors"
                      style={{ color: '#94a3b8' }}
                    >
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Identificación y Ubicación */}
              <section className="space-y-5">
                <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: '#f1f5f9' }}>
                  <span className="material-symbols-outlined" style={{ color: '#0a3d82' }}>badge</span>
                  <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>Identificación y Ubicación</h3>
                </div>

                <div className="p-4 rounded-xl flex gap-4" style={{ backgroundColor: 'rgba(239, 246, 255, 0.5)', border: '1px solid #dbeafe' }}>
                  <span className="material-symbols-outlined text-2xl" style={{ color: '#0a3d82' }}>info</span>
                  <p className="text-sm leading-snug" style={{ color: '#334155' }}>
                    <span className="font-extrabold" style={{ color: '#0a3d82' }}>Importante:</span> Tu número de identificación quedará vinculado permanentemente a este correo.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1" style={{ color: '#334155' }}>Tipo de Documento</label>
                    <select
                      name="tipoDocumento"
                      value={formData.tipoDocumento}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl h-12 transition-all"
                      style={{ 
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'rgba(248, 250, 252, 0.5)'
                      }}
                    >
                      <option>Cédula de Ciudadanía</option>
                      <option>Cédula de Extranjería</option>
                      <option>Pasaporte</option>
                      <option>PPT</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1" style={{ color: '#334155' }}>Número de Documento</label>
                    <input
                      type="text"
                      name="numeroDocumento"
                      value={formData.numeroDocumento}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl h-12 transition-all"
                      style={{ 
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'rgba(248, 250, 252, 0.5)'
                      }}
                      placeholder="1029384756"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1" style={{ color: '#334155' }}>Teléfono Móvil</label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl h-12 transition-all"
                      style={{ 
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'rgba(248, 250, 252, 0.5)'
                      }}
                      placeholder="300 000 0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1" style={{ color: '#334155' }}>Dirección de Residencia</label>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl h-12 transition-all"
                      style={{ 
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'rgba(248, 250, 252, 0.5)'
                      }}
                      placeholder="Carrera 5 #10-20"
                    />
                  </div>
                </div>
              </section>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white font-bold h-14 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] text-lg mb-6"
                  style={{ 
                    backgroundColor: loading ? '#64748b' : '#0a3d82',
                    boxShadow: '0 10px 15px -3px rgba(10, 61, 130, 0.2)'
                  }}
                >
                  {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </button>

                <div className="sm:hidden text-center mb-6">
                  <p className="text-sm" style={{ color: '#64748b' }}>
                    ¿Ya tienes una cuenta? <Link to="/login" className="font-bold" style={{ color: '#0a3d82' }}>Inicia sesión</Link>
                  </p>
                </div>

                <p className="text-center text-xs leading-relaxed px-4" style={{ color: '#94a3b8' }}>
                  Al registrarte, confirmas que has leído y aceptas nuestros 
                  <a href="#" className="underline font-medium" style={{ color: '#64748b' }}> Términos y Condiciones</a> 
                  y la <a href="#" className="underline font-medium" style={{ color: '#64748b' }}>Política de Protección de Datos</a>.
                </p>
              </div>
            </form>
          </div>

          <footer className="mt-auto border-t p-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs" style={{ borderColor: '#f1f5f9', color: '#94a3b8' }}>
            <p>© 2024 Cootranar S.A. Calidad y servicio en cada viaje.</p>
            <div className="flex gap-6">
              <a href="#" className="transition-colors hover:text-blue-600">Centro de Ayuda</a>
              <a href="#" className="transition-colors hover:text-blue-600">Contáctanos</a>
            </div>
          </footer>
        </div>

        {/* Panel Derecho - Imagen */}
        <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden" style={{ backgroundColor: '#0a3d82' }}>
          <div className="absolute inset-0 z-0">
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC0-d--scF4TqOJrwxnA_xeMxygJoxLO0rBf672Hz45gLkqUyOAFTctvJaDYCj8EKSXzA-7PllOIGd3sTwVzZM8yRdPpkWcwFIBLNLMq7zSf2VtAmi-i9DstcYG3mS-ZKzVtb3SnUHaahKa_fhHHJT2bHK8U1UJTxMrJhvAMix8GlA-ErIf1ABZ3GSHMoOWk2L8cQz4B4Ap7EgVr84MWELzxskKsZomaOnTWGsCFTWlhYXXozUMrUQ44GumKoJlgMPAaDVl3GsDKMNv")',
                filter: 'brightness(0.85) contrast(1.1)'
              }}
            ></div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, rgba(10, 61, 130, 0.9), rgba(10, 61, 130, 0.4), rgba(0, 0, 0, 0.3))' }}></div>
          </div>
          <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full">
            <div className="space-y-1">
              <p className="font-extrabold uppercase tracking-widest text-sm w-fit px-3 py-1 rounded-full backdrop-blur-sm" style={{ color: '#1557b0', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                Transporte Interdepartamental
              </p>
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-6xl font-extrabold leading-tight tracking-tight">
                  Tu viaje seguro <span className="block" style={{ color: '#1557b0' }}>empieza aquí.</span>
                </h2>
                <p className="text-xl font-medium opacity-90 max-w-md leading-relaxed" style={{ color: '#dbeafe' }}>
                  Más de 30 años conectando al suroccidente colombiano con la mejor flota y personal calificado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Registro;
