import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../services/api';
import '../App.css';

function Login() {
  const [formData, setFormData] = useState({
    correo: '',
    password: '',
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validarCampo = (name, value) => {
    if (!value) return '';
    switch (name) {
      case 'correo':
        if (!value.includes('@')) return 'El correo debe contener @';
        return '';
      case 'password': {
        const checks = [];
        if (value.length < 6 || value.length > 12) checks.push('entre 6 y 12 caracteres');
        if (!/[A-Z]/.test(value)) checks.push('1 mayúscula');
        if (!/[0-9]/.test(value)) checks.push('1 número');
        return checks.length ? `Falta: ${checks.join(', ')}` : '';
      }
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const { name } = e.target;
    setFormData({ ...formData, [name]: value });
    setFieldErrors({ ...fieldErrors, [name]: validarCampo(name, value) });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.loginCliente(formData.correo, formData.password);
      
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
        alert('¡Inicio de sesión exitoso!');
        console.log('Usuario:', response.data.usuario);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
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
        alert('¡Inicio de sesión con Google exitoso!');//Por ahora, despues pues se puede hacer un modal 
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al iniciar sesión con Google';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    setError('Error al iniciar sesión con Google. Por favor, intenta de nuevo.');
  };

  return (
    <div className="min-h-screen flex items-start lg:items-center justify-center lg:p-6" style={{ backgroundColor: '#f8fafc' }}>
      <div className="flex w-full min-h-screen lg:min-h-0 lg:h-[95vh] overflow-hidden lg:shadow-2xl bg-brand-blue lg:bg-white max-w-[1536px] lg:rounded-3xl border-0 lg:border border-slate-100 flex-col lg:flex-row">
        
        {/* Panel Izquierdo - Imagen */}
        <div className="flex w-full h-[100dvh] lg:h-auto lg:w-[50%] relative overflow-hidden bg-brand-blue order-1 lg:order-1 shrink-0">
          <div className="absolute inset-0 z-0">
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC0-d--scF4TqOJrwxnA_xeMxygJoxLO0rBf672Hz45gLkqUyOAFTctvJaDYCj8EKSXzA-7PllOIGd3sTwVzZM8yRdPpkWcwFIBLNLMq7zSf2VtAmi-i9DstcYG3mS-ZKzVtb3SnUHaahKa_fhHHJT2bHK8U1UJTxMrJhvAMix8GlA-ErIf1ABZ3GSHMoOWk2L8cQz4B4Ap7EgVr84MWELzxskKsZomaOnTWGsCFTWlhYXXozUMrUQ44GumKoJlgMPAaDVl3GsDKMNv")',
                filter: 'brightness(0.85) contrast(1.1)'
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-brand-blue via-brand-blue/40 to-transparent"></div>
          </div>
          
          <div className="relative z-10 flex flex-col justify-end p-8 pt-32 pb-8 lg:p-20 text-white w-full h-full">
            <div className="space-y-8 max-w-lg">
              <div className="space-y-4">
                <div className="w-16 h-1 bg-white/30 rounded-full mb-8"></div>
                <h2 className="text-4xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                  Tu viaje seguro
                  <span className="text-brand-blue-light block">empieza aquí.</span>
                </h2>
                <p className="text-lg lg:text-xl text-blue-50 font-medium opacity-90 leading-relaxed mt-4 lg:mt-0">
                  Accede a tu cuenta para gestionar tus reservas, acumular kilómetros y viajar con la comodidad que mereces.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-6 lg:pt-10">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-blue-200">security</span>
                  <div className="text-sm">
                    <p className="font-bold">Seguridad Total</p>
                    <p className="text-blue-200/80">Monitoreo GPS 24/7</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-blue-200">schedule</span>
                  <div className="text-sm">
                    <p className="font-bold">Puntualidad</p>
                    <p className="text-blue-200/80">Horarios garantizados</p>
                  </div>
                </div>
              </div>
              
              <div className="flex lg:hidden w-full pt-8 pb-4">
                <a 
                  href="#form-section"
                  className="flex items-center justify-center gap-2 bg-white text-brand-blue font-bold px-8 py-4 rounded-xl w-full hover:bg-slate-50 transition-colors shadow-lg shadow-black/10"
                >
                  <span>Comenzar</span>
                  <span className="material-symbols-outlined">arrow_downward</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="absolute top-6 left-6 lg:top-10 lg:left-10 flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 scale-90 lg:scale-100 origin-top-left">
            <div className="flex -space-x-2">
              <img alt="Usuario" className="h-10 w-10 rounded-full border-2 border-brand-blue" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmiIIGK5EkU5jDPAcab6JJ6Ww0ge9A-b28i2fx1reI6Ox753pxiBvzp3ziOtnKe9qoJipGWF7bDOagMabjRlyfJPIgtPeSDkkfYOkG9GL2kbU8cH0jIGafBw_mL10uzhIWupsYZor3nD1q_NAbD_41JunxiLimNaDfhzK9cvO8FeRKue1txaa9RTj7XKfDCrot8Z5jGSqVW9wvTJ-XXy_BfiAdrTdgT8ZPQQrnEU83tN3aoy2G4Fn8vwzHmUdMmDz1HyndXMnsZHZR" />
              <img alt="Usuario" className="h-10 w-10 rounded-full border-2 border-brand-blue" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAue8SWGdu_Ah6PEywug0hPE9VS3iwbVQF83Jg3IiZGGJhNecnWDGcoyJ7EzeicYBb7veTnigg3vZXbdm0BcVftIco5-9dmK-z7_8uZtu-BFRj4ziwKDmvNxARXztENESXSAmZDjzxZ4XJmJzBFj89RfP7bCa7b7Iz_rAfssd0Q0K91xWNlefhq2qq2FLr4vXzw4eZPzvu5peZtM_9N_B42gWSiSnMY7_1SDa2E4X2Nj8Dv_zOAM4cKlgViMdK-nHx8WTxjWwNQofAX" />
              <img alt="Usuario" className="h-10 w-10 rounded-full border-2 border-brand-blue" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwPsOIbhuvXF3VTsUnHHNnvnK4l_CxR-ip2CYhgQJYQqmTondLxKagF_GmoFwvvU4W0M9GOYodBwNQFUWeFIKWrxQ_xjfnsXza9AihvaWXGJdCBnIc7RR4xa6kkXYLRKhA2FvjshFs6atMKVXxQp9n1D6njMpYW020taz_sY8IcOL_5kjsBwWXl8XxSso6m-i9WpLap4ipcCrptL5fp8fnsOKAUvMd82jmjc2UAjFRkzgHTdsPAVM2okKHu3_GoCiaMQBkx9KEqSsA" />
            </div>
            <div className="text-sm text-white">
              <p className="font-bold">Comunidad Cootranar</p>
              <p className="text-blue-100 opacity-80">+15k viajeros felices</p>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-blue-light/20 rounded-full -ml-48 -mb-48 blur-3xl"></div>
        </div>

        {/* Panel Derecho - Formulario */}
        <div id="form-section" className="w-full lg:w-[50%] flex flex-col bg-white lg:rounded-none rounded-t-[2.5rem] lg:-mt-0 lg:pt-0 relative z-20 custom-scrollbar overflow-y-auto order-2 lg:order-2 shadow-[0_-15px_30px_rgba(0,0,0,0.15)] lg:shadow-none min-h-[100dvh] lg:min-h-0">
          <div className="flex items-center justify-between p-6 lg:px-12 lg:pt-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-white text-2xl">directions_bus</span>
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-brand-blue">Cootranar</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-slate-500">¿No tienes cuenta?</span>
              <Link to="/registro" className="font-bold text-brand-blue hover:text-brand-blue-light transition-colors">Regístrate</Link>
            </div>
          </div>

          <div className="max-w-[480px] w-full mx-auto px-6 py-8 lg:px-12 lg:py-16 flex-grow flex flex-col justify-center">
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
                onError={handleGoogleError}
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
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">O con tu correo electrónico</span>
              <div className="flex-grow border-t border-slate-200"></div>
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
                {fieldErrors.correo && <p className="text-xs ml-1" style={{ color: '#dc2626' }}>{fieldErrors.correo}</p>}
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
                {fieldErrors.password && <p className="text-xs ml-1" style={{ color: '#dc2626' }}>{fieldErrors.password}</p>}
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
                <label htmlFor="remember" className="text-sm text-slate-600 font-medium cursor-pointer">
                  Mantener sesión iniciada
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold h-14 rounded-xl shadow-lg shadow-brand-blue/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] text-lg"
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
              </div>
            </form>

            <div className="sm:hidden text-center mt-8">
              <p className="text-slate-500 text-sm">
                ¿No tienes cuenta? <Link to="/registro" className="text-brand-blue font-bold">Regístrate</Link>
              </p>
            </div>
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

export default Login;
