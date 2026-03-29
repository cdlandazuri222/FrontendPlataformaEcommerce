import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/Logo.png.png';

function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();

  // Simulamos un usuario logueado con datos de ejemplo
  const usuario = {
    nombre: 'Juan Pérez',
    foto: null,
  };

  const enlaces = [
    { label: 'Home', path: '/home' },
    { label: 'Mis Viajes', path: '/mis-viajes' },
    { label: 'Contar/Recomendando', path: '/recomendaciones' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="Cootranar" className="h-10 w-auto" />
          </Link>

          {/* Enlaces de navegación - desktop */}
          <div className="hidden md:flex items-center gap-8">
            {enlaces.map((enlace) => (
              <Link
                key={enlace.path}
                to={enlace.path}
                className={`text-sm font-semibold transition-colors ${
                  location.pathname === enlace.path
                    ? 'text-brand-blue border-b-2 border-brand-blue pb-0.5'
                    : 'text-slate-500 hover:text-brand-blue'
                }`}
              >
                {enlace.label}
              </Link>
            ))}
          </div>

          {/* Perfil de usuario - desktop */}
          <div className="hidden md:flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-400 text-2xl cursor-pointer hover:text-brand-blue transition-colors">
              notifications
            </span>
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800 leading-tight">{usuario.nombre}</p>
                <p className="text-xs text-slate-400">Ver perfil</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-brand-blue flex items-center justify-center text-white font-bold text-sm">
                {usuario.nombre.charAt(0)}
              </div>
            </div>
          </div>

          {/* Botón menú móvil */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <span className="material-symbols-outlined">
              {menuAbierto ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {menuAbierto && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-3">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.path}
              to={enlace.path}
              onClick={() => setMenuAbierto(false)}
              className={`block text-sm font-semibold py-2 px-3 rounded-lg transition-colors ${
                location.pathname === enlace.path
                  ? 'bg-brand-blue/10 text-brand-blue'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {enlace.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <div className="w-9 h-9 rounded-full bg-brand-blue flex items-center justify-center text-white font-bold text-sm">
              {usuario.nombre.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{usuario.nombre}</p>
              <p className="text-xs text-slate-400">Ver perfil</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
