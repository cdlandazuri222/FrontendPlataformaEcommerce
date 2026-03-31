import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../../shared/constants';
import logo from '../../../assets/Logo.png.png';
import busCootranar from '../../../assets/busCootranar.png';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginGoogle, loading, error, setError } = useAuth();
  const [formData, setFormData] = useState({ correo: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validarCampo = (name: string, value: string): string => {
    if (!value) return '';
    switch (name) {
      case 'correo':
        return !value.includes('@') ? 'El correo debe contener @' : '';
      case 'password': {
        const checks: string[] = [];
        if (value.length < 6 || value.length > 12) checks.push('entre 6 y 12 caracteres');
        if (!/[A-Z]/.test(value)) checks.push('1 mayúscula');
        if (!/[0-9]/.test(value)) checks.push('1 número');
        return checks.length ? `Falta: ${checks.join(', ')}` : '';
      }
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const { name } = e.target;
    setFormData({ ...formData, [name]: value });
    setFieldErrors({ ...fieldErrors, [name]: validarCampo(name, String(value)) });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ correo: formData.correo, password: formData.password });
      navigate(ROUTES.HOME);
    } catch {
      // error handled by useAuth
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    try {
      await loginGoogle(credentialResponse.credential);
      navigate(ROUTES.HOME);
    } catch {
      // error handled by useAuth
    }
  };

  return (
    <div className="min-h-screen flex items-start lg:items-center justify-center lg:p-6" style={{ backgroundColor: '#f8fafc' }}>
      <div className="flex w-full min-h-screen lg:min-h-0 lg:h-[95vh] overflow-hidden lg:shadow-2xl bg-brand-blue lg:bg-white max-w-[1536px] lg:rounded-3xl border-0 lg:border border-slate-100 flex-col lg:flex-row">

        {/* Panel Izquierdo */}
        <div className="flex w-full h-[100dvh] lg:h-auto lg:w-[50%] relative overflow-hidden bg-brand-blue order-1 lg:order-1 shrink-0">
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${busCootranar})`, filter: 'brightness(0.85) contrast(1.1)' }} />
            <div className="absolute inset-0 bg-gradient-to-tl from-brand-blue via-brand-blue/40 to-transparent" />
          </div>
          <div className="relative z-10 flex flex-col justify-end p-8 pt-32 pb-8 lg:p-20 text-white w-full h-full">
            <div className="space-y-8 max-w-lg">
              <div className="space-y-4">
                <div className="w-16 h-1 bg-white/30 rounded-full mb-8" />
                <h2 className="text-4xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                  Tu viaje seguro<span className="text-brand-blue-light block">empieza aquí.</span>
                </h2>
                <p className="text-lg lg:text-xl text-blue-50 font-medium opacity-90 leading-relaxed mt-4 lg:mt-0">
                  Accede a tu cuenta para gestionar tus reservas, acumular kilómetros y viajar con la comodidad que mereces.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-6 lg:pt-10">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-blue-200">security</span>
                  <div className="text-sm"><p className="font-bold">Seguridad Total</p><p className="text-blue-200/80">Monitoreo GPS 24/7</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-blue-200">schedule</span>
                  <div className="text-sm"><p className="font-bold">Puntualidad</p><p className="text-blue-200/80">Horarios garantizados</p></div>
                </div>
              </div>
              <div className="flex lg:hidden w-full pt-8 pb-4">
                <a href="#form-section" className="flex items-center justify-center gap-2 bg-white text-brand-blue font-bold px-8 py-4 rounded-xl w-full hover:bg-slate-50 transition-colors shadow-lg shadow-black/10">
                  <span>Comenzar</span>
                  <span className="material-symbols-outlined">arrow_downward</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Formulario */}
        <div id="form-section" className="w-full lg:w-[50%] flex flex-col bg-white lg:rounded-none rounded-t-[2.5rem] lg:-mt-0 lg:pt-0 relative z-20 custom-scrollbar overflow-y-auto order-2 lg:order-2 shadow-[0_-15px_30px_rgba(0,0,0,0.15)] lg:shadow-none min-h-[100dvh] lg:min-h-0">
          <div className="max-w-[480px] w-full mx-auto px-6 py-8 lg:px-12 lg:py-16 flex-grow flex flex-col justify-center">
            <div className="flex justify-center mb-8">
              <img src={logo} alt="Cootranar" className="h-20 w-auto" />
            </div>
            <header className="mb-10 text-center lg:text-left">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Bienvenido de nuevo</h1>
              <p className="text-slate-500 text-lg">Inicia sesión para gestionar tus viajes.</p>
            </header>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <div className="mb-8 google-login-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Error al iniciar sesión con Google. Por favor, intenta de nuevo.')}
                useOneTap={false}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                logo_alignment="left"
                width="400"
              />
            </div>

            <div className="relative flex items-center mb-10">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">O con tu correo electrónico</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Correo Electrónico</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-3 text-slate-400">mail</span>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 rounded-xl h-12 transition-all placeholder:text-slate-400"
                    style={{ border: `1px solid ${fieldErrors.correo ? '#f87171' : '#e2e8f0'}`, backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                {fieldErrors.correo && <p className="text-xs ml-1 text-red-600">{fieldErrors.correo}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-700">Contraseña</label>
                  <a href="#" className="text-xs font-bold text-brand-blue hover:text-brand-blue-light">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-3 text-slate-400">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-12 rounded-xl h-12 transition-all placeholder:text-slate-400"
                    style={{ border: `1px solid ${fieldErrors.password ? '#f87171' : '#e2e8f0'}`, backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-4 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    visibility
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs ml-1 text-red-600">{fieldErrors.password}</p>}
              </div>

              <div className="flex items-center gap-2 ml-1">
                <input
                  type="checkbox"
                  name="remember"
                  id="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 text-brand-blue border-slate-300 rounded focus:ring-brand-blue"
                />
                <label htmlFor="remember" className="text-sm text-slate-600 font-medium cursor-pointer">Mantener sesión iniciada</label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold h-14 rounded-xl shadow-lg shadow-brand-blue/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] text-lg"
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
                <p className="text-center text-slate-500 text-sm mt-5">
                  ¿No tienes cuenta? <Link to={ROUTES.REGISTRO} className="text-brand-blue font-bold">Regístrate</Link>
                </p>
              </div>
            </form>
          </div>

          <footer className="mt-auto border-t border-slate-100 p-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p>© 2024 Cootranar S.A. Calidad y servicio en cada viaje.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-brand-blue transition-colors">Privacidad</a>
              <a href="#" className="hover:text-brand-blue transition-colors">Términos</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}


