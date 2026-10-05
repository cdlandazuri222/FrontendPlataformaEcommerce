import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import gsap from 'gsap';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../../shared/constants';
import logo from '../../../assets/Logo.png.png';
import busCootranar from '../../../assets/busCootranar.png';
import loginWave from '../../../assets/login-wave.svg';

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
  const location = useLocation();
  const returnTo = (location.state as any)?.returnTo || ROUTES.HOME;
  const containerRef = useRef<HTMLDivElement>(null);
  const { login, loginGoogle, loading, error, setError } = useAuth();
  const [formData, setFormData] = useState({ correo: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [socialButtons, setSocialButtons] = useState<SocialButton[]>(INITIAL_SOCIAL_BUTTONS);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dragOriginIndex = useRef<number>(-1);

  const googleContainerRef = useRef<HTMLDivElement>(null);
  const [googleWidth, setGoogleWidth] = useState<string>("360");

  // Si ya tiene sesión activa, no mostrar formulario de login, redirigir directamente
  useEffect(() => {
    const user = localStorage.getItem('usuario');
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (user && token) {
      navigate(returnTo !== ROUTES.LOGIN ? returnTo : ROUTES.HOME, { replace: true });
    }
  }, [navigate, returnTo]);

  /* ── GSAP ANIMATIONS ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. Bus background zoom entrance
      tl.from('.g-bus-bg', {
        scale: 1.12,
        opacity: 0.3,
        duration: 1.2,
        ease: 'power2.out',
      }, 0);

      // 2. Social icons wrapper pop in with stagger
      tl.from('.g-social-item', {
        opacity: 0,
        y: -22,
        scale: 0.6,
        stagger: 0.08,
        duration: 0.65,
        ease: 'back.out(2.2)',
      }, 0.1);

      // 3. Hero text title and accent
      tl.from('.g-hero-title', {
        opacity: 0,
        y: 35,
        duration: 0.8,
        ease: 'power3.out',
      }, 0.2)
      .from('.g-hero-accent', {
        opacity: 0,
        y: 25,
        scale: 0.9,
        duration: 0.85,
        ease: 'back.out(1.8)',
      }, 0.35)
      .from('.g-hero-desc', {
        opacity: 0,
        x: -25,
        filter: 'blur(4px)',
        duration: 0.75,
      }, 0.45)
      .from('.g-hero-badge', {
        opacity: 0,
        y: 20,
        scale: 0.92,
        stagger: 0.1,
        duration: 0.65,
        ease: 'back.out(1.5)',
      }, 0.55);

      // 4. White organic wave SVG slide in from right
      tl.from('.g-wave-panel', {
        opacity: 0,
        x: 80,
        duration: 0.9,
        ease: 'power3.out',
      }, 0.15);

      // 5. Right side form components
      tl.from('.g-form-logo', {
        opacity: 0,
        y: -20,
        scale: 0.85,
        duration: 0.7,
        ease: 'back.out(1.6)',
      }, 0.3)
      .from('.g-form-header', {
        opacity: 0,
        y: 18,
        duration: 0.6,
      }, 0.42)
      .from('.g-google-wrap', {
        opacity: 0,
        y: 16,
        duration: 0.55,
      }, 0.5)
      .from('.g-divider-row', {
        opacity: 0,
        scaleX: 0.7,
        duration: 0.5,
      }, 0.58)
      .from('.g-input-field', {
        opacity: 0,
        y: 20,
        stagger: 0.08,
        duration: 0.55,
        ease: 'power2.out',
      }, 0.65)
      .from('.g-submit-btn', {
        opacity: 0,
        y: 18,
        scale: 0.96,
        duration: 0.6,
        ease: 'back.out(1.5)',
      }, 0.8)
      .from('.g-footer-row', {
        opacity: 0,
        y: 10,
        duration: 0.5,
      }, 0.9);

      // Subtle breathing pulse on accent text
      gsap.to('.g-hero-accent', {
        textShadow: '0 0 20px rgba(56,189,248,0.7)',
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!googleContainerRef.current) return;
    const updateWidth = () => {
      if (googleContainerRef.current) {
        const parentWidth = googleContainerRef.current.offsetWidth;
        const widthVal = Math.max(260, Math.min(390, parentWidth));
        setGoogleWidth(String(widthVal));
      }
    };
    updateWidth();
    const timer = setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

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
      navigate(returnTo);
    } catch {
      // error handled by useAuth
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    try {
      await loginGoogle(credentialResponse.credential);
      navigate(returnTo);
    } catch {
      // error handled by useAuth
    }
  };

  return (
    <div ref={containerRef} className="w-full h-screen h-[100dvh] flex items-stretch justify-center bg-[#06183d] select-none overflow-hidden font-sans">
      <div className="relative w-full h-full flex flex-col lg:flex-row overflow-hidden">

        {/* ─── FONDO DE BUS (Ajustado específicamente al área visible izquierda) ─── */}
        <div className="g-bus-bg absolute top-0 bottom-0 left-0 w-full lg:w-[62%] xl:w-[65%] z-0 overflow-hidden bg-[#071739]">
          <img
            src={busCootranar}
            alt="Bus Cootranar"
            className="w-full h-full object-cover object-[center_35%]"
            style={{ filter: 'brightness(0.96) contrast(1.08) saturate(1.06)' }}
          />
          {/* Sombreado elegante para legibilidad de textos inferiores */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#06183d]/90 via-[#06183d]/25 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06183d]/50 via-transparent to-transparent" />
        </div>

        {/* ─── PANEL SVG ORGÁNICO BLANCO FULL-BLEED ─── */}
        <img
          src={loginWave}
          alt=""
          className="g-wave-panel hidden lg:block absolute inset-0 w-full h-full object-fill pointer-events-none z-10 select-none"
        />

        {/* ─── PANEL IZQUIERDO: HERO CONTENT ─── */}
        <div className="relative z-20 flex flex-col justify-between p-6 sm:p-10 lg:p-10 xl:p-14 w-full lg:w-[52%] h-[40vh] lg:h-full shrink-0 pointer-events-none">
          {/* Redes Sociales - Esquina superior izquierda */}
          <div className="flex items-center gap-3 pointer-events-auto">
            {socialButtons.map((btn, index) => {
              const isDragging = draggedId === btn.id;
              const isDropTarget = dragOverId === btn.id && draggedId !== btn.id;
              const isHovered = hoveredId === btn.id && !isDragging;

              return (
                <div key={btn.id} className="g-social-item">
                  <a
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
                    onTouchStart={() => {
                      dragOriginIndex.current = index;
                      setDraggedId(btn.id);
                    }}
                    onTouchMove={e => {
                      if (!draggedId) return;
                      const touch = e.touches[0];
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
                    className="flex items-center justify-center w-11 h-11 rounded-2xl shadow-xl select-none touch-none transition-all duration-200 cursor-pointer"
                    style={{
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: isDropTarget
                        ? '2px dashed rgba(255,255,255,0.95)'
                        : '1px solid rgba(255,255,255,0.3)',
                      background: isDragging
                        ? 'rgba(255,255,255,0.45)'
                        : isHovered
                          ? btn.hoverBg
                          : 'rgba(7, 24, 66, 0.65)',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      transform: isDragging
                        ? 'scale(1.18) rotate(-6deg)'
                        : isDropTarget
                          ? 'scale(1.1)'
                          : isHovered
                            ? 'scale(1.12)'
                            : 'scale(1)',
                      boxShadow: isDragging
                        ? '0 12px 30px rgba(0,0,0,0.5)'
                        : isHovered
                          ? '0 8px 24px rgba(0,0,0,0.35)'
                          : '0 4px 16px rgba(0,0,0,0.3)',
                    }}
                  >
                    {btn.icon}
                  </a>
                </div>
              );
            })}
          </div>

          {/* Hero text bottom */}
          <div className="max-w-md pb-2">
            <h2 className="g-hero-title text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight text-white mb-3">
              Tu viaje seguro <span className="g-hero-accent text-[#38bdf8] block">empieza aquí.</span>
            </h2>
            <p className="g-hero-desc text-xs sm:text-sm text-blue-100/90 font-medium leading-relaxed mb-5">
              Accede a tu cuenta para gestionar tus reservas, acumular kilómetros y viajar con la comodidad que mereces.
            </p>
            <div className="flex flex-wrap items-center gap-6 text-white">
              <div className="g-hero-badge flex items-center gap-2.5">
                <span className="material-symbols-outlined text-2xl sm:text-3xl text-sky-300">security</span>
                <div>
                  <p className="text-xs sm:text-sm font-bold leading-tight">Seguridad Total</p>
                  <p className="text-[10px] sm:text-xs text-blue-200/80 leading-tight">Monitoreo GPS 24/7</p>
                </div>
              </div>
              <div className="g-hero-badge flex items-center gap-2.5">
                <span className="material-symbols-outlined text-2xl sm:text-3xl text-sky-300">schedule</span>
                <div>
                  <p className="text-xs sm:text-sm font-bold leading-tight">Puntualidad</p>
                  <p className="text-[10px] sm:text-xs text-blue-200/80 leading-tight">Horarios garantizados</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── PANEL DERECHO: FORMULARIO DE LOGIN ─── */}
        <div className="relative z-20 w-full lg:w-[45%] xl:w-[42%] lg:ml-auto flex flex-col justify-between bg-white lg:bg-transparent rounded-t-[2.5rem] lg:rounded-none px-6 py-6 sm:px-10 lg:pl-12 lg:pr-10 xl:pl-16 xl:pr-14 lg:py-6 h-auto lg:h-full overflow-y-auto lg:overflow-hidden flex-grow">
          <div className="max-w-[390px] w-full mx-auto my-auto flex flex-col justify-center">

            {/* Logo */}
            <div className="g-form-logo flex justify-center mb-2">
              <img src={logo} alt="Cootranar" className="h-12 sm:h-14 xl:h-16 w-auto object-contain" />
            </div>

            {/* Header */}
            <header className="g-form-header mb-3.5 text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Bienvenido de nuevo</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Inicia sesión para gestionar tus viajes.</p>
            </header>

            {/* Error Message */}
            {error && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs font-semibold text-red-700 text-center">{error}</p>
              </div>
            )}

            {/* Google Login Button */}
            <div ref={googleContainerRef} className="g-google-wrap mb-3.5 flex justify-center google-login-wrapper w-full">
              {import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'TU_GOOGLE_CLIENT_ID_AQUI' && (
                <GoogleLogin
                  key={googleWidth}
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Error al iniciar sesión con Google. Por favor, intenta de nuevo.')}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="pill"
                  logo_alignment="left"
                  width={googleWidth}
                />
              )}
            </div>

            {/* Divider */}
            <div className="g-divider-row relative flex items-center mb-3.5">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-3 text-slate-400 text-[10.5px] font-bold uppercase tracking-wider">O con tu correo electrónico</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Correo Electrónico */}
              <div className="g-input-field space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Correo Electrónico</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">mail</span>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 rounded-2xl h-12 transition-all placeholder:text-slate-400 text-[14.5px] bg-slate-50/80 border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    style={{ borderColor: fieldErrors.correo ? '#f87171' : '#cbd5e1' }}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                {fieldErrors.correo && <p className="text-[11.5px] ml-1 text-red-600">{fieldErrors.correo}</p>}
              </div>

              {/* Contraseña */}
              <div className="g-input-field space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[13px] font-bold text-slate-700">Contraseña</label>
                  <Link to={ROUTES.RECUPERAR_PASSWORD} className="text-xs font-bold text-brand-blue hover:text-brand-blue-light transition-colors">¿Olvidaste tu contraseña?</Link>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-12 rounded-2xl h-12 transition-all placeholder:text-slate-400 text-[14.5px] bg-slate-50/80 border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    style={{ borderColor: fieldErrors.password ? '#f87171' : '#cbd5e1' }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-xl cursor-pointer"
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-[11.5px] ml-1 text-red-600">{fieldErrors.password}</p>}
              </div>

              {/* Mantener sesión iniciada */}
              <div className="g-input-field flex items-center gap-2.5 ml-1 pt-0.5">
                <input
                  type="checkbox"
                  name="remember"
                  id="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 text-brand-blue border-slate-300 rounded focus:ring-brand-blue cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs text-slate-600 font-medium cursor-pointer select-none">Mantener sesión iniciada</label>
              </div>

              {/* Botón Iniciar Sesión (con altura robusta y proporciones armónicas) */}
              <div className="g-submit-btn pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#082b71] hover:bg-[#061d4e] active:scale-[0.99] text-white font-bold h-12 rounded-full shadow-lg shadow-[#082b71]/25 transition-all duration-200 text-[15px] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}</span>
                  {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
                </button>
                <p className="text-center text-slate-500 text-xs mt-3">
                  ¿No tienes cuenta? <Link to={ROUTES.REGISTRO} className="text-brand-blue font-bold hover:underline">Regístrate</Link>
                </p>
              </div>
            </form>

          </div>

          {/* Footer */}
          <footer className="g-footer-row pt-2 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-slate-400">
            <p>© 2024 Cootranar S.A. Calidad y servicio.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-brand-blue transition-colors">Privacidad</a>
              <a href="#" className="hover:text-brand-blue transition-colors">Términos</a>
            </div>
          </footer>
        </div>

      </div>
    </div>
  );
}