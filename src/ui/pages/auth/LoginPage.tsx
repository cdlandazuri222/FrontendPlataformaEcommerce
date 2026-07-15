import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../../shared/constants';
import logo from '../../../assets/Logo.png.png';
import busCootranar from '../../../assets/busCootranar.png';

type SocialButton = {
  id: string;
  title: string;
  href: string;
  hoverBg: string;
  icon: React.ReactNode;
};

const INSTAGRAM_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);
const FACEBOOK_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
const TIKTOK_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);
const WHATSAPP_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const INITIAL_SOCIAL_BUTTONS: SocialButton[] = [
  { id: 'instagram', title: 'Instagram', href: 'https://www.instagram.com/cootranar/', hoverBg: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', icon: INSTAGRAM_ICON },
  { id: 'facebook',  title: 'Facebook',  href: 'https://www.facebook.com/cootranar',  hoverBg: '#1877F2', icon: FACEBOOK_ICON },
  { id: 'tiktok',   title: 'TikTok',    href: 'https://www.tiktok.com/@cootranar',   hoverBg: '#010101', icon: TIKTOK_ICON },
  { id: 'whatsapp', title: 'WhatsApp',  href: 'https://wa.me/573000000000',          hoverBg: '#25D366', icon: WHATSAPP_ICON },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginGoogle, loading, error, setError } = useAuth();
  const [formData, setFormData] = useState({ correo: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [socialButtons, setSocialButtons] = useState<SocialButton[]>(INITIAL_SOCIAL_BUTTONS);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dragOriginIndex = useRef<number>(-1);

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
    <div className="min-h-screen flex items-stretch lg:items-center justify-center lg:p-6" style={{ backgroundColor: '#f8fafc' }}>
      <div className="flex w-full min-h-screen lg:min-h-0 lg:h-[95vh] overflow-hidden lg:shadow-2xl bg-brand-blue lg:bg-white max-w-[1536px] lg:rounded-3xl border-0 lg:border border-slate-100 flex-col lg:flex-row">

        {/* Panel Izquierdo */}
        <div className="flex w-full h-[100dvh] lg:h-auto lg:w-[50%] relative overflow-hidden bg-brand-blue order-1 lg:order-1 shrink-0 lg:rounded-l-3xl rounded-none">
          <div className="absolute inset-0 z-0">
            <img src={busCootranar} alt="" className="w-full h-full object-cover scale-[1.03] origin-center" style={{ filter: 'brightness(0.85) contrast(1.1)', objectPosition: 'center 40%' }} />
            <div className="absolute inset-0 bg-gradient-to-tl from-brand-blue via-brand-blue/40 to-transparent" />
          </div>

          {/* Redes Sociales - Esquina superior izquierda (Draggables & Touch Support) */}
          <div className="absolute top-8 left-8 lg:top-20 lg:left-20 z-20 flex items-center gap-3">
            {socialButtons.map((btn, index) => {
              const isDragging = draggedId === btn.id;
              const isDropTarget = dragOverId === btn.id && draggedId !== btn.id;
              const isHovered = hoveredId === btn.id && !isDragging;

              return (
                <a
                  key={btn.id}
                  data-id={btn.id}
                  data-index={index}
                  href={isDragging ? undefined : btn.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={btn.title}
                  draggable
                  onClick={e => { if (draggedId) e.preventDefault(); }}
                  onMouseEnter={() => setHoveredId(btn.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  /* ── Desktop Drag handlers ── */
                  onDragStart={e => {
                    dragOriginIndex.current = index;
                    setDraggedId(btn.id);
                    e.dataTransfer.effectAllowed = 'move';
                    const ghost = document.createElement('div');
                    ghost.style.width = '0px';
                    ghost.style.height = '0px';
                    document.body.appendChild(ghost);
                    e.dataTransfer.setDragImage(ghost, 0, 0);
                    setTimeout(() => document.body.removeChild(ghost), 0);
                  }}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setDragOverId(null);
                    dragOriginIndex.current = -1;
                  }}
                  onDragEnter={e => {
                    e.preventDefault();
                    if (draggedId && draggedId !== btn.id) {
                      setDragOverId(btn.id);
                      setSocialButtons(prev => {
                        const next = [...prev];
                        const from = next.findIndex(b => b.id === draggedId);
                        const to = index;
                        if (from === -1 || from === to) return prev;
                        const [moved] = next.splice(from, 1);
                        next.splice(to, 0, moved);
                        return next;
                      });
                    }
                  }}
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                  onDrop={e => { e.preventDefault(); setDragOverId(null); }}
                  /* ── Mobile Touch handlers ── */
                  onTouchStart={() => {
                    dragOriginIndex.current = index;
                    setDraggedId(btn.id);
                  }}
                  onTouchMove={e => {
                    if (!draggedId) return;
                    const touch = e.touches[0];
                    // Encontrar elemento debajo del dedo
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    const targetEl = element?.closest('[data-id]');
                    if (targetEl) {
                      const targetId = targetEl.getAttribute('data-id');
                      const targetIdxStr = targetEl.getAttribute('data-index');
                      const targetIdx = targetIdxStr ? parseInt(targetIdxStr, 10) : -1;

                      if (targetId && targetId !== draggedId && targetIdx !== -1) {
                        setDragOverId(targetId);
                        setSocialButtons(prev => {
                          const next = [...prev];
                          const from = next.findIndex(b => b.id === draggedId);
                          const to = targetIdx;
                          if (from === -1 || from === to) return prev;
                          const [moved] = next.splice(from, 1);
                          next.splice(to, 0, moved);
                          return next;
                        });
                      }
                    }
                  }}
                  onTouchEnd={() => {
                    setDraggedId(null);
                    setDragOverId(null);
                    dragOriginIndex.current = -1;
                  }}
                  className="flex items-center justify-center w-11 h-11 rounded-2xl shadow-lg select-none touch-none"
                  style={{
                    backdropFilter: 'blur(10px)',
                    border: isDropTarget
                      ? '2px dashed rgba(255,255,255,0.9)'
                      : '1px solid rgba(255,255,255,0.3)',
                    background: isDragging
                      ? 'rgba(255,255,255,0.35)'
                      : isHovered
                        ? btn.hoverBg
                        : 'rgba(255,255,255,0.15)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transform: isDragging
                      ? 'scale(1.18) rotate(-6deg)'
                      : isDropTarget
                        ? 'scale(1.08)'
                        : isHovered
                          ? 'scale(1.1)'
                          : 'scale(1)',
                    opacity: isDragging ? 0.7 : 1,
                    boxShadow: isDragging
                      ? '0 12px 30px rgba(0,0,0,0.35)'
                      : isDropTarget
                        ? '0 0 0 3px rgba(255,255,255,0.5)'
                        : '',
                    transition: isDragging
                      ? 'transform 0.15s ease, opacity 0.15s ease'
                      : 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    willChange: 'transform',
                  }}
                >
                  {/* Grip dots hint visible on hover */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '3px',
                      fontSize: '7px',
                      lineHeight: 1,
                      color: 'rgba(255,255,255,0.6)',
                      letterSpacing: '1px',
                      pointerEvents: 'none',
                      opacity: isHovered || isDragging ? 1 : 0,
                      transition: 'opacity 0.2s',
                      userSelect: 'none',
                    }}
                  >⠿</span>
                  {btn.icon}
                </a>
              );
            })}
          </div>
          <div className="relative z-10 flex flex-col justify-end p-8 pt-32 pb-8 lg:p-20 text-white w-full h-full">
            <div className="space-y-8 max-w-lg">
              <div className="space-y-4">
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

            <div className="mb-8 flex justify-center google-login-wrapper">
              {import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'TU_GOOGLE_CLIENT_ID_AQUI' && (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Error al iniciar sesión con Google. Por favor, intenta de nuevo.')}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="pill"
                  logo_alignment="left"
                  width="360"
                />
              )}
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
                  <Link to={ROUTES.RECUPERAR_PASSWORD} className="text-xs font-bold text-brand-blue hover:text-brand-blue-light">¿Olvidaste tu contraseña?</Link>
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