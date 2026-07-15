import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePreferencias } from '../../context/PreferenciasContext';
import { ROUTES } from '../../../shared/constants';
import { AvatarUsuario } from '../common/AvatarUsuario';
import type { Idioma } from '../../../shared/i18n/translations';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getUsuario, logout } = useAuth();
  const usuario = getUsuario();
  const { esDark, toggleTema, idioma, setIdioma, tx } = usePreferencias();
  const n = tx.navbar;

  const enlacesDesktop = [
    { label: n.home, path: ROUTES.HOME },
    { label: n.misViajes, path: ROUTES.MIS_VIAJES },
    { label: n.encomiendas, path: ROUTES.ENCOMIENDAS },
  ];

  const enlacesBottomNav = [
    { label: n.home, path: ROUTES.HOME, icon: 'home' },
    { label: n.misViajes, path: ROUTES.MIS_VIAJES, icon: 'history' },
    { label: n.encomiendas, path: ROUTES.ENCOMIENDAS, icon: 'local_shipping' },
    { label: n.perfil, path: ROUTES.PERFIL, icon: 'person' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  /* ── Clases condicionales según tema ── */
  const navBg   = esDark ? 'bg-[#0d1b2e] border-white/5'  : 'bg-white border-slate-200';
  const linkActive   = esDark ? 'text-white' : 'text-[#0e3a8c]';
  const linkInactive = esDark
    ? 'text-slate-400 hover:text-white'
    : 'text-slate-500 hover:text-[#0e3a8c]';
  const pillBg  = esDark ? 'bg-white/5'   : 'bg-slate-100';
  const pillActive = esDark ? 'bg-white/15 text-white' : 'bg-[#0e3a8c] text-white';
  const pillInactive = esDark
    ? 'text-slate-400 hover:text-white'
    : 'text-slate-500 hover:text-slate-800';
  const iconBtn = esDark
    ? 'text-slate-400 hover:text-white hover:bg-white/10'
    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100';
  const userName = esDark ? 'text-white' : 'text-[#0e3a8c]';

  const bottomNavBg = esDark
    ? 'bg-[#0d1b2e] border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]'
    : 'bg-white border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.07)]';
  const bottomActive   = esDark ? 'bg-white/10 text-white' : 'bg-[#e8f0fe] text-[#0e3a8c]';
  const bottomInactive = esDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600';
  const bottomLabelActive   = esDark ? 'text-white' : 'text-[#0e3a8c]';
  const bottomLabelInactive = esDark ? 'text-slate-500' : 'text-slate-400';

  return (
    <>
      {/* Header top bar */}
      <header className={`sticky top-0 z-[60] border-b shadow-sm transition-colors duration-200 ${navBg}`}>
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center select-none">
            <span className="text-[#c01e2e] text-2xl font-black tracking-tight">Cootranar</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {enlacesDesktop.map((enlace) => (
              <Link
                key={enlace.path}
                to={enlace.path}
                className={`text-sm font-semibold transition-colors duration-200 ${
                  location.pathname === enlace.path ? linkActive : linkInactive
                }`}
              >
                {enlace.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">

            {/* Botón de ayuda — solo en HomePage */}
            {location.pathname === ROUTES.HOME && (
              <button
                id="navbar-btn-tour"
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('cootranar:iniciar-tour'))}
                title={idioma === 'es' ? 'Ver tutorial de búsqueda' : 'View search tutorial'}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${iconBtn} relative group`}
              >
                <span className="material-symbols-outlined text-xl">help_outline</span>
                {/* Tooltip */}
                <span className="pointer-events-none absolute top-full mt-2 right-0 whitespace-nowrap bg-[#0e3a8c] dark:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-50">
                  {idioma === 'es' ? '¿Cómo buscar un viaje?' : 'How to search a trip?'}
                </span>
              </button>
            )}

            {/* Language selector */}
            <div className={`hidden sm:flex items-center gap-1 rounded-lg p-1 transition-colors duration-200 ${pillBg}`}>
              {(['es', 'en'] as Idioma[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setIdioma(lang)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-200 ${
                    idioma === lang ? pillActive : pillInactive
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleTema}
              title={esDark ? 'Modo claro' : 'Modo oscuro'}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${iconBtn}`}
            >
              <span className="material-symbols-outlined text-xl">
                {esDark ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            {usuario ? (
              <div className="flex items-center gap-2">
                {/* User name + avatar */}
                <Link
                  to={ROUTES.PERFIL}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <span className={`hidden md:block text-sm font-bold uppercase tracking-wide transition-colors duration-200 ${userName}`}>
                    {usuario.nombre} {usuario.apellido}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-white/20 flex items-center justify-center">
                    <AvatarUsuario usuario={usuario} size="sm" />
                  </div>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  title={n.cerrarSesion}
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${iconBtn}`}
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                </button>
              </div>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="bg-[#0e3a8c] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors"
              >
                {n.iniciarSesion}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Navigation — solo móvil y tablet */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-[60] border-t transition-colors duration-200 ${bottomNavBg}`}>
        <div className="flex items-center justify-around px-2 pt-2.5 pb-[calc(0.6rem+env(safe-area-inset-bottom))]">
          {enlacesBottomNav.map((enlace) => {
            const activo = location.pathname === enlace.path;
            return (
              <Link
                key={enlace.path}
                to={enlace.path}
                className="flex flex-col items-center gap-1 min-w-[64px]"
              >
                <div
                  className={`px-5 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                    activo ? bottomActive : bottomInactive
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[24px] block"
                    style={{ fontVariationSettings: activo ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {enlace.icon}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold tracking-wide transition-colors duration-200 ${
                    activo ? bottomLabelActive : bottomLabelInactive
                  }`}
                >
                  {enlace.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
