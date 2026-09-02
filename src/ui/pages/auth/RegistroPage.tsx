import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../../shared/constants';
import logo from '../../../assets/Logo.png.png';
import busCootranar from '../../../assets/busCootranar.png';
import loginWave from '../../../assets/login-wave.svg';

const TIPOS_DOCUMENTO = ['CC', 'TI', 'CE', 'Pasaporte'];

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

export function RegistroPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { registro, loading, error, setError } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    confirmarPassword: '',
    tipoDocumento: 'CC',
    documento: '',
    telefono: '',
    direccion: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const [socialButtons, setSocialButtons] = useState<SocialButton[]>(INITIAL_SOCIAL_BUTTONS);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dragOriginIndex = useRef<number>(-1);

  /* ── GSAP ANIMATIONS ── */
  useEffect(() => {
    if (success) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. Bus background zoom entrance
      tl.from('.g-bus-bg', {
        scale: 1.12,
        opacity: 0.3,
        duration: 1.2,
        ease: 'power2.out',
      }, 0);

      // 2. Social icons
      tl.from('.g-social-item', {
        opacity: 0,
        y: -22,
        scale: 0.6,
        stagger: 0.08,
        duration: 0.65,
        ease: 'back.out(2.2)',
      }, 0.1);

      // 3. Hero text title and badges
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

      // 4. White organic wave SVG slide in
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
      .from('.g-form-grid', {
        opacity: 0,
        y: 20,
        duration: 0.65,
        ease: 'power2.out',
      }, 0.52)
      .from('.g-submit-btn', {
        opacity: 0,
        y: 18,
        scale: 0.96,
        duration: 0.6,
        ease: 'back.out(1.5)',
      }, 0.7)
      .from('.g-footer-row', {
        opacity: 0,
        y: 10,
        duration: 0.5,
      }, 0.85);

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
  }, [success]);

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
      case 'confirmarPassword':
        return value !== formData.password ? 'Las contraseñas no coinciden' : '';
      case 'telefono':
        return !/^\d{7,15}$/.test(value) ? 'Teléfono inválido (7-15 dígitos)' : '';
      case 'documento':
        return !/^\d+$/.test(value) ? 'Solo se permiten números' : '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFieldErrors({ ...fieldErrors, [name]: validarCampo(name, value) });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmarPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmarPassword: 'Las contraseñas no coinciden' }));
      return;
    }
    try {
      const { confirmarPassword: _, ...data } = formData;
      await registro(data);
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message?.toLowerCase() || '';
      if (msg.includes('documento') && (msg.includes('existe') || msg.includes('registrado') || msg.includes('uso'))) {
        setFieldErrors(prev => ({ ...prev, documento: 'El documento ya se encuentra registrado' }));
      }
      if (msg.includes('correo') && (msg.includes('existe') || msg.includes('registrado') || msg.includes('uso'))) {
        setFieldErrors(prev => ({ ...prev, correo: 'El correo ya se encuentra registrado' }));
      }
    }
  };

  if (success) {
    return (
      <div className="w-full h-screen h-[100dvh] flex items-center justify-center bg-[#06183d] p-4 select-none">
        <div className="bg-white px-8 py-10 rounded-3xl shadow-2xl max-w-[420px] w-full text-center relative z-10 border border-slate-100">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-emerald-600 text-3xl font-bold">check_circle</span>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-[#082b71] mb-2 tracking-tight">¡Registro Exitoso!</h2>
          <p className="text-slate-700 font-semibold text-sm mb-2">Hemos enviado un correo de verificación a tu cuenta.</p>
          <p className="text-slate-500 text-xs mb-8 leading-relaxed">Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.</p>
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#082b71] hover:bg-[#061d4e] text-white font-bold text-sm h-12 rounded-full transition-all shadow-lg shadow-[#082b71]/25 mb-6"
          >
            <span>Ir a mi correo</span>
            <span className="material-symbols-outlined text-lg">mail</span>
          </a>
          <div>
            <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-blue text-xs font-bold transition-colors">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Volver al Inicio de Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-screen h-[100dvh] flex items-stretch justify-center bg-[#06183d] select-none overflow-hidden font-sans">
      <div className="relative w-full h-full flex flex-col lg:flex-row overflow-hidden">

        {/* ─── FONDO DE BUS (Ajustado a la zona visible izquierda) ─── */}
        <div className="g-bus-bg absolute top-0 bottom-0 left-0 w-full lg:w-[62%] xl:w-[65%] z-0 overflow-hidden bg-[#071739]">
          <img
            src={busCootranar}
            alt="Bus Cootranar"
            className="w-full h-full object-cover object-[center_35%]"
            style={{ filter: 'brightness(0.96) contrast(1.08) saturate(1.06)' }}
          />
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
        <div className="relative z-20 flex flex-col justify-between p-6 sm:p-10 lg:p-10 xl:p-14 w-full lg:w-[50%] h-[35vh] lg:h-full shrink-0 pointer-events-none">
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
              Únete a <span className="g-hero-accent text-[#38bdf8] block">Cootranar.</span>
            </h2>
            <p className="g-hero-desc text-xs sm:text-sm text-blue-100/90 font-medium leading-relaxed mb-5">
              Crea tu cuenta y empieza a reservar tus viajes de forma rápida, cómoda y segura.
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

        {/* ─── PANEL DERECHO: FORMULARIO DE REGISTRO ─── */}
        <div className="relative z-20 w-full lg:w-[48%] xl:w-[45%] lg:ml-auto flex flex-col justify-between bg-white lg:bg-transparent rounded-t-[2.5rem] lg:rounded-none px-6 py-5 sm:px-10 lg:pl-12 lg:pr-10 xl:pl-16 xl:pr-14 lg:py-4 h-auto lg:h-full overflow-y-auto custom-scrollbar shadow-2xl lg:shadow-none flex-grow">
          <div className="max-w-[440px] w-full mx-auto my-auto flex flex-col justify-center">

            {/* Logo */}
            <div className="g-form-logo flex justify-center mb-1">
              <img src={logo} alt="Cootranar" className="h-10 sm:h-12 xl:h-14 w-auto object-contain" />
            </div>

            {/* Header */}
            <header className="g-form-header mb-3 text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Crear cuenta</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Completa tus datos para registrarte.</p>
            </header>

            {/* Error Message */}
            {error && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs font-semibold text-red-700 text-center">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="g-form-grid space-y-2.5">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre" icon="person" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Juan" error={fieldErrors.nombre} required />
                <Field label="Apellido" icon="person" name="apellido" value={formData.apellido} onChange={handleChange} placeholder="Pérez" error={fieldErrors.apellido} required />
              </div>

              {/* Correo Electrónico */}
              <Field label="Correo Electrónico" icon="mail" name="correo" type="email" value={formData.correo} onChange={handleChange} placeholder="usuario@ejemplo.com" error={fieldErrors.correo} required />

              {/* Tipo y Número de Documento */}
              <div className="grid grid-cols-[120px_1fr] gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Tipo Doc.</label>
                  <div className="relative">
                    <select
                      name="tipoDocumento"
                      value={formData.tipoDocumento}
                      onChange={handleChange}
                      className="w-full rounded-2xl h-11 px-3 text-xs sm:text-[13.5px] font-bold text-slate-700 bg-slate-50/80 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer transition-all"
                    >
                      {TIPOS_DOCUMENTO.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <Field label="Número de Documento" icon="badge" name="documento" value={formData.documento} onChange={handleChange} placeholder="1234567890" error={fieldErrors.documento} required />
              </div>

              {/* Teléfono y Dirección */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Teléfono" icon="phone" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="3001234567" error={fieldErrors.telefono} required />
                <Field label="Dirección" icon="home" name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Calle 123 #45-67" error={fieldErrors.direccion} required />
              </div>

              {/* Contraseñas en Grid de 2 Columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Contraseña</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">lock</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-9 rounded-2xl h-11 transition-all placeholder:text-slate-400 text-[13.5px] bg-slate-50/80 border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      style={{ borderColor: fieldErrors.password ? '#f87171' : '#cbd5e1' }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                    >
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-[11px] ml-1 text-red-600">{fieldErrors.password}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Confirmar</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">lock_reset</span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmarPassword"
                      value={formData.confirmarPassword}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-9 rounded-2xl h-11 transition-all placeholder:text-slate-400 text-[13.5px] bg-slate-50/80 border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      style={{ borderColor: fieldErrors.confirmarPassword ? '#f87171' : '#cbd5e1' }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                    >
                      {showConfirm ? 'visibility_off' : 'visibility'}
                    </button>
                  </div>
                  {fieldErrors.confirmarPassword && <p className="text-[11px] ml-1 text-red-600">{fieldErrors.confirmarPassword}</p>}
                </div>
              </div>

              {/* Botón Crear Cuenta */}
              <div className="g-submit-btn pt-1.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#082b71] hover:bg-[#061d4e] active:scale-[0.99] text-white font-bold h-12 rounded-full shadow-lg shadow-[#082b71]/25 transition-all duration-200 text-[15px] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'Registrando...' : 'Crear Cuenta'}</span>
                  {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
                </button>
                <p className="text-center text-slate-500 text-xs mt-2.5">
                  ¿Ya tienes cuenta? <Link to={ROUTES.LOGIN} className="text-brand-blue font-bold hover:underline">Inicia sesión</Link>
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

function Field({
  label, icon, name, type = 'text', value, onChange, placeholder, error, required,
}: {
  label: string; icon: string; name: string; type?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; error?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-700 ml-1">{label}</label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">{icon}</span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full pl-10 pr-3.5 rounded-2xl h-11 transition-all placeholder:text-slate-400 text-[13.5px] bg-slate-50/80 border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          style={{ borderColor: error ? '#f87171' : '#cbd5e1' }}
          placeholder={placeholder}
        />
      </div>
      {error && <p className="text-[11px] ml-1 text-red-600">{error}</p>}
    </div>
  );
}