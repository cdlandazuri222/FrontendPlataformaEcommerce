import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../../assets/Logo.png.png';
import busCootranar from '../../../assets/busCootranar.png';

export function OlvidoPasswordPage() {
  const { olvidoPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Por favor ingresa tu correo electrónico'); return; }
    if (!email.includes('@')) { setError('Por favor ingresa un correo electrónico válido'); return; }
    setError('');
    try {
      await olvidoPassword(email);
      setEnviado(true);
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex items-start lg:items-center justify-center lg:p-6" style={{ backgroundColor: '#f8fafc' }}>
      <div className="flex w-full min-h-screen lg:min-h-0 lg:h-[95vh] overflow-hidden lg:shadow-2xl bg-[#0B1E4A] lg:bg-white max-w-[1536px] lg:rounded-3xl border-0 lg:border border-slate-100 flex-col lg:flex-row">
        
        {/* Panel Izquierdo */}
        <div className="flex w-full h-[100dvh] lg:h-auto lg:w-[50%] relative overflow-hidden bg-brand-blue order-1 lg:order-1 shrink-0 lg:rounded-l-3xl">
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-cover scale-[1.03] origin-center" style={{ backgroundImage: `url(${busCootranar})`, filter: 'brightness(0.85) contrast(1.1)', backgroundPosition: 'center 40%' }} />
            <div className="absolute inset-0 bg-gradient-to-tl from-brand-blue via-brand-blue/40 to-transparent" />
          </div>
          <div className="relative z-10 flex flex-col justify-between p-8 lg:p-14 text-white w-full h-full">
            {/* Top */}
            <div className="w-12 h-1 bg-white/40 rounded-full" />

            {/* Center */}
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-6xl font-extrabold leading-tight tracking-tight drop-shadow-md">
                Recupera<br/>tu acceso.
              </h2>
              <p className="text-sm lg:text-base text-white/80 leading-relaxed max-w-xs">
                Restablece tu contraseña de forma segura y rápida. Estamos aquí para ayudarte.
              </p>
            </div>

    

            <div className="flex lg:hidden w-full">
              <a href="#form-section" className="flex items-center justify-center gap-2 bg-white text-[#0B1E4A] font-bold px-8 py-4 rounded-xl w-full hover:bg-slate-50 transition-colors shadow-lg">
                <span>Recuperar</span>
                <span className="material-symbols-outlined">arrow_downward</span>
              </a>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Formulario */}
        <div id="form-section" className="w-full lg:w-[50%] flex flex-col bg-white lg:rounded-none rounded-t-[2.5rem] lg:-mt-0 lg:pt-0 relative z-20 custom-scrollbar overflow-y-auto order-2 lg:order-2 shadow-[0_-15px_30px_rgba(0,0,0,0.15)] lg:shadow-none min-h-[100dvh] lg:min-h-0">
          <div className="max-w-[480px] w-full mx-auto px-6 py-8 lg:px-12 lg:py-16 flex-grow flex flex-col justify-center text-center">
            
            <div className="flex justify-center mb-10 lg:mb-16">
              <img src={logo} alt="Cootranar" className="h-10 lg:h-12 w-auto" />
            </div>

            {/* Panel de formulario */}
              {enviado ? (
                <>
                  <div className="flex justify-center mb-6">
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-600 text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
                    </div>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 mb-4">Revisa tu correo</h1>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8">
                    Si el correo está registrado, recibirás las instrucciones para restablecer tu contraseña.
                  </p>
                   <p className="text-slate-500 text-sm leading-relaxed mb-8">
                    Si no encuentras el correo en tu bandeja principal, buscala en spam
                  </p>
                  <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-2 text-slate-600 hover:text-[#0B1E4A] text-sm font-bold transition-colors">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Volver al Inicio de Sesión
                  </Link>
                </>
              ) : (
                <>
                <header className="mb-10 text-center">
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
                    ¿Olvidaste tu contraseña?
                  </h1>
                  <p className="text-slate-500 text-sm lg:text-base leading-relaxed px-4">
                    Ingresa tu correo electrónico y te enviaremos las<br className="hidden lg:block"/>
                    instrucciones para restablecer tu clave.
                  </p>
                </header>

                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 text-left">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 ml-1">Correo Electrónico</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-3.5 text-slate-400 text-xl">mail</span>
                      <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        className="w-full pl-12 rounded-xl h-14 transition-all placeholder:text-slate-400 text-sm"
                        style={{ border: `1px solid ${error ? '#f87171' : '#f1f5f9'}`, backgroundColor: '#f8fafc' }}
                        placeholder="ejemplo@cootranar.com.co"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold h-12 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] text-sm flex items-center justify-center gap-2"
                    >
                      {loading ? 'Enviando...' : 'Enviar instrucciones'}
                      {!loading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                    </button>
                    
                    <div className="mt-8 text-center">
                      <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-2 text-slate-600 hover:text-[#0B1E4A] text-sm font-bold transition-colors">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Volver al Inicio de Sesión
                      </Link>
                    </div>
                  </div>
                </form>
              </>
              )}
          </div>

          <footer className="mt-auto p-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-400 font-medium">
            <p>© 2024 Cootranar S.A. Calidad y servicio.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-600 transition-colors">Privacidad</a>
              <a href="#" className="hover:text-slate-600 transition-colors">Términos</a>
              <a href="#" className="hover:text-slate-600 transition-colors">Soporte</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}