import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Navbar } from '../../components/layout/Navbar';
import { AvatarUsuario } from '../../components/common/AvatarUsuario';
import { ROUTES } from '../../../shared/constants';

function Campo({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="bg-[#f0f2f5] rounded-xl px-4 py-3 text-sm text-slate-700 font-medium min-h-[44px] flex items-center">
        {valor || <span className="text-slate-400 italic">Sin información</span>}
      </div>
    </div>
  );
}

export function PerfilPage() {
  const navigate = useNavigate();
  const { getUsuario, logout } = useAuth();
  const usuario = getUsuario();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  if (!usuario) {
    navigate(ROUTES.LOGIN);
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-10 space-y-5">

        {/* Header perfil */}
        <div className="bg-white rounded-2xl p-6 flex items-center gap-5 border-l-4 border-[#0e3a8c] shadow-sm">
          <div className="relative shrink-0">
            <AvatarUsuario usuario={usuario} size="xl" />
            <button
              title="Editar foto"
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#0e3a8c] text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-900 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0e3a8c] leading-tight">
              {usuario.nombre} {usuario.apellido}
            </h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[#0e3a8c]">verified_user</span>
              Cliente Cootranar
            </p>
          </div>
        </div>

        {/* Información personal */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-[#0e3a8c] flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">badge</span>
            Información Personal
          </h2>
          <div className="h-px bg-slate-100" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Nombre" valor={usuario.nombre} />
            <Campo label="Apellido" valor={usuario.apellido} />
          </div>

          <Campo label="Correo Electrónico" valor={usuario.correo} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Teléfono" valor={usuario.telefono} />
            <Campo label="Documento" valor={usuario.documento} />
          </div>

          <Campo label="Dirección" valor={usuario.direccion} />
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-red-500/20 text-sm"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Cerrar Sesión
        </button>

      </div>
    </div>
  );
}
