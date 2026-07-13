import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePreferencias } from '../../context/PreferenciasContext';
import { Navbar } from '../../components/layout/Navbar';
import { AvatarUsuario } from '../../components/common/AvatarUsuario';
import { ROUTES } from '../../../shared/constants';
import type { Idioma } from '../../../shared/i18n/translations';

function Campo({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        {label}
      </span>
      <div className="bg-[#f0f2f5] dark:bg-slate-700 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200 font-medium min-h-[44px] flex items-center transition-colors">
        {valor || (
          <span className="text-slate-400 dark:text-slate-500 italic">
            Sin información
          </span>
        )}
      </div>
    </div>
  );
}

export function PerfilPage() {
  const navigate = useNavigate();
  const { getUsuario, logout } = useAuth();
  const { esDark, toggleTema, idioma, setIdioma, tx } = usePreferencias();
  const usuario = getUsuario();
  const p = tx.perfil;

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  if (!usuario) {
    navigate(ROUTES.LOGIN);
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-slate-900 transition-colors duration-200">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-10 space-y-5">

        {/* Header perfil */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 flex items-center gap-5 border-l-4 border-[#0e3a8c] dark:border-blue-400 shadow-sm transition-colors">
          <div className="relative shrink-0">
            <AvatarUsuario usuario={usuario} size="xl" />
            <button
              title={p.editarFoto}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#0e3a8c] text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-900 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0e3a8c] dark:text-blue-400 leading-tight">
              {usuario.nombre} {usuario.apellido}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[#0e3a8c] dark:text-blue-400">
                verified_user
              </span>
              {p.clienteCootranar}
            </p>
          </div>
        </div>

        {/* Información personal */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm space-y-5 transition-colors">
          <h2 className="text-base font-bold text-[#0e3a8c] dark:text-blue-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">badge</span>
            {p.infoPersonal}
          </h2>
          <div className="h-px bg-slate-100 dark:bg-slate-700" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label={p.nombre} valor={usuario.nombre} />
            <Campo label={p.apellido} valor={usuario.apellido} />
          </div>

          <Campo label={p.correo} valor={usuario.correo} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label={p.telefono} valor={usuario.telefono} />
            <Campo label={p.documento} valor={usuario.documento} />
          </div>

          <Campo label={p.direccion} valor={usuario.direccion} />
        </div>

        {/* Preferencias */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm space-y-5 transition-colors">
          <h2 className="text-base font-bold text-[#0e3a8c] dark:text-blue-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">tune</span>
            {p.preferencias}
          </h2>
          <div className="h-px bg-slate-100 dark:bg-slate-700" />

          {/* Toggle modo oscuro */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-xl text-[#0e3a8c] dark:text-blue-400">
                  {esDark ? 'dark_mode' : 'light_mode'}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {p.apariencia}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {esDark ? p.modoDark : p.modoLight}
                </p>
              </div>
            </div>

            <button
              onClick={toggleTema}
              role="switch"
              aria-checked={esDark}
              className={`relative inline-flex h-7 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                esDark ? 'bg-[#0e3a8c]' : 'bg-slate-200'
              }`}
              style={{ width: '52px' }}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  esDark ? 'translate-x-[28px]' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-700" />

          {/* Selector de idioma */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-xl text-[#0e3a8c] dark:text-blue-400">
                  language
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {p.idioma}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {idioma === 'es' ? p.espanol : p.ingles}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1 transition-colors">
              {(['es', 'en'] as Idioma[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setIdioma(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    idioma === lang
                      ? 'bg-[#0e3a8c] text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-red-500/20 text-sm"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          {p.cerrarSesion}
        </button>

      </div>
    </div>
  );
}
