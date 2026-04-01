import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../../shared/constants';
import logo from '../../../assets/Logo.png.png';

const enlaces = [
  { label: 'Home', path: ROUTES.HOME },
  { label: 'Mis Viajes', path: ROUTES.MIS_VIAJES },
  { label: 'Cotizar Encomienda', path: ROUTES.ENCOMIENDAS },
];

export function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { getUsuario, logout } = useAuth();
  const usuario = getUsuario();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link to={ROUTES.HOME} className="flex items-center">
          <img src={logo} alt="Cootranar Logo" className="h-[46px] w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.path}
              to={enlace.path}
              className={`text-sm font-semibold transition-colors ${
                location.pathname === enlace.path
                  ? 'text-[#0e3a8c] font-bold'
                  : 'text-slate-500 hover:text-[#0e3a8c]'
              }`}
            >
              {enlace.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {usuario ? (
            <>
              <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold leading-none text-[#0e3a8c]">{usuario.nombre}</p>
                  <p className="text-xs text-slate-400">{usuario.apellido}</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                </button>
              </div>
            </>
          ) : (
            <Link
              to={ROUTES.LOGIN}
              className="bg-[#0e3a8c] text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          <span className="material-symbols-outlined">{menuAbierto ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Overlay oscuro para cerrar al hacer clic afuera */}
      {menuAbierto && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-[60] transition-opacity"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* Menú lateral (Drawer) deslizándose desde la derecha hacia la izquierda */}
      <div 
        className={`md:hidden fixed top-0 right-0 h-full w-3/4 sm:w-1/2 bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${
          menuAbierto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <span className="font-bold text-[#0e3a8c] text-lg">Menú</span>
          <button
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setMenuAbierto(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-4 py-6 space-y-3 flex-1 overflow-y-auto">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.path}
              to={enlace.path}
              onClick={() => setMenuAbierto(false)}
              className={`block text-base font-semibold py-3 px-4 rounded-xl transition-colors ${
                location.pathname === enlace.path
                  ? 'bg-[#0e3a8c]/10 text-[#0e3a8c]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {enlace.label}
            </Link>
          ))}
        </div>

        {usuario ? (
          <div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto">
            <div className="mb-4">
              <p className="text-base font-bold text-slate-800">{usuario.nombre}</p>
              <p className="text-sm text-slate-500">{usuario.correo}</p>
            </div>
            <button onClick={handleLogout} className="w-full text-center text-sm font-bold text-white bg-red-500 hover:bg-red-600 px-4 py-3 rounded-xl transition-colors shadow-lg shadow-red-500/20">
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto">
            <Link
              to={ROUTES.LOGIN}
              onClick={() => setMenuAbierto(false)}
              className="block w-full text-center bg-[#0e3a8c] text-white text-sm font-bold px-4 py-3 rounded-xl hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20"
            >
              Iniciar Sesión
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
