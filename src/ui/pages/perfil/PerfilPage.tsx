import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePreferencias } from '../../context/PreferenciasContext';
import { Navbar } from '../../components/layout/Navbar';
import { AvatarUsuario, FOTO_PERFIL_LOCAL_KEY } from '../../components/common/AvatarUsuario';
import { ROUTES } from '../../../shared/constants';
import type { Idioma } from '../../../shared/i18n/translations';


/* ────────────────────────────────────────────
   Campo de solo lectura
──────────────────────────────────────────── */
function Campo({
  label,
  valor,
  icon,
  esDark,
}: {
  label: string;
  valor?: string | null;
  icon?: string;
  esDark: boolean;
}) {
  const fieldBg = esDark
    ? 'bg-[#1a2a3a] border-white/5 text-slate-200'
    : 'bg-[#f0f2f5] border-slate-200/60 text-slate-700';

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {label}
      </span>
      <div className={`rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] flex items-center gap-2 transition-colors border ${fieldBg}`}>
        {icon && (
          <span className="material-symbols-outlined text-base text-slate-400 shrink-0">
            {icon}
          </span>
        )}
        {valor ? (
          <span>{valor}</span>
        ) : (
          <span className="text-slate-400 italic">Información no disponible</span>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Página de Perfil
──────────────────────────────────────────── */
export function PerfilPage() {
  const navigate = useNavigate();
  const { getUsuario, logout } = useAuth();
  const { esDark, toggleTema, idioma, setIdioma, tx } = usePreferencias();
  const usuario = getUsuario();
  const p = tx.perfil;

  /* ── Estado de foto de perfil ── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(
    localStorage.getItem(FOTO_PERFIL_LOCAL_KEY)
  );
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  /* ── Al hacer click en el botón de cámara ── */
  const abrirSelectorFoto = () => {
    fileInputRef.current?.click();
  };

  /* ── Al seleccionar un archivo ── */
  const handleArchivoSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // Validar que sea imagen
    if (!archivo.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    // Validar tamaño (máx 5 MB)
    if (archivo.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5 MB.');
      return;
    }

    setSubiendoFoto(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      localStorage.setItem(FOTO_PERFIL_LOCAL_KEY, dataUrl);
      setFotoPreview(dataUrl);
      setSubiendoFoto(false);
    };
    reader.readAsDataURL(archivo);

    // Limpiar el input para permitir volver a seleccionar el mismo archivo
    e.target.value = '';
  };

  if (!usuario) {
    navigate(ROUTES.LOGIN);
    return null;
  }

  /* ── Clases condicionales tema ── */
  const pageBg    = esDark ? 'bg-[#0d1b2e]' : 'bg-[#f6f6f8]';
  const cardBg    = esDark ? 'bg-[#122040] border-white/5'  : 'bg-white border-slate-100';
  const titleText = esDark ? 'text-white' : 'text-slate-800';
  const subtitleText = 'text-slate-400';
  const divider   = esDark ? 'bg-white/5' : 'bg-slate-100';
  const pillBg    = esDark ? 'bg-white/5' : 'bg-slate-100';
  const toggleActive   = esDark ? 'bg-blue-600' : 'bg-blue-600';
  const toggleInactive = esDark ? 'bg-white/10' : 'bg-slate-200';
  const itemLabel = esDark ? 'text-slate-200' : 'text-slate-700';
  const iconRowBg = esDark ? 'bg-white/5' : 'bg-slate-100';
  const iconColor = esDark ? 'text-slate-300' : 'text-slate-600';
  const pillLangActive   = 'bg-blue-600 text-white';
  const pillLangInactive = esDark
    ? 'text-slate-400 hover:text-slate-200'
    : 'text-slate-500 hover:text-slate-800';

  return (
    <div className={`min-h-screen transition-colors duration-200 ${pageBg}`}>
      <Navbar />

      {/* Input de archivo oculto — acepta imágenes desde cualquier dispositivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture={undefined}   /* sin capture → abre galería + cámara según el dispositivo */
        className="hidden"
        onChange={handleArchivoSeleccionado}
        aria-label="Seleccionar foto de perfil"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-10 space-y-5">

        {/* ── Banner de perfil ── */}
        <div
          className="rounded-2xl overflow-hidden shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #0d1b2e 0%, #122040 40%, #0e2d5a 100%)',
          }}
        >
          <div className="relative px-8 pt-8 pb-6">
            {/* Círculos decorativos */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/3 -translate-y-12 translate-x-12 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-blue-500/5 translate-y-10 -translate-x-10 pointer-events-none" />

            <div className="relative flex items-center gap-6">
              {/* Mockup dispositivo (solo sm+) */}
              <div className="hidden sm:flex shrink-0 w-28 h-28 rounded-2xl overflow-hidden bg-[#0a1628] items-center justify-center shadow-lg shadow-black/40 ring-1 ring-white/10 relative">
                <div className="w-16 h-24 rounded-xl bg-gradient-to-b from-slate-700 to-slate-900 ring-1 ring-white/10 flex flex-col overflow-hidden">
                  <div className="h-2 bg-slate-600 flex items-center justify-center">
                    <div className="w-4 h-0.5 rounded-full bg-slate-500" />
                  </div>
                  <div className="flex-1 bg-gradient-to-b from-[#0e3a8c]/80 to-[#0a1628] flex items-center justify-center overflow-hidden">
                    {fotoPreview ? (
                      <img src={fotoPreview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-blue-400 text-2xl">person</span>
                    )}
                  </div>
                  <div className="h-3 bg-slate-600 flex items-center justify-center">
                    <div className="w-5 h-1 rounded-full bg-slate-500" />
                  </div>
                </div>

                {/* Botón cámara sobre el mockup */}
                <button
                  onClick={abrirSelectorFoto}
                  title={p.editarFoto}
                  disabled={subiendoFoto}
                  className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 flex items-center justify-center shadow-md ring-2 ring-[#0d1b2e] transition-all duration-200 disabled:opacity-60"
                >
                  {subiendoFoto ? (
                    <span className="material-symbols-outlined text-white text-sm animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-white text-sm">photo_camera</span>
                  )}
                </button>
              </div>

              {/* Nombre e info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                  {usuario.nombre}{' '}
                  <span className="text-[#4ea8f7]">{usuario.apellido}</span>
                </h1>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-300 text-xs font-semibold">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <span>{p.clienteCootranar}</span>
                </div>
              </div>

              {/* Avatar + botón cámara (solo móvil) */}
              <div className="sm:hidden shrink-0 relative">
                <AvatarUsuario usuario={usuario} size="xl" fotoLocal={fotoPreview} />
                <button
                  onClick={abrirSelectorFoto}
                  title={p.editarFoto}
                  disabled={subiendoFoto}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md ring-2 ring-[#0d1b2e] transition-all duration-200 disabled:opacity-60"
                >
                  {subiendoFoto ? (
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Información Personal ── */}
        <div className={`rounded-2xl shadow-sm transition-colors border ${cardBg}`}>
          <div className="px-6 pt-6 pb-2 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-red-500 text-xl">badge</span>
              </div>
              <div>
                <h2 className={`text-base font-bold ${titleText}`}>{p.infoPersonal}</h2>
                <p className={`text-xs mt-0.5 ${subtitleText}`}>Gestiona tus datos de contacto básicos</p>
              </div>
            </div>
            <button className="text-xs font-semibold text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mt-1 whitespace-nowrap">
              {p.editarPerfil}
            </button>
          </div>

          <div className={`h-px mx-6 mt-4 ${divider}`} />

          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo label={p.nombre}   valor={usuario.nombre}   esDark={esDark} />
              <Campo label={p.apellido} valor={usuario.apellido} esDark={esDark} />
            </div>
            <Campo label={p.correo}    valor={usuario.correo}   icon="mail"          esDark={esDark} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo label={p.telefono}  valor={usuario.telefono}  icon="phone_android" esDark={esDark} />
              <Campo label={p.documento} valor={usuario.documento} icon="badge"         esDark={esDark} />
            </div>
            <Campo label={p.direccion} valor={usuario.direccion} icon="location_on"   esDark={esDark} />
          </div>

          <div className="px-6 pb-5 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span>Tus datos están protegidos bajo nuestra política de privacidad</span>
          </div>
        </div>

        {/* ── Preferencias ── */}
        <div className={`rounded-2xl shadow-sm transition-colors border ${cardBg}`}>
          <div className="px-6 pt-6 pb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-blue-500 text-xl">tune</span>
            </div>
            <div>
              <h2 className={`text-base font-bold ${titleText}`}>{p.preferencias}</h2>
              <p className={`text-xs mt-0.5 ${subtitleText}`}>Personaliza tu experiencia</p>
            </div>
          </div>

          <div className={`h-px mx-6 mt-4 ${divider}`} />

          <div className="px-6 py-5 space-y-5">
            {/* Toggle modo oscuro */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${iconRowBg}`}>
                  <span className={`material-symbols-outlined text-xl ${iconColor}`}>
                    {esDark ? 'dark_mode' : 'light_mode'}
                  </span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${itemLabel}`}>{p.apariencia}</p>
                  <p className={`text-xs ${subtitleText}`}>{esDark ? p.modoDark : p.modoLight}</p>
                </div>
              </div>
              <button
                onClick={toggleTema}
                role="switch"
                aria-checked={esDark}
                className={`relative inline-flex h-7 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                  esDark ? toggleActive : toggleInactive
                }`}
                style={{ width: '52px' }}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    esDark ? 'translate-x-[28px]' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className={`h-px ${divider}`} />

            {/* Selector de idioma */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${iconRowBg}`}>
                  <span className={`material-symbols-outlined text-xl ${iconColor}`}>language</span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${itemLabel}`}>{p.idioma}</p>
                  <p className={`text-xs ${subtitleText}`}>{idioma === 'es' ? p.espanol : p.ingles}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 rounded-xl p-1 transition-colors ${pillBg}`}>
                {(['es', 'en'] as Idioma[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setIdioma(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      idioma === lang ? pillLangActive : pillLangInactive
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Cerrar sesión ── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-red-500/25 text-sm"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          {p.cerrarSesion}
        </button>

      </div>
    </div>
  );
}
