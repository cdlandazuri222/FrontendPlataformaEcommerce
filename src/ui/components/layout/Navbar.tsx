import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePreferencias } from '../../context/PreferenciasContext';
import { ROUTES } from '../../../shared/constants';
import { AvatarUsuario } from '../common/AvatarUsuario';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getUsuario, logout } = useAuth();
  const usuario = getUsuario();
  const { tx } = usePreferencias();
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

  return (
    <>
      {/* Header top bar */}
      <header className="sticky top-0 z-[60] bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={ROUTES.HOME} className="flex items-center">
            <span className="text-[#c01e2e] dark:text-red-500 text-2xl font-black tracking-tight select-none">Cootranar</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {enlacesDesktop.map((enlace) => (
              <Link
                key={enlace.path}
                to={enlace.path}
                className={`text-sm font-semibold transition-colors ${
                  location.pathname === enlace.path
                    ? 'text-[#0e3a8c] dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-[#0e3a8c] dark:hover:text-blue-400'
                }`}
              >
                {enlace.label}
              </Link>
            ))}
          </nav>

          {/* Acciones (desktop + mobile avatar directly!) */}
          <div className="flex items-center gap-4">
            {usuario ? (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 sm:border-l border-slate-100 dark:border-slate-800">
                <Link to={ROUTES.PERFIL} className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
                  <AvatarUsuario usuario={usuario} size="sm" />
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-bold leading-none text-[#0e3a8c] dark:text-blue-400">{usuario.nombre}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{usuario.apellido}</p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  title={n.cerrarSesion}
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                </button>
              </div>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="bg-[#0e3a8c] text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-900 transition-colors"
              >
                {n.iniciarSesion}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Navigation — solo móvil y tablet */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.07)] transition-colors">
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
                    activo
                      ? 'bg-[#e8f0fe] dark:bg-blue-950/40 text-[#0e3a8c] dark:text-blue-400'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
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
                  className={`text-[10px] font-bold tracking-wide transition-colors ${
                    activo ? 'text-[#0e3a8c] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
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

